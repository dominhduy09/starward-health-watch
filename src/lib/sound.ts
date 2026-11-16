/** Soft synthesized UI sounds (Web Audio). Browser-only: call from handlers/effects. */
export type SoundName = "blip" | "nominal" | "caution" | "critical" | "tick" | "badge" | "whoosh" | "ping" | "receive";

export const SOUND_KEY = "astra-sound";
/** Sounds default ON unless the user has turned them off. */
export function readSoundPref(store: Pick<Storage, "getItem">): boolean {
  return store.getItem(SOUND_KEY) !== "off";
}
export function writeSoundPref(store: Pick<Storage, "setItem">, on: boolean) {
  store.setItem(SOUND_KEY, on ? "on" : "off");
}

let ctx: AudioContext | null = null;
let enabled = true;
export const setSoundEnabled = (on: boolean) => { enabled = on; };

function tone(c: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.08, to?: number) {
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, c.currentTime + start);
  if (to) o.frequency.exponentialRampToValueAtTime(to, c.currentTime + start + dur);
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(vol, c.currentTime + start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination); o.start(c.currentTime + start); o.stop(c.currentTime + start + dur + 0.05);
}

export function play(name: SoundName) {
  if (!enabled || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const c = ctx;
    switch (name) {
      case "blip": tone(c, 880, 0, 0.08, "sine", 0.05); break;
      case "tick": tone(c, 1200, 0, 0.05, "triangle", 0.06); tone(c, 1600, 0.05, 0.06, "triangle", 0.05); break;
      case "nominal": [523, 659, 784].forEach((f, i) => tone(c, f, i * 0.1, 0.35, "sine", 0.06)); break;
      case "caution": tone(c, 660, 0, 0.18, "triangle", 0.07); tone(c, 520, 0.22, 0.22, "triangle", 0.07); break;
      case "critical": [0, 0.35].forEach((s) => tone(c, 440, s, 0.25, "sine", 0.09, 330)); break;
      case "badge": [784, 988, 1175, 1568].forEach((f, i) => tone(c, f, i * 0.07, 0.25, "sine", 0.05)); break;
      case "whoosh": tone(c, 300, 0, 0.5, "sawtooth", 0.025, 1400); break;
      case "ping": tone(c, 1320, 0, 0.4, "sine", 0.06); break;
      case "receive": tone(c, 700, 0, 0.1, "sine", 0.05); tone(c, 1050, 0.1, 0.18, "sine", 0.05); break;
    }
  } catch { /* audio unavailable */ }
}
