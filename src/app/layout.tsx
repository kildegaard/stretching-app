import type { Metadata, Viewport } from "next";
import BottomNav from "@/components/BottomNav";
import ServiceWorker from "@/components/ServiceWorker";
import "./globals.css";

export const metadata: Metadata = {
  title: "Estirá",
  description: "Rutinas cortas de estiramiento para relajarte, entrar en calor y dormir mejor.",
  appleWebApp: { capable: true, title: "Estirá", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#141a1b" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className="h-full antialiased">
      <body className="min-h-full">
        <main className="mx-auto w-full max-w-md px-4 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))]">
          {children}
        </main>
        <BottomNav />
        <ServiceWorker />
      </body>
    </html>
  );
}
