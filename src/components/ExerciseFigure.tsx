import type { Position } from "@/lib/types";

/**
 * Ilustración provisoria: una figura simple según la posición del ejercicio.
 * Se reemplaza más adelante por ilustraciones por ejercicio.
 */
const FIGURES: Record<Position, { head: [number, number]; paths: string[] }> = {
  "de-pie": {
    head: [60, 22],
    paths: ["M60 32v38", "M60 44l-18 16M60 44l18 16", "M60 70l-12 32M60 70l12 32"],
  },
  sentado: {
    head: [52, 30],
    paths: ["M52 40l4 40", "M54 54l-14 18M54 54l18 14", "M56 80h34l2 22", "M56 80l-6 0"],
  },
  cuadrupedia: {
    head: [24, 48],
    paths: ["M34 52h50", "M36 54v40M82 54l4 40", "M86 94h14"],
  },
  acostado: {
    head: [18, 82],
    paths: ["M28 84h44", "M72 84l14-18 14 18", "M40 84l14 10"],
  },
};

export default function ExerciseFigure({ position, className = "" }: { position: Position; className?: string }) {
  const fig = FIGURES[position];
  return (
    <svg viewBox="0 0 120 112" className={className} aria-hidden>
      <rect x="6" y="104" width="108" height="3" rx="1.5" className="fill-line" />
      <circle cx={fig.head[0]} cy={fig.head[1]} r="9" className="fill-accent" />
      <g fill="none" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" className="stroke-accent">
        {fig.paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}
