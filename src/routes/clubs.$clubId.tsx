import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/modules/auth/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/clubs/$clubId")({
  head: () => ({ meta: [{ title: "Club — AceCourt" }] }),
  component: () => (
    <AppShell><RequireAuth><Inner /></RequireAuth></AppShell>
  ),
});

function Inner() {
  const { clubId } = Route.useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [club, setClub] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [courtForm, setCourtForm] = useState({ name: "", surface: "", indoor: false });

  const load = async () => {
    const [c, m, e, ct] = await Promise.all([
      supabase.from("clubs").select("*").eq("id", clubId).maybeSingle(),
      supabase.from("club_members").select("user_id, role, profiles:user_id(full_name)").eq("club_id", clubId),
      supabase.from("events").select("id,title,event_type,starts_at,status").eq("club_id", clubId).order("starts_at", { ascending: true }),
      supabase.from("courts").select("id,name,surface,indoor").eq("club_id", clubId),
    ]);
    setClub(c.data);
    setMembers(m.data ?? []);
    setEvents(e.data ?? []);
    setCourts(ct.data ?? []);
    setIsMember((m.data ?? []).some((mm: any) => mm.user_id === user?.id));
    const me = (m.data ?? []).find((mm: any) => mm.user_id === user?.id);
    setIsAdmin(me?.role === "admin" || me?.role === "organizer");
  };
  useEffect(() => { load(); }, [clubId, user?.id]);

  const join = async () => {
    if (!user) return;
    const { error } = await supabase.from("club_members").insert({ club_id: clubId, user_id: user.id, role: "member" });
    if (error) toast.error(error.message); else { toast.success(t("clubs.join")); load(); }
  };

  const addCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("courts").insert({ club_id: clubId, name: courtForm.name, surface: courtForm.surface || null, indoor: courtForm.indoor });
    if (error) return toast.error(error.message);
    setCourtForm({ name: "", surface: "", indoor: false });
    load();
  };

  if (!club) return <div className="text-muted-foreground">{t("common.loading")}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/clubs" className="text-sm text-muted-foreground hover:text-foreground">← {t("common.back")}</Link>
          <h1 className="text-2xl font-semibold mt-1">{club.name}</h1>
          {club.location && <p className="text-sm text-muted-foreground">{club.location}</p>}
        </div>
        {!isMember && club.privacy === "public" && (
          <Button onClick={join}>{t("clubs.join")}</Button>
        )}
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">{t("clubs.events")}</TabsTrigger>
          <TabsTrigger value="members">{t("clubs.members")}</TabsTrigger>
          <TabsTrigger value="courts">{t("clubs.courts")}</TabsTrigger>
        </TabsList>
        <TabsContent value="events" className="space-y-2 mt-4">
          {events.length === 0 ? <Empty /> : events.map((e) => (
            <Link key={e.id} to="/events" className="block rounded-lg border border-border bg-card p-4 hover:bg-accent">
              <div className="font-medium">{e.title}</div>
              <div className="text-xs text-muted-foreground">{e.event_type} · {e.status}</div>
            </Link>
          ))}
        </TabsContent>
        <TabsContent value="members" className="space-y-2 mt-4">
          {members.length === 0 ? <Empty /> : members.map((m: any) => (
            <div key={m.user_id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
              <span>{m.profiles?.full_name || "—"}</span>
              <span className="text-xs text-muted-foreground">{m.role}</span>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="courts" className="space-y-2 mt-4">
          {isAdmin && (
            <form onSubmit={addCourt} className="flex flex-wrap gap-2 items-end rounded-lg border border-border bg-card p-3">
              <div className="flex-1 min-w-[140px]">
                <Input placeholder={t("courts.name")} value={courtForm.name} onChange={(e) => setCourtForm({ ...courtForm, name: e.target.value })} required />
              </div>
              <div className="flex-1 min-w-[140px]">
                <Input placeholder={t("courts.surface")} value={courtForm.surface} onChange={(e) => setCourtForm({ ...courtForm, surface: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={courtForm.indoor} onCheckedChange={(v) => setCourtForm({ ...courtForm, indoor: !!v })} />
                {t("courts.indoor")}
              </label>
              <Button type="submit" size="sm">{t("courts.add")}</Button>
            </form>
          )}
          {courts.length === 0 ? <Empty /> : courts.map((c: any) => (
            <div key={c.id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
              <span>{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.surface ?? "—"} · {c.indoor ? "indoor" : "outdoor"}</span>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Empty() {
  const { t } = useTranslation();
  return <div className="text-sm text-muted-foreground rounded-lg border border-dashed border-border p-6 text-center">{t("dashboard.none")}</div>;
}