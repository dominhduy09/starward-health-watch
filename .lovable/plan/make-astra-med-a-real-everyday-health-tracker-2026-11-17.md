# Make ASTRA-MED a real everyday health tracker

## What's missing today
- **No real data.** Every reading is made up by the app. Nothing comes from a real person.
- **No memory.** Nothing is saved. Reloading the page wipes symptom logs and chats.
- **No accounts.** You can't tell one person's health from another's.
- **No one gets alerted.** A "critical" status only shows on screen. No real person is told.
- **No medical approval.** The warning levels and the Copilot are made for learning, not for diagnosing anyone.

So it can't be used in real life yet. The plan below turns it into a personal health log for everyday people, with a team and helper view. It stays a wellness tool, not a medical device.

## What we'll build

### 1. Accounts and saved history (Lovable Cloud)
- Sign up and sign in with email or Google.
- Each person gets their own profile: name, age range and their own "normal" ranges.
- Every reading and symptom check-in is saved, so you can look back over days and weeks.

### 2. Three ways to add real readings
- **Type it in:** heart rate, blood pressure, oxygen, temperature, blood sugar, sleep, mood and symptoms. Each field has a check, so a typo like a heart rate of 800 gets caught.
- **Phone camera pulse:** put a fingertip over the camera with the flash on, wait about 30 seconds and get an estimated heart rate. It's clearly marked "estimate, not medical".
- **Import a file:** upload a CSV or a smartwatch/health-app export. You'll see a preview and pick which columns match, then it saves.

### 3. "My Health" dashboard (real mode)
- The same vital cards and charts, filled with your saved data instead of made-up numbers.
- The green, amber and red colours are compared with general adult reference ranges and your own normal ranges.
- Daily check-in streak and badges count real check-ins.
- The Copilot reads your real recent readings. It keeps the safety rules (it never says what you have or what medicine to take) and tells you to see a doctor.

### 4. Team and helper view
- Create a team (family, club, workplace, expedition) and invite people with a link.
- People choose to share. A **helper** (for example a parent, coach or team medic) sees everyone's latest status on one board, with the most worrying person at the top.
- Anyone can leave the team or stop sharing at any time.

### 5. Safety and urgent warnings
- Clearly dangerous numbers (for example oxygen below 90% or very high blood pressure) show a big "Get medical help now — call your local emergency number" message.
- Helpers see a red flag on the team board.
- A first-time agreement explains that the app is not a medical device.
- You can download all your data, or delete your account and all your data.

### 6. Keep the space demo
- The current astronaut simulation stays at its own page ("Space demo"), with the judge tour unchanged.
- The home page becomes a simple start page: "Track your health" (sign in) or "Try the space demo".

## Not included (needs outside approval or hardware)
- Being certified as a medical device, or giving diagnoses.
- Live syncing with Apple Health or Google Fit (those need a phone app; file import covers this for now).
- Text-message or phone-call alerts (we can add email alerts later if you want).

## Technical details
- Enable Lovable Cloud. Tables: `profiles`, `readings` (type, value, unit, source manual/camera/import, measured_at), `checkins`, `teams`, `team_members` (role in a separate `team_roles`-style table: member/helper), `share_consents`. Every table gets row-level security: you can read your own rows, and a helper can read only members who have chosen to share. A security-definer function `is_team_helper()` avoids recursive security checks.
- Routes: `/` landing, `/demo` (move the current dashboard there), `/auth`, `/_authenticated/me`, `/_authenticated/log`, `/_authenticated/import`, `/_authenticated/team/$id`, `/join/$code`. Each gets its own head() metadata.
- Camera pulse: getUserMedia with the torch, average the red channel of each frame, band-pass filter at 0.7–3.5 Hz, find peaks to estimate BPM. Show a quality score and reject noisy readings. Pure signal code goes in `src/lib/ppg.ts` with tests.
- Import: parse CSV in the browser (papaparse), map columns, check values, then insert in batches through server functions.
- Reference ranges and urgent thresholds go in a pure `src/lib/ranges.ts` with unit tests. Copilot safety stays in the existing shared safety module, and the Copilot context gets a "REAL USER DATA — not clinical" label.
- Server functions use `requireSupabaseAuth`. The Copilot only receives the signed-in user's own data.
