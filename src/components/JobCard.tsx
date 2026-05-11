import { Link } from "react-router-dom";

import { formatRand, type Opportunity } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { ApplyButton } from "@/components/ApplyButton";
import { UrgentBoostButton } from "@/components/UrgentBoostButton";
import { useAuth } from "@/hooks/useAuth";
import { BriefcaseBusiness, Siren, Sparkles, Paperclip, MapPin } from "lucide-react";
import { freshnessFromIso, competitionSignal } from "@/lib/leadSignals";

interface JobCardProps {
  job: Opportunity;
  className?: string;
  /** Optional: how many jobs this client has previously hired on Sjoh. */
  /** When true, render Pro-side signals (freshness + quote count). */
  isProView?: boolean;
  /** When set, show a "Near you" pip if this job's city matches. */
  proCity?: string;
}

export const JobCard = ({ job, className, isProView, proCity }: JobCardProps) => {
  const { user } = useAuth();
  const isOwner = !!user && !!job.clientId && user.id === job.clientId;
  const isBoosted = !!job.urgentBoostPaidAt && (Date.now() - new Date(job.urgentBoostPaidAt).getTime()) < 72 * 3600 * 1000;
  const fresh = freshnessFromIso(job.createdAt, job.postedAt);
  const competition = competitionSignal(job.applicants);
  const isNearby = !!proCity && !!job.city && proCity.trim().toLowerCase() === job.city.trim().toLowerCase();

  return (
    <div className={className}>
      <div
        className={cn(
          "group rounded-[1.35rem] border p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-pop",
          "bg-white/[0.06] text-white border-white/10 hover:border-sa-gold/70",
          isBoosted && "border-sa-gold/70 ring-1 ring-sa-gold/25",
        )}
      >
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {isBoosted && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-accent-foreground bg-accent px-2 py-1 rounded-full animate-pulse">
              <Siren className="size-3" strokeWidth={2.5} /> Urgent
            </span>
          )}
          {isProView && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border",
                fresh.badgeClass,
              )}
              title="When this lead was posted"
            >
              <span aria-hidden>{fresh.dot}</span> {fresh.label}
            </span>
          )}
          {isProView && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border",
                competition.badgeClass,
              )}
              title="How many pros have already quoted"
            >
              <span aria-hidden>{competition.dot}</span> {competition.label}
            </span>
          )}
          {isProView && isNearby && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border bg-foreground text-background border-foreground">
              <MapPin className="size-3" strokeWidth={2.5} /> Near you
            </span>
          )}
          {job.isConciergeLead && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/30 px-2 py-1 rounded-full">
              <Sparkles className="size-3" strokeWidth={2.5} /> Sourced by Sjoh Concierge
            </span>
          )}
        </div>
        <div className="flex items-start gap-4">
          <div className="shrink-0 size-12 rounded-xl bg-sa-gold text-sa-dark flex items-center justify-center shadow-[4px_4px_0_rgba(255,255,255,0.12)]">
            <BriefcaseBusiness className="size-5" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <Link to={`/requests/${job.id}`} className="block">
              <h3 className="font-display text-base font-extrabold leading-snug text-white group-hover:text-sa-gold transition-colors">
                {job.title}
              </h3>
            </Link>
            <p className="mt-1 text-xs text-white/50">
              Posted by <span className="text-white/70 font-medium">{job.postedBy}</span> · {job.postedAt}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/62">
              <span>{job.city}, {job.province}</span>
              <span className="text-white/30">·</span>
              <span>By {job.deadline}</span>
              {!isProView && <span className="text-white/30">·</span>}
              {!isProView && <span>{job.applicants} applied</span>}
              {job.attachments && job.attachments.length > 0 && (
                <>
                  <span className="text-white/30">·</span>
                  <span className="inline-flex items-center gap-1 text-white font-medium">
                    <Paperclip className="size-3" strokeWidth={2.5} />
                    {job.attachments.length} photo{job.attachments.length === 1 ? "" : "s"}
                  </span>
                </>
              )}
            </div>

            {job.attachments && job.attachments.length > 0 && (
              <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                {job.attachments.slice(0, 4).map((a, i) => (
                  a.type.startsWith("image/") ? (
                    <a
                      key={i}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 size-14 rounded-lg overflow-hidden border border-white/10 hover:border-sa-gold transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img src={a.url} alt={a.name} loading="lazy" className="size-full object-cover" />
                    </a>
                  ) : (
                    <a
                      key={i}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 size-14 rounded-lg border border-white/10 hover:border-sa-gold flex items-center justify-center bg-white/10 text-white/60"
                      onClick={(e) => e.stopPropagation()}
                      title={a.name}
                    >
                      <Paperclip className="size-4" strokeWidth={2} />
                    </a>
                  )
                ))}
                {job.attachments.length > 4 && (
                  <span className="shrink-0 size-14 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-[11px] font-semibold text-white/50">
                    +{job.attachments.length - 4}
                  </span>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-display text-lg font-extrabold tabular-nums text-white">
                  {formatRand(job.budget)}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-white/45 font-semibold">
                  {job.budgetType === "fixed" ? "Fixed budget" : job.budgetType === "estimate" ? "Estimated" : "Negotiable"}
                </div>
              </div>
              {isOwner ? (
                <UrgentBoostButton
                  opportunityId={job.id}
                  opportunityTitle={job.title}
                  alreadyUrgent={isBoosted}
                  size="sm"
                />
              ) : (
                <ApplyButton
                  jobId={job.id}
                  jobTitle={job.title}
                  jobBudget={job.budget}
                  clientName={job.postedBy}
                  isUrgent={isBoosted || job.isUrgent}
                  isConciergeLead={job.isConciergeLead}
                  externalContactUrl={job.externalContactUrl}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
