import { notFound } from "next/navigation";
import { ROUTINES, ROUTINE_BY_ID } from "@/data/routines";
import Player from "./Player";

export function generateStaticParams() {
  return ROUTINES.map((r) => ({ id: r.id }));
}

export default async function SessionPage({ params }: PageProps<"/sesion/[id]">) {
  const { id } = await params;
  if (!ROUTINE_BY_ID.has(id)) notFound();
  return <Player routineId={id} />;
}
