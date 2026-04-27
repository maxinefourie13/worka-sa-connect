import { useState } from "react";
import { Link } from "react-router-dom";
import { X, Zap, Video, Paperclip, FileDown, Lock, Sparkles, Check, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKlap } from "@/lib/klapStore";
import { toast } from "@/hooks/use-toast";
import { TopUpModal } from "@/components/TopUpModal";
import { LiabilityDisclaimer } from "@/components/LiabilityDisclaimer";
import { downloadQuotation } from "@/lib/quotation";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyBusiness } from "@/hooks/useMyBusiness";
import { findProhibited, PROHIBITED_MESSAGE } from "@/lib/prohibitedKeywords";

interface Props {
  open: boolean;
  jobId: string;
  jobTitle: string;
  jobBudget?: number;
  clientName?: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

type PriceType = "fixed" | "from" | "quote";

export const ProposalModal = ({ open, jobId, jobTitle, jobBudget, clientName, onClose, onSubmitted }: Props) => {
  const { provider, placeBid, previewBid } = useKlap();
  const { user } = useAuth();
  const { business: myBusiness } = useMyBusiness();
  const [topUpOpen, setTopUpOpen] = useState(false);

  const [priceType, setPriceType] = useState<PriceType>("fixed");
  const [price, setPrice] = useState<string>(jobBudget ? String(jobBudget) : "");
  const [scope, setScope] = useState("");
  const [timeline, setTimeline] = useState("Within 1 week");
  const [contactPref, setContactPref] = useState("WhatsApp");
  const [loomUrl, setLoomUrl] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [bid, setBid] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);
  const [resultRank, setResultRank] = useState<{ rank: number; total: number; bid: number } | null>(null);

  const isMainOke = provider.tier === "main-oke";
  const priceNum = Number(price) || 0;
  const safeBid = Math.max(0, Math.min(bid, provider.klapsRemaining));
  const preview = previewBid(jobId, safeBid);
  const canSubmit =
    scope.trim().length >= 20 &&
    (priceType === "quote" || priceNum > 0) &&
    !submitted;

  if (!open) return null;

  const reset = () => {
    setPriceType("fixed");
    setPrice(jobBudget ? String(jobBudget) : "");
    setScope("");
    setTimeline("Within 1 week");
    setContactPref("WhatsApp");
    setLoomUrl("");
    setAttachments([]);
    setBid(0);
    setSubmitted(false);
    setResultRank(null);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const banned = findProhibited(scope);
    if (banned) {
      toast({ title: "Aikona!", description: PROHIBITED_MESSAGE, variant: "destructive" });
      return;
    }
    const result = placeBid(jobId, jobTitle, safeBid);
    if (!result.ok) {
      toast({ title: "Out of Klaps, eish!", description: "Top up to bid higher — or submit free with no bid.", variant: "destructive" });
      setTopUpOpen(true);
      return;
    }

    // Persist to database via the place_bid RPC (atomic deduct + insert).
    if (user && myBusiness && jobId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId);
      if (isUuid) {
        const { data: insertedId, error } = await supabase.rpc("place_bid", {
          _opportunity_id: jobId,
          _business_id: myBusiness.id,
          _message: scope,
          _quote_amount: priceType === "quote" ? null : priceNum,
          _bid_klaps: safeBid,
        });
        if (error) {
          console.error("[place_bid] failed", error);
          toast({ title: "Aikona!", description: error.message, variant: "destructive" });
          return;
        }
        if (insertedId) {
          supabase.functions
            .invoke("notify-new-bid", { body: { proposal_id: insertedId } })
            .catch((e) => console.error("[notify-new-bid]", e));
        }
      }
    }

