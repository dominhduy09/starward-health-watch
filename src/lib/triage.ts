import type { Vitals } from "./telemetry";

export type Level = "NOMINAL" | "CAUTION" | "CRITICAL";
export type Severity = "nominal" | "caution" | "critical";

export interface SymptomLog {
  id: string; at: string;
  headache: boolean; dizziness: boolean; visualFlashes: boolean; nausea: boolean;
  sleepQuality: number; // 1-10
  mood: number; // 1-10 (10 = great, 1 = isolated/low)
  notes: string;
}

export interface Risk { id: string; severity: Severity; title: string; detail: string; }
export interface Action { id: string; text: string; priority: Severity; }

export function vitalStatus(v: Vitals): Record<"hr" | "spo2" | "temp" | "radiation" | "bone", Severity> {
  return {
    hr: v.hr > 110 || v.hr < 45 ? "critical" : v.hr > 90 ? "caution" : "nominal",
    spo2: v.spo2 < 92 ? "critical" : v.spo2 < 95 ? "caution" : "nominal",
    temp: v.temp >= 38.5 || v.temp < 35.5 ? "critical" : v.temp >= 37.6 ? "caution" : "nominal",
    radiation: v.radiation >= 150 || v.doseRate >= 5 ? "critical" : v.radiation >= 100 ? "caution" : "nominal",
    bone: v.bone <= -4 ? "critical" : v.bone <= -2.5 ? "caution" : "nominal",
  };
}

export function readinessScore(v: Vitals, log?: SymptomLog | null): number {
  let s = v.cognitive;
  if (log) {
    if (log.headache) s -= 6;
    if (log.dizziness) s -= 9;
    if (log.visualFlashes) s -= 4;
    if (log.nausea) s -= 6;
    s -= Math.max(0, 6 - log.sleepQuality) * 2;
    s -= Math.max(0, 6 - log.mood) * 2;
  }
  return Math.max(0, Math.min(100, Math.round(s)));
}

export const scoreSeverity = (s: number): Severity => (s < 55 ? "critical" : s < 75 ? "caution" : "nominal");

