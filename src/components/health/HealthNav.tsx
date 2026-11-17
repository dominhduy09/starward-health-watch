import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { HeartPulse, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { to: "/me", label: "My health" }, { to: "/log", label: "Add reading" },
  { to: "/import", label: "Import" }, { to: "/teams", label: "Teams" },
] as const;

export function HealthNav() {
  const qc = useQueryClient(); const navigate = useNavigate();
  const signOut = async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); navigate({ to: "/auth", search: { redirect: undefined }, replace: true }); };
  return (
    <header className="border-b border-border bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-3 py-2 md:px-6">
        <Link to="/" className="mr-3 flex items-center gap-2 font-semibold"><HeartPulse className="size-5 text-primary" />ASTRA-MED</Link>
        <nav className="flex flex-1 flex-wrap gap-1">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground" activeProps={{ className: "bg-primary/15 text-foreground" }}>{l.label}</Link>
          ))}
        </nav>
        <button onClick={signOut} className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"><LogOut className="size-4" />Sign out</button>
      </div>
    </header>
  );
}
