"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { db, DEFAULT_PREFS } from "./db";
import type { Plan, Prefs, Session } from "./types";

/** undefined mientras carga, null si todavía no hay plan. */
export function usePlan(): Plan | null | undefined {
  return useLiveQuery(async () => {
    const row = await db.kv.get("plan");
    return (row?.value as Plan | undefined) ?? null;
  });
}

export function usePrefs(): Prefs {
  const prefs = useLiveQuery(async () => {
    const row = await db.kv.get("prefs");
    return { ...DEFAULT_PREFS, ...((row?.value as Partial<Prefs> | undefined) ?? {}) };
  });
  return prefs ?? DEFAULT_PREFS;
}

export function useSessions(): Session[] | undefined {
  return useLiveQuery(() => db.sessions.orderBy("startedAt").toArray());
}

export function useSessionDays(sessions: Session[] | undefined): Set<string> {
  return useMemo(() => new Set((sessions ?? []).map((s) => s.day)), [sessions]);
}
