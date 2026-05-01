import { useEffect, useState } from "react";

const COOKIE_KEY = "sjoh_cookie_consent";
const COOKIE_AT_KEY = "sjoh_cookie_consent_at";

type CookieChoice = "all" | "essential" | "decline";

const recordChoice = (choice: CookieChoice) => {
  try {
    localStorage.setItem(COOKIE_KEY, choice);
    localStorage.setItem(COOKIE_AT_KEY, new Date().toISOString());
  } catch { /* ignore */ }
};

export const CookieConsent = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const existing = localStorage.getItem(COOKIE_KEY);
      if (!existing) {
        // Small delay so it doesn't slam in during the first paint.
        const t = window.setTimeout(() => setOpen(true), 600);
        return () => window.clearTimeout(t);
      }
    } catch { /* ignore */ }
  }, []);

  const handle = (choice: CookieChoice) => {
    recordChoice(choice);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none"
    >
      <div className="mx-auto max-w-2xl pointer-events-auto rounded-2xl border border-white/10 bg-neutral-900/95 backdrop-blur-md text-white shadow-2xl p-5 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-start gap-3">
          <span aria-hidden className="text-2xl leading-none mt-0.5">☕</span>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-base sm:text-lg font-extrabold tracking-tight">
              In the mood for a rusk?
            </h2>
            <p className="mt-1.5 text-sm text-white/75 leading-relaxed">
              <span className="font-bold text-white">Sjoh!</span> We use digital cookies to make sure the site doesn't act like a mampara.
              They help us remember your city and keep your account secure—no crumbs, no mess.
              We promise we aren't here to sell your info to your nosy neighbour. Is it a "go" for the rusks?
            </p>

            <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-2">
              <button
                onClick={() => handle("all")}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
              >
                Shot, dunk away ☕
              </button>
              <button
                onClick={() => handle("essential")}
                className="inline-flex items-center justify-center rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-white/15 transition-all duration-150"
              >
                Just the essentials
              </button>
              <button
                onClick={() => handle("decline")}
                className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs sm:text-sm font-bold text-white/60 hover:text-white/90 hover:bg-white/5 transition-all duration-150"
              >
                No rusks for me
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
