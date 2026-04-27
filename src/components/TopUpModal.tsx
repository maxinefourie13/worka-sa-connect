import { Zap, X, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { KLAP_PACKS, formatRand } from "@/lib/mockData";
import { payments } from "@/lib/payments";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const TopUpModal = ({ open, onClose }: Props) => {
  if (!open) return null;

  const buy = (packId: string) => {
    const slug = packId === "crate" ? "crate" : "six-pack";
    payments.buyKlapPack(slug);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-pop overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-secondary z-10"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {/* Bold header */}
        <div className="bg-foreground text-background px-6 md:px-8 pt-7 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="size-4 text-accent" />
            <span className="text-xs font-bold uppercase tracking-widest text-accent">Out of ammo</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
            Sjoh! You're out of ammo, boet.
          </h2>
          <p className="text-sm text-background/80 mt-2">
            No Klaps left to send a proposal. Top up below and get back in the ring.
          </p>
        </div>

        <div className="px-6 md:px-8 pt-6 pb-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {KLAP_PACKS.map((p, i) => {
              const isCrate = i === 1;
              return (
                <div
                  key={p.id}
                  className={`relative rounded-xl border-2 p-5 flex flex-col ${
                    isCrate ? "border-accent bg-accent/5" : "border-border bg-background"
                  }`}
                >
                  {isCrate && (
                    <span className="absolute -top-2.5 right-4 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                      Recommended
                    </span>
                  )}
                  <p className="font-display text-xl font-semibold">{p.name}</p>
                  <p className="font-display text-3xl font-medium tabular-nums mt-3">
                    +{p.klaps} <span className="text-sm font-sans text-muted-foreground">Klaps</span>
                  </p>
                  <p className="text-xs text-ink-2 mt-1">{p.blurb}</p>
                  <Button
                    className={
                      isCrate
                        ? "mt-4 bg-accent text-accent-foreground hover:bg-accent/90 font-bold gap-1.5"
                        : "mt-4 font-bold gap-1.5"
                    }
                    variant={isCrate ? "default" : "outline"}
                    onClick={() => buy(p.id)}
                  >
                    <Zap className="size-3.5" strokeWidth={2.5} />
                    KLAP HOM PAPPIE! — {formatRand(p.price)}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Upgrade nudge */}
          <div className="mt-5 rounded-xl bg-secondary border border-border p-4 flex items-start gap-3">
            <span className="size-8 rounded-lg bg-accent text-accent-foreground flex items-center justify-center shrink-0">
              <Zap className="size-4" strokeWidth={2.5} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-semibold">Stop topping up — upgrade instead</p>
              <p className="text-xs text-ink-2 mt-0.5">
                <strong>The Main Oke</strong> gets 100 Klaps a month + featured placement for R 250.
              </p>
            </div>
            <Link
              to="/pricing"
              onClick={onClose}
              className="text-xs font-bold text-accent hover:underline shrink-0"
            >
              See plans →
            </Link>
          </div>

          <p className="mt-4 text-[11px] text-muted-foreground text-center">
            Secure payment via Paystack · ZAR
          </p>
        </div>
      </div>
    </div>
  );
};
