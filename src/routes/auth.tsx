import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HeartPulse } from "lucide-react";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const safePath = (p: unknown) => {
  if (typeof p !== "string") return "/me";
  try { const u = new URL(p, "http://x"); return u.origin === "http://x" || (typeof window !== "undefined" && u.origin === window.location.origin) ? u.pathname + u.search : "/me"; } catch { return "/me"; }
};

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined }),
  head: () => ({ meta: [
    { title: "Sign in — ASTRA-MED Health" },
    { name: "description", content: "Sign in to save your health readings, see trends and share with your team." },
    { property: "og:title", content: "Sign in — ASTRA-MED Health" },
    { property: "og:description", content: "Sign in to save your health readings, see trends and share with your team." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

const G = () => (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>);

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const target = safePath(redirect);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);

  useEffect(() => {
    const go = () => navigate({ to: target as "/me", replace: true });
    void supabase.auth.getSession().then(({ data }) => { if (data.session) go(); });
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) go(); });
    return () => data.subscription.unsubscribe();
  }, [navigate, target]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    if (mode === "up") {
      const { data, error } = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin + target } });
      setMsg(error ? error.message : data.session ? null : "Check your email to confirm your account, then sign in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) setMsg(error.message);
    }
    setBusy(false);
  };
  const social = async (p: "google" | "lovable") => {
    sessionStorage.setItem("astra-after-auth", target);
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin + "/auth" });
    if (r.error) setMsg("Sign-in failed. Please try again.");
  };
  useEffect(() => { const s = sessionStorage.getItem("astra-after-auth"); if (s && !redirect) { sessionStorage.removeItem("astra-after-auth"); navigate({ to: "/auth", search: { redirect: s }, replace: true }); } }, [redirect, navigate]);

  return (
    <div className="min-h-screen space-bg grid place-items-center p-4">
      <div className="glass w-full max-w-sm space-y-4 p-6">
        <Link to="/" className="flex items-center gap-2 font-semibold"><HeartPulse className="size-5 text-primary" />ASTRA-MED Health</Link>
        <h1 className="text-xl font-semibold">{mode === "in" ? "Welcome back" : "Create your account"}</h1>
        <div className="space-y-2">
          <Button type="button" variant="outline" className="w-full" onClick={() => social("google")}><G />Continue with Google</Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => social("lovable")}><LovableMark />Continue with Lovable</Button>
        </div>
        <div className="text-center text-xs text-muted-foreground">or with email</div>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={busy}>{mode === "in" ? "Sign in" : "Sign up"}</Button>
        </form>
        {msg && <p className="text-sm text-caution">{msg}</p>}
        <button className="text-sm text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}</button>
      </div>
    </div>
  );
}
