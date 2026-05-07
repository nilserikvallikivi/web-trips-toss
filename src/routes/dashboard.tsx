import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, CalendarCheck, Swords } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/modules/auth/RequireAuth";
import { useAuth } from "@/modules/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AceCourt" }] }),
  component: () => (
    <AppShell>
      <RequireAuth><Inner /></RequireAuth>
    </AppShell>
  ),
});

function Inner() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({ clubs: 0, regs: 0, matches: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [c, r, m] = await Promise.all([
        supabase.from("club_members").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("event_registrations").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("matches").select("id", { count: "exact", head: true }).or(`player1_id.eq.${user.id},player2_id.eq.${user.id},player3_id.eq.${user.id},player4_id.eq.${user.id}`),
      ]);
      setStats({ clubs: c.count ?? 0, regs: r.count ?? 0, matches: m.count ?? 0 });
    })();
  }, [user]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{t("dashboard.welcome")}</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card label={t("nav.clubs")} value={stats.clubs} to="/clubs" icon={Users} />
        <Card label={t("dashboard.registrations")} value={stats.regs} to="/events" icon={CalendarCheck} />
        <Card label={t("dashboard.upcoming")} value={stats.matches} to="/dashboard" icon={Swords} />
      </div>
    </div>
  );
}

function Card({ label, value, to, icon: Icon }: { label: string; value: number; to: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
    </Link>
  );
}