import { useEffect, useState } from "react";
import { Pencil, Loader2, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatRand } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface Revision {
  id: string;
  previous_amount_zar: number;
  new_amount_zar: number;
  reason: string;
  scope_addition: string | null;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  responded_at: string | null;
  created_at: string;
}

interface Props {
  /** Pro is the current user; deal_memo must be in 'accepted' status. */
  dealMemoId: string;
  currentAmount: number;
  /** Whether the parent memo is currently 'accepted' (only state where revisions are allowed). */
  isAccepted: boolean;
  onChanged?: () => void;
}

/**
 * Lets the Pro request a price revision after arriving on site if the scope
 * has changed. The customer must explicitly accept on their phone before the
 * new amount becomes binding.
 */
export const QuoteRevisionCard = ({ dealMemoId, currentAmount, isAccepted, onChanged }: Props) => {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [reason, setReason] = useState("");
  const [scopeAddition, setScopeAddition] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("quote_revisions")
      .select("*")
      .eq("deal_memo_id", dealMemoId)
      .order("created_at", { ascending: false });
    setRevisions((data as Revision[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, [dealMemoId]);

  const pending = revisions.find((r) => r.status === "pending");

  const submit = async () => {
    const amt = parseFloat(newAmount);
    if (!amt || amt < 0) {
      toast({ title: "Enter a valid new total", variant: "destructive" });
      return;
    }
    if (reason.trim().length < 5) {
      toast({ title: "Tell the customer why", description: "A short reason keeps things above board.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase as any).rpc("request_quote_revision", {
      _deal_memo_id: dealMemoId,
      _new_amount: amt,
      _reason: reason.trim(),
      _scope_addition: scopeAddition.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't send the revision", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Revision sent ✓",
      description: "The customer will get a notification to accept on their phone.",
    });
    setOpen(false);
    setNewAmount(""); setReason(""); setScopeAddition("");
    void refresh();
    onChanged?.();
  };

  const cancel = async (revId: string) => {
    if (!confirm("Cancel this pending revision?")) return;
    const { error } = await (supabase as any).rpc("cancel_quote_revision", { _revision_id: revId });
    if (error) {
      toast({ title: "Couldn't cancel", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Revision cancelled" });
    void refresh();
    onChanged?.();
  };

  if (!isAccepted && revisions.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="size-9 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
          <Pencil className="size-4" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-base font-bold">Update the quote</h3>
          <p className="text-xs text-ink-2 mt-0.5">
            Scope changed on site? Send a revision — the customer must accept it on their phone before it counts.
          </p>
        </div>
      </div>

      {pending && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
            <Clock className="size-3" /> Awaiting customer approval
          </p>
          <p className="text-sm mt-1">
            <span className="text-ink-2 line-through">{formatRand(pending.previous_amount_zar)}</span>
            <span className="mx-2">→</span>
            <span className="font-bold tabular-nums">{formatRand(pending.new_amount_zar)}</span>
          </p>
          <p className="text-xs text-ink-2 mt-1">{pending.reason}</p>
          <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs" onClick={() => cancel(pending.id)}>
            Cancel revision
          </Button>
        </div>
      )}

      {isAccepted && !pending && !open && (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
          <Pencil className="size-4" /> Update Quote
        </Button>
      )}

      {open && (
        <div className="space-y-3 border-t border-border pt-4 mt-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New total (R)</label>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder={`Was ${formatRand(currentAmount)}`}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Why the change?</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Found a second leak under the sink that also needs fixing."
              className="mt-1"
              maxLength={500}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Add to scope (optional)
            </label>
            <Textarea
              value={scopeAddition}
              onChange={(e) => setScopeAddition(e.target.value)}
              rows={2}
              placeholder="Extra work this revision covers."
              className="mt-1"
              maxLength={500}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={submit} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Send revision to customer
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          </div>
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
            Don't start the extra work until they accept. This is your paper trail.
          </p>
        </div>
      )}

      {!loading && revisions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">History</p>
          <ul className="space-y-2">
            {revisions.map((r) => (
              <li key={r.id} className="text-xs flex items-center gap-2 flex-wrap">
                <StatusPip status={r.status} />
                <span className="tabular-nums">
                  {formatRand(r.previous_amount_zar)} → <strong>{formatRand(r.new_amount_zar)}</strong>
                </span>
                <span className="text-muted-foreground">· {new Date(r.created_at).toLocaleDateString("en-ZA")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const StatusPip = ({ status }: { status: Revision["status"] }) => {
  const map = {
    pending: { Icon: Clock, label: "Pending", cls: "text-amber-700 bg-amber-500/15" },
    accepted: { Icon: CheckCircle2, label: "Accepted", cls: "text-emerald-700 bg-emerald-500/15" },
    rejected: { Icon: XCircle, label: "Rejected", cls: "text-destructive bg-destructive/15" },
    cancelled: { Icon: XCircle, label: "Cancelled", cls: "text-muted-foreground bg-muted" },
  } as const;
  const { Icon, label, cls } = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", cls)}>
      <Icon className="size-2.5" /> {label}
    </span>
  );
};
