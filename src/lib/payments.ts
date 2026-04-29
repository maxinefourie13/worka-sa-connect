import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Tier = "basic" | "verified_pro";

async function startCheckout(
  fn: "paystack-create-subscription" | "paystack-create-urgent",
  body: Record<string, unknown>,
  loadingMsg: string,
) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    toast({ title: "Sign in first, boet", description: "Log in to continue with payment.", variant: "destructive" });
    return null;
  }

  toast({ title: loadingMsg, description: "Sorting the chankura…" });

  const { data, error } = await supabase.functions.invoke(fn, {
    body: { ...body, callback_url: window.location.origin + "/dashboard?paid=1" },
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

export const payments = {
  startSubscription: (tier: Tier) =>
    startCheckout(
      "paystack-create-subscription",
      { tier },
      `Starting ${tier === "basic" ? "On the Map" : "Ready for Work"} subscription`,
    ),
};
