"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import ExerciseFigure from "@/components/ExerciseFigure";
import { ROUTINE_BY_ID } from "@/data/routines";
import { playCue, speak, unlockAudio } from "@/lib/cues";
import { addSession, updateSession } from "@/lib/db";
import { dayKey } from "@/lib/dates";
import { usePrefs } from "@/lib/hooks";
import { PREP_SECONDS, expandRoutine, formatClock, type PlayStep } from "@/lib/routine";
import { POSITION_LABEL } from "@/lib/types";

type Phase = "intro" | "prep" | "hold" | "done";

const MOODS = [
  { value: 1, label: "Tenso" },
  { value: 2, label: "Igual" },
  { value: 3, label: "Mejor" },
  { value: 4, label: "Suelto" },
  { value: 5, label: "Muy bien" },
] as const;

interface State {
  phase: Phase;
  index: number;
  remaining: number;
  /** Segundos efectivamente estirando (sin contar preparación ni pausas). */
  active: number;
  skipped: number;
}

type Action = { type: "start" } | { type: "tick"; dt: number } | { type: "skip" } | { type: "back" };

function makeReducer(steps: PlayStep[]) {
  const toStep = (s: State, index: number): State =>
    index >= steps.length
      ? { ...s, phase: "done", remaining: 0 }
      : { ...s, phase: "prep", index, remaining: PREP_SECONDS };

  return function reducer(s: State, a: Action): State {
    switch (a.type) {
      case "start":
        return toStep(s, 0);
      case "tick": {
        if (s.phase === "prep") {
          const r = s.remaining - a.dt;
          return r > 0 ? { ...s, remaining: r } : { ...s, phase: "hold", remaining: steps[s.index].seconds };
        }
        if (s.phase === "hold") {
          const r = s.remaining - a.dt;
          const active = s.active + a.dt;
          return r > 0 ? { ...s, remaining: r, active } : toStep({ ...s, active }, s.index + 1);
        }
        return s;
      }
      case "skip":
        return toStep({ ...s, skipped: s.skipped + 1 }, s.index + 1);
      case "back":
        if (s.phase === "hold" && s.remaining < steps[s.index].seconds - 2) return toStep(s, s.index);
        return toStep(s, Math.max(0, s.index - 1));
    }
  };
}

