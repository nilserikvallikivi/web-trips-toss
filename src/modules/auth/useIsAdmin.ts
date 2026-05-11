import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (cancelled) return;
        const roles = (data ?? []).map((r) => r.role);
        // isAdmin = access to Admin Console
        // Controlled by app_role in user_roles table (not club_members.role)
        // super_admin: full system access
        // club_admin: admin console access (granted manually via Admin Console)
        // club_members.role "admin" = club-level admin, separate concept
        setIsAdmin(roles.includes("super_admin") || roles.includes("club_admin"));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { isAdmin, loading };
}