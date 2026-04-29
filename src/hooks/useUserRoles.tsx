import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "admin" | "moderator" | "client" | "pro";

interface UserRolesState {
  loading: boolean;
  roles: AppRole[];
  isAdmin: boolean;
}

const DEFAULT: UserRolesState = { loading: true, roles: [], isAdmin: false };

export function useUserRoles(): UserRolesState {
  const { user } = useAuth();
  const [state, setState] = useState<UserRolesState>(DEFAULT);

  useEffect(() => {
    if (!user) { setState({ ...DEFAULT, loading: false }); return; }
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const roles = (data ?? []).map((r) => r.role as AppRole);
      setState({
        loading: false,
        roles,
        isAdmin: roles.includes("admin"),
      });
    })();
  }, [user]);

  return state;
}
