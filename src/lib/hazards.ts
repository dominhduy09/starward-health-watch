// NASA Human Research Program — the five standard hazards of spaceflight.
// Every detected risk is tagged with the hazard(s) that drive it.
export type HazardId = "radiation" | "gravity" | "isolation" | "closed" | "distance";

export interface Hazard {
  id: HazardId;
  label: string;
  short: string;
  /** Tailwind-safe accent token name used by the chip. */
  tone: "critical" | "caution" | "nominal" | "primary";
}

export const HAZARDS: Hazard[] = [
  { id: "radiation", label: "Space Radiation", short: "GCR + SPE dose", tone: "critical" },
  { id: "gravity", label: "Altered Gravity Fields", short: "Fluid shift, unloading", tone: "caution" },
  { id: "isolation", label: "Isolation & Confinement", short: "Crew psychology", tone: "nominal" },
  { id: "closed", label: "Hostile/Closed Environment", short: "ECLSS, dust, suit", tone: "caution" },
  { id: "distance", label: "Distance from Earth", short: "Comms delay, no rescue", tone: "critical" },
];

export const hazardFor = (id: HazardId): Hazard => HAZARDS.find((h) => h.id === id)!;
