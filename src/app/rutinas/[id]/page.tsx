import Link from "next/link";
import { notFound } from "next/navigation";
import ExerciseFigure from "@/components/ExerciseFigure";
import { EXERCISE_BY_ID } from "@/data/exercises";
import { ROUTINES, ROUTINE_BY_ID } from "@/data/routines";
import { routineMinutes } from "@/lib/routine";
import { GOAL_LABEL, POSITION_LABEL } from "@/lib/types";

export function generateStaticParams() {
  return ROUTINES.map((r) => ({ id: r.id }));
}

export default async function RoutineDetailPage({ params }: PageProps<"/rutinas/[id]">) {
  const { id } = await params;
  const routine = ROUTINE_BY_ID.get(id);
  if (!routine) notFound();

  return (
    <div className="space-y-5">
      <Link href="/rutinas" className="text-sm font-semibold text-accent">
        ← Rutinas
      </Link>
      <header>
        <p className="text-sm text-muted">
          {GOAL_LABEL[routine.goal]} · {routineMinutes(routine)} min
        </p>
        <h1 className="text-3xl font-bold leading-tight">{routine.name}</h1>
        <p className="mt-2 text-muted">{routine.description}</p>
      </header>

      <Link href={`/sesion/${routine.id}`} className="btn-primary w-full">
        Empezar
      </Link>

      <ol className="space-y-2">
        {routine.steps.map((step, i) => {
          const ex = EXERCISE_BY_ID.get(step.exerciseId)!;
          const seconds = step.seconds ?? ex.seconds;
          return (
            <li key={`${step.exerciseId}-${i}`} className="card flex items-center gap-4 p-4">
              <ExerciseFigure position={ex.position} className="h-12 w-12 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{ex.name}</p>
                <p className="text-xs text-muted">
                  {POSITION_LABEL[ex.position]} · {seconds} s{ex.perSide ? " por lado" : ""}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
