import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
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

/**
 * Apply to a job. Submits one free proposal — only Verified Pros may apply.
 * Replaces the old KlapButton/bidding flow.
 */
export const ApplyButton = ({ jobId, jobTitle, jobBudget, clientName, size = "sm", className }: Props) => {
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
        <Send className="size-3.5" strokeWidth={2.5} />
        {submitted ? "Proposal sent ✓" : "Apply for this job"}
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
