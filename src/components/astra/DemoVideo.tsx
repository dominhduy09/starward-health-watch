import { useState } from "react";
import { Clapperboard, Play, Youtube } from "lucide-react";
import demoVideo from "@/assets/iss-exercise-demo.mp4.asset.json";
import thumbBest from "@/assets/nasa-exercise-best.jpg.asset.json";
import thumbBenefits from "@/assets/nasa-exercise-benefits.jpg.asset.json";
import thumbHiit from "@/assets/nasa-exercise-hiit.jpg.asset.json";

const NASA_VIDEOS = [
  { id: "7QtUH6IOXIc", title: "Best Exercise for Astronauts", thumb: thumbBest.url },
  { id: "klRFSA_auPg", title: "Space Station Live: Health Benefits of Exercise in Space, and on Earth!", thumb: thumbBenefits.url },
  { id: "b_Ot7r-nXRw", title: "Space Station Live: High-Intensity Exercise in Space", thumb: thumbHiit.url },
];

function NasaCard({ id, title, thumb }: { id: string; title: string; thumb: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background/40">
      <div className="relative aspect-video">
        {playing ? (
          <iframe
            className="absolute inset-0 size-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button onClick={() => setPlaying(true)} aria-label={`Play: ${title}`} className="group absolute inset-0 size-full">
            <img src={thumb} alt="" className="size-full object-cover opacity-80 transition-opacity group-hover:opacity-100" loading="lazy" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-12 place-items-center rounded-full border border-primary/50 bg-background/70 backdrop-blur-sm transition-transform group-hover:scale-110">
                <Play className="size-5 fill-primary text-primary" />
              </span>
            </span>
          </button>
        )}
      </div>
      <div className="flex items-start gap-2 p-3">
        <Youtube className="mt-0.5 size-4 shrink-0 text-critical" />
        <div className="min-w-0">
          <p className="text-xs font-medium leading-snug">{title}</p>
          <p className="readout mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">NASA · Johnson Space Center</p>
        </div>
      </div>
    </div>
  );
}

export function DemoVideo() {
  return (
    <section className="glass p-4 md:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold"><Clapperboard className="size-4 text-primary" />Mission Demo &amp; Training Footage</h2>
          <p className="text-xs text-muted-foreground">Why countermeasure exercise matters — and how ASTRA-MED watches over it</p>
        </div>
        <span className="readout text-[10px] uppercase tracking-widest text-muted-foreground">NASA Space Apps 2026</span>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-primary/30">
          <div className="relative aspect-video">
            <video className="absolute inset-0 size-full object-cover" src={demoVideo.url} autoPlay muted loop playsInline preload="metadata" />
            <span className="readout absolute left-2 top-2 rounded border border-primary/40 bg-background/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary backdrop-blur-sm">
              Concept viz · ARED treadmill + live telemetry
            </span>
          </div>
          <p className="p-3 text-xs leading-relaxed text-muted-foreground">
            Crewmembers train ~2.5 h/day on treadmill, cycle and resistive devices to fight bone and muscle loss.
            ASTRA-MED streams their vitals throughout each session and flags strain before it becomes injury.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {NASA_VIDEOS.map((v) => <NasaCard key={v.id} {...v} />)}
        </div>
      </div>
    </section>
  );
}
