export interface Source { id: string; metric: string; limit: string; note: string; label: string; url: string; }
/** Public references behind the simulated thresholds. Values in the app are simulated. */
export const SOURCES: Source[] = [
  { id: "radiation", metric: "Cumulative radiation", limit: "600 mSv career (NASA, 2022)", note: "NASA's career effective dose limit for all astronauts.", label: "NASA-STD-3001 Vol. 1 / NASA HRP space radiation", url: "https://www.nasa.gov/hrp/elements/radiation/" },
  { id: "spo2", metric: "SpO₂", limit: "Caution < 95 %, critical < 92 %", note: "Common clinical hypoxemia cut-offs used as illustrative thresholds.", label: "NASA-STD-3001 Vol. 2 (crew health & environment)", url: "https://www.nasa.gov/ocho/nasa-std-3001/" },
  { id: "bone", metric: "Bone mineral density", limit: "~1–1.5 % loss per month in microgravity", note: "Typical hip/spine loss without countermeasures.", label: "NASA HRP — Risk of early onset osteoporosis", url: "https://humanresearchroadmap.nasa.gov/" },
  { id: "ossd", metric: "Optic nerve sheath (SANS)", limit: "Illustrative concern > 5 mm", note: "SANS is monitored with onboard ultrasound and OCT.", label: "NASA HRP — SANS risk", url: "https://humanresearchroadmap.nasa.gov/" },
  { id: "hazards", metric: "Five hazards", limit: "Radiation, isolation, distance, gravity, closed environment", note: "Framework used to tag every risk.", label: "NASA — 5 Hazards of Human Spaceflight", url: "https://www.nasa.gov/hrp/hazards/" },
  { id: "exercise", metric: "ARED exercise", limit: "~2 h/day countermeasure exercise on ISS", note: "Resistive + aerobic exercise preserves bone and muscle.", label: "NASA — Exercise in space", url: "https://www.nasa.gov/missions/station/" },
];
