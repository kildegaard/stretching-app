import { EXERCISE_BY_ID } from "@/data/exercises";
import type { Exercise, Routine, Zone } from "./types";

/** Segundos de preparación antes de cada paso (para acomodarse o cambiar de lado). */
export const PREP_SECONDS = 5;

export interface PlayStep {
  exercise: Exercise;
  seconds: number;
  side?: "izquierdo" | "derecho";
}

/** Convierte una rutina en la lista de pasos a reproducir, duplicando los ejercicios por lado. */
export function expandRoutine(routine: Routine): PlayStep[] {
  const steps: PlayStep[] = [];
  for (const step of routine.steps) {
    const exercise = EXERCISE_BY_ID.get(step.exerciseId);
    if (!exercise) throw new Error(`Ejercicio inexistente: ${step.exerciseId}`);
    const seconds = step.seconds ?? exercise.seconds;
    if (exercise.perSide) {
      steps.push({ exercise, seconds, side: "izquierdo" });
      steps.push({ exercise, seconds, side: "derecho" });
    } else {
      steps.push({ exercise, seconds });
    }
  }
  return steps;
}

export function routineSeconds(routine: Routine): number {
  return expandRoutine(routine).reduce((acc, s) => acc + s.seconds + PREP_SECONDS, 0);
}

export function routineMinutes(routine: Routine): number {
  return Math.max(1, Math.round(routineSeconds(routine) / 60));
}

export function routineZones(routine: Routine): Zone[] {
  const zones = new Set<Zone>();
  for (const step of routine.steps) {
    const ex = EXERCISE_BY_ID.get(step.exerciseId);
    if (ex) zones.add(ex.zone);
  }
  return [...zones];
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
