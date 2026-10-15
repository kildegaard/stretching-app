"use client";

import { useRouter } from "next/navigation";
import PlanForm from "@/components/PlanForm";
import { savePlan } from "@/lib/db";

export default function WelcomePage() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Estirá</p>
        <h1 className="text-3xl font-bold leading-tight">Unos minutos por día para soltar el cuerpo.</h1>
        <p className="text-muted">
          Contanos un poco qué buscás y te armamos una rutina corta para cada día. Lo podés cambiar cuando quieras.
        </p>
      </header>
      <PlanForm
        submitLabel="Empezar"
        onSubmit={async (plan) => {
          await savePlan(plan);
          router.replace("/");
        }}
      />
    </div>
  );
}
