import type { Severity } from "@/lib/triage";
export const sevText: Record<Severity, string> = { nominal: "text-nominal", caution: "text-caution", critical: "text-critical" };
export const sevBadge: Record<Severity, string> = {
  nominal: "bg-nominal/10 text-nominal border-nominal/30",
  caution: "bg-caution/10 text-caution border-caution/40",
  critical: "bg-critical/15 text-critical border-critical/50",
};
export const sevStroke: Record<Severity, string> = { nominal: "var(--color-nominal)", caution: "var(--color-caution)", critical: "var(--color-critical)" };
