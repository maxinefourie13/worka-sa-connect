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
        <span className="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 text-[10px] font-extrabold uppercase tracking-widest">
          <Sparkles className="size-3 animate-pulse" strokeWidth={2.75} /> Early access
        </span>
        <p className="leading-tight flex-1 min-w-0">
          <span className="font-bold">First 500 pros lock in founding pricing forever.</span>{" "}
          <span className="opacity-80 hidden sm:inline">List your business today.</span>
        </p>
        <a
          href="/list"
          className="group shrink-0 inline-flex items-center gap-1 rounded-full bg-accent text-foreground px-3 py-1 text-xs font-extrabold hover:bg-accent/90 transition-all"
        >
          Claim your spot
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
