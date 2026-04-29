import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Tier = "none" | "basic_trial" | "basic" | "verified_pro_trial" | "verified_pro";

export interface ProviderAccess {
  loading: boolean;
  tier: Tier;
  trialEndsAt: string | null;
  tierExpiresAt: string | null;
  /** Pro is on a paid plan or active trial → listed publicly. */
  hasListingAccess: boolean;
  /** Pro can apply for jobs (Verified Pro paid or trial, AND business is verified). */
  hasVerifiedProAccess: boolean;
  /** True while the trial is still ticking. */
  isOnTrial: boolean;
  /** Days left of trial (0 if not on trial / expired). */
  trialDaysLeft: number;
}

const DEFAULT: ProviderAccess = {
  loading: true,
  tier: "none",
  trialEndsAt: null,
  tierExpiresAt: null,
  hasListingAccess: false,
  hasVerifiedProAccess: false,
  isOnTrial: false,
  trialDaysLeft: 0,
};

export function useProviderAccess(): ProviderAccess {
  const { user } = useAuth();
  const [state, setState] = useState<ProviderAccess>(DEFAULT);

  useEffect(() => {
    if (!user) { setState({ ...DEFAULT, loading: false }); return; }
    (async () => {
      const { data } = await supabase
        .from("provider_balances")
        .select("tier, trial_ends_at, tier_expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!data) { setState({ ...DEFAULT, loading: false }); return; }

      const tier = (data.tier ?? "none") as Tier;
      const trialEndsAt = data.trial_ends_at ?? null;
      const tierExpiresAt = data.tier_expires_at ?? null;

      const now = Date.now();
      const trialLive = !!trialEndsAt && new Date(trialEndsAt).getTime() > now;
      const tierLive = !tierExpiresAt || new Date(tierExpiresAt).getTime() > now;

      const isPaidBasic = tier === "basic" && tierLive;
      const isPaidPro = tier === "verified_pro" && tierLive;
      const isTrialBasic = tier === "basic_trial" && trialLive;
      const isTrialPro = tier === "verified_pro_trial" && trialLive;

      const trialDaysLeft = trialLive
        ? Math.max(0, Math.ceil((new Date(trialEndsAt!).getTime() - now) / (1000 * 60 * 60 * 24)))
        : 0;

      setState({
        loading: false,
        tier,
        trialEndsAt,
        tierExpiresAt,
        hasListingAccess: isPaidBasic || isPaidPro || isTrialBasic || isTrialPro,
        hasVerifiedProAccess: isPaidPro || isTrialPro,
        isOnTrial: isTrialBasic || isTrialPro,
        trialDaysLeft,
      });
    })();
  }, [user]);

  return state;
}
