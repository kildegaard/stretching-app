"use client";

import { useRef, useState } from "react";
import PlanForm from "@/components/PlanForm";
import { clearAll, exportData, importData, savePlan, savePrefs } from "@/lib/db";
import { usePlan, usePrefs } from "@/lib/hooks";
import type { Prefs } from "@/lib/types";

const PREF_LABELS: { key: keyof Prefs; label: string; hint: string }[] = [
  { key: "sound", label: "Sonido", hint: "Pitidos al empezar y en los últimos segundos" },
  { key: "vibration", label: "Vibración", hint: "Solo en celulares que la soportan" },
  { key: "voice", label: "Voz", hint: "Lee el nombre de cada ejercicio" },
];

export default function SettingsPage() {
  const plan = usePlan();
  const prefs = usePrefs();
  const [message, setMessage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function download() {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estira-respaldo-${data.exportedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function upload(file: File) {
    try {
      await importData(JSON.parse(await file.text()));
      setMessage("Respaldo importado.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "No se pudo importar el archivo.");
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Ajustes</h1>

      <section className="card space-y-1">
        <h2 className="mb-2 font-semibold">Durante la sesión</h2>
        {PREF_LABELS.map((p) => (
          <label key={p.key} className="flex items-center justify-between gap-4 py-2">
            <span>
              <span className="block">{p.label}</span>
              <span className="block text-xs text-muted">{p.hint}</span>
            </span>
            <input
              type="checkbox"
              className="h-6 w-6 accent-[var(--accent)]"
              checked={prefs[p.key]}
              onChange={(e) => savePrefs({ ...prefs, [p.key]: e.target.checked })}
            />
          </label>
        ))}
      </section>

      {plan && (
        <section className="space-y-4">
          <h2 className="font-semibold">Tu plan</h2>
          <PlanForm
            key={plan.createdAt}
            initial={plan}
            submitLabel="Guardar plan"
            onSubmit={async (p) => {
              await savePlan(p);
              setMessage("Plan guardado.");
            }}
          />
        </section>
      )}

      <section className="card space-y-3">
        <h2 className="font-semibold">Tus datos</h2>
        <p className="text-sm text-muted">
          Todo se guarda solo en este navegador. Descargá un respaldo de vez en cuando para no perderlo, o para pasarlo a
          otro dispositivo.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={download}>
            Descargar respaldo
          </button>
          <button className="btn-ghost" onClick={() => fileInput.current?.click()}>
            Importar respaldo
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </div>
        <ConfirmDelete onDeleted={() => setMessage("Se borraron todos los datos.")} />
      </section>

      {message && (
        <p role="status" className="text-center text-sm text-accent">
          {message}
        </p>
      )}
    </div>
  );
}

function ConfirmDelete({ onDeleted }: { onDeleted: () => void }) {
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <button className="text-sm text-warm underline" onClick={() => setArmed(true)}>
        Borrar todos mis datos
      </button>
    );
  }
  return (
    <div className="flex items-center gap-3 text-sm">
      <span>¿Seguro? No se puede deshacer.</span>
      <button
        className="font-semibold text-warm"
        onClick={async () => {
          await clearAll();
          setArmed(false);
          onDeleted();
        }}
      >
        Sí, borrar
      </button>
      <button className="text-muted" onClick={() => setArmed(false)}>
        Cancelar
      </button>
    </div>
  );
}