export function triage(v: Vitals, log?: SymptomLog | null) {
  const risks: Risk[] = [];
  const actions: Action[] = [];
  const add = (r: Risk, acts: [string, string][]) => {
    risks.push(r);
    acts.forEach(([id, text]) => actions.push({ id, text, priority: r.severity }));
  };

  if (v.doseRate >= 5) add({ id: "spe", severity: "critical", title: "Solar particle event — acute dose rate",
    detail: `Dose rate ${v.doseRate.toFixed(1)} mSv/day (≈${Math.round(v.doseRate / 0.45)}× background). Risk of acute radiation syndrome prodrome (nausea, fatigue) and CNS effects if unshielded.` },
    [["spe-1", "Shelter in place: move to storm shelter now and stay until all-clear"], ["spe-2", "Take potassium iodide (KI) 130 mg only if flight surgeon / ground confirms radioiodine exposure"], ["spe-3", "Administer ondansetron 8 mg if nausea develops (ARS prodrome)"]]);

  if (v.radiation >= 100) add({ id: "rad", severity: v.radiation >= 150 ? "critical" : "caution", title: "Acute radiation exposure",
    detail: `Cumulative dose ${v.radiation.toFixed(1)} mSv. Proton flux spike consistent with a solar particle event; tissue and CNS dose accruing faster than mission plan.` },
    [...(v.doseRate >= 5 ? [] : [["rad-1", "Relocate to shielded storm shelter module (water-wall)"] as [string, string]]), ["rad-2", "Log personal dosimeter reading every 30 min"], ["rad-3", "Defer all EVA and window-cupola activity"]]);

  if (v.temp >= 37.6 || v.hydration < 85) add({ id: "heat", severity: v.temp >= 38.5 ? "critical" : "caution", title: "Thermal load & dehydration",
    detail: `Core temp ${v.temp.toFixed(1)} °C with hydration at ${Math.round(v.hydration)}% of target. Suit cooling deficit and fluid loss post-EVA.` },
    [["heat-1", "Initiate 500 ml electrolyte hydration protocol"], ["heat-2", "Doff LCVG; rest in 21 °C cabin for 30 min"], ["heat-3", "Re-measure core temperature in 20 min"]]);

  if ((v.hr > 90 && v.hrv < 45) || v.hr > 110) add({ id: "cv", severity: v.hr > 110 ? "critical" : "caution", title: "Sympathetic cardiovascular stress",
    detail: `Elevated resting HR (${v.hr} bpm) with HRV drop to ${v.hrv} ms indicates acute sympathetic stress${v.hydration < 85 ? " and dehydration post-EVA" : ""}.` },
    [["cv-1", "Acquire 12-lead ECG and transmit to flight surgeon"], ["cv-2", "5-min paced breathing (6 breaths/min)"]]);

  if (v.spo2 < 95) add({ id: "o2", severity: v.spo2 < 92 ? "critical" : "caution", title: "Reduced oxygen saturation",
    detail: `SpO₂ ${v.spo2}%. Check cabin ppO₂ and CO₂ scrubber status; rule out suit-induced hypoventilation.` },
    [["o2-1", "Verify cabin ppO₂ / CO₂ on ECLSS panel"], ["o2-2", "Administer supplemental O₂ via mask if < 92%"]]);

  if (v.sleepHours < 6 || v.remPct < 15 || v.stress > 60) add({ id: "circ", severity: v.stress > 70 || v.sleepHours < 4.5 ? "critical" : "caution", title: "Circadian disruption & isolation stress",
    detail: `${v.sleepHours.toFixed(1)} h sleep, ${Math.round(v.remPct)}% REM, stress index ${Math.round(v.stress)}. Elevated cortisol pattern degrading executive function.` },
    [["circ-1", "Schedule 20-min 6500K blue-light exposure at wake"], ["circ-2", "Private family/psych conference at next comm window"], ["circ-3", "Protect 8.5 h sleep period; melatonin 3 mg"]]);

  if (v.bone <= -2.5) add({ id: "bone", severity: v.bone <= -4 ? "critical" : "caution", title: "Microgravity bone loss",
    detail: `BMD ${v.bone.toFixed(1)}% since launch — above the ~1%/month expected rate.` },
    [["bone-1", "Complete 45-min ARED resistive exercise"], ["bone-2", "Verify vitamin D & calcium intake"]]);

  if (log) {
    if (log.visualFlashes) add({ id: "sym-vis", severity: "caution", title: "Reported visual phosphenes",
      detail: "Light flashes are typical of cosmic-ray hits to the retina; correlate with radiation flux." },
      [["sym-vis-1", "Run on-board optical coherence tomography (OCT) scan"]]);
    if (log.headache || log.dizziness) add({ id: "sym-neuro", severity: log.dizziness && log.headache ? "critical" : "caution", title: "Neurovestibular symptoms",
      detail: "Headache/dizziness may indicate fluid shift (SANS), CO₂ build-up or dehydration." },
      [["sym-neuro-1", "Perform neuro-vestibular self-test (WinSCAT)"], ["sym-neuro-2", "Check cabin CO₂ partial pressure"]]);
    if (log.nausea) add({ id: "sym-nau", severity: "caution", title: "Space motion sickness",
      detail: "Nausea reported; restrict head movement and assess hydration." },
      [["sym-nau-1", "Take promethazine 25 mg per protocol SMS-1"]]);
  }

  const score = readinessScore(v, log);
  if (scoreSeverity(score) !== "nominal") add({ id: "cog", severity: scoreSeverity(score), title: "Reduced cognitive readiness",
    detail: `Readiness score ${score}/100. Avoid high-consequence tasks (robotics, docking) until recovered.` },
    [["cog-1", "Reassign critical tasks to a crewmate for next shift"]]);

  const level: Level = risks.some((r) => r.severity === "critical") ? "CRITICAL" : risks.length ? "CAUTION" : "NOMINAL";
  if (!risks.length) actions.push(
    { id: "nom-1", text: "Complete scheduled 2.5 h exercise block (ARED + CEVIS)", priority: "nominal" },
    { id: "nom-2", text: "Log fluid intake (target 2.5 L)", priority: "nominal" },
    { id: "nom-3", text: "Weekly health check-in survey", priority: "nominal" },
  );
  return { level, risks, actions, score };
}
