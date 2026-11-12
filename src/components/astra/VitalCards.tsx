import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { Bone, Brain, Droplets, Gauge, HeartPulse, Radiation, Syringe, Thermometer } from "lucide-react";
import type { Crew, Point, Vitals } from "@/lib/telemetry";
import { scoreSeverity, vitalStatus, type Severity } from "@/lib/triage";
import type { SystemId } from "@/lib/systems";
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

function Card({ icon: Icon, label, value, unit, sub, sev, flash, dim, children }: { icon: typeof HeartPulse; label: string; value: string; unit: string; sub?: React.ReactNode; sev: Severity; flash?: boolean; dim?: boolean; children?: React.ReactNode }) {
  return (
    <div className={cn("glass p-4 flex flex-col gap-2 transition-opacity duration-300", sev === "critical" && "border-critical/50", flash && "radiation-flash", dim && "opacity-35")}>
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

export function VitalCards({ v, crew, data, score, focus }: { v: Vitals; crew: Crew; data: Point[]; score: number; focus?: SystemId | null }) {
  const st = vitalStatus(v);
  const hrSev: Severity = st.hr === "critical" ? "critical" : st.hr === "caution" || v.hrv < 45 ? "caution" : "nominal";
  const pct = Math.min(100, (v.radiation / crew.missionLimit) * 100);
  const cs = scoreSeverity(score);
  const dim = (s: SystemId) => !!focus && focus !== s;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <Card icon={HeartPulse} label="Heart Rate / HRV" value={`${v.hr}`} unit="BPM" sev={hrSev} dim={dim("cardio")} sub={<>HRV <span className={v.hrv < 45 ? "text-caution" : "text-foreground"}>{v.hrv} ms</span></>}>
        <Spark data={data} k="hr" sev={hrSev} />
      </Card>
      <Card icon={Droplets} label="Blood Oxygen" value={`${v.spo2}`} unit="% SpO₂" sev={st.spo2} dim={dim("cardio")} sub="Safe ≥ 95%"><Spark data={data} k="spo2" sev={st.spo2} /></Card>
      <Card icon={Gauge} label="Blood Pressure" value={`${v.systolic}/${v.diastolic}`} unit="mmHg" sev={st.bp} dim={dim("cardio")} sub="Flight rule < 140/90"><Spark data={data} k="sys" sev={st.bp} /></Card>
      <Card icon={Thermometer} label="Core Body Temp" value={v.temp.toFixed(1)} unit="°C" sev={st.temp} dim={dim("immune")} sub={`Hydration ${Math.round(v.hydration)}%`}><Spark data={data} k="temp" sev={st.temp} /></Card>
      <Card icon={Syringe} label="Blood Glucose" value={`${v.glucose}`} unit="mg/dL" sev={st.glucose} dim={dim("immune")} sub="Window 70–140"><Spark data={data} k="glucose" sev={st.glucose} /></Card>
      <Card icon={Radiation} label="Cumulative Radiation" value={v.radiation.toFixed(1)} unit="mSv" sev={st.radiation} flash={v.doseRate >= 5} dim={dim("radiation")}
        sub={<>Mission {crew.missionLimit} · Career {crew.careerLimit} mSv</>}>
        {v.doseRate >= 5 && <div className="readout text-[11px] font-semibold text-critical animate-pulse">⚠ DOSE RATE {v.doseRate.toFixed(1)} mSv/day — SPE</div>}
        <div className="h-2 rounded-full bg-muted overflow-hidden mt-2"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: sevStroke[st.radiation] }} /></div>
        <div className="readout text-[10px] text-muted-foreground">{pct.toFixed(0)}% of mission limit</div>
      </Card>
      <Card icon={Bone} label="Bone Mineral Density" value={`${v.bone.toFixed(1)}`} unit="% since launch" sev={st.bone} dim={dim("skeletal")} sub="Expected ≈ −1%/month (hip)">
        <div className="h-2 rounded-full bg-muted overflow-hidden mt-2"><div className="h-full rounded-full ml-auto" style={{ width: `${Math.min(100, Math.abs(v.bone) * 15)}%`, background: sevStroke[st.bone] }} /></div>
      </Card>
      <Card icon={Brain} label="Cognitive Readiness" value={`${score}`} unit="/ 100" sev={cs} dim={dim("neuro")} sub={`ONSD ${v.ossd.toFixed(1)} mm · Sleep ${v.sleepHours.toFixed(1)} h`}>
        <div className="h-2 rounded-full bg-muted overflow-hidden mt-2"><div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: sevStroke[cs] }} /></div>
      </Card>
    </div>
  );
}
