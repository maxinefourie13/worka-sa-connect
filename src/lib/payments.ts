import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Tier = "hustler" | "main-oke";
type Pack = "six-pack" | "crate";

async function startCheckout(
  fn: "paystack-create-subscription" | "paystack-create-topup" | "paystack-create-urgent-fee",
  body: Record<string, unknown>,
  loadingMsg: string,
) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    toast({ title: "Sign in required", description: "Log in to continue with payment.", variant: "destructive" });
    return null;
  }

  toast({ title: loadingMsg, description: "Redirecting to Paystack…" });

  const { data, error } = await supabase.functions.invoke(fn, {
    body: { ...body, callback_url: window.location.origin + "/dashboard?paid=1" },
  });

  if (error || !data?.authorization_url) {
    toast({
      title: "Payment couldn't start",
      description: error?.message ?? "Try again in a moment.",
      variant: "destructive",
    });
    return null;
  }

  window.location.href = data.authorization_url as string;
  return data.reference as string;
}

export const payments = {
  startSubscription: (tier: Tier) =>
    startCheckout("paystack-create-subscription", { tier }, `Starting ${tier === "hustler" ? "Hustler" : "Main Oke"} subscription`),

  buyKlapPack: (pack: Pack) =>
    startCheckout("paystack-create-topup", { pack }, "Loading Klaps"),

  payUrgentFee: (opportunityId: string) =>
    startCheckout("paystack-create-urgent-fee", { opportunity_id: opportunityId }, "Charging urgent fee"),
};
