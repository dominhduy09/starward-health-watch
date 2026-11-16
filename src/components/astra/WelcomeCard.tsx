import { useEffect, useState } from "react";
import { Play, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "astra-welcome-seen";
export function WelcomeCard({ onTour }: { onTour: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setShow(localStorage.getItem(KEY) !== "1"); }, []);
  if (!show) return null;
  const close = () => { localStorage.setItem(KEY, "1"); setShow(false); };
  return (
    <div className="glass relative p-4 md:p-5 border-primary/50">
      <button aria-label="Close welcome" onClick={close} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
      <h2 className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-primary" />Hi, I'm ASTRA-MED 👋</h2>
      <p className="mt-1 text-sm text-muted-foreground">I help astronauts look after their health when Earth is too far away to help quickly. Explore in 3 steps:</p>
      <ol className="mt-2 grid gap-1 text-sm sm:grid-cols-3">
        <li><span className="readout text-primary">1 ·</span> Pick a scenario like a solar storm</li>
        <li><span className="readout text-primary">2 ·</span> Tap a body area to learn how to check it</li>
        <li><span className="readout text-primary">3 ·</span> Ask the AI Copilot a question</li>
      </ol>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" className="gap-2" onClick={() => { close(); onTour(); }}><Play className="size-4" />Start the tour</Button>
        <Button size="sm" variant="ghost" onClick={close}>I'll explore myself</Button>
      </div>
    </div>
  );
}
