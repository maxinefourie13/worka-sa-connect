import { Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KLAP_PACKS, formatRand } from "@/lib/mockData";
import { useKlap } from "@/lib/klapStore";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const TopUpModal = ({ open, onClose }: Props) => {
  const { topUp } = useKlap();
  if (!open) return null;

  const buy = (klaps: number, name: string) => {
    topUp(klaps);
    toast({
      title: `+${klaps} Klaps added`,
      description: `${name} top-up successful. Get back to grafting.`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-pop p-6 md:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-secondary"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Zap className="size-5 text-accent" />
          <span className="text-xs font-bold uppercase tracking-widest text-accent">Top up Klaps</span>
        </div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Out of Klaps? No drama.</h2>
        <p className="text-sm text-ink-2 mt-1">
          Each Klap = one job pitch. Buy more whenever, no commitment.
        </p>

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {KLAP_PACKS.map((p, i) => (
            <div
              key={p.id}
              className={`relative rounded-xl border p-5 flex flex-col ${
                i === 1 ? "border-accent bg-accent/5" : "border-border bg-background"
              }`}
            >
              {i === 1 && (
                <span className="absolute -top-2.5 right-4 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                  Best value
                </span>
              )}
              <p className="font-display text-xl font-semibold">{p.name}</p>
              <p className="font-display text-3xl font-medium tabular-nums mt-3">
                +{p.klaps} <span className="text-sm font-sans text-muted-foreground">Klaps</span>
              </p>
              <p className="text-xs text-ink-2 mt-1">{p.blurb}</p>
              <Button
                className="mt-4"
                variant={i === 1 ? "default" : "outline"}
                onClick={() => buy(p.klaps, p.name)}
              >
                Buy for {formatRand(p.price)}
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-5 text-xs text-muted-foreground text-center">
          Demo only — no real charge. Real payments coming soon.
        </p>
      </div>
    </div>
  );
};
