import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Tier = "basic" | "verified_pro";
export type BillingCycle = "monthly" | "annual";
export interface TrialCodeRedemption {
  tier: "verified_pro_trial";
  trial_ends_at: string;
  code: string;
}

type CheckoutFn =
  | "paystack-create-subscription"
  | "paystack-create-urgent"
  | "payfast-create-subscription";

async function startCheckout(
  fn: CheckoutFn,
  body: Record<string, unknown>,
  loadingMsg: string,
) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    toast({ title: "Sign in first, boet", description: "Log in to continue with payment.", variant: "destructive" });
    return null;
  }

  toast({ title: loadingMsg, description: "Sorting the chankura…" });

  const returnUrl = window.location.origin + "/dashboard?paid=1";
  const cancelUrl = window.location.origin + "/pricing?cancelled=1";

  const { data, error } = await supabase.functions.invoke(fn, {
    body: { ...body, callback_url: returnUrl, return_url: returnUrl, cancel_url: cancelUrl },
  });

  if (error || !data?.authorization_url) {
    toast({
      title: "Aikona!",
      description: "Your card just bounced harder than a pothole on the N1. Check your balance and let's give it another gooi.",
      variant: "destructive",
    });
    return null;
  }

  window.location.href = data.authorization_url as string;
  return data.reference as string;
}

export type PaymentProvider = "paystack" | "payfast";

export const payments = {
  startSubscription: (
    tier: Tier,
    billing_cycle: BillingCycle = "monthly",
    provider: PaymentProvider = "paystack",
  ) => {
    const fn: CheckoutFn = provider === "payfast"
      ? "payfast-create-subscription"
      : "paystack-create-subscription";
    const planName = tier === "basic" ? "Basic Listing" : "Verified Pro";
    const cycleLabel = billing_cycle === "annual" ? " (yearly)" : "";
    return startCheckout(
      fn,
      { tier, billing_cycle },
      `Starting ${planName}${cycleLabel} subscription via ${provider === "payfast" ? "PayFast" : "Paystack"}`,
    );
  },
  redeemTrialCode: async (code: string): Promise<TrialCodeRedemption | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Sign in first", description: "Create your Sjoh account before redeeming a trial code." });
      return null;
    }

    const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    // Cast through any: the generated types file lags behind newer RPCs
    // (redeem_trial_code is deployed but not in src/integrations/supabase/types.ts yet).
    const { data, error } = await (supabase.rpc as any)("redeem_trial_code", { _code: normalized });

    if (error) {
      toast({
        title: "Trial code did not work",
        description: error.message || "Check the code and try again.",
        variant: "destructive",
      });
      return null;
    }

    const redemption = data?.[0] ?? null;
    if (!redemption) {
      toast({
        title: "Trial code did not work",
        description: "No redemption came back from Sjoh. Please try again.",
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: `${redemption.code} unlocked`,
      description: "Your 3-day Verified Pro trial is live. Go build that profile properly.",
    });

    return redemption as TrialCodeRedemption;
  },
};
