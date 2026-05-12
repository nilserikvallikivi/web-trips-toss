import { createFileRoute, Link } from "@tanstack/react-router";
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
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MapPin } from "lucide-react";
import { useIsSuperAdmin } from "@/modules/auth/useIsSuperAdmin";

type Club = { id: string; name: string; description: string | null; location: string | null; privacy: string };

export const Route = createFileRoute("/clubs")({
  head: () => ({ meta: [{ title: "Clubs — AceCourt" }] }),
  component: () => (
    <AppShell><RequireAuth><Inner /></RequireAuth></AppShell>
  ),
});

function Inner() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isSuperAdmin } = useIsSuperAdmin();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", location: "" });
  const [venues, setVenues] = useState<{ name: string; address: string }[]>([{ name: "", address: "" }]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("clubs")
      .select("id,name,description,location,privacy")
      .is("archived_at", null)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    setClubs((data ?? []) as Club[]);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (venues.some(v => !v.name.trim() || !v.address.trim())) {
      return toast.error("Kõigil asukohtadel peab olema nimi ja aadress.");
    }
    setBusy(true);
    const { data: club, error } = await supabase.from("clubs").insert({
      name: form.name, description: form.description || null, location: form.location || null, created_by: user.id,
    }).select("id").single();
    if (error || !club) { setBusy(false); return toast.error(error?.message ?? "Error"); }

    const venueRows = venues.filter(v => v.name.trim() && v.address.trim()).map(v => ({
      club_id: club.id, name: v.name.trim(), address: v.address.trim(),
    }));
    if (venueRows.length > 0) {
      const { error: ve } = await supabase.from("venues").insert(venueRows);
      if (ve) { setBusy(false); return toast.error(ve.message); }
    }

    setBusy(false);
    toast.success(t("clubs.create"));
    setOpen(false);
    setForm({ name: "", description: "", location: "" });
    setVenues([{ name: "", address: "" }]);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("clubs.title")}</h1>
        {isSuperAdmin ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus /> {t("clubs.create")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("clubs.create")}</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("clubs.name")}</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>{t("clubs.description")}</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("clubs.location")}</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Asukohad * (vähemalt üks kohustuslik)</Label>
                {venues.map((v, i) => (
                  <div key={i} className="space-y-1.5 rounded-md border border-border p-3">
                    <Input
                      placeholder="Asukoha nimi (nt. Pärnu Tennisekeskus)"
                      value={v.name}
                      onChange={(e) => {
                        const updated = [...venues];
                        updated[i] = { ...updated[i], name: e.target.value };
                        setVenues(updated);
                      }}
                      required
                    />
                    <Input
                      placeholder="Aadress (nt. Tammsaare 39, Pärnu)"
                      value={v.address}
                      onChange={(e) => {
                        const updated = [...venues];
                        updated[i] = { ...updated[i], address: e.target.value };
                        setVenues(updated);
                      }}
                      required
                    />
                    {venues.length > 1 && (
                      <button
                        type="button"
                        className="text-xs text-destructive hover:opacity-80"
                        onClick={() => setVenues(venues.filter((_, idx) => idx !== i))}
                      >
                        Eemalda
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="text-xs text-primary hover:opacity-80"
                  onClick={() => setVenues([...venues, { name: "", address: "" }])}
                >
                  + Lisa veel üks asukoht
                </button>
              </div>
              <Button type="submit" className="w-full" disabled={busy}>{t("common.save")}</Button>
            </form>
          </DialogContent>
        </Dialog>
        ) : (
          <span className="text-xs text-muted-foreground">Only Super Admins can create clubs</span>
        )}
      </div>

      {clubs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          {t("clubs.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map((c) => (
            <Link key={c.id} to="/clubs/$clubId" params={{ clubId: c.id }} className="rounded-xl border border-border bg-card p-5 hover:bg-accent transition-colors">
              <div className="font-semibold">{c.name}</div>
              {c.location && <div className="mt-1 text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{c.location}</div>}
              {c.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
              <span className="mt-3 inline-block text-xs rounded-md bg-secondary text-secondary-foreground px-2 py-0.5">{c.privacy}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}