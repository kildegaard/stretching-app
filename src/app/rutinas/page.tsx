"use client";

import { useState } from "react";
import RoutineCard from "@/components/RoutineCard";
import { ROUTINES } from "@/data/routines";
import { GOAL_LABEL, type Goal } from "@/lib/types";

const GOALS = Object.keys(GOAL_LABEL) as Goal[];

export default function RoutinesPage() {
  const [goal, setGoal] = useState<Goal | null>(null);
  const list = goal ? ROUTINES.filter((r) => r.goal === goal) : ROUTINES;

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Rutinas</h1>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button className="chip shrink-0" aria-pressed={goal === null} onClick={() => setGoal(null)}>
          Todas
        </button>
        {GOALS.map((g) => (
          <button key={g} className="chip shrink-0" aria-pressed={goal === g} onClick={() => setGoal(g)}>
            {GOAL_LABEL[g]}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {list.map((r) => (
          <RoutineCard key={r.id} routine={r} />
        ))}
      </div>
    </div>
  );
}
