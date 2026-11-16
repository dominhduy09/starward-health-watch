# Upgrades to score higher with the judges

Important: the submission deadline was Sunday Nov 15, 11:59 PM local time. If your local time is Chicago, it passed about 12 minutes ago. Check your project page right away — if editing is still open, save now. These upgrades help most for local judging, a live pitch, or next year.

Judges score five things: Impact, Creativity, Validity, Relevance, Presentation. Below is one targeted upgrade per area.

## 1. Presentation — "Judge Tour" mode (highest value)
- A "Start 30-sec Tour" button in the header that runs the app by itself: Nominal → Solar Particle Event turns CRITICAL → body map highlights radiation → Copilot gives an answer from a saved example (no AI cost, always works) → back to Nominal.
- Short caption at each step, so a judge with no background understands it.
- You can screen-record this tour to make the required 30-second demo video.

## 2. Validity — "Data & Evidence" page
- New page listing where each safe range comes from (public NASA HRP pages and published references), with a clear note that values are simulated.
- A "source" link next to each limit on the vital cards.
- Judges check whether the science holds up; this shows it does.

## 3. Relevance — Mission Debrief report for the flight surgeon
- "Export Crew Report" button creates a printable one-page summary: vitals, risks, HRP hazards, symptom logs, checklist status.
- Speaks to the challenge's goal of handing autonomous data to Earth after the communication delay.

## 4. Impact — Comms-delay message queue
- Shows messages to Mission Control as "sending… arrives in 14m 20s" with a countdown, based on the chosen environment (Mars, Moon, ISS).
- Makes the "Distance from Earth" problem easy to see.

## 5. Creativity — Whole-crew overview
- A small panel showing all three crew members' status at once, so the commander can spot who needs help first.

## Technical details
- Tour: a step-by-step timer in the dashboard that sets scenario, focus area and a saved Copilot reply; stops if the user clicks anything.
- Evidence: new route `/evidence` with its own page title/description; a sources list shared with the vital cards.
- Report: print-friendly page using the browser's print-to-PDF.
- Comms queue and crew overview reuse the existing simulated data; no backend needed.
- Keep all existing simulation-only and flight-surgeon safety labels.
