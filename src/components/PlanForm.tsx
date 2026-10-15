"use client";

import { useState } from "react";
import { WEEKDAYS_LONG } from "@/lib/dates";
import { GOAL_LABEL, ZONE_LABEL, type Goal, type Plan, type Zone } from "@/lib/types";

const GOALS = Object.keys(GOAL_LABEL) as Goal[];
const MINUTES: Plan["minutes"][] = [5, 10, 15];
const AVOIDABLE: Zone[] = ["cuello", "hombros", "espalda-baja", "cadera", "piernas", "munecas"];
// Lunes primero.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

interface Props {
  initial?: Plan | null;
  submitLabel: string;
  onSubmit: (plan: Plan) => void | Promise<void>;
}

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export default function PlanForm({ initial, submitLabel, onSubmit }: Props) {
  const [goal, setGoal] = useState<Goal>(initial?.goal ?? "relajar");
  const [days, setDays] = useState<number[]>(initial?.days ?? [0, 1, 2, 3, 4, 5, 6]);
  const [minutes, setMinutes] = useState<Plan["minutes"]>(initial?.minutes ?? 10);
  const [avoid, setAvoid] = useState<Zone[]>(initial?.avoidZones ?? []);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (days.length === 0) return;
    setSaving(true);
    await onSubmit({
      goal,
      days: [...days].sort(),
      minutes,
      avoidZones: avoid,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    });
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      <fieldset className="space-y-3">
        <legend className="mb-3 font-semibold">¿Para qué querés estirar?</legend>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <button type="button" key={g} className="chip" aria-pressed={goal === g} onClick={() => setGoal(g)}>
              {GOAL_LABEL[g]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 font-semibold">¿Qué días?</legend>
        <p className="mb-3 text-sm text-muted">
          La racha solo cuenta estos días. Los demás son libres. {days.length} {days.length === 1 ? "día" : "días"} por semana.
        </p>
        <div className="flex justify-between gap-1">
          {DAY_ORDER.map((d) => (
            <button
              type="button"
              key={d}
              aria-pressed={days.includes(d)}
              aria-label={WEEKDAYS_LONG[d]}
              onClick={() => setDays(toggle(days, d))}
              className="chip h-11 w-11 px-0"
            >
              {WEEKDAYS_LONG[d].slice(0, 2)}
            </button>
          ))}
        </div>
        {days.length === 0 && <p className="mt-2 text-sm text-warm">Elegí al menos un día.</p>}
      </fieldset>

      <fieldset>
        <legend className="mb-3 font-semibold">¿Cuánto tiempo por sesión?</legend>
        <div className="flex gap-2">
          {MINUTES.map((m) => (
            <button type="button" key={m} className="chip flex-1" aria-pressed={minutes === m} onClick={() => setMinutes(m)}>
              {m} min
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 font-semibold">¿Alguna zona que prefieras evitar?</legend>
        <p className="mb-3 text-sm text-muted">Opcional. Las rutinas sugeridas no van a incluirla.</p>
        <div className="flex flex-wrap gap-2">
          {AVOIDABLE.map((z) => (
            <button type="button" key={z} className="chip" aria-pressed={avoid.includes(z)} onClick={() => setAvoid(toggle(avoid, z))}>
              {ZONE_LABEL[z]}
            </button>
          ))}
        </div>
      </fieldset>

      <button type="submit" className="btn-primary w-full" disabled={saving || days.length === 0}>
        {submitLabel}
      </button>
    </form>
  );
}
