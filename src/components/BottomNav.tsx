"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Hoy", icon: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" },
  { href: "/rutinas", label: "Rutinas", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/progreso", label: "Progreso", icon: "M4 20V10m6 10V4m6 16v-7m4 7H2" },
  {
    href: "/ajustes",
    label: "Ajustes",
    icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.4 7.4 0 0 0-.1-1.3l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2.2-1.3L14.4 3h-4l-.4 2.5a7.6 7.6 0 0 0-2.2 1.3l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.6l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2.2 1.3l.4 2.5h4l.4-2.5a7.6 7.6 0 0 0 2.2-1.3l2.4 1 2-3.4-2-1.6c.1-.4.1-.9.1-1.3z",
  },
];

/** Barra inferior. Se oculta en el reproductor y en la configuración inicial. */
export default function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/sesion") || pathname.startsWith("/bienvenida")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto flex max-w-md">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 py-3 text-xs ${active ? "font-semibold text-accent" : "text-muted"}`}
                aria-current={active ? "page" : undefined}
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={item.icon} />
                </svg>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
