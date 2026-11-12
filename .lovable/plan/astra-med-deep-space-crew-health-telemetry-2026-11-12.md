# ASTRA-MED // Deep Space Crew Health Telemetry

A single-page mission dashboard at `/`. All data is simulated in the browser (no backend needed), driven by a scenario engine so every panel reacts instantly.

## Look & feel
- Deep-space background (#050811), frosted glass panels with thin cyan borders.
- Cyan/teal = nominal, amber = caution, crimson = critical.
- Space Grotesk for UI, JetBrains Mono (tabular numbers) for all readouts, clocks and timestamps.

## Header
- Title, live MET clock (Day 142 | hh:mm:ss UTC, ticking), Earth comms latency badge ("14m 20s — Autonomous Mode Active").
- Crew selector: Cmdr. Elena Vance, Dr. Marcus Chen, Spec. Kenji Sato (each has their own baseline vitals, radiation history, bone density).
- Live Stream toggle (vitals jitter every 2s, sparklines scroll).
- Scenario bar: Nominal Orbit, Solar Particle Event, Extended EVA Strain, Circadian & Isolation Stress.

## Bento grid
- **A. Six vital cards** with sparkline + status badge: HR & HRV, SpO2, Core Temp, Cumulative Radiation (mSv vs mission/career limit progress bar), Bone Mineral Density % change, Cognitive Readiness 0–100.
- **B. Telemetry chart**: 24h / 30-day range switch; layer toggles Cardiovascular, Radiation, Sleep/Circadian; shaded safe-threshold bands so anomalies pop.
- **C. Triage Copilot**: overall status NOMINAL/CAUTION/CRITICAL, list of detected risks with plain explanations, interactive intervention checklist with progress (resets per scenario/crew).
- **D. Symptom Log** (side drawer): headache, dizziness, visual flashes, nausea toggles; sleep quality and mood/isolation sliders; notes. Submitting recalculates readiness score and adds symptom-driven risks and actions to triage. Recent log history shown.

## Responsiveness
Desktop 3-column bento, tablet 2-column, stacked on small screens.

## Technical details
- Rule-based triage engine in `src/lib/triage.ts` (thresholds → risks → protocols), scenario/crew data in `src/lib/telemetry.ts`, state via a React context.
- Recharts for charts (ReferenceArea for safe zones), shadcn Sheet/Slider/Switch/Checkbox/Select.
- Design tokens (nominal/caution/critical, glass) in `src/styles.css`; fonts via `<link>` in root head; page head metadata set.
- Vitest tests for triage thresholds (e.g. SpO2 < 92 → critical, readiness score drops with symptoms).
