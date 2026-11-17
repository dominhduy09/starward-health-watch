/** General adult wellness reference ranges. Not diagnostic; the app is not a medical device. */
export type Kind = "hr" | "bp" | "spo2" | "temp" | "glucose" | "sleep";
export type Level = "ok" | "watch" | "urgent";

export const KINDS: { id: Kind; label: string; unit: string; hint: string }[] = [
  { id: "hr", label: "Heart rate", unit: "bpm", hint: "Resting, sitting quietly" },
  { id: "bp", label: "Blood pressure", unit: "mmHg", hint: "Top / bottom number" },
  { id: "spo2", label: "Oxygen", unit: "%", hint: "From a fingertip oximeter" },
  { id: "temp", label: "Temperature", unit: "°C", hint: "Body temperature" },
  { id: "glucose", label: "Blood sugar", unit: "mg/dL", hint: "From a glucose meter" },
  { id: "sleep", label: "Sleep", unit: "h", hint: "Hours last night" },
];

const BOUNDS: Record<Kind, [number, number]> = {
  hr: [25, 250], bp: [60, 260], spo2: [50, 100], temp: [30, 45], glucose: [20, 600], sleep: [0, 24],
};
const DIA_BOUNDS: [number, number] = [30, 160];

/** Returns an error message for values no real person could have (typos), else null. */
export function validateReading(kind: Kind, value: number, value2?: number | null): string | null {
  if (!Number.isFinite(value)) return "Enter a number";
  const [lo, hi] = BOUNDS[kind];
  if (value < lo || value > hi) return `That looks like a typo — expected ${lo}–${hi}`;
  if (kind === "bp") {
    if (value2 == null || !Number.isFinite(value2)) return "Enter the bottom number too";
    if (value2 < DIA_BOUNDS[0] || value2 > DIA_BOUNDS[1]) return `Bottom number should be ${DIA_BOUNDS[0]}–${DIA_BOUNDS[1]}`;
    if (value2 >= value) return "The top number should be higher than the bottom";
  }
  return null;
}

export function classify(kind: Kind, value: number, value2?: number | null): Level {
  switch (kind) {
    case "hr": return value < 40 || value > 130 ? "urgent" : value < 50 || value > 100 ? "watch" : "ok";
    case "spo2": return value < 90 ? "urgent" : value < 95 ? "watch" : "ok";
    case "temp": return value >= 39.5 || value < 35 ? "urgent" : value >= 38 || value < 36 ? "watch" : "ok";
    case "glucose": return value < 54 || value > 300 ? "urgent" : value < 70 || value > 180 ? "watch" : "ok";
    case "sleep": return value < 6 || value > 10 ? "watch" : "ok";
    case "bp": {
      const d = value2 ?? 0;
      if (value >= 180 || d >= 120) return "urgent";
      if (value >= 130 || d >= 80 || value < 90) return "watch";
      return "ok";
    }
  }
}

export const worst = (levels: Level[]): Level =>
  levels.includes("urgent") ? "urgent" : levels.includes("watch") ? "watch" : "ok";

export const fmtValue = (kind: Kind, v: number, v2?: number | null) =>
  kind === "bp" ? `${Math.round(v)}/${Math.round(v2 ?? 0)}` : kind === "temp" || kind === "sleep" ? v.toFixed(1) : String(Math.round(v));
