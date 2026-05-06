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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — AceCourt" }] }),
  component: () => <AppShell><RequireAuth><Inner /></RequireAuth></AppShell>,
});

function Inner() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState({ full_name: "", phone: "", gender: "unspecified", skill_level: "beginner", dominant_hand: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) setForm({
        full_name: data.full_name ?? "",
        phone: data.phone ?? "",
        gender: data.gender ?? "unspecified",
        skill_level: data.skill_level ?? "beginner",
        dominant_hand: data.dominant_hand ?? "",
      });
    })();
  }, [user?.id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name,
      phone: form.phone || null,
      gender: form.gender as any,
      skill_level: form.skill_level as any,
      dominant_hand: form.dominant_hand || null,
    }).eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("profile.saved"));
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">{t("profile.title")}</h1>
      <form onSubmit={save} className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="space-y-2">
          <Label>{t("profile.fullName")}</Label>
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>{t("profile.phone")}</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t("profile.gender")}</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["male","female","other","unspecified"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("profile.skill")}</Label>
            <Select value={form.skill_level} onValueChange={(v) => setForm({ ...form, skill_level: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["beginner","intermediate","advanced","league"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t("profile.hand")}</Label>
          <Select value={form.dominant_hand || "unset"} onValueChange={(v) => setForm({ ...form, dominant_hand: v === "unset" ? "" : v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unset">—</SelectItem>
              <SelectItem value="right">right</SelectItem>
              <SelectItem value="left">left</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={busy}>{t("common.save")}</Button>
      </form>
    </div>
  );
}