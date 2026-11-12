import type { Vitals } from "./telemetry";
import type { Crew } from "./telemetry";

/** The five physiological systems a crew member can self-examine. */
export type SystemId = "neuro" | "cardio" | "skeletal" | "immune" | "radiation";

export interface SystemDef {
  id: SystemId;
  name: string;
  /** What the body-map region is called in plain words. */
  region: string;
  /** Why the exam matters — written for a crew member, not a flight surgeon. */
  why: string;
  /** Step-by-step self-measure instructions using the onboard medical kit. */
  how: string[];
  /** Kit items referenced by the steps. */
  kit: string[];
  /** Metric readouts filtered for this system. */
  metrics: (v: Vitals, crew: Crew) => { label: string; value: string; unit?: string }[];
}

export const SYSTEMS: SystemDef[] = [
  {
    id: "neuro",
    name: "Neuro-Ocular & Brain (SANS)",
    region: "Head & eyes",
    why: "With no gravity pulling fluid down to your legs, some of it stays in your head. That extra pressure can flatten the back of the eyeball and swell the optic nerve — Spaceflight-Associated Neuro-Ocular Syndrome (SANS). Caught early it is manageable; ignored it can leave permanent blurry vision. This panel also tracks cognitive readiness, because a tired brain makes every other reading worse.",
    how: [
      "Open the ultrasound (USOPS) kit, put sterile gel in the eye-pad cover and rest the probe gently on the closed eyelid.",
      "Take a sagittal view straight back along the optic nerve and freeze the frame.",
      "Measure the bright sheath around the nerve 3 mm behind the back of the eyeball and write the number down.",
      "Judge it: under 5.0 mm is normal, 5.0–5.5 mm is borderline, above 5.5 mm means report it to the flight surgeon.",
      "Run the WinSCAT neuro-cognitive test (about 10 min) and note any new flashing lights, double vision or morning headache.",
    ],
    kit: ["Ultrasound / USOPS kit", "WinSCAT tablet", "Refraction test set"],
    metrics: (v) => [
      { label: "Optic nerve sheath", value: v.ossd.toFixed(1), unit: "mm" },
      { label: "Cognitive readiness", value: `${Math.round(v.cognitive)}`, unit: "/100" },
      { label: "Sleep last night", value: v.sleepHours.toFixed(1), unit: "h" },
      { label: "Stress index", value: `${Math.round(v.stress)}`, unit: "/100" },
    ],
  },
  {
    id: "cardio",
    name: "Cardiovascular System",
    region: "Chest & heart",
    why: "Your heart no longer has to fight gravity, so it works less and changes shape slightly. Fluid shifts toward the chest and head, which can hide a real blood-pressure problem. A rising resting heart rate with a falling HRV is the earliest warning that you are dehydrated, overheating or fighting an infection — often a full day before you feel it.",
    how: [
      "Sit quietly for 5 minutes with your arm supported at heart level; do not talk during the reading.",
      "Wrap the medical-kit cuff on your upper arm, keep still and silent, and take two readings one minute apart.",
      "Record both numbers: keep the top number under 140 and the bottom number under 90 mmHg.",
      "Put on the heart-rate strap, breathe slowly for 2 minutes and check HRV — a drop below 45 ms means rest and hydrate now.",
      "If either number is out of range twice in a row, acquire a 12-lead ECG and send it to the flight surgeon.",
    ],
    kit: ["Blood pressure cuff", "HR / HRV chest strap", "12-lead ECG (USOPS)"],
    metrics: (v) => [
      { label: "Heart rate", value: `${v.hr}`, unit: "bpm" },
      { label: "HRV", value: `${v.hrv}`, unit: "ms" },
      { label: "Blood pressure", value: `${v.systolic}/${v.diastolic}`, unit: "mmHg" },
      { label: "Blood oxygen", value: `${v.spo2}`, unit: "%" },
    ],
  },
  {
    id: "skeletal",
    name: "Skeletal & Muscular System",
    region: "Spine, hips & legs",
    why: "Bone only stays strong when something loads it. In weightlessness your hips can lose about 1% of density every month and your muscles waste in days, so the resistive exercise you do is genuinely the medicine. This panel shows how much load you are actually lifting versus what the countermeasure plan asks for.",
    how: [
      "Step onto ARED, select the squat profile and set the load to roughly 70% of your best lift.",
      "Wear the harness and stand on the vibration plate for the whole session.",
      "Do 3 slow sets of 10 reps with 60 seconds of rest between sets.",
      "Log the total load lifted and how the last set felt — if you could not finish it, tell the flight surgeon.",
      "Check your vitamin D and calcium pack is taken, and record any new hip, knee or back pain.",
    ],
    kit: ["ARED resistive exercise device", "Vibration plate + harness", "Vitamin D / calcium pack"],
    metrics: (v) => [
      { label: "Bone mineral density", value: v.bone.toFixed(1), unit: "% since launch" },
      { label: "ARED load", value: `${v.ared}`, unit: "kg" },
      { label: "Hydration", value: `${Math.round(v.hydration)}`, unit: "%" },
    ],
  },
  {
    id: "immune",
    name: "Immune & Metabolic System",
    region: "Abdomen & skin",
    why: "Spaceflight quietly turns down immunity and wakes up viruses that have been asleep in your body — the same family that causes chickenpox and shingles. A small rash, unusual thirst or a temperature that will not settle can be the first visible clue. Blood glucose and core temperature show whether your body is burning fuel and shedding heat correctly.",
    how: [
      "Wash your hands, insert a fresh test strip into the glucometer and use the lancet on a fingertip.",
      "Read the number: 70–140 mg/dL is the normal in-flight window.",
      "Take your temperature with the tympanic thermometer (or ingestible sensor) and note anything above 37.6 °C.",
      "Photograph any rash in good light with a ruler for scale, then upload it to the AI Copilot for a shingles / dermatitis check.",
      "Log fluid intake — aim for 2.5 L — because dehydration makes both glucose and temperature readings unreliable.",
    ],
    kit: ["Glucometer + lancet strips", "Tympanic thermometer", "Dermal photo kit (scale card)"],
    metrics: (v) => [
      { label: "Blood glucose", value: `${v.glucose}`, unit: "mg/dL" },
      { label: "Core temperature", value: v.temp.toFixed(1), unit: "°C" },
      { label: "Viral reactivation index", value: `${Math.round(v.viral)}`, unit: "/100" },
      { label: "Hydration", value: `${Math.round(v.hydration)}`, unit: "%" },
    ],
  },
  {
    id: "radiation",
    name: "Radiation & Cellular Shielding",
    region: "Whole body dose",
    why: "Outside Earth's magnetic field, galactic cosmic rays and solar particle events deliver dose that adds up for the rest of your life. Radiation damages DNA faster than your cells can repair it, which is why dose is tracked against a hard career limit rather than treated like a normal vital sign.",
    how: [
      "Dock your personal dosimeter at the radiation station and read the cumulative total.",
      "Check the station dose rate: under 1 mSv/day is background, 5 mSv/day or more means shelter immediately.",
      "If the rate is climbing, move to the storm shelter (water-wall / lowest deck) and stay until the all-clear.",
      "Log the reading every 30 minutes during an event and defer any EVA or cupola time.",
      "Confirm your dosimeter was worn the whole shift — an un-worn dosimeter under-reads your true dose.",
    ],
    kit: ["Personal electronic dosimeter", "Storm shelter (water wall)", "Potassium iodide (KI) tablets"],
    metrics: (v, crew) => [
      { label: "Cumulative dose", value: v.radiation.toFixed(1), unit: "mSv" },
      { label: "Dose rate", value: v.doseRate.toFixed(2), unit: "mSv/day" },
      { label: "Mission limit", value: `${crew.missionLimit}`, unit: "mSv" },
      { label: "Career limit (HRP)", value: `${crew.careerLimit}`, unit: "mSv" },
    ],
  },
];

export const systemFor = (id: SystemId): SystemDef => SYSTEMS.find((s) => s.id === id)!;
