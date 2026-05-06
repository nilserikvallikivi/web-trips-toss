import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/modules/auth/RequireAuth";
import { useAuth } from "@/modules/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/events")({
  head: () => ({ meta: [{ title: "Events — AceCourt" }] }),
  component: () => <AppShell><RequireAuth><Inner /></RequireAuth></AppShell>,
});

function Inner() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [myClubs, setMyClubs] = useState<any[]>([]);
  const [regs, setRegs] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", club_id: "", event_type: "round_robin", starts_at: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: ev } = await supabase.from("events").select("id,title,event_type,starts_at,status,club_id, clubs:club_id(name)").order("starts_at", { ascending: true });
    setEvents(ev ?? []);
    if (user) {
      const { data: cm } = await supabase.from("club_members").select("club_id, clubs:club_id(id,name)").eq("user_id", user.id);
      setMyClubs(cm ?? []);
      const { data: r } = await supabase.from("event_registrations").select("event_id").eq("user_id", user.id);
      setRegs(new Set((r ?? []).map((x) => x.event_id)));
    }
  };
  useEffect(() => { load(); }, [user?.id]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.club_id) return;
    setBusy(true);
    const { error } = await supabase.from("events").insert({
      title: form.title,
      club_id: form.club_id,
      event_type: form.event_type as any,
      starts_at: form.starts_at || null,
      status: "published",
      created_by: user.id,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("events.create"));
    setOpen(false); setForm({ title: "", club_id: "", event_type: "round_robin", starts_at: "" });
    load();
  };

  const register = async (eventId: string) => {
    if (!user) return;
    const { error } = await supabase.from("event_registrations").insert({ event_id: eventId, user_id: user.id, status: "approved" });
    if (error) toast.error(error.message); else { toast.success(t("events.registered")); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("events.title")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button disabled={myClubs.length === 0}><Plus /> {t("events.create")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("events.create")}</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("clubs.title")}</Label>
                <Select value={form.club_id} onValueChange={(v) => setForm({ ...form, club_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {myClubs.map((c: any) => <SelectItem key={c.club_id} value={c.club_id}>{c.clubs?.name}</SelectItem>)}
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
              <Button type="submit" disabled={busy} className="w-full">{t("common.save")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">{t("events.empty")}</div>
      ) : (
        <div className="space-y-2">
          {events.map((e: any) => (
            <div key={e.id} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4">
              <Link to="/events/$eventId" params={{ eventId: e.id }} className="flex-1 min-w-0">
                <div className="font-medium truncate">{e.title}</div>
                <div className="text-xs text-muted-foreground truncate">{e.clubs?.name} · {e.event_type} · {e.starts_at ? new Date(e.starts_at).toLocaleString() : "—"}</div>
              </Link>
              {regs.has(e.id) ? (
                <span className="text-xs rounded-md bg-secondary text-secondary-foreground px-2 py-1">{t("events.registered")}</span>
              ) : (
                <Button size="sm" variant="outline" onClick={() => register(e.id)}>{t("events.register")}</Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}