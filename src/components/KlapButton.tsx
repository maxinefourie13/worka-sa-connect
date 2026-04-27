import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKlap } from "@/lib/klapStore";
import { TopUpModal } from "@/components/TopUpModal";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  jobId: string;
  jobTitle: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export const KlapButton = ({ jobId, jobTitle, size = "sm", className }: Props) => {
  const { provider, klapJob } = useKlap();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [klapped, setKlapped] = useState(false);

  const onClick = () => {
    if (klapped) return;
    const result = klapJob(jobId, jobTitle);
    if (!result.ok) {
      setTopUpOpen(true);
      return;
    }
    setKlapped(true);
    toast({
      title: "Klap sent! 💥",
      description: "The client will see your pitch. 1 Klap deducted.",
    });
  };

  return (
    <>
      <Button
        size={size}
        onClick={onClick}
        disabled={klapped}
        className={cn(
          "font-bold tracking-wide gap-1.5",
          klapped
            ? "bg-primary-light text-primary hover:bg-primary-light"
            : "bg-accent text-accent-foreground hover:bg-accent/90",
          className,
        )}
      >
        <Zap className="size-3.5" strokeWidth={2.5} />
        {klapped ? "Klapped ✓" : "Klap it — 1 Klap"}
      </Button>
      <TopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} />
    </>
  );
};

export const KlapWalletPill = ({ onTopUp }: { onTopUp?: () => void }) => {
  const { provider } = useKlap();
  return (
    <button
      onClick={onTopUp}
      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-accent/10 text-accent px-2.5 py-1 rounded-full hover:bg-accent/20 transition-colors"
      title="Your Klap wallet"
    >
      <Zap className="size-3" strokeWidth={2.5} />
      <span className="tabular-nums">{provider.klapsRemaining}</span> Klaps
    </button>
  );
};
