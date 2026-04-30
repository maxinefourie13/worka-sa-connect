import { useEffect, useState } from "react";
import { Sparkles, X, ArrowRight } from "lucide-react";

const STORAGE_KEY = "sjoh_early_access_dismissed_v1";

/**
 * Bold site-wide ribbon shown above the header.
 * Uses the coral accent so it punches against the dark header and white body.
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
    <div className="relative w-full bg-gradient-to-r from-accent via-primary to-accent text-white shadow-[0_2px_12px_-2px_hsl(var(--primary)/0.5)] overflow-hidden">
      {/* subtle shimmer */}
      <div className="pointer-events-none absolute inset-0 opacity-20 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.6)_50%,transparent_70%)] bg-[length:200%_100%] animate-[shimmer_4s_linear_infinite]" />
      <div className="container relative py-2.5 flex items-center gap-3 text-xs sm:text-sm">
        <span className="hidden sm:inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur text-[10px] font-extrabold uppercase tracking-widest">
          <Sparkles className="size-3" strokeWidth={2.75} /> Early access
        </span>
        <p className="leading-tight flex-1 min-w-0 font-semibold">
          <span className="font-extrabold">First 500 pros lock in founding pricing forever.</span>{" "}
          <span className="opacity-90 hidden sm:inline">List your business today before spots run out.</span>
        </p>
        <a
          href="/list"
          className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white text-primary px-3 py-1 text-xs font-extrabold hover:bg-white/90 transition-colors"
        >
          Claim your spot <ArrowRight className="size-3" strokeWidth={3} />
        </a>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 size-6 rounded-md hover:bg-white/15 inline-flex items-center justify-center"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
};
