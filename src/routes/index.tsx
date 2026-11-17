import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, FileUp, HeartPulse, Rocket, ShieldAlert, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "ASTRA-MED — Everyday Health Tracker Inspired by Space Medicine" },
    { name: "description", content: "Log heart rate, blood pressure, oxygen and symptoms, spot warning signs early and share with family or a team helper. Plus a NASA Space Apps astronaut demo." },
    { property: "og:title", content: "ASTRA-MED — Everyday Health Tracker Inspired by Space Medicine" },
    { property: "og:description", content: "Log your vitals, spot warning signs early and share with the people who look out for you." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Landing,
});

const features = [
  { icon: HeartPulse, t: "Log in seconds", d: "Heart rate, blood pressure, oxygen, temperature, blood sugar, sleep and how you feel." },
  { icon: Camera, t: "Phone camera pulse", d: "Fingertip on the camera for a rough heart-rate estimate — no extra device." },
  { icon: FileUp, t: "Import your watch data", d: "Upload a CSV export from a smartwatch or health app." },
  { icon: Users, t: "Team & helper view", d: "Share with a parent, coach or team medic. You choose, and you can stop anytime." },
];

function Landing() {
  return (
    <div className="min-h-screen space-bg">
      <main className="mx-auto max-w-5xl space-y-8 p-4 py-12 md:p-10">
        <div className="space-y-4">
          <p className="readout text-xs text-primary">ASTRA-MED · SPACE MEDICINE FOR EVERYONE</p>
          <h1 className="text-3xl font-semibold md:text-5xl">Astronauts are far from a doctor.<br />Sometimes, so are you.</h1>
          <p className="max-w-2xl text-muted-foreground">Track your vital signs, see trends, get early warnings when something looks off, and let someone you trust keep an eye on you.</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/me" className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground">Track your health</Link>
            <Link to="/demo" className="flex items-center gap-2 rounded-md border border-border px-5 py-3"><Rocket className="size-4" />Try the space demo</Link>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {features.map((f) => (
            <div key={f.t} className="glass space-y-1 p-5"><f.icon className="size-5 text-primary" /><h2 className="font-medium">{f.t}</h2><p className="text-sm text-muted-foreground">{f.d}</p></div>
          ))}
        </div>
        <p className="flex gap-2 text-xs text-muted-foreground"><ShieldAlert className="size-4 shrink-0 text-caution" />ASTRA-MED is a wellness tool, not a medical device. It does not diagnose. In an emergency, call your local emergency number.</p>
      </main>
    </div>
  );
}
