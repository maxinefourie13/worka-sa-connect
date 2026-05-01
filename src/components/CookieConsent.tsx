import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";

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
        const t = window.setTimeout(() => setOpen(true), 600);
        return () => window.clearTimeout(t);
      }
    } catch { /* ignore */ }
  }, []);

  // Body scroll lock while open — makes it feel like a real prompt.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const handle = (choice: CookieChoice) => {
    recordChoice(choice);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      aria-label="Cookie preferences"
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6"
    >
      {/* Dimming overlay */}
      <div
        aria-hidden
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] animate-in fade-in duration-300"
      />

      {/* Coral attention card */}
      <div
        className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl text-white p-6 sm:p-7 ring-1 ring-white/25 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        style={{
          background:
            "linear-gradient(135deg, hsl(5 100% 70%) 0%, hsl(5 80% 58%) 100%)",
          boxShadow:
            "0 25px 60px -15px hsl(5 100% 55% / 0.55), 0 10px 30px -10px hsl(5 80% 40% / 0.4)",
        }}
      >
        {/* Floating cookie chip */}
        <div className="absolute -top-5 left-6 sm:left-7 size-12 rounded-full bg-white text-primary flex items-center justify-center shadow-lg ring-1 ring-black/5 -rotate-12">
          <Cookie className="size-6" strokeWidth={2.25} aria-hidden />
        </div>

        <div className="pt-4">
          <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            In the mood for a rusk?
          </h2>
          <p className="mt-2 text-sm sm:text-[15px] text-white/95 leading-relaxed">
            <span className="font-extrabold">Sjoh!</span> We use digital cookies to make sure the site doesn't act like a mampara.
            They help us remember your city and keep your account secure—no crumbs, no mess.
            We promise we aren't here to sell your info to your nosy neighbour. Is it a "go" for the rusks?
          </p>

          <div className="mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-2.5">
            <button
              onClick={() => handle("all")}
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-extrabold text-primary shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
            >
              Shot, dunk away
            </button>
            <button
              onClick={() => handle("essential")}
              className="inline-flex items-center justify-center rounded-full border border-white/50 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-all duration-150"
            >
              Just the essentials
            </button>
            <button
              onClick={() => handle("decline")}
              className="inline-flex items-center justify-center px-3 py-2.5 text-sm font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline transition"
            >
              No rusks for me
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
