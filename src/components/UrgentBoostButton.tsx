import { useState } from "react";
import { Siren, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  opportunityId: string;
  opportunityTitle: string;
  alreadyBoosted?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
}

/**
 * Customer-facing R50 Urgent Boost button. Shown only on the owner's view of their opportunity.
 * Initiates a Paystack one-off charge; webhook flips urgent_boost_paid_at on success.
 */
export const UrgentBoostButton = ({ opportunityId, opportunityTitle, alreadyBoosted, className, size = "default" }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBoost = async () => {
    setLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/dashboard?boost=success`;
      const { data, error } = await supabase.functions.invoke("paystack-create-urgent-charge", {
        body: { opportunity_id: opportunityId, callback_url: callbackUrl },
      });
      if (error) throw error;
      if (!data?.authorization_url) throw new Error("No checkout URL returned");
      window.location.href = data.authorization_url;
    } catch (err: any) {
      toast({
        title: "Aikona!",
        description: err?.message ?? "Couldn't start the boost. Try again now-now.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (alreadyBoosted) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1.5 rounded-full", className)}>
        <Siren className="size-3.5" strokeWidth={2.5} /> Boosted
      </span>
    );
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size={size}
        className={cn("bg-accent text-accent-foreground hover:bg-accent/90 font-bold gap-1.5", className)}
      >
        <Siren className="size-4" strokeWidth={2.5} /> Boost — R50
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Siren className="size-5 text-accent" strokeWidth={2.5} />
              Boost this job for R50?
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <p className="text-foreground font-medium">"{opportunityTitle}"</p>
              <p>
                Your job gets pushed to the front of the feed for <strong>72 hours</strong>, with a coral "Urgent" badge so every Verified Pro in the area sees it first.
              </p>
              <p className="text-xs">
                Pay once. No subscription. We'll redirect you to Paystack to complete the R50 payment.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button
              onClick={handleBoost}
              disabled={loading}
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold gap-1.5"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Siren className="size-4" strokeWidth={2.5} />}
              {loading ? "Redirecting…" : "Pay R50 & boost"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
