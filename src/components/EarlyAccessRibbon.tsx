import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "sjoh_early_access_dismissed_v1";

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
    <div className="w-full border-b border-white/10 bg-[#0b0b0b] text-white">
      <div className="container flex items-center gap-4 py-2 text-xs sm:text-sm">
        <p className="min-w-0 flex-1 truncate leading-tight text-white/64">
          <span className="mr-2 font-black uppercase tracking-[0.18em] text-sa-gold">Early access</span>
          <span className="font-semibold text-white">Sjoh is still onboarding pros.</span>{" "}
          <span className="hidden text-white/58 sm:inline">Some categories may be quiet while founding businesses join.</span>
        </p>
        <a
          href="/list"
          className="shrink-0 text-xs font-black text-sa-gold underline-offset-4 hover:text-white hover:underline"
        >
          List your business
        </a>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-white/45 transition hover:bg-white/10 hover:text-white"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
};
