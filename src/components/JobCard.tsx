import { Link } from "react-router-dom";

import { formatRand, type Opportunity } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { KlapButton } from "@/components/KlapButton";
import { UrgentBadge } from "@/components/UrgentBadge";

interface JobCardProps {
  job: Opportunity;
  className?: string;
}

const Inner = ({ job }: { job: Opportunity }) => (
  <div
    className={cn(
      "group bg-card rounded-xl border border-border p-5 shadow-card hover:shadow-pop hover:border-primary/30 transition-all",
    )}
  >
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
          <KlapButton jobId={job.id} jobTitle={job.title} jobBudget={job.budget} clientName={job.postedBy} />
        </div>
      </div>
    </div>
  </div>
);

export const JobCard = ({ job, className }: JobCardProps) => {
  if (job.isUrgent) {
    return (
      <UrgentBadge className={className}>
        <Inner job={job} />
      </UrgentBadge>
    );
  }
  return <div className={className}><Inner job={job} /></div>;
};
