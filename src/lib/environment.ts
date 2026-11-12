import type { Vitals } from "./telemetry";
import type { HazardId } from "./hazards";

export type EnvironmentId = "transit" | "iss" | "lunar" | "mars";

export interface Environment {
  id: EnvironmentId;
  label: string;
  /** One-line mission context shown under the selector. */
  short: string;
  /** Gravity context for the crew. */
  gravity: string;
  /** One-way Earth comms latency. */
  comms: string;
  /** Radiation environment note. */
  dose: string;
  /** Hazards that are always in play for this environment. */
  hazards: HazardId[];
  /** How this environment shifts the baseline vitals. */
  delta: Partial<Vitals>;
}

export const ENVIRONMENTS: Environment[] = [
  {
    id: "transit", label: "Deep-Space Transit", short: "Trans-Mars coast — outside the magnetosphere",
    gravity: "0 g (microgravity)", comms: "14m 20s", dose: "GCR + SPE — ≈2.6× low-Earth orbit",
    hazards: ["radiation", "distance", "isolation"],
    delta: { doseRate: 1.4, radiation: 6, stress: 6 },
  },
  {
    id: "iss", label: "ISS / Orbital Station", short: "Low Earth Orbit — partially magnetosphere-shielded",
    gravity: "0 g (microgravity)", comms: "0.5s", dose: "South Atlantic Anomaly passes only",
    hazards: ["gravity", "closed", "isolation"],
    delta: { doseRate: -0.15, radiation: -6 },
  },
  {
    id: "lunar", label: "Lunar South Pole Base", short: "Permanently shadowed crater ops — abrasive regolith dust",
    gravity: "0.16 g (lunar)", comms: "1.3s", dose: "No magnetosphere — GCR field dose",
    hazards: ["gravity", "closed", "distance", "radiation"],
    delta: { doseRate: 0.9, radiation: 3, hydration: -3, stress: 4 },
  },
  {
    id: "mars", label: "Mars Surface Rover", short: "Thin CO₂ atmosphere — 20 min one-way to Houston",
    gravity: "0.38 g (Mars)", comms: "14m 20s", dose: "No global field — regolith shielding required",
    hazards: ["gravity", "closed", "distance", "radiation", "isolation"],
    delta: { doseRate: 1.2, radiation: 5, stress: 10, hydration: -5 },
  },
];

export const environmentFor = (id: EnvironmentId): Environment => ENVIRONMENTS.find((e) => e.id === id)!;
