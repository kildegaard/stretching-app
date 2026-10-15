"use client";

import type { Prefs } from "./types";

let ctx: AudioContext | null = null;

/** Hay que llamarla desde un toque del usuario para que iOS habilite el audio. */
export function unlockAudio() {
  if (typeof window === "undefined") return;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  ctx ??= new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
}

function tone(freq: number, start: number, duration: number) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  const t = ctx.currentTime + start;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

export type Cue = "tick" | "start" | "finish";

export function playCue(cue: Cue, prefs: Prefs) {
  if (prefs.sound) {
    if (cue === "tick") tone(660, 0, 0.12);
    if (cue === "start") tone(880, 0, 0.35);
    if (cue === "finish") {
      tone(660, 0, 0.3);
      tone(880, 0.25, 0.3);
      tone(1100, 0.5, 0.5);
    }
  }
  if (prefs.vibration && "vibrate" in navigator) {
    navigator.vibrate(cue === "tick" ? 40 : cue === "start" ? 150 : [120, 80, 120]);
  }
}

export function speak(text: string, prefs: Prefs) {
  if (!prefs.voice || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-AR";
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}
