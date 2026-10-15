# Estirá

Web app de rutinas cortas de estiramiento, inspirada en Bend: cada día sugiere una rutina según tu plan, la guía ejercicio por ejercicio con temporizador y lleva tu racha e historial. Funciona en el celular (instalable como app) y en la compu.

## Cómo correrla

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # build de producción
```

Se despliega en Vercel sin configuración extra: importar el repositorio en Vercel y listo.

## Cómo está organizada

| Carpeta | Qué hay |
| --- | --- |
| `src/data/exercises.ts` | Catálogo de ejercicios (nombre, zona, posición, duración, instrucciones) |
| `src/data/routines.ts` | Rutinas armadas a partir de los ejercicios |
| `src/lib/plan.ts` | Elección de la rutina del día, racha y progreso semanal |
| `src/lib/db.ts` | Guardado local en el navegador (IndexedDB con Dexie), respaldo e importación |
| `src/app/sesion/[id]/Player.tsx` | Reproductor guiado (temporizador, sonido, vibración, voz) |
| `public/sw.js` | Service worker para usar la app sin conexión |

No hay backend: el plan y las sesiones se guardan solo en el navegador de cada dispositivo. Desde Ajustes se puede descargar e importar un respaldo.

Para sumar un ejercicio, agregalo en `exercises.ts` y usalo en alguna rutina de `routines.ts`.
