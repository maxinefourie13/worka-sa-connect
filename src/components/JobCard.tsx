import { Link } from "react-router-dom";

import { formatRand, type Opportunity } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { KlapButton } from "@/components/KlapButton";
import { UrgentBoostButton } from "@/components/UrgentBoostButton";
import { useAuth } from "@/hooks/useAuth";
import { History, Siren } from "lucide-react";

interface JobCardProps {
  job: Opportunity;
  className?: string;
  /** Optional: how many jobs this client has previously hired on Sjoh. */
  clientHireCount?: number;
}

export const JobCard = ({ job, className, clientHireCount }: JobCardProps) => {
  const { user } = useAuth();
  const isOwner = !!user && !!job.clientId && user.id === job.clientId;
  const isBoosted = !!job.urgentBoostPaidAt && (Date.now() - new Date(job.urgentBoostPaidAt).getTime()) < 72 * 3600 * 1000;

  return (
    <div className={className}>
      <div
        className={cn(
          "group bg-card rounded-xl border p-5 shadow-card hover:shadow-pop transition-all",
          isBoosted ? "border-accent/60 ring-1 ring-accent/30 hover:border-accent" : "border-border hover:border-primary/30",
        )}
      >
        {isBoosted && (
          <div className="mb-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-accent-foreground bg-accent px-2 py-1 rounded-full animate-pulse">
            <Siren className="size-3" strokeWidth={2.5} /> Urgent
          </div>
        )}
        <div className="flex items-start gap-4">
          <div className="shrink-0 size-12 rounded-lg bg-secondary flex items-center justify-center text-2xl">
            {job.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <Link to={`/opportunities/${job.id}`} className="block">
              <h3 className="font-display text-base font-semibold leading-snug group-hover:text-primary transition-colors">
                {job.title}
              </h3>
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">
              Posted by <span className="text-ink-2 font-medium">{job.postedBy}</span> · {job.postedAt}
            </p>

            {typeof clientHireCount === "number" && clientHireCount > 0 && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <History className="size-3" strokeWidth={2.5} />
                Hired {clientHireCount} pro{clientHireCount === 1 ? "" : "s"} on Sjoh before
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-2">
              <span>{job.city}, {job.province}</span>
              <span className="text-muted-foreground">·</span>
              <span>By {job.deadline}</span>
              <span className="text-muted-foreground">·</span>
              <span>{job.applicants} applied</span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-display text-lg font-semibold tabular-nums">
                  {formatRand(job.budget)}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  {job.budgetType === "fixed" ? "Fixed budget" : job.budgetType === "estimate" ? "Estimated" : "Negotiable"}
                </div>
              </div>
              {isOwner ? (
                <UrgentBoostButton
                  opportunityId={job.id}
                  opportunityTitle={job.title}
                  alreadyBoosted={isBoosted}
                  size="sm"
                />
              ) : (
                <KlapButton jobId={job.id} jobTitle={job.title} jobBudget={job.budget} clientName={job.postedBy} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
