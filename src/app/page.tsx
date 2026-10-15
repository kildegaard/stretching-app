"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import ExerciseFigure from "@/components/ExerciseFigure";
import { EXERCISE_BY_ID } from "@/data/exercises";
import { getPlan } from "@/lib/db";
import { WEEKDAYS_SHORT, dayKey } from "@/lib/dates";
import { usePlan, useSessionDays, useSessions } from "@/lib/hooks";
import { currentStreak, isPlannedDay, momentOfDay, pickDailyRoutine, weekProgress } from "@/lib/plan";
import { routineMinutes } from "@/lib/routine";

const GREETING = { manana: "Buen día", dia: "Buenas tardes", noche: "Buenas noches" } as const;

export default function TodayPage() {
  const router = useRouter();
  const plan = usePlan();
  const sessions = useSessions();
  const sessionDays = useSessionDays(sessions);

  useEffect(() => {
    if (plan !== null) return;
    // Se vuelve a leer de la base: esta pantalla puede quedar montada en segundo plano
    // con un valor viejo mientras se completa la configuración inicial.
    let cancelled = false;
    void getPlan().then((fresh) => {
      if (!fresh && !cancelled) router.replace("/bienvenida");
    });
    return () => {
      cancelled = true;
    };
  }, [plan, router]);

  const routine = useMemo(
    () => (plan && sessions ? pickDailyRoutine(plan, sessions) : null),
    [plan, sessions],
  );

  if (!plan || !sessions || !routine) return <div className="h-64" aria-busy />;

  const today = new Date();
  const doneToday = sessionDays.has(dayKey(today));
  const streak = currentStreak(plan, sessionDays, today);
  const week = weekProgress(plan, sessionDays, today);
  const firstExercise = EXERCISE_BY_ID.get(routine.steps[0].exerciseId);
  const planned = isPlannedDay(plan, today);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-muted">{GREETING[momentOfDay(today)]}</p>
        <h1 className="text-3xl font-bold">
          {doneToday ? "Ya estiraste hoy" : planned ? "Tu rutina de hoy" : "Hoy es día libre"}
        </h1>
      </header>

      <section className="card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              {doneToday ? "Si querés otra" : "Sugerida para vos"}
            </p>
            <h2 className="mt-1 text-2xl font-semibold leading-tight">{routine.name}</h2>
            <p className="mt-1 text-sm text-muted">
              {routineMinutes(routine)} min · {routine.steps.length} ejercicios
            </p>
          </div>
          {firstExercise && <ExerciseFigure position={firstExercise.position} className="h-20 w-20 shrink-0" />}
        </div>
        <p className="text-sm">{routine.description}</p>
        <div className="flex gap-2">
          <Link href={`/sesion/${routine.id}`} className="btn-primary flex-1">
            Empezar
          </Link>
          <Link href={`/rutinas/${routine.id}`} className="btn-ghost">
            Ver
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-sm text-muted">Racha</p>
          <p className="text-3xl font-bold">
            {streak} <span className="text-base font-normal text-muted">{streak === 1 ? "día" : "días"}</span>
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-muted">Esta semana</p>
          <p className="text-3xl font-bold">
            {week.done}
            <span className="text-base font-normal text-muted"> / {week.goal}</span>
          </p>
        </div>
      </section>

      <section className="card">
        <ol className="flex justify-between">
          {week.days.map((d) => (
            <li key={d.key} className="flex flex-col items-center gap-2">
              <span className={`text-xs ${d.isToday ? "font-bold text-ink" : "text-muted"}`}>
                {WEEKDAYS_SHORT[d.date.getDay()]}
              </span>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm ${
                  d.done
                    ? "bg-accent text-accent-ink"
                    : d.planned
                      ? "border-2 border-dashed border-accent/50"
                      : "bg-surface-2 text-muted"
                } ${d.isToday ? "ring-2 ring-warm ring-offset-2 ring-offset-surface" : ""}`}
                aria-label={d.done ? "hecho" : d.planned ? "planificado" : "libre"}
              >
                {d.done ? "✓" : d.date.getDate()}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <Link href="/rutinas" className="block text-center text-sm font-semibold text-accent">
        Elegir otra rutina
      </Link>
    </div>
  );
}
