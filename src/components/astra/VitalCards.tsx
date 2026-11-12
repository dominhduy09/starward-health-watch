import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { Bone, Brain, Droplets, HeartPulse, Radiation, Thermometer } from "lucide-react";
import type { Crew, Point, Vitals } from "@/lib/telemetry";
import { scoreSeverity, vitalStatus, type Severity } from "@/lib/triage";
import { sevBadge, sevStroke, sevText } from "./status";
import { cn } from "@/lib/utils";

function Spark({ data, k, sev }: { data: Point[]; k: keyof Point; sev: Severity }) {
  return (
    <div className="h-10 -mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Area type="monotone" dataKey={k} stroke={sevStroke[sev]} fill={sevStroke[sev]} fillOpacity={0.12} strokeWidth={1.5} isAnimationActive={false} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function Card({ icon: Icon, label, value, unit, sub, sev, children }: { icon: typeof HeartPulse; label: string; value: string; unit: string; sub?: React.ReactNode; sev: Severity; children?: React.ReactNode }) {
  return (
    <div className={cn("glass p-4 flex flex-col gap-2", sev === "critical" && "border-critical/50")}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className={cn("size-4", sevText[sev])} />{label}</span>
        <span className={cn("readout rounded border px-1.5 py-0.5 text-[10px] uppercase", sevBadge[sev])}>{sev}</span>
      </div>
      <div className="readout"><span className={cn("text-3xl font-semibold", sevText[sev])}>{value}</span> <span className="text-xs text-muted-foreground">{unit}</span></div>
      {sub && <div className="readout text-xs text-muted-foreground">{sub}</div>}
      {children}
    </div>
  );
}

export function VitalCards({ v, crew, data, score }: { v: Vitals; crew: Crew; data: Point[]; score: number }) {
  const st = vitalStatus(v);
  const hrSev: Severity = st.hr === "critical" ? "critical" : st.hr === "caution" || v.hrv < 45 ? "caution" : "nominal";
  const pct = Math.min(100, (v.radiation / crew.missionLimit) * 100);
  const cs = scoreSeverity(score);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <Card icon={HeartPulse} label="Heart Rate / HRV" value={`${v.hr}`} unit="BPM" sev={hrSev} sub={<>HRV <span className={v.hrv < 45 ? "text-caution" : "text-foreground"}>{v.hrv} ms</span></>}>
        <Spark data={data} k="hr" sev={hrSev} />
      </Card>
      <Card icon={Droplets} label="Blood Oxygen" value={`${v.spo2}`} unit="% SpO₂" sev={st.spo2} sub="Safe ≥ 95%"><Spark data={data} k="spo2" sev={st.spo2} /></Card>
      <Card icon={Thermometer} label="Core Body Temp" value={v.temp.toFixed(1)} unit="°C" sev={st.temp} sub={`Hydration ${Math.round(v.hydration)}%`}><Spark data={data} k="temp" sev={st.temp} /></Card>
      <Card icon={Radiation} label="Cumulative Radiation" value={v.radiation.toFixed(1)} unit="mSv" sev={st.radiation}
        sub={<>Mission {crew.missionLimit} · Career {crew.careerLimit} mSv</>}>
        <div className="h-2 rounded-full bg-muted overflow-hidden mt-2"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: sevStroke[st.radiation] }} /></div>
        <div className="readout text-[10px] text-muted-foreground">{pct.toFixed(0)}% of mission limit</div>
      </Card>
      <Card icon={Bone} label="Bone Mineral Density" value={`${v.bone.toFixed(1)}`} unit="% since launch" sev={st.bone} sub="Expected ≈ −1%/month (hip)">
        <div className="h-2 rounded-full bg-muted overflow-hidden mt-2"><div className="h-full rounded-full ml-auto" style={{ width: `${Math.min(100, Math.abs(v.bone) * 15)}%`, background: sevStroke[st.bone] }} /></div>
      </Card>
      <Card icon={Brain} label="Cognitive Readiness" value={`${score}`} unit="/ 100" sev={cs} sub={`Sleep ${v.sleepHours.toFixed(1)} h · Stress ${Math.round(v.stress)}`}>
        <div className="h-2 rounded-full bg-muted overflow-hidden mt-2"><div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: sevStroke[cs] }} /></div>
      </Card>
    </div>
  );
}
