import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Tier = "none" | "basic_trial" | "basic" | "verified_pro_trial" | "verified_pro" | "locked";
export type ProviderStatus = "trialing" | "active" | "locked" | "none";

export interface ProviderAccess {
  loading: boolean;
  tier: Tier;
  /** Derived high-level state: trialing | active | locked | none. */
  status: ProviderStatus;
  trialEndsAt: string | null;
  tierExpiresAt: string | null;
  /** Pro is on a paid plan or active trial → listed publicly. */
  hasListingAccess: boolean;
  /** Pro can apply for jobs (Verified Pro paid or trial, AND business is verified). */
  hasVerifiedProAccess: boolean;
  /** True while the trial is still ticking. */
  isOnTrial: boolean;
  /** True if account auto-locked after a lapsed trial without a payment method. */
  isLocked: boolean;
  /** Days left of trial (0 if not on trial / expired). */
  trialDaysLeft: number;
  /** True if this user owns at least one ID-verified business — required for Eish! Urgent jobs. */
  hasKycBusiness: boolean;
  /** Founding-member perk fields */
  isFoundingMember: boolean;
  /** True if founding member AND hasn't used their 1 free proposal this calendar month. */
  foundingProposalAvailable: boolean;
  /** First day of next calendar month — when the credit resets. */
  foundingProposalsResetAt: Date | null;
}

const DEFAULT: ProviderAccess = {
  loading: true,
  tier: "none",
  status: "none",
  trialEndsAt: null,
  tierExpiresAt: null,
  hasListingAccess: false,
  hasVerifiedProAccess: false,
  isOnTrial: false,
  isLocked: false,
  trialDaysLeft: 0,
  hasKycBusiness: false,
  isFoundingMember: false,
  foundingProposalAvailable: false,
  foundingProposalsResetAt: null,
};

function nextMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

function currentMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function useProviderAccess(): ProviderAccess {
  const { user } = useAuth();
  const [state, setState] = useState<ProviderAccess>(DEFAULT);

  useEffect(() => {
    if (!user) { setState({ ...DEFAULT, loading: false }); return; }
    (async () => {
      const [{ data: bal }, { data: foundingFlag }, { data: kycCount }] = await Promise.all([
        supabase
          .from("provider_balances")
          .select("tier, trial_ends_at, tier_expires_at, founding_proposals_used_this_month, founding_proposals_period_start")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.rpc("is_founding_member", { _user_id: user.id }),
        supabase
          .from("businesses")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", user.id)
          .eq("kyc_verified", true),
      ]);

      const isFoundingMember = !!foundingFlag;
      const hasKycBusiness = (kycCount ?? 0) > 0;

      if (!bal) {
        setState({
          ...DEFAULT,
          loading: false,
          isFoundingMember,
          hasKycBusiness,
          foundingProposalAvailable: isFoundingMember,
          foundingProposalsResetAt: isFoundingMember ? nextMonthStart() : null,
        });
        return;
      }

      const tier = (bal.tier ?? "none") as Tier;
      const trialEndsAt = bal.trial_ends_at ?? null;
      const tierExpiresAt = bal.tier_expires_at ?? null;

      const now = Date.now();
      const trialLive = !!trialEndsAt && new Date(trialEndsAt).getTime() > now;
      const tierLive = !tierExpiresAt || new Date(tierExpiresAt).getTime() > now;

      const isLocked = tier === "locked";
      const isPaidBasic = tier === "basic" && tierLive;
      const isPaidPro = tier === "verified_pro" && tierLive;
      const isTrialBasic = tier === "basic_trial" && trialLive;
      const isTrialPro = tier === "verified_pro_trial" && trialLive;

      const trialDaysLeft = trialLive
        ? Math.max(0, Math.ceil((new Date(trialEndsAt!).getTime() - now) / (1000 * 60 * 60 * 24)))
        : 0;

      const status: ProviderStatus = isLocked
        ? "locked"
        : (isPaidBasic || isPaidPro)
          ? "active"
          : (isTrialBasic || isTrialPro)
            ? "trialing"
            : "none";

      const periodStart = bal.founding_proposals_period_start
        ? new Date(bal.founding_proposals_period_start)
        : null;
      const periodIsCurrent = periodStart && periodStart >= currentMonthStart();
      const usedThisMonth = periodIsCurrent ? (bal.founding_proposals_used_this_month ?? 0) : 0;
      const foundingProposalAvailable = isFoundingMember && usedThisMonth < 1;

      setState({
        loading: false,
        tier,
        status,
        trialEndsAt,
        tierExpiresAt,
        hasListingAccess: isPaidBasic || isPaidPro || isTrialBasic || isTrialPro,
        hasVerifiedProAccess: isPaidPro || isTrialPro,
        isOnTrial: isTrialBasic || isTrialPro,
        isLocked,
        trialDaysLeft,
        hasKycBusiness,
        isFoundingMember,
        foundingProposalAvailable,
        foundingProposalsResetAt: isFoundingMember ? nextMonthStart() : null,
      });
    })();
  }, [user]);

  return state;
}