    setSubmitted(true);
    setResultRank({ rank: result.rank!, total: result.total!, bid: safeBid });
    toast({
      title: safeBid === 0 ? "Proposal sent!" : safeBid >= 20 ? "Big bid in! 👑" : "Bid placed ⚡",
      description: safeBid === 0
        ? `You're #${result.rank} of ${result.total}. Bid Klaps next time to push higher.`
        : `${safeBid} Klap${safeBid > 1 ? "s" : ""} bid · ranked #${result.rank} of ${result.total}.`,
    });
    onSubmitted?.();
  };

  const handleDownloadQuote = () => {
    if (!isMainOke) return;
    const ok = downloadQuotation({
      jobId,
      jobTitle,
      clientName,
      price: priceNum,
      priceType,
      scope,
      timeline,
      validityDays: 14,
      contactPref,
      loomUrl: loomUrl || undefined,
      providerBusinessId: provider.businessId,
    });
    if (!ok) {
      toast({ title: "Pop-up blocked", description: "Allow pop-ups to download the quotation." });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <div className="relative w-full max-w-2xl bg-card border border-border rounded-t-2xl md:rounded-2xl shadow-pop my-0 md:my-8 max-h-[95vh] flex flex-col">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-secondary z-10"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>

          {/* Header */}
          <div className="px-6 md:px-8 pt-6 md:pt-8 pb-4 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="size-4 text-accent" strokeWidth={2.5} />
              <span className="text-xs font-bold uppercase tracking-widest text-accent">Submit your proposal</span>
            </div>
            <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight pr-8">{jobTitle}</h2>
            <p className="text-xs text-muted-foreground mt-2">
              Proposals are <strong className="text-foreground">free & unlimited</strong>. Bid Klaps to push your proposal higher in the client's list.
              You have <strong className="tabular-nums text-foreground">{provider.klapsRemaining}</strong> Klap{provider.klapsRemaining !== 1 ? "s" : ""} left.
              {clientName && <> · For <strong>{clientName}</strong></>}
            </p>
          </div>

          {/* Body — scrolls */}
          <div className="px-6 md:px-8 py-5 space-y-5 overflow-y-auto flex-1">
            {submitted ? (
              <SuccessState
                isMainOke={isMainOke}
                onDownloadQuote={handleDownloadQuote}
                onClose={handleClose}
                resultRank={resultRank}
              />
            ) : (
              <>
                {/* Price */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-ink-2 block mb-2">
                    Your price <span className="text-accent">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {([
                      { id: "fixed", label: "Fixed price" },
                      { id: "from", label: "Starting from" },
                      { id: "quote", label: "Quote on inspection" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPriceType(opt.id)}
                        className={cn(
                          "text-xs font-semibold px-3 py-1.5 rounded-full border transition-all",
                          priceType === opt.id
                            ? "bg-foreground text-background border-foreground"
                            : "bg-card text-ink-2 border-border hover:border-foreground",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {priceType !== "quote" ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">R</span>
                      <input
                        type="number"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-2.5 bg-background border border-border rounded-lg text-base font-semibold tabular-nums outline-none focus:border-primary"
                      />
                      {jobBudget && (
                        <p className="text-[11px] text-muted-foreground mt-1.5">
                          Client's budget: R {jobBudget.toLocaleString("en-ZA")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-ink-2 bg-secondary rounded-lg px-3 py-2.5">
                      No fixed price — you'll quote after seeing the site. Recommended for plumbing, electrical, structural work.
                    </div>
                  )}
                </div>

                {/* Pitch / scope */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-ink-2 block mb-2">
                    Your pitch <span className="text-accent">*</span>
                  </label>
                  <textarea
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    rows={5}
                    placeholder="What's included, why you're the right oke, any relevant past work. Min 20 characters."
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:border-primary resize-none"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">
                    {scope.length} chars {scope.length < 20 && <span className="text-accent">— need at least 20</span>}
                  </p>
                </div>

                {/* Timeline + contact */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-ink-2 block mb-2">
                      Can start
                    </label>
                    <select
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:border-primary"
                    >
                      <option>Today</option>
                      <option>This week</option>
                      <option>Within 1 week</option>
                      <option>Within 2 weeks</option>
                      <option>Flexible</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-ink-2 block mb-2">
                      Best contact
                    </label>
                    <select
                      value={contactPref}
                      onChange={(e) => setContactPref(e.target.value)}
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:border-primary"
                    >
                      <option>WhatsApp</option>
                      <option>Phone call</option>
                      <option>Email</option>
                      <option>In-app message</option>
                    </select>
                  </div>
                </div>

                {/* Loom + attachments */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-ink-2 block mb-2">
                    <Video className="size-3 inline -mt-0.5 mr-1" />
                    Walkthrough video (optional, big winner)
                  </label>
                  <input
                    type="url"
                    value={loomUrl}
                    onChange={(e) => setLoomUrl(e.target.value)}
                    placeholder="Paste a Loom, YouTube, or video URL"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:border-primary"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Pros who include a video win <strong>3x</strong> more often. Show your face, walk through the job.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-ink-2 block mb-2">
                    <Paperclip className="size-3 inline -mt-0.5 mr-1" />
                    Attachments (optional)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => setAttachments(Array.from(e.target.files || []))}
                    className="block w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-foreground hover:file:bg-secondary/80"
                  />
                  {attachments.length > 0 && (
                    <p className="text-[11px] text-ink-2 mt-1.5">
                      {attachments.length} file{attachments.length > 1 ? "s" : ""}: {attachments.map(f => f.name).join(", ")}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Photos of past work, certifications, or product specs.
                  </p>
                </div>

                {/* Bid step — open auction */}
                <BidInput
                  bid={bid}
                  onChange={setBid}
                  preview={preview}
                  klapsRemaining={provider.klapsRemaining}
                  onTopUp={() => setTopUpOpen(true)}
                />

                {/* Quotation upsell card */}
                <QuotationCard isMainOke={isMainOke} />
              </>
            )}
          </div>

          {/* Footer */}
          {!submitted && (
            <div className="px-6 md:px-8 py-4 border-t border-border bg-card rounded-b-none md:rounded-b-2xl">
              <LiabilityDisclaimer variant="inline" className="mb-3" />
              <div className="flex items-center justify-between gap-3">
                <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold gap-1.5"
                  size="lg"
                >
                  <Zap className="size-4" strokeWidth={2.5} />
                  {safeBid > 0
                    ? `Klap this Job — bid ${safeBid} Klap${safeBid > 1 ? "s" : ""}`
                    : "Submit proposal — Free"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <TopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} />
    </>
  );
};

const QuotationCard = ({ isMainOke }: { isMainOke: boolean }) => {
  if (isMainOke) {
    return (
      <div className="rounded-xl border border-foreground bg-foreground text-background p-4">
        <div className="flex items-start gap-3">
          <span className="size-9 rounded-lg bg-accent text-accent-foreground flex items-center justify-center shrink-0">
            <FileDown className="size-4" />
          </span>
          <div className="flex-1">
            <p className="font-display text-sm font-semibold flex items-center gap-2">
              Auto-Quotation unlocked
              <span className="text-[9px] bg-accent text-accent-foreground font-bold px-1.5 py-0.5 rounded uppercase tracking-widest">Main Oke</span>
            </p>
            <p className="text-xs text-background/80 mt-1">
              We'll generate a branded PDF quotation from your business info + this proposal. Available right after you send.
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-dashed border-accent/50 bg-accent/5 p-4">
      <div className="flex items-start gap-3">
        <span className="size-9 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
          <Lock className="size-4" />
        </span>
        <div className="flex-1">
          <p className="font-display text-sm font-semibold">
            Want to send a branded PDF quotation? <Sparkles className="size-3.5 inline text-accent -mt-0.5" />
          </p>
          <p className="text-xs text-ink-2 mt-1">
            Auto-Quotation builds a professional PDF from your business info — only on <strong>The Main Oke</strong>. Pros who quote in PDF land 2x more jobs.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-1 text-xs font-bold text-accent mt-2 hover:underline"
          >
            Upgrade to Main Oke →
          </Link>
        </div>
      </div>
    </div>
  );
};

const SuccessState = ({
  isMainOke, onDownloadQuote, onClose, resultRank,
}: {
  isMainOke: boolean;
  onDownloadQuote: () => void;
  onClose: () => void;
  resultRank: { rank: number; total: number; bid: number } | null;
}) => (
  <div className="text-center py-6">
    <div className="size-16 rounded-full bg-primary-light text-primary flex items-center justify-center mx-auto mb-4">
      <Check className="size-8" strokeWidth={3} />
    </div>
    <h3 className="font-display text-2xl font-semibold tracking-tight">
      {resultRank && resultRank.bid > 0 ? "Klapped! ⚡" : "Proposal sent!"}
    </h3>
    <p className="text-sm text-ink-2 mt-2 max-w-sm mx-auto">
      Your proposal is in. The client will see your pitch and reach out directly. No middleman, no commission.
    </p>

    {resultRank && (
      <div className="mt-5 mx-auto max-w-sm rounded-xl bg-foreground text-background px-4 py-3 flex items-center justify-between">
        <div className="text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Your placement</p>
          <p className="font-display text-lg font-semibold">
            #{resultRank.rank} <span className="text-background/60 font-normal text-sm">of {resultRank.total} bids</span>
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest bg-accent text-accent-foreground px-2 py-1 rounded">
          {resultRank.bid} Klap{resultRank.bid !== 1 ? "s" : ""}
        </span>
      </div>
    )}

    {isMainOke ? (
      <div className="mt-6 max-w-sm mx-auto">
        <Button onClick={onDownloadQuote} size="lg" className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90">
          <FileDown className="size-4" />
          Download branded quotation PDF
        </Button>
        <p className="text-[11px] text-muted-foreground mt-2">
          Opens in a new tab — print or save as PDF to send to the client.
        </p>
      </div>
    ) : (
      <div className="mt-6 max-w-sm mx-auto rounded-xl border border-dashed border-accent/50 bg-accent/5 p-4 text-left">
        <p className="font-display text-sm font-semibold flex items-center gap-1.5">
          <Lock className="size-3.5 text-muted-foreground" />
          Send a branded PDF quote next time
        </p>
        <p className="text-xs text-ink-2 mt-1">
          Main Oke pros automatically generate a polished PDF quote with their logo, address, and pricing — done in 1 click.
        </p>
        <Link to="/pricing" className="inline-flex items-center gap-1 text-xs font-bold text-accent mt-2 hover:underline">
          Upgrade to Main Oke →
        </Link>
      </div>
    )}

    <Button variant="ghost" onClick={onClose} className="mt-6">Done</Button>
  </div>
);

const QUICK_BIDS = [0, 5, 10, 25, 50];

const BidInput = ({
  bid, onChange, preview, klapsRemaining, onTopUp,
}: {
  bid: number;
  onChange: (n: number) => void;
  preview: { total: number; projectedRank: number; topBid: number };
  klapsRemaining: number;
  onTopUp: () => void;
}) => {
  const safeBid = Math.max(0, Math.min(bid, klapsRemaining));
  const topBidNote = preview.topBid > 0
    ? `Top bid right now: ${preview.topBid} Klap${preview.topBid > 1 ? "s" : ""}`
    : "No-one's bid yet — even 1 Klap puts you on top.";
  const beatsTop = safeBid > preview.topBid;

  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-widest text-ink-2 block mb-2">
        Bid Klaps to rank higher
      </label>

      {/* Competition banner */}
      <div className="mb-3 flex items-center gap-2 text-xs text-ink-2 bg-secondary rounded-lg px-3 py-2">
        <Users className="size-3.5 text-accent" />
        <span>
          <strong className="text-foreground tabular-nums">{preview.total - 1}</strong> other pro{preview.total - 1 !== 1 ? "s have" : " has"} bid on this job.
          {" "}<span className="text-muted-foreground">{topBidNote}</span>
        </span>
      </div>

      {/* Quick chips + custom input */}
      <div className="flex flex-wrap gap-2 mb-3">
        {QUICK_BIDS.map((n) => {
          const disabled = n > klapsRemaining;
          const selected = safeBid === n;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange(n)}
              className={cn(
                "text-xs font-bold px-3 py-1.5 rounded-full border transition-all tabular-nums",
                selected
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-card text-ink-2 border-border hover:border-accent",
                disabled && "opacity-40 cursor-not-allowed",
              )}
            >
              {n === 0 ? "Free" : `${n} Klap${n > 1 ? "s" : ""}`}
            </button>
          );
        })}
        <div className="relative">
          <input
            type="number"
            min={0}
            max={klapsRemaining}
            value={bid}
            onChange={(e) => onChange(Math.max(0, Math.min(Number(e.target.value) || 0, klapsRemaining)))}
            className="w-24 pl-3 pr-2 py-1.5 bg-background border border-border rounded-full text-xs font-bold tabular-nums outline-none focus:border-accent text-center"
            placeholder="Custom"
          />
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={Math.max(klapsRemaining, 1)}
        value={safeBid}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={klapsRemaining === 0}
        className="w-full accent-accent"
        aria-label="Bid amount"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1 tabular-nums font-semibold">
        <span>0</span>
        <span>Your balance: {klapsRemaining}</span>
      </div>

      {klapsRemaining === 0 && (
        <button
          type="button"
          onClick={onTopUp}
          className="mt-2 text-[11px] font-bold text-accent hover:underline"
        >
          Out of Klaps, eish! → Top up to bid
        </button>
      )}

      {/* Projected rank */}
      <div className="mt-3 flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-foreground text-background text-xs">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-3.5 text-accent" />
          <span className="text-background/70 uppercase tracking-widest font-bold text-[10px]">Projected rank</span>
        </div>
        <span className="font-display text-base font-semibold tabular-nums">
          #{preview.projectedRank} <span className="text-background/60 font-normal text-xs">of {preview.total}</span>
          {beatsTop && safeBid > 0 && (
            <span className="ml-2 text-[9px] bg-accent text-accent-foreground font-bold px-1.5 py-0.5 rounded uppercase tracking-widest">
              Top spot
            </span>
          )}
        </span>
      </div>
    </div>
  );
};
