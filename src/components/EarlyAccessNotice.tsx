import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import boKaap from "@/assets/bo-kaap.jpg";

type EarlyAccessNoticeProps = {
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaTo?: string;
  className?: string;
};

export const EarlyAccessNotice = ({
  title = "You’re early. Very early.",
  body = "Sjoh is still onboarding South African pros, so some areas may look a little quiet while the marketplace fills up.",
  ctaLabel = "Founding pros: list your business",
  ctaTo = "/list",
  className,
}: EarlyAccessNoticeProps) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-[1.65rem] border border-white/12 bg-[#101010] p-5 text-white shadow-pop md:p-6",
      className,
    )}
  >
    <img
      src={boKaap}
      alt=""
      aria-hidden
      className="absolute inset-0 h-full w-full object-cover opacity-42"
      loading="lazy"
    />
    <div
      aria-hidden
      className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.92)_0%,rgba(0,0,0,.72)_52%,rgba(0,0,0,.42)_100%)]"
    />
    <div aria-hidden className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,var(--sa-red)_0_20%,var(--sa-navy)_20%_40%,var(--sa-green)_40%_60%,var(--sa-gold)_60%_80%,var(--sa-pink)_80%_100%)]" />
    <div aria-hidden className="absolute bottom-0 right-0 hidden h-full w-56 opacity-80 md:block">
      <div className="absolute right-10 top-8 size-5 rotate-45 bg-sa-gold" />
      <div className="absolute right-24 top-16 size-4 rotate-45 bg-sa-pink" />
      <div className="absolute right-16 bottom-12 size-6 rotate-45 bg-sa-green" />
      <div className="absolute right-36 bottom-20 size-3 rotate-45 bg-white/70" />
    </div>
    <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex gap-4">
        <span className="mt-1 flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-black/45 text-sa-gold backdrop-blur-md">
          <Sparkles className="size-6" strokeWidth={2.5} />
        </span>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/72">Early access marketplace</p>
          <p className="mt-1 font-display-bold text-2xl leading-[1.02] text-white md:text-3xl">{title}</p>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-white/78 md:text-base">{body}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
        <div className="rounded-2xl border border-white/18 bg-black/42 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/60">
            <UsersRound className="size-4 text-sa-gold" strokeWidth={2.5} />
            Founding window
          </div>
          <p className="mt-1 font-display text-2xl font-black text-white">First 500</p>
          <p className="text-xs font-semibold text-white/58">pros get early perks</p>
        </div>
      <Link
        to={ctaTo}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-sa-gold px-5 py-3 text-sm font-black text-sa-dark transition hover:bg-white"
      >
        {ctaLabel}
        <ArrowRight className="size-4" strokeWidth={3} />
      </Link>
      </div>
    </div>
  </div>
);
