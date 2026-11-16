# Sound effects and a friendlier feel

## Sounds (soft, short, space-themed)
- Gentle "blip" when you click scenario, environment or crew buttons.
- Soft rising chime when status returns to NOMINAL; two-tone amber beep for CAUTION; a calm (not scary) alert pulse for CRITICAL.
- Satisfying "tick" when checking a checklist step; sparkle sound when a badge unlocks.
- "Radio whoosh" when a message is sent to Earth, and a ping when it's delivered.
- Soft typing/receive tone when the Copilot answers.
- Sounds are made in the browser on the fly: free, instant, no files to download, no AI credits.

## Sound control
- Speaker button in the header to turn sounds on/off, remembered between visits.
- Sounds start off until the person clicks once (browsers require this), and the judge tour turns them on automatically.

## Friendlier touches
- Short welcome card on first visit: "Hi, I'm ASTRA-MED — here's how to explore in 3 steps" with a "Start the tour" button; can be dismissed and won't show again.
- Friendly helper text under each section title (e.g. "These cards show how your body is doing right now").
- Small celebration toast ("Great job! Hydration goal reached") when steps or badges complete.
- Keep all simulation-only and flight-surgeon safety labels unchanged.

## Technical details
- New `src/lib/sound.ts` using Web Audio API oscillators/envelopes (no assets, client-only, created lazily on first user gesture).
- Mute state in localStorage, read after hydration.
- Status-change sounds triggered by an effect watching triage level; badge sounds by comparing unlocked badge counts.
- Toasts via sonner (mount `<Toaster />` in root).
- Unit test for the mute preference default and persistence.
