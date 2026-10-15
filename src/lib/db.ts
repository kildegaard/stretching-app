import Dexie, { type EntityTable } from "dexie";
import type { Plan, Prefs, Session } from "./types";

interface KV {
  key: string;
  value: unknown;
}

class StretchDB extends Dexie {
  sessions!: EntityTable<Session, "id">;
  kv!: EntityTable<KV, "key">;

  constructor() {
    super("stretching-app");
    this.version(1).stores({
      sessions: "++id, day, startedAt, routineId",
      kv: "key",
    });
  }
}

export const db = new StretchDB();

export const DEFAULT_PREFS: Prefs = { sound: true, vibration: true, voice: false };

export async function getPlan(): Promise<Plan | null> {
  const row = await db.kv.get("plan");
  return (row?.value as Plan | undefined) ?? null;
}

export async function savePlan(plan: Plan): Promise<void> {
  await db.kv.put({ key: "plan", value: plan });
}

export async function getPrefs(): Promise<Prefs> {
  const row = await db.kv.get("prefs");
  return { ...DEFAULT_PREFS, ...((row?.value as Partial<Prefs> | undefined) ?? {}) };
}

export async function savePrefs(prefs: Prefs): Promise<void> {
  await db.kv.put({ key: "prefs", value: prefs });
}

export async function addSession(session: Omit<Session, "id">): Promise<number> {
  return (await db.sessions.add(session as Session)) as number;
}

export async function updateSession(id: number, changes: Partial<Session>): Promise<void> {
  await db.sessions.update(id, changes);
}

export interface Backup {
  app: "stretching-app";
  version: 1;
  exportedAt: string;
  plan: Plan | null;
  prefs: Prefs;
  sessions: Session[];
}

export async function exportData(): Promise<Backup> {
  return {
    app: "stretching-app",
    version: 1,
    exportedAt: new Date().toISOString(),
    plan: await getPlan(),
    prefs: await getPrefs(),
    sessions: await db.sessions.orderBy("startedAt").toArray(),
  };
}

export async function importData(data: Backup): Promise<void> {
  if (data?.app !== "stretching-app" || !Array.isArray(data.sessions)) {
    throw new Error("El archivo no es un respaldo de esta app.");
  }
  await db.transaction("rw", db.sessions, db.kv, async () => {
    await db.sessions.clear();
    await db.sessions.bulkAdd(data.sessions.map((s) => ({ ...s, id: undefined })));
    if (data.plan) await savePlan(data.plan);
    if (data.prefs) await savePrefs(data.prefs);
  });
}

export async function clearAll(): Promise<void> {
  await db.transaction("rw", db.sessions, db.kv, async () => {
    await db.sessions.clear();
    await db.kv.clear();
  });
}
