"use client";

import { useState } from "react";
import { MONTHS, WEEKDAYS_SHORT, addDays, dayKey, startOfWeek } from "@/lib/dates";
import { usePlan, useSessionDays, useSessions } from "@/lib/hooks";
import { bestStreak, currentStreak, isPlannedDay } from "@/lib/plan";

const MOOD_LABEL = ["", "Tenso", "Igual", "Mejor", "Suelto", "Muy bien"];

export default function ProgressPage() {
  const plan = usePlan();
  const sessions = useSessions();
  const sessionDays = useSessionDays(sessions);
  const [monthOffset, setMonthOffset] = useState(0);

  if (!plan || !sessions) {
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-bold">Progreso</h1>
        {plan === null && <p className="text-muted">Todavía no configuraste tu plan.</p>}
      </div>
    );
  }

  const today = new Date();
  const totalMinutes = Math.round(sessions.reduce((acc, s) => acc + s.seconds, 0) / 60);
  const thisMonday = startOfWeek(today);
  const weekMinutes = Math.round(
    sessions.filter((s) => s.day >= dayKey(thisMonday)).reduce((acc, s) => acc + s.seconds, 0) / 60,
  );

  // Calendario del mes.
  const monthStart = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const gridStart = startOfWeek(monthStart);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const lastRow = cells.findLastIndex((d) => d.getMonth() === monthStart.getMonth());
  const visible = cells.slice(0, Math.ceil((lastRow + 1) / 7) * 7);

  // Minutos por semana, últimas 8 semanas.
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = addDays(thisMonday, -7 * (7 - i));
    const end = addDays(start, 7);
    const mins = sessions
      .filter((s) => s.day >= dayKey(start) && s.day < dayKey(end))
      .reduce((acc, s) => acc + s.seconds / 60, 0);
    return { start, mins: Math.round(mins) };
  });
  const maxWeek = Math.max(10, ...weeks.map((w) => w.mins));

  const recent = [...sessions].reverse().slice(0, 10);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Progreso</h1>

      <section className="grid grid-cols-2 gap-3">
        <Stat label="Racha actual" value={currentStreak(plan, sessionDays, today)} unit="días" />
        <Stat label="Mejor racha" value={bestStreak(plan, sessionDays, today)} unit="días" />
        <Stat label="Esta semana" value={weekMinutes} unit="min" />
        <Stat label="En total" value={totalMinutes} unit="min" />
      </section>

      <section className="card">
        <div className="mb-4 flex items-center justify-between">
          <button className="px-2 text-muted" onClick={() => setMonthOffset((m) => m - 1)} aria-label="Mes anterior">
            ‹
          </button>
          <h2 className="font-semibold capitalize">
            {MONTHS[monthStart.getMonth()]} {monthStart.getFullYear()}
          </h2>
          <button
            className="px-2 text-muted disabled:opacity-30"
            onClick={() => setMonthOffset((m) => m + 1)}
            disabled={monthOffset >= 0}
            aria-label="Mes siguiente"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <span key={d} className="text-muted">
              {WEEKDAYS_SHORT[d]}
            </span>
          ))}
          {visible.map((d) => {
            const key = dayKey(d);
            const inMonth = d.getMonth() === monthStart.getMonth();
            const done = sessionDays.has(key);
            const future = d > today;
            const missed = !done && !future && isPlannedDay(plan, d) && key !== dayKey(today) && key >= plan.createdAt.slice(0, 10);
            return (
              <span key={key} className="flex justify-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    !inMonth ? "opacity-0" : done ? "bg-accent text-accent-ink font-semibold" : missed ? "bg-warm-soft" : ""
                  } ${key === dayKey(today) && inMonth ? "ring-2 ring-warm" : ""}`}
                >
                  {d.getDate()}
                </span>
              </span>
            );
          })}
        </div>
        <p className="mt-4 flex gap-4 text-xs text-muted">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-accent" /> Estiraste
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-warm-soft" /> Día del plan sin estirar
          </span>
        </p>
      </section>

      <section className="card">
        <h2 className="mb-4 font-semibold">Minutos por semana</h2>
        <div className="flex h-32 items-end gap-2">
          {weeks.map((w, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-muted">{w.mins || ""}</span>
              <div
                className={`w-full rounded-t-md ${i === weeks.length - 1 ? "bg-accent" : "bg-accent/40"}`}
                style={{ height: `${(w.mins / maxWeek) * 96}px` }}
              />
              <span className="text-[10px] text-muted">{w.start.getDate()}/{w.start.getMonth() + 1}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Últimas sesiones</h2>
        {recent.length === 0 && <p className="text-sm text-muted">Todavía no hay sesiones. ¡La primera es la más importante!</p>}
        {recent.map((s) => (
          <div key={s.id} className="card flex items-center justify-between p-4 text-sm">
            <div>
              <p className="font-semibold">{s.routineName}</p>
              <p className="text-xs text-muted">
                {new Date(s.startedAt).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })} ·{" "}
                {Math.max(1, Math.round(s.seconds / 60))} min{!s.completed ? " · incompleta" : ""}
              </p>
            </div>
            {s.moodAfter && <span className="text-xs text-accent">{MOOD_LABEL[s.moodAfter]}</span>}
          </div>
        ))}
      </section>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="card">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-3xl font-bold">
        {value} <span className="text-base font-normal text-muted">{value === 1 ? unit.replace(/s$/, "") : unit}</span>
      </p>
    </div>
  );
}
