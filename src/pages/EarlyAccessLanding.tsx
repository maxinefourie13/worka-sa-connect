import { useNavigate } from "react-router-dom";
import { Typewriter } from "@/components/Typewriter";
import { markEarlyAccessSeen } from "@/components/EarlyAccessGate";
import { SeoHead } from "@/components/SeoHead";
import sjohMascot from "@/assets/sjoh-mascot.png";
import sjohLogoWhite from "@/assets/sjoh-logo-white.png";

const COOKIE_KEY = "sjoh_cookie_consent";

const TYPING_PHRASES = [
  "In the mood for a rusk?",
  "Tea's brewing, boet.",
  "Pull up a chair.",
  "Just one quick chat.",
];

type CookieChoice = "all" | "essential" | "decline";

const setCookieChoice = (choice: CookieChoice) => {
  try {
    localStorage.setItem(COOKIE_KEY, choice);
    localStorage.setItem(`${COOKIE_KEY}_at`, new Date().toISOString());
  } catch { /* ignore */ }
};

const EarlyAccessLanding = () => {
  const navigate = useNavigate();

  const handle = (choice: CookieChoice) => {
    setCookieChoice(choice);
    markEarlyAccessSeen();
    navigate("/", { replace: true });
  };

  return (
    <div
      className="min-h-dvh w-full text-white relative overflow-hidden"
      style={{
        background:
          "radial-gradient(1200px 800px at 70% 20%, hsl(220 10% 22%) 0%, hsl(220 12% 12%) 45%, hsl(220 14% 7%) 100%)",
      }}
    >
      <SeoHead
        title="Sjoh — In the mood for a rusk? ☕"
        description="South Africa's no-commission directory of vetted pros. Cookies help us keep things sharp."
      />

      {/* faint coral vignette top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        style={{ background: "radial-gradient(600px 200px at 50% 0%, hsl(5 100% 74% / 0.10), transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 py-8 lg:py-12 min-h-dvh flex flex-col">
        {/* Logo top */}
        <header className="flex items-center justify-between">
          <img src={sjohLogoWhite} alt="Sjoh" className="h-8 sm:h-10 w-auto" />
          <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 font-bold uppercase tracking-widest">
            Pre-launch
          </span>
        </header>

        <main className="flex-1 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center py-10 lg:py-0">
          {/* Mascot */}
          <div className="order-2 lg:order-1 flex justify-center lg:justify-start">
            <img
              src={sjohMascot}
              alt="Sjoh mascot"
              className="w-[280px] sm:w-[380px] md:w-[460px] lg:w-[520px] xl:w-[600px] h-auto select-none drop-shadow-2xl"
              draggable={false}
            />
          </div>

          {/* Copy + buttons */}
          <section className="order-1 lg:order-2 text-center lg:text-left">
            <h1 className="font-display font-extrabold tracking-tight leading-[1.05]">
              <span className="block text-white text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] min-h-[2.4em]">
                <Typewriter
                  phrases={TYPING_PHRASES}
                  reserveCurrentPhraseSpace
                  typingSpeed={50}
                  erasingSpeed={25}
                  holdDuration={2400}
                  accentClassName="text-primary"
                />
              </span>
              <span className="block text-primary text-4xl sm:text-5xl md:text-6xl lg:text-7xl mt-2">
                ☕
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-white/75 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              <span className="font-bold text-white">Sjoh!</span> We use digital cookies to make sure the site doesn't act like a mampara.
              They help us remember your city and keep your account secure—no crumbs, no mess.
              We promise we aren't here to sell your info to your nosy neighbour. Is it a "go" for the rusks?
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <button
                onClick={() => handle("all")}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Shot, dunk away ☕
              </button>
              <button
                onClick={() => handle("essential")}
                className="inline-flex items-center justify-center rounded-xl bg-white/10 border border-white/20 px-6 py-3 text-sm font-bold text-white hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Just the essentials
              </button>
              <button
                onClick={() => handle("decline")}
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold text-white/60 hover:text-white/90 hover:bg-white/5 transition-all duration-200"
              >
                No rusks for me
              </button>
            </div>

            <p className="mt-6 text-xs text-white/40">
              By continuing you agree to our{" "}
              <a href="/terms" className="underline hover:text-white/70">Terms</a>{" "}and{" "}
              <a href="/privacy" className="underline hover:text-white/70">Privacy Policy</a>.
            </p>
          </section>
        </main>

        <footer className="text-center text-xs text-white/40 pt-6">
          © {new Date().getFullYear()} Sjoh. Proudly South African.
        </footer>
      </div>
    </div>
  );
};

export default EarlyAccessLanding;
