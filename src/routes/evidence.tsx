import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react";
import { SOURCES } from "@/lib/evidence";

export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [
      { title: "Data & Evidence — ASTRA-MED" },
      { name: "description", content: "Public NASA references behind ASTRA-MED's simulated safety thresholds, and the limits of what the demo shows." },
      { property: "og:title", content: "Data & Evidence — ASTRA-MED" },
      { property: "og:description", content: "Public NASA references behind ASTRA-MED's simulated safety thresholds." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Evidence,
});

function Evidence() {
  return (
    <div className="min-h-screen space-bg">
      <main className="mx-auto max-w-4xl p-4 md:p-8 space-y-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary"><ArrowLeft className="size-4" />Back to dashboard</Link>
        <div className="glass p-5 space-y-2">
          <h1 className="flex items-center gap-2 text-xl font-semibold"><BookOpen className="size-5 text-primary" />Data & Evidence</h1>
          <p className="text-sm text-muted-foreground">Where ASTRA-MED's safety ranges come from. All crew data in the app is simulated; thresholds are illustrative and need flight-surgeon validation before any real use.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {SOURCES.map((s) => (
            <div key={s.id} className="glass p-4 space-y-1.5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.metric}</div>
              <div className="readout text-sm text-primary">{s.limit}</div>
              <p className="text-sm text-muted-foreground">{s.note}</p>
              <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary underline">{s.label}<ExternalLink className="size-3" /></a>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
