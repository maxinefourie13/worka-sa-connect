import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKlap } from "@/lib/klapStore";
import { ProposalModal } from "@/components/ProposalModal";
import { cn } from "@/lib/utils";

interface Props {
  jobId: string;
  jobTitle: string;
  jobBudget?: number;
  clientName?: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export const KlapButton = ({ jobId, jobTitle, jobBudget, clientName, size = "sm", className }: Props) => {
  const [proposalOpen, setProposalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <Button
        size={size}
        onClick={() => setProposalOpen(true)}
        disabled={submitted}
        className={cn(
          "font-bold tracking-wide gap-1.5",
          submitted
            ? "bg-primary-light text-primary hover:bg-primary-light"
            : "bg-accent text-accent-foreground hover:bg-accent/90",
          className,
        )}
      >
        <Zap className="size-3.5" strokeWidth={2.5} />
        {submitted ? "Proposal sent ✓" : "Klap it — Send proposal"}
      </Button>
      <ProposalModal
        open={proposalOpen}
        jobId={jobId}
        jobTitle={jobTitle}
        jobBudget={jobBudget}
        clientName={clientName}
        onClose={() => setProposalOpen(false)}
        onSubmitted={() => setSubmitted(true)}
      />
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