export default function Player({ routineId }: { routineId: string }) {
  const router = useRouter();
  const routine = ROUTINE_BY_ID.get(routineId)!;
  const steps = useMemo(() => expandRoutine(routine), [routine]);
  const reducer = useMemo(() => makeReducer(steps), [steps]);
  const prefs = usePrefs();

  const [state, dispatch] = useReducer(reducer, {
    phase: "intro",
    index: 0,
    remaining: PREP_SECONDS,
    active: 0,
    skipped: 0,
  });
  const { phase, index, remaining } = state;
  const [paused, setPaused] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);

  const startedAt = useRef<Date | null>(null);
  const stateRef = useRef(state);
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const step = steps[Math.min(index, steps.length - 1)];
  const next = steps[index + 1];

  const save = useCallback(
    async (completed: boolean) => {
      if (!startedAt.current) return null;
      const s = stateRef.current;
      return addSession({
        startedAt: startedAt.current.toISOString(),
        day: dayKey(startedAt.current),
        routineId: routine.id,
        routineName: routine.name,
        seconds: Math.round(s.active),
        completed,
        skipped: s.skipped,
      });
    },
    [routine],
  );

  // Reloj: descuenta según el tiempo real transcurrido, así no se atrasa.
  const running = (phase === "prep" || phase === "hold") && !paused;
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      dispatch({ type: "tick", dt: (now - last) / 1000 });
      last = now;
    }, 200);
    return () => clearInterval(timer);
  }, [running]);

  // Avisos al cambiar de fase o de paso.
  const saved = useRef(false);
  useEffect(() => {
    if (phase === "prep") {
      const s = steps[index];
      const isSecondSide = s.side === "derecho" && steps[index - 1]?.exercise.id === s.exercise.id;
      speak(isSecondSide ? "Cambiá de lado" : s.exercise.name, prefs);
    } else if (phase === "hold") {
      playCue("start", prefs);
    } else if (phase === "done" && !saved.current) {
      saved.current = true;
      playCue("finish", prefs);
      speak("Terminaste. Muy bien.", prefs);
      void save(true).then(setSessionId);
    }
    // Solo cuando cambia la fase o el paso, no cuando cambian las preferencias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index]);

  // Pitidos en los últimos 3 segundos.
  const whole = Math.ceil(remaining);
  useEffect(() => {
    if (running && whole <= 3 && whole > 0) playCue("tick", prefs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whole]);

  // Mantener la pantalla encendida durante la sesión.
  const inSession = phase === "prep" || phase === "hold";
  useEffect(() => {
    if (!inSession) return;
    let cancelled = false;
    const request = async () => {
      try {
        if ("wakeLock" in navigator && !wakeLock.current) {
          const lock = await navigator.wakeLock.request("screen");
          if (cancelled) void lock.release();
          else wakeLock.current = lock;
        }
      } catch {}
    };
    void request();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        wakeLock.current = null;
        void request();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void wakeLock.current?.release();
      wakeLock.current = null;
    };
  }, [inSession]);

  function start() {
    unlockAudio();
    startedAt.current = new Date();
    dispatch({ type: "start" });
  }

  async function quit() {
    if (stateRef.current.active >= 60) await save(false);
    router.push("/");
  }

  if (phase === "intro") {
    return (
      <div className="flex min-h-[80dvh] flex-col justify-between gap-6">
        <Link href={`/rutinas/${routine.id}`} className="text-sm font-semibold text-accent">
          ← Volver
        </Link>
        <div className="space-y-3 text-center">
          <ExerciseFigure position={steps[0].exercise.position} className="mx-auto h-40 w-40" />
          <h1 className="text-3xl font-bold">{routine.name}</h1>
          <p className="text-muted">
            {steps.length} pasos · buscá un lugar cómodo y ropa suelta.
          </p>
          <p className="text-sm text-muted">Estirá sin dolor: tiene que sentirse, no doler.</p>
        </div>
        <button className="btn-primary w-full py-4 text-lg" onClick={start}>
          Comenzar
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const minutes = Math.round(state.active / 60);
    return (
      <div className="flex min-h-[80dvh] flex-col justify-center gap-8 text-center">
        <div className="space-y-2">
          <p className="text-5xl">🌿</p>
          <h1 className="text-3xl font-bold">¡Listo!</h1>
          <p className="text-muted">
            {routine.name} · {minutes < 1 ? "menos de 1 min" : `${minutes} min`}
          </p>
        </div>
        <div className="card space-y-4">
          <p className="font-semibold">¿Cómo te sentís?</p>
          <div className="flex justify-between gap-1">
            {MOODS.map((m) => (
              <button
                key={m.value}
                className="chip flex-1 px-1 text-xs"
                aria-pressed={mood === m.value}
                onClick={() => {
                  setMood(m.value);
                  if (sessionId) void updateSession(sessionId, { moodAfter: m.value });
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <Link href="/" className="btn-primary w-full">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const total = phase === "prep" ? PREP_SECONDS : step.seconds;
  const progress = 1 - Math.max(0, remaining) / total;
  const isSecondSide = step.side === "derecho" && steps[index - 1]?.exercise.id === step.exercise.id;
  const R = 88;
  const C = 2 * Math.PI * R;

  return (
    <div className="flex min-h-[85dvh] flex-col gap-5">
      <div className="flex items-center gap-3">
        <button onClick={quit} className="text-sm font-semibold text-muted" aria-label="Terminar sesión">
          ✕
        </button>
        <div className="flex h-1.5 flex-1 gap-1">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`flex-1 rounded-full ${i < index ? "bg-accent" : i === index ? "bg-accent/50" : "bg-surface-2"}`}
            />
          ))}
        </div>
        <span className="text-xs text-muted">
          {index + 1}/{steps.length}
        </span>
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          {phase === "prep" ? (isSecondSide ? "Cambiá de lado" : "Preparate") : "Sostené y respirá"}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{step.exercise.name}</h1>
        <p className="text-sm text-muted">
          {POSITION_LABEL[step.exercise.position]}
          {step.side ? ` · lado ${step.side}` : ""}
        </p>
      </div>

      <div className="relative mx-auto h-56 w-56">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle cx="100" cy="100" r={R} fill="none" strokeWidth="10" className="stroke-surface-2" />
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            className={phase === "prep" ? "stroke-warm" : "stroke-accent"}
            style={{ transition: "stroke-dashoffset 0.2s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <ExerciseFigure position={step.exercise.position} className="h-20 w-20" />
          <span className="text-4xl font-bold tabular-nums">{formatClock(remaining)}</span>
        </div>
      </div>

      <ul className="card space-y-2 text-sm">
        {step.exercise.instructions.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="text-accent">•</span>
            {line}
          </li>
        ))}
        {step.exercise.caution && <li className="pt-1 text-warm">{step.exercise.caution}</li>}
      </ul>

      {next && (
        <p className="text-center text-xs text-muted">
          Después: {next.exercise.id === step.exercise.id ? "otro lado" : next.exercise.name}
        </p>
      )}

      <div className="mt-auto flex items-center justify-center gap-4">
        <button className="btn-ghost h-14 w-14 p-0" onClick={() => dispatch({ type: "back" })} aria-label="Anterior">
          ⏮
        </button>
        <button className="btn-primary h-16 w-16 p-0 text-xl" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Seguir" : "Pausa"}>
          {paused ? "▶" : "❚❚"}
        </button>
        <button className="btn-ghost h-14 w-14 p-0" onClick={() => dispatch({ type: "skip" })} aria-label="Saltear">
          ⏭
        </button>
      </div>
    </div>
  );
}
