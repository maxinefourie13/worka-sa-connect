import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

const STORAGE_KEY = "sjoh_early_access_dismissed_v1";

/**
 * Slim site-wide ribbon shown above the header.
 * Communicates that Sjoh is in early access and points pros at the founding offer.
 * Dismiss persists per browser.
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
    <div className="w-full bg-foreground text-background">
      <div className="container py-2 flex items-center gap-3 text-xs sm:text-sm">
        <Sparkles className="size-3.5 sm:size-4 shrink-0 text-accent" strokeWidth={2.5} />
        <p className="leading-tight flex-1 min-w-0">
          <span className="font-bold">Sjoh is in early access.</span>{" "}
          <span className="opacity-85">
            First 500 pros lock in founding-member pricing forever. List your business today —
          </span>{" "}
          <a href="/list" className="font-bold text-accent hover:underline">claim your spot →</a>
        </p>
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
