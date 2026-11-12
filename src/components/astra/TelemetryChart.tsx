import { useState } from "react";
import { CartesianGrid, ComposedChart, Line, Area, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import type { Point } from "@/lib/telemetry";
import { cn } from "@/lib/utils";

type Layer = "cardio" | "radiation" | "sleep";
const LAYERS: { id: Layer; label: string }[] = [{ id: "cardio", label: "Cardiovascular" }, { id: "radiation", label: "Radiation" }, { id: "sleep", label: "Sleep / Circadian" }];
const axis = { stroke: "var(--color-muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" };

export function TelemetryChart({ data, range, onRange }: { data: Point[]; range: "24h" | "30d"; onRange: (r: "24h" | "30d") => void }) {
  const [layer, setLayer] = useState<Layer>("cardio");
  const btn = (active: boolean) => cn("rounded-md border px-2.5 py-1 text-xs transition-colors", active ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground");
  return (
    <div className="glass p-4 md:p-5 flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold">Telemetry Trends</h2>
          <p className="text-xs text-muted-foreground">Shaded bands mark safe operating zones</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {LAYERS.map((l) => <button key={l.id} className={cn(btn(layer === l.id), "min-h-9")} onClick={() => setLayer(l.id)}>{l.label}</button>)}
          <span className="hidden sm:block w-px bg-border mx-1" />
          {(["24h", "30d"] as const).map((r) => <button key={r} className={cn(btn(range === r), "readout min-h-9")} onClick={() => onRange(r)}>{r === "24h" ? "24 H" : "30 DAYS"}</button>)}
        </div>
      </div>
      <div className="h-[260px] sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="t" {...axis} tickLine={false} interval="preserveStartEnd" minTickGap={30} />
            <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {layer === "cardio" && [
              <YAxis key="y" yAxisId="l" {...axis} domain={[30, 130]} />,
              <ReferenceArea key="z" yAxisId="l" y1={50} y2={90} fill="var(--color-nominal)" fillOpacity={0.07} />,
              <Line key="hr" yAxisId="l" dataKey="hr" name="Heart Rate (bpm)" stroke="var(--color-chart-1)" dot={false} strokeWidth={2} isAnimationActive={false} />,
              <Line key="hrv" yAxisId="l" dataKey="hrv" name="HRV (ms)" stroke="var(--color-chart-2)" dot={false} strokeWidth={2} isAnimationActive={false} />,
              <Line key="o2" yAxisId="l" dataKey="spo2" name="SpO₂ (%)" stroke="var(--color-chart-5)" dot={false} strokeWidth={1.5} strokeDasharray="4 3" isAnimationActive={false} />,
            ]}
            {layer === "radiation" && [
              <YAxis key="yl" yAxisId="l" {...axis} domain={["auto", "auto"]} />,
              <YAxis key="yr" yAxisId="r" orientation="right" {...axis} domain={[0, 12]} />,
              <ReferenceArea key="z1" yAxisId="r" y1={0} y2={1} fill="var(--color-nominal)" fillOpacity={0.08} />,
              <ReferenceArea key="z2" yAxisId="r" y1={5} y2={12} fill="var(--color-critical)" fillOpacity={0.06} />,
              <Area key="d" yAxisId="r" dataKey="dose" name="Dose rate (mSv/day)" stroke="var(--color-caution)" fill="var(--color-caution)" fillOpacity={0.15} isAnimationActive={false} />,
              <Line key="c" yAxisId="l" dataKey="radiation" name="Cumulative (mSv)" stroke="var(--color-chart-1)" dot={false} strokeWidth={2} isAnimationActive={false} />,
            ]}
            {layer === "sleep" && [
              <YAxis key="yl" yAxisId="l" {...axis} domain={[0, 100]} />,
              <YAxis key="yr" yAxisId="r" orientation="right" {...axis} domain={[0, 10]} />,
              <ReferenceArea key="z" yAxisId="r" y1={7} y2={9} fill="var(--color-nominal)" fillOpacity={0.08} />,
              <Area key="s" yAxisId="r" dataKey="sleep" name="Sleep (h)" stroke="var(--color-chart-2)" fill="var(--color-chart-2)" fillOpacity={0.12} isAnimationActive={false} />,
              <Line key="r" yAxisId="l" dataKey="rem" name="REM (%)" stroke="var(--color-chart-5)" dot={false} strokeWidth={2} isAnimationActive={false} />,
              <Line key="st" yAxisId="l" dataKey="stress" name="Stress index" stroke="var(--color-critical)" dot={false} strokeWidth={2} isAnimationActive={false} />,
            ]}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
