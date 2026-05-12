import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/modules/auth/RequireAuth";
import { useAuth } from "@/modules/auth/AuthContext";
import { useIsSuperAdmin } from "@/modules/auth/useIsSuperAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/events")({
  head: () => ({ meta: [{ title: "Events — AceCourt" }] }),
  component: () => <AppShell><RequireAuth><Inner /></RequireAuth></AppShell>,
});

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("et-EE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Inner() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isSuperAdmin } = useIsSuperAdmin();
  const [events, setEvents] = useState<any[]>([]);
  const [myClubs, setMyClubs] = useState<any[]>([]);
  const [allClubs, setAllClubs] = useState<any[]>([]);
  const [regs, setRegs] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<"upcoming" | "past" | "mine">("upcoming");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", club_id: "", event_type: "round_robin", starts_at: "", registration_deadline: "", recurrence: "none" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: ev } = await supabase.from("events").select("id,title,event_type,starts_at,registration_deadline,status,club_id, clubs:club_id(name)").order("starts_at", { ascending: true });
    setEvents(ev ?? []);
    const { data: allRegs } = await supabase.from("event_registrations").select("event_id");
    const c: Record<string, number> = {};
    (allRegs ?? []).forEach((r: any) => { c[r.event_id] = (c[r.event_id] ?? 0) + 1; });
    setCounts(c);
    if (user) {
      const { data: cm } = await supabase.from("club_members").select("club_id, clubs:club_id(id,name)").eq("user_id", user.id);
      setMyClubs(cm ?? []);
      const { data: r } = await supabase.from("event_registrations").select("event_id").eq("user_id", user.id);
      setRegs(new Set((r ?? []).map((x) => x.event_id)));
    }
    if (isSuperAdmin) {
      const { data: ac } = await supabase.from("clubs").select("id, name").is("deleted_at", null).is("archived_at", null).order("name");
      setAllClubs(ac ?? []);
    }
  };
  useEffect(() => { load(); }, [user?.id, isSuperAdmin]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.club_id) return;
    setBusy(true);
    const { error } = await supabase.from("events").insert({
      title: form.title,
      club_id: form.club_id,
      event_type: form.event_type as any,
      starts_at: form.starts_at || null,
      registration_deadline: form.registration_deadline || null,
      recurrence: form.recurrence,
      status: "published",
      created_by: user.id,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("events.create"));
    setOpen(false); setForm({ title: "", club_id: "", event_type: "round_robin", starts_at: "", registration_deadline: "", recurrence: "none" });
    load();
  };

  const register = async (eventId: string) => {
    if (!user) return;
    const { error } = await supabase.from("event_registrations").insert({ event_id: eventId, user_id: user.id, status: "approved" });
    if (error) toast.error(error.message); else { toast.success(t("events.registered")); load(); }
  };

  const unregister = async (eventId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("event_registrations")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user.id);
    if (error) toast.error(error.message);
    else { toast.success(t("events.unregistered")); load(); }
  };

  const now = Date.now();
  const isPast = (e: any) => e.starts_at && new Date(e.starts_at).getTime() < now;
  const deadlinePassed = (e: any) => e.registration_deadline && new Date(e.registration_deadline).getTime() < now;
  const filtered = events.filter((e) => {
    if (filter === "past") return isPast(e);
    if (filter === "mine") return regs.has(e.id);
    return !isPast(e);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("events.title")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button disabled={!isSuperAdmin && myClubs.length === 0}><Plus /> {t("events.create")}</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{t("events.create")}</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("clubs.title")}</Label>
                <Select value={form.club_id} onValueChange={(v) => setForm({ ...form, club_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin
                      ? allClubs.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                      : myClubs.map((c: any) => <SelectItem key={c.club_id} value={c.club_id}>{c.clubs?.name}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("events.title")}</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>{t("events.type")}</Label>
                <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["singles_tournament","doubles_tournament","mixed_doubles","league","ladder","round_robin","knockout","casual","training","rotating_doubles","custom"].map((x) => (
                      <SelectItem key={x} value={x}>{x.replaceAll("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("events.when")}</Label>
                <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("events.deadline")}</Label>
                <Input type="datetime-local" value={form.registration_deadline} onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Korduvus</Label>
                <Select value={form.recurrence} onValueChange={(v) => setForm({ ...form, recurrence: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ühekordne</SelectItem>
                    <SelectItem value="daily">Iga päev</SelectItem>
                    <SelectItem value="weekly">Kord nädalas</SelectItem>
                    <SelectItem value="biweekly">Iga kahe nädala tagant</SelectItem>
                    <SelectItem value="monthly">Kord kuus</SelectItem>
                    <SelectItem value="yearly">Kord aastas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={busy} className="w-full">{t("common.save")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="upcoming">{t("events.filterUpcoming")}</TabsTrigger>
          <TabsTrigger value="past">{t("events.filterPast")}</TabsTrigger>
          <TabsTrigger value="mine">{t("events.filterMine")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">{t("events.empty")}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((e: any) => (
            <div key={e.id} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4">
              <Link to="/events/$eventId" params={{ eventId: e.id }} className="flex-1 min-w-0">
                <div className="font-medium truncate">{e.title}</div>
                <div className="text-xs text-muted-foreground truncate">
                  <Link to="/clubs/$clubId" params={{ clubId: e.club_id }} className="hover:underline">{e.clubs?.name}</Link>
                  {" · "}{e.event_type}{" · "}{formatDate(e.starts_at)}
                  {" · "}{counts[e.id] ?? 0} {t("events.registeredCount")}
                </div>
              </Link>
              {!isPast(e) && (
                regs.has(e.id) ? (
                  <Button size="sm" variant="outline" onClick={() => unregister(e.id)}>
                    {t("events.unregister")}
                  </Button>
                ) : deadlinePassed(e) ? (
                  <span className="text-xs text-muted-foreground">{t("events.deadlinePassed")}</span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => register(e.id)}>{t("events.register")}</Button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}