import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export type VerificationStatus =
  | "not_required" | "required" | "pending" | "verified" | "failed" | "expired";

export interface VerificationState {
  isIdVerified: boolean;
  status: VerificationStatus;
  expiresAt: string | null;
  loading: boolean;
}

export const useVerification = () => {
  const { user } = useAuth();
  const [state, setState] = useState<VerificationState>({
    isIdVerified: false,
    status: "not_required",
    expiresAt: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (!user) {
      setState({ isIdVerified: false, status: "not_required", expiresAt: null, loading: false });
      return;
    }
    const { data } = await supabase
      .from("provider_balances")
      .select("is_id_verified, verification_status, verification_expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    setState({
      isIdVerified: data?.is_id_verified ?? false,
      status: (data?.verification_status as VerificationStatus) ?? "not_required",
      expiresAt: data?.verification_expires_at ?? null,
      loading: false,
    });
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Realtime: re-fetch when our balance row updates (webhook flips fields).
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`pb-${user.id}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "provider_balances", filter: `user_id=eq.${user.id}` },
        () => { refresh(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refresh]);

  const startVerification = useCallback(async () => {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase.functions.invoke("smile-id-init", { body: {} });
    if (error) {
      toast({ title: "Couldn't start verification", description: error.message, variant: "destructive" });
      return;
    }
    if (data?.mode === "stub") {
      toast({
        title: "Verification started",
        description: "Stub mode — your badge will arrive in ~2 seconds.",
      });
    } else {
      toast({
        title: "Verification ready",
        description: "Loading Smile ID…",
      });
      // TODO: launch Smile ID Web SDK with `data.partner_id`, `data.job_id`, etc.
    }
    await refresh();
  }, [user, refresh]);

  return { ...state, refresh, startVerification };
};
