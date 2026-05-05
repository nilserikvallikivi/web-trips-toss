import { ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "./AuthContext";
import { useTranslation } from "react-i18next";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [user, loading, nav]);

  if (loading || !user) {
    return <div className="p-10 text-center text-muted-foreground">{t("common.loading")}</div>;
  }
  return <>{children}</>;
}