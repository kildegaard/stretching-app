import { ROUTINES } from "@/data/routines";
import { addDays, dayKey, startOfWeek } from "./dates";
import { routineSeconds, routineZones } from "./routine";
import type { Moment, Plan, Routine, Session } from "./types";

export function momentOfDay(date: Date = new Date()): Exclude<Moment, "cualquiera"> {
  const h = date.getHours();
  if (h >= 5 && h < 11) return "manana";
  if (h >= 19 || h < 5) return "noche";
  return "dia";
}

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Elige la rutina sugerida del día. Prioriza el objetivo del plan, el momento del día y la
 * duración elegida, evita las zonas marcadas y no repite la última rutina hecha.
 * Es determinística por día y momento, para que no cambie cada vez que se abre la app.
 */
export function pickDailyRoutine(plan: Plan, sessions: Session[], now: Date = new Date()): Routine {
  const moment = momentOfDay(now);
  const lastRoutineId = sessions.at(-1)?.routineId;
  const targetSeconds = plan.minutes * 60;

  const allowed = ROUTINES.filter(
    (r) => !routineZones(r).some((z) => plan.avoidZones.includes(z)),
  );
  const pool = allowed.length ? allowed : ROUTINES;

  const scored = pool.map((r) => {
    let score = 0;
    // A la noche manda dormir, a la mañana calentar, salvo que coincida con el objetivo.
    if (r.goal === plan.goal) score += 4;
    if (moment === "noche" && r.goal === "dormir") score += 3;
    if (moment === "manana" && r.goal === "calentar") score += 2;
    if (r.moment === moment) score += 2;
    if (r.moment !== "cualquiera" && r.moment !== moment) score -= 3;
    score -= Math.abs(routineSeconds(r) - targetSeconds) / 120;
    if (r.id === lastRoutineId) score -= 2.5;
    return { r, score };
  });

  scored.sort((a, b) => b.score - a.score);
  // Entre las que quedan cerca de la mejor, rota según el día.
  const best = scored[0].score;
  const near = scored.filter((s) => s.score >= best - 1);
  const idx = hash(`${dayKey(now)}-${moment}`) % near.length;
  return near[idx].r;
}

export function isPlannedDay(plan: Plan, date: Date): boolean {
  return plan.days.includes(date.getDay());
}

/**
 * Racha: días con sesión, contando hacia atrás desde hoy. Un día del plan sin sesión la corta;
 * los días libres no la cortan. Hoy todavía no la corta si no estiraste.
 */
export function currentStreak(plan: Plan, sessionDays: Set<string>, today: Date = new Date()): number {
  let streak = 0;
  const start = plan.createdAt ? new Date(plan.createdAt) : addDays(today, -365);
  const limit = addDays(start, -1);
  for (let d = new Date(today); d >= limit; d = addDays(d, -1)) {
    const key = dayKey(d);
    if (sessionDays.has(key)) {
      streak++;
    } else if (isPlannedDay(plan, d) && key !== dayKey(today)) {
      break;
    }
  }
  return streak;
}

export function bestStreak(plan: Plan, sessionDays: Set<string>, today: Date = new Date()): number {
  if (sessionDays.size === 0) return 0;
  const first = [...sessionDays].sort()[0];
  let best = 0;
  let run = 0;
  for (let d = new Date(first + "T00:00:00"); d <= today; d = addDays(d, 1)) {
    const key = dayKey(d);
    if (sessionDays.has(key)) {
      run++;
      best = Math.max(best, run);
    } else if (isPlannedDay(plan, d) && key !== dayKey(today)) {
      run = 0;
    }
  }
  return best;
}

export function weekProgress(plan: Plan, sessionDays: Set<string>, today: Date = new Date()) {
  const monday = startOfWeek(today);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const key = dayKey(date);
    return {
      date,
      key,
      planned: isPlannedDay(plan, date),
      done: sessionDays.has(key),
      isToday: key === dayKey(today),
    };
  });
  const done = days.filter((d) => d.done).length;
  return { days, done, goal: plan.days.length };
}
