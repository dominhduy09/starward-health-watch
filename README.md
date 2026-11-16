# Starward Health Watch

Build a mission-critical Astronaut Health Monitoring & Autonomous Medical Triage Web Application for the 2026 NASA Space Apps Challenge ("Create Health Monitoring Software for Astronauts on Space Missions").

### 1. Visual Aesthetic & UI Design
- **Theme:** Deep-space dark mode (`#050811` background) with frosted glassmorphic panels (`backdrop-blur-md`, `bg-slate-900/60`, subtle `1px` borders in `border-cyan-500/20`).
- **Color Palette:** Primary accents in Electric Cyan (`#06b6d4`) and Teal (`#14b8a6`) for nominal states, Amber (`#f59e0b`) for caution/warnings, and Crimson (`#ef4444`) for critical medical alerts.
- **Typography & Feel:** Clean sans-serif UI paired with monospace (`JetBrains Mono` / tabular-nums) for all live biometric readouts, timestamps, and mission elapsed time (MET).

### 2. Core Layout & Navigation
- **Top Mission Control Header:**
  - App Title: **ASTRA-MED // Deep Space Crew Health Telemetry**
  - Live Mission Clock (MET: `Day 142 | 14:22:09 UTC`), Communication Delay Indicator (`Earth Comms Latency: 14m 20s — Autonomous Mode Active`), and Crew Selector dropdown (e.g., *Cmdr. Elena Vance*, *Dr. Marcus Chen*, *Spec. Kenji Sato*).
  - **Interactive Scenario Simulator Bar (Crucial for Demo):** Quick-switch preset buttons that dynamically update all charts, metrics, and AI recommendations in real time:
    1. `Nominal Orbit` (All vitals healthy)
    2. `Solar Particle Event` (Spike in cumulative radiation dose, elevated heart rate, acute fatigue)
    3. `Extended EVA Strain` (Elevated core temp, dehydration risk, high cardiovascular load, low HRV)
    4. `Circadian & Isolation Stress` (Elevated cortisol/stress index, poor REM sleep, cognitive decline)

### 3. Main Dashboard Grid (Bento Layout)
- **Panel A: Real-Time Biometric Vital Cards (6 KPIs with sparklines & status badges):**
  1. Heart Rate (`BPM`) & Heart Rate Variability (`HRV ms`)
  2. Blood Oxygen (`SpO2 %`)
  3. Core Body Temperature (`°C`)
  4. Cumulative Radiation Exposure (`mSv` vs. Career/Mission Limit)
  5. Bone Mineral Density Trend (`% change` — tracking microgravity bone loss)
  6. Cognitive & Behavioral Readiness Score (`0-100`)
- **Panel B: Interactive Multi-Metric Telemetry Chart (Recharts):**
  - Time-series line/area chart showing vital trends over the past 24 hours or 30 mission days with toggleable layers (Cardiovascular, Radiation, Sleep/Circadian).
  - Include shaded safe-threshold zones so anomalies stand out immediately.
- **Panel C: Autonomous Medical Triage & Actionable Protocol Copilot:**
  - Automatically evaluates current biometric anomalies and displays:
    - **Overall Crew Health Status:** `NOMINAL` / `CAUTION` / `CRITICAL`
    - **Detected Physiological Risks:** Clear explanation of what is happening (e.g., *"Elevated resting HR + HRV drop indicates acute sympathetic stress and dehydration post-EVA"*).
    - **Interactive Intervention Checklist:** Actionable steps the astronaut can check off in real time (e.g., *"Initiate 500ml electrolyte hydration protocol"*, *"Relocate to shielded storm shelter module"*, *"Complete 45-min ARED resistive exercise"*).
- **Panel D: Self-Assessment & Symptom Log Drawer/Modal:**
  - Allows the astronaut to log subjective symptoms (headache, dizziness, sleep quality, mood/isolation slider, visual flashes) which immediately recalculates the Crew Health Readiness Score and updates the AI triage advice.

### 4. Technical & Interactive Details
- Include a "Live Stream" toggle that subtly animates/updates vital signs every 2 seconds so the dashboard feels alive.
- Make sure all charts, scenario buttons, symptom check-ins, and checklists work seamlessly with realistic pre-populated NASA-inspired physiological data.
- Ensure responsive desktop and tablet layout with zero clutter.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://starward-health-watch.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0febb649-f26e-405e-b54d-e7b196263f8d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
