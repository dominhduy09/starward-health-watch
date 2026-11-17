import type { Level } from "@/lib/ranges";
import { cn } from "@/lib/utils";
export const levelText: Record<Level, string> = { ok: "Normal", watch: "Watch", urgent: "Get help" };
export const levelColor: Record<Level, string> = { ok: "text-nominal border-nominal/50", watch: "text-caution border-caution/50", urgent: "text-critical border-critical/60" };
export function LevelBadge({ level }: { level: Level }) {
  return <span className={cn("readout rounded border px-2 py-0.5 text-[10px] uppercase", levelColor[level])}>{levelText[level]}</span>;
}
export function UrgentBanner({ who }: { who?: string }) {
  return (
    <div role="alert" className="rounded-lg border-2 border-critical bg-critical/15 p-4">
      <p className="text-lg font-semibold text-critical">Get medical help now</p>
      <p className="text-sm">{who ? `${who} has` : "You have"} a recent reading in the danger range. If {who ? "they feel" : "you feel"} unwell — chest pain, trouble breathing, fainting or confusion — call your local emergency number. Re-measure if you think it was a mistake.</p>
    </div>
  );
}
