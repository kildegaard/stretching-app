import Link from "next/link";
import { routineMinutes, routineZones } from "@/lib/routine";
import { GOAL_LABEL, ZONE_LABEL, type Routine } from "@/lib/types";

export default function RoutineCard({ routine }: { routine: Routine }) {
  const zones = routineZones(routine).filter((z) => z !== "respiracion" && z !== "cuerpo-completo");
  return (
    <Link href={`/rutinas/${routine.id}`} className="card block transition active:scale-[0.99]">
      <div className="mb-1 flex items-center justify-between text-xs text-muted">
        <span>{GOAL_LABEL[routine.goal]}</span>
        <span>{routineMinutes(routine)} min</span>
      </div>
      <h3 className="text-lg font-semibold">{routine.name}</h3>
      <p className="mt-1 text-sm text-muted">{routine.description}</p>
      {zones.length > 0 && (
        <p className="mt-3 text-xs text-muted">{zones.map((z) => ZONE_LABEL[z]).join(" · ")}</p>
      )}
    </Link>
  );
}
