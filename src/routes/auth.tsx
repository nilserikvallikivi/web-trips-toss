import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/modules/auth/AuthContext";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — AceCourt" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useTranslation();
  const { signIn, signUp, user } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) nav({ to: "/dashboard" }); }, [user, nav]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = mode === "in"
      ? await signIn(email, password)
      : await signUp(email, password, fullName);
    setBusy(false);
    if (res.error) toast.error(res.error);
    else toast.success(mode === "in" ? t("auth.signedIn") : t("auth.accountCreated"));
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-md py-10">
        <h1 className="text-2xl font-semibold mb-6">
          {mode === "in" ? t("auth.signInTitle") : t("auth.signUpTitle")}
        </h1>
        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "up" && (
            <div className="space-y-2">
              <Label htmlFor="fn">{t("auth.fullName")}</Label>
              <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="em">{t("auth.email")}</Label>
            <Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw">{t("auth.password")}</Label>
            <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === "in" ? t("auth.signInTitle") : t("auth.signUpTitle")}
          </Button>
        </form>
        <button
          type="button"
          className="mt-4 text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
        >
          {mode === "in" ? t("auth.toSignUp") : t("auth.toSignIn")}
        </button>
      </div>
    </AppShell>
  );
}