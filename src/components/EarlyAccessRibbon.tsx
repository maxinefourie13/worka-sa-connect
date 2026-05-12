import { useEffect, useState } from "react";
import { Sparkles, X, ArrowRight } from "lucide-react";

const STORAGE_KEY = "sjoh_early_access_dismissed_v1";

/**
 * Slim site-wide ribbon shown above the header.
 * Black background with a coral shimmer sweep + pulsing sparkle for energy.
 */
export const EarlyAccessRibbon = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    setOpen(false);
  };

  return (
    <div className="relative w-full bg-foreground text-background overflow-hidden">
      {/* coral shimmer sweep */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 bg-[linear-gradient(110deg,transparent_35%,hsl(var(--accent)/0.55)_50%,transparent_65%)] bg-[length:250%_100%] animate-[shimmer_5s_linear_infinite]"
        aria-hidden
      />
      <div className="container relative py-2 flex items-center gap-3 text-xs sm:text-sm">
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-sa-gold/35 bg-sa-gold/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-sa-gold">
          <Sparkles className="size-3 animate-pulse" strokeWidth={2.75} /> Early access
        </span>
        <p className="leading-tight flex-1 min-w-0">
          <span className="font-bold">You’re early. Very early.</span>{" "}
          <span className="hidden opacity-90 sm:inline">Sjoh is still onboarding pros, so some categories may look quiet. Founding pros lock in 0% commission.</span>
        </p>
        <a
          href="/list"
          className="group inline-flex shrink-0 items-center gap-1 rounded-full bg-sa-gold px-3 py-1 text-xs font-extrabold text-sa-dark transition-all hover:bg-white"
        >
          List your business
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" strokeWidth={3} />
        </a>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 size-6 rounded-md hover:bg-background/10 inline-flex items-center justify-center"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
};
