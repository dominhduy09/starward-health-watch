import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { Download, Flame, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { KINDS, classify, fmtValue } from "@/lib/ranges";
import { checkinsQuery, dayStreak, latestByKind, overallLevel, profileQuery, readingsQuery } from "@/lib/health-data";
import { LevelBadge, UrgentBanner } from "@/components/health/LevelBadge";
import { HealthHelper } from "@/components/health/HealthHelper";
import { deleteMyAccount } from "@/lib/health.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/me")({
  head: () => ({ meta: [{ title: "My Health — ASTRA-MED" }, { name: "description", content: "Your saved readings, trends and warnings." }, { property: "og:title", content: "My Health — ASTRA-MED" }, { property: "og:description", content: "Your saved readings, trends and warnings." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(readingsQuery(context.user.id)),
    context.queryClient.ensureQueryData(checkinsQuery(context.user.id)),
    context.queryClient.ensureQueryData(profileQuery(context.user.id)),
  ]),
  component: Me,
  errorComponent: ({ error }) => <p role="alert" className="text-critical">{error instanceof Error ? error.message : "Something went wrong"}</p>,
});

function Consent({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const m = useMutation({ mutationFn: async () => { await supabase.from("profiles").upsert({ id: userId, accepted_terms_at: new Date().toISOString() }); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", userId] }) });
  return (
    <div className="glass mx-auto max-w-lg space-y-3 p-6">
      <h1 className="text-xl font-semibold">Before you start</h1>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li>ASTRA-MED is a wellness tool, <b>not a medical device</b>. It does not diagnose or treat.</li>
        <li>Warnings use general adult ranges and may not fit you. Ask your doctor what's normal for you.</li>
        <li>Camera pulse is a rough estimate. Imported and typed readings may contain mistakes.</li>
        <li>In an emergency, call your local emergency number — don't wait for this app.</li>
        <li>Your data is private. Only team helpers you choose to share with can see it.</li>
      </ul>
      <Button onClick={() => m.mutate()} disabled={m.isPending}>I understand</Button>
    </div>
  );
}

function Me() {
  const { user } = Route.useRouteContext();
  const { data: readings } = useSuspenseQuery(readingsQuery(user.id));
  const { data: checkins } = useSuspenseQuery(checkinsQuery(user.id));
  const { data: profile } = useSuspenseQuery(profileQuery(user.id));
  const del = useServerFn(deleteMyAccount);
  const [confirm, setConfirm] = useState(false);
  if (!profile?.accepted_terms_at) return <Consent userId={user.id} />;

  const latest = latestByKind(readings);
  const level = overallLevel(readings);
  const streak = dayStreak([...readings.map((r) => r.measured_at), ...checkins.map((c) => c.created_at)]);
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ profile, readings, checkins }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "astra-med-my-data.json"; a.click();
  };
  const remove = async () => { const r = await del(); if (r.ok) { await supabase.auth.signOut(); window.location.href = "/"; } };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><h1 className="text-xl font-semibold">Hi {profile.display_name ?? "there"} 👋</h1><p className="text-sm text-muted-foreground">Overall: <LevelBadge level={level} /></p></div>
        <div className="flex items-center gap-2 text-sm"><Flame className="size-4 text-caution" />{streak}-day check-in streak</div>
      </div>
      {level === "urgent" && <UrgentBanner />}
      {readings.length === 0 && (
        <div className="glass p-5 text-sm">No readings yet. <Link to="/log" className="text-primary">Add your first reading</Link> or <Link to="/import" className="text-primary">import a file</Link>.</div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {KINDS.map((k) => {
          const r = latest.get(k.id);
          const hist = readings.filter((x) => x.kind === k.id).slice(0, 30).reverse().map((x) => ({ v: Number(x.value) }));
          return (
            <div key={k.id} className="glass space-y-1 p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">{k.label}{r && <LevelBadge level={classify(k.id, Number(r.value), r.value2 == null ? null : Number(r.value2))} />}</div>
              <div className="readout text-2xl">{r ? fmtValue(k.id, Number(r.value), r.value2 == null ? null : Number(r.value2)) : "—"} <span className="text-xs text-muted-foreground">{k.unit}</span></div>
              <div className="text-[11px] text-muted-foreground">{r ? `${new Date(r.measured_at).toLocaleString()} · ${r.source === "camera" ? "camera estimate" : r.source}` : "No reading"}</div>
              {hist.length > 1 && <div className="h-10"><ResponsiveContainer><LineChart data={hist}><Line dataKey="v" dot={false} strokeWidth={2} stroke="var(--primary)" /></LineChart></ResponsiveContainer></div>}
            </div>
          );
        })}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass space-y-2 p-4">
          <h2 className="font-medium">Recent check-ins</h2>
          {checkins.length === 0 ? <p className="text-sm text-muted-foreground">None yet.</p> : checkins.slice(0, 6).map((c) => (
            <div key={c.id} className="border-b border-border pb-2 text-sm last:border-0">
              <span className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span> · mood {c.mood ?? "–"}/5 · sleep {c.sleep_quality ?? "–"}/5{c.symptoms.length ? ` · ${c.symptoms.join(", ")}` : ""}
            </div>
          ))}
        </div>
        <HealthHelper />
      </div>
      <div className="glass flex flex-wrap items-center gap-2 p-4 text-sm">
        <span className="mr-auto text-muted-foreground">Your data, your choice.</span>
        <Button variant="outline" size="sm" onClick={exportData}><Download className="size-4" />Download my data</Button>
        {confirm ? <><span className="text-critical">Delete everything forever?</span><Button variant="destructive" size="sm" onClick={remove}>Yes, delete</Button><Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>Cancel</Button></>
          : <Button variant="ghost" size="sm" onClick={() => setConfirm(true)}><Trash2 className="size-4" />Delete account</Button>}
      </div>
    </div>
  );
}
