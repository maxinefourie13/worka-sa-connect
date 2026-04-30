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
  alreadyUrgent?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
}

/**
 * Customer-facing free Eish! Urgent toggle. Flips opportunities.is_urgent to true,
 * which auto-pins the job for 72 hours via the `handle_urgent_opportunity` trigger.
 */
export const UrgentBoostButton = ({ opportunityId, opportunityTitle, alreadyUrgent, className, size = "default" }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(!!alreadyUrgent);

  const handleMarkUrgent = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("opportunities")
        .update({ is_urgent: true })
        .eq("id", opportunityId);
      if (error) throw error;

      // Best-effort: alert qualifying pros
      supabase.functions
        .invoke("notify-new-job", { body: { opportunity_id: opportunityId, urgent: true } })
        .catch((e) => console.error("[notify-new-job urgent]", e));

      toast({
        title: "Eish! Urgent live",
        description: "Pinned to the top for 72 hours. Verified pros nearby have been alerted.",
      });
      setDone(true);
      setOpen(false);
    } catch (err: any) {
      toast({
        title: "Couldn't flag as urgent",
        description: err?.message ?? "Try again now-now.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1.5 rounded-full", className)}>
        <Siren className="size-3.5" strokeWidth={2.5} /> Urgent · pinned 72h
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
        <Siren className="size-4" strokeWidth={2.5} /> Mark Eish! Urgent
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Siren className="size-5 text-accent" strokeWidth={2.5} />
              Flag this as Eish! Urgent? <span className="text-accent">(Free)</span>
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <span className="block text-foreground font-medium">"{opportunityTitle}"</span>
              <span className="block">
                We'll pin it to the top of the feed for <strong>72 hours</strong> and alert every Verified Pro within 10km. No charge — please only use this for real emergencies (burst geyser, locked out, no power).
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>Not yet</Button>
            <Button
              onClick={handleMarkUrgent}
              disabled={loading}
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold gap-1.5"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Siren className="size-4" strokeWidth={2.5} />}
              {loading ? "Pinning…" : "Yes, eish! Urgent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
