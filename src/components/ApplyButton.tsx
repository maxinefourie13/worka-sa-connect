import { useState } from "react";
import { Send, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProposalModal } from "@/components/ProposalModal";
import { cn } from "@/lib/utils";
import { useProviderAccess } from "@/hooks/useProviderAccess";

interface Props {
  jobId: string;
  jobTitle: string;
  jobBudget?: number;
  clientName?: string;
  size?: "sm" | "default" | "lg";
  className?: string;
  /** If true, this is an admin-sourced concierge lead — redirect to externalContactUrl instead of opening the proposal modal. */
  isConciergeLead?: boolean;
  externalContactUrl?: string | null;
}

/**
 * Apply to a job. Server-side `submit_proposal` enforces:
 *  - Ready for Work subscribers: unlimited proposals (verified business required)
 *  - Founding members on Basic/trial/no plan: 1 free proposal per calendar month, no verification needed
 *  - Everyone else: must upgrade to Ready for Work
 */
export const ApplyButton = ({ jobId, jobTitle, jobBudget, clientName, size = "sm", className, isConciergeLead, externalContactUrl }: Props) => {
  const [proposalOpen, setProposalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { hasVerifiedProAccess, foundingProposalAvailable, isFoundingMember, foundingProposalsResetAt } = useProviderAccess();

  const showFoundingPill = !hasVerifiedProAccess && foundingProposalAvailable;
  const foundingExhausted = !hasVerifiedProAccess && isFoundingMember && !foundingProposalAvailable;

  const resetLabel = foundingProposalsResetAt
    ? foundingProposalsResetAt.toLocaleDateString("en-ZA", { day: "numeric", month: "long" })
    : null;

  // Concierge lead: skip the proposal modal entirely and bounce to the original source.
  if (isConciergeLead && externalContactUrl) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <Button
          size={size}
          asChild
          className={cn("font-bold tracking-wide gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90", className)}
        >
          <a href={externalContactUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" strokeWidth={2.5} />
            Contact client directly
          </a>
        </Button>
        <span className="text-[10px] text-muted-foreground text-right max-w-[160px] leading-tight">
          We sourced this lead from outside Sjoh — contact the client at the link above.
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-start gap-1.5">
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
          <Send className="size-3.5" strokeWidth={2.5} />
          {submitted ? "Proposal sent ✓" : "Apply for this job"}
        </Button>
        {showFoundingPill && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-accent">
            <Sparkles className="size-3" strokeWidth={2.5} />
            Founding member · free this month
          </span>
        )}
        {foundingExhausted && resetLabel && (
          <span className="text-[11px] text-muted-foreground">
            Free proposal used · resets {resetLabel}
          </span>
        )}
      </div>
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
