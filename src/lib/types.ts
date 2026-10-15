export type Zone =
  | "cuello"
  | "hombros"
  | "espalda-alta"
  | "espalda-baja"
  | "cadera"
  | "piernas"
  | "munecas"
  | "cuerpo-completo"
  | "respiracion";

export type Position = "de-pie" | "sentado" | "cuadrupedia" | "acostado";

export type ExerciseKind = "estatico" | "dinamico" | "respiracion";

export interface Exercise {
  id: string;
  name: string;
  zone: Zone;
  position: Position;
  kind: ExerciseKind;
  /** Duración por defecto, en segundos (por lado si perSide). */
  seconds: number;
  perSide: boolean;
  /** 1 = muy suave, 3 = más exigente. */
  intensity: 1 | 2 | 3;
  instructions: string[];
  caution?: string;
}

export type Goal = "relajar" | "dormir" | "calentar" | "postura";

export type Moment = "manana" | "dia" | "noche" | "cualquiera";

export interface RoutineStep {
  exerciseId: string;
  /** Si se omite, usa la duración por defecto del ejercicio. */
  seconds?: number;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  goal: Goal;
  moment: Moment;
  steps: RoutineStep[];
}

export interface Plan {
  goal: Goal;
  /** Días de la semana: 0 = domingo … 6 = sábado. */
  days: number[];
  minutes: 5 | 10 | 15;
  avoidZones: Zone[];
  createdAt: string;
}

export interface Prefs {
  sound: boolean;
  vibration: boolean;
  voice: boolean;
}

export interface Session {
  id?: number;
  /** ISO con hora local de inicio. */
  startedAt: string;
  /** Fecha local YYYY-MM-DD, para agrupar por día. */
  day: string;
  routineId: string;
  routineName: string;
  seconds: number;
  completed: boolean;
  skipped: number;
  moodAfter?: 1 | 2 | 3 | 4 | 5;
}

export const ZONE_LABEL: Record<Zone, string> = {
  cuello: "Cuello",
  hombros: "Hombros",
  "espalda-alta": "Espalda alta",
  "espalda-baja": "Espalda baja",
  cadera: "Cadera",
  piernas: "Piernas",
  munecas: "Muñecas",
  "cuerpo-completo": "Cuerpo completo",
  respiracion: "Respiración",
};

export const GOAL_LABEL: Record<Goal, string> = {
  relajar: "Relajarme",
  dormir: "Dormir mejor",
  calentar: "Entrar en calor",
  postura: "Mejorar la postura",
};

export const POSITION_LABEL: Record<Position, string> = {
  "de-pie": "De pie",
  sentado: "Sentado",
  cuadrupedia: "En cuatro apoyos",
  acostado: "Acostado",
};
