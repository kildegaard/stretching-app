import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Estirá",
    short_name: "Estirá",
    description: "Rutinas cortas de estiramiento para relajarte, entrar en calor y dormir mejor.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f4ef",
    theme_color: "#3f7f74",
    lang: "es-AR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
