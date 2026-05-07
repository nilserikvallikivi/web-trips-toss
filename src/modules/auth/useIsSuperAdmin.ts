import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export function useIsSuperAdmin() {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) { setIsSuperAdmin(false); setLoading(false); return; }
    setLoading(true);
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      if (cancelled) return;
      const roles = (data ?? []).map((r) => r.role);
      setIsSuperAdmin(roles.includes("super_admin"));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  return { isSuperAdmin, loading };
}