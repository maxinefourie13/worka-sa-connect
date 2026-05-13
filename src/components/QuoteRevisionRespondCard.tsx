import { useCallback, useEffect, useState } from "react";
import { Pencil, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatRand } from "@/lib/mockData";

interface Revision {
  id: string;
  previous_amount_zar: number;
  new_amount_zar: number;
  reason: string;
  scope_addition: string | null;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  created_at: string;
}

interface Props {
  dealMemoId: string;
  onResponded?: () => void;
}

/**
 * Customer-facing banner shown on /quote/:id when the Pro has requested a
 * scope/price revision. The customer must explicitly Accept or Decline.
 */
export const QuoteRevisionRespondCard = ({ dealMemoId, onResponded }: Props) => {
  const [pending, setPending] = useState<Revision | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await (supabase as any)
      .from("quote_revisions")
      .select("*")
      .eq("deal_memo_id", dealMemoId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setPending((data as Revision | null) ?? null);
  }, [dealMemoId]);

  useEffect(() => { void refresh(); }, [refresh]);

  if (!pending) return null;

  const respond = async (accept: boolean) => {
    if (!accept && !confirm("Decline this revision? The original quote stays in place.")) return;
    setBusy(true);
    const { error } = await (supabase as any).rpc("respond_to_quote_revision", {
      _revision_id: pending.id,
      _accept: accept,
    });
    setBusy(false);
    if (error) {
      toast({ title: "Couldn't save your response", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: accept ? "Revision accepted ✓" : "Revision declined",
      description: accept
        ? "Your pro can carry on with the updated scope."
        : "The original quote stays as is. Chat to your pro about next steps.",
    });
    setPending(null);
    onResponded?.();
  };

  const delta = pending.new_amount_zar - pending.previous_amount_zar;
  const isIncrease = delta > 0;

  return (
    <div className="mt-6 rounded-2xl border-2 border-amber-500/40 bg-amber-50/60 dark:bg-amber-500/5 p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-3">
        <div className="size-10 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
          <Pencil className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Your pro has updated the quote</p>
          <h3 className="font-display text-lg font-extrabold tracking-tight mt-0.5">
            Tap Accept to confirm the new total.
          </h3>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-4 mb-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Was</span>
          <span className="text-sm tabular-nums line-through text-muted-foreground">
            {formatRand(pending.previous_amount_zar)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">New total</span>
          <span className="font-display text-2xl font-extrabold tabular-nums">
            {formatRand(pending.new_amount_zar)}
          </span>
        </div>
        {delta !== 0 && (
          <p className={`text-xs font-semibold mt-1 text-right ${isIncrease ? "text-amber-700" : "text-emerald-700"}`}>
            {isIncrease ? "+" : ""}{formatRand(delta)} {isIncrease ? "more" : "less"} than before
          </p>
        )}
      </div>

      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Reason</p>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{pending.reason}</p>
        {pending.scope_addition && (
          <>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 mt-3">Added to scope</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{pending.scope_addition}</p>
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={() => respond(true)} disabled={busy} className="flex-1 h-12 font-bold text-base gap-2">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          Accept Revision
        </Button>
        <Button onClick={() => respond(false)} disabled={busy} variant="outline" className="flex-1 h-12 font-bold gap-2">
          <XCircle className="size-4" /> Decline
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
        <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
        Don't accept until you've spoken to your pro and you're happy with the new total. Once accepted, this becomes the binding amount.
      </p>
    </div>
  );
};
