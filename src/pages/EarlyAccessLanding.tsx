import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { markEarlyAccessSeen } from "@/components/EarlyAccessGate";
import { SeoHead } from "@/components/SeoHead";
import { Typewriter } from "@/components/Typewriter";
import { FoundingSpotsBanner } from "@/components/FoundingSpotsBanner";
import sjohMascot from "@/assets/sjoh-mascot-hoodie.png";
import sjohLogoWhite from "@/assets/sjoh-logo-white.png";
import { Award, Gift, Handshake, ShieldCheck, Hammer, Search } from "lucide-react";

type Mode = "pro" | "customer";

const HERO_PHRASES = [
  "Tired of hiring mamparas?",
  "Sick of ghost-quotes?",
  "Got skills to sell?",
  "Need leads, not lurkers?",
  "Done with no-shows?",
  "Ready to get found, boet?",
];

const PERKS = [
  { Icon: Award, title: "Founder badge", body: "First 500 in get a permanent Founder badge on your profile. Forever." },
  { Icon: Gift, title: "Extra month free", body: "Founders get a bonus month on top of the regular trial. No card now." },
  { Icon: Handshake, title: "Direct contact", body: "No commission, no middleman. You talk straight to the pro." },
  { Icon: ShieldCheck, title: "Vetted Pros only", body: "Every Verified Pro is checked — ID, references, the lot." },
];

const EarlyAccessLanding = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("pro");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const goBrowse = () => {
    markEarlyAccessSeen();
    navigate("/directory");
  };

  const goPostJob = () => {
    markEarlyAccessSeen();
    navigate("/requests/new");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) {
      toast({ title: "Tick the box, boet", description: "Agree to the Terms before claiming your spot.", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName },
      },
    });
    setSubmitting(false);

    if (error) {
      toast({ title: "Couldn't create account", description: error.message, variant: "destructive" });
      return;
    }

    markEarlyAccessSeen();
    toast({ title: "Founding spot locked in", description: "Welcome to Sjoh. Check your email to confirm." });
    navigate("/", { replace: true });
  };

  const skipToBrowse = () => {
    markEarlyAccessSeen();
    navigate("/", { replace: true });
  };

  return (
    <div
      className="min-h-dvh w-full text-white relative overflow-hidden"
      style={{ background: "#050505" }}
    >
      <SeoHead
        title="Sjoh — Claim your founding spot | Find someone who can do it properly"
        description="Join Sjoh as a founding member. South Africa's no-commission directory of vetted pros. First 500 get a Founder badge + extra month free. No card needed."
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Top bar */}
      <header className="relative border-b border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
          <img src={sjohLogoWhite} alt="Sjoh" className="h-8 sm:h-9 w-auto" />
          <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full bg-sa-gold text-sa-dark font-bold uppercase tracking-widest border border-sa-gold">
            Founding members open
          </span>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-5 py-10 lg:py-16 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Pitch + mascot */}
        <section>
          {/* Typewriter eyebrow */}
          <div className="mb-5 text-sm sm:text-base font-bold uppercase tracking-widest text-sa-pink min-h-[1.5em]">
            <Typewriter
              phrases={HERO_PHRASES}
              randomize
              accentClassName="text-sa-gold"
              className="inline"
            />
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-white">
            Find someone who can do it{" "}
            <span className="text-sa-gold">properly.</span>
          </h1>
          <p className="mt-5 text-lg text-white/75 max-w-lg">
            South Africa's no-commission directory of vetted pros. We're letting in the{" "}
            <strong className="text-white">first 500 founding members</strong> — claim a permanent{" "}
            <strong className="text-white">Founder badge</strong> and an{" "}
            <strong className="text-white">extra month free</strong> on top of the trial.{" "}
            <span className="text-sa-gold font-bold">No card needed now.</span>
          </p>

          <div className="mt-5">
            <FoundingSpotsBanner />
          </div>

          <ul className="mt-8 space-y-4">
            {PERKS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span className="shrink-0 size-10 rounded-full bg-sa-gold/15 text-sa-gold flex items-center justify-center ring-1 ring-sa-gold/25">
                  <p.Icon className="size-5" strokeWidth={2.25} aria-hidden />
                </span>
                <div className="pt-1">
                  <div className="font-bold text-white">{p.title}</div>
                  <div className="text-sm text-white/65">{p.body}</div>
                </div>
              </li>
            ))}
          </ul>

          {/* Mascot below perks (md+), hidden on small screens — mobile version sits above signup card */}
          <div className="hidden md:flex justify-center lg:justify-start mt-10">
            <div
              className="relative"
              style={{ background: "radial-gradient(closest-side, hsl(43 100% 55% / 0.35), transparent 70%)" }}
            >
              <img
                src={sjohMascot}
                alt="Sjoh mascot — French bulldog in a coral hoodie"
                className="w-[420px] xl:w-[520px] h-auto select-none drop-shadow-2xl"
                draggable={false}
              />
            </div>
          </div>

          <div className="mt-6 lg:mt-8 hidden lg:flex items-center gap-3 text-xs text-white/60">
            <span>Already have an account?</span>
            <Link to="/login" className="font-bold text-sa-gold hover:underline">Log in →</Link>
          </div>
        </section>

        {/* Signup card */}
        <section>
          {/* Mobile-only mascot above the card (md+ shows it under perks) */}
          <div className="flex md:hidden justify-center mb-6">
            <div
              className="relative"
              style={{ background: "radial-gradient(closest-side, hsl(43 100% 55% / 0.35), transparent 70%)" }}
            >
              <img
                src={sjohMascot}
                alt="Sjoh mascot — French bulldog in a coral hoodie"
                className="w-[280px] sm:w-[340px] h-auto select-none drop-shadow-2xl"
                draggable={false}
              />
            </div>
          </div>

          {/* Mode chooser — Pro vs Customer */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <button
              type="button"
              onClick={() => setMode("pro")}
              className={`text-left rounded-xl border p-3.5 transition-all ${
                mode === "pro"
                  ? "border-sa-gold bg-sa-gold/15 ring-2 ring-sa-gold/40"
                  : "border-white/15 bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
              aria-pressed={mode === "pro"}
            >
              <div className="flex items-center gap-2">
                <span className={`size-7 rounded-lg flex items-center justify-center ${
                  mode === "pro" ? "bg-sa-gold text-sa-dark" : "bg-white/10 text-white/70"
                }`}>
                  <Hammer className="size-3.5" strokeWidth={2.5} />
                </span>
                <span className="font-bold text-sm text-white">I'm a Pro</span>
              </div>
              <p className="text-[11px] text-white/60 mt-1.5 leading-snug">
                Get leads. No commission. Founding badge.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setMode("customer")}
              className={`text-left rounded-xl border p-3.5 transition-all ${
                mode === "customer"
                  ? "border-sa-gold bg-sa-gold/15 ring-2 ring-sa-gold/40"
                  : "border-white/15 bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
              aria-pressed={mode === "customer"}
            >
              <div className="flex items-center gap-2">
                <span className={`size-7 rounded-lg flex items-center justify-center ${
                  mode === "customer" ? "bg-sa-gold text-sa-dark" : "bg-white/10 text-white/70"
                }`}>
                  <Search className="size-3.5" strokeWidth={2.5} />
                </span>
                <span className="font-bold text-sm text-white">I need a Pro</span>
              </div>
              <p className="text-[11px] text-white/60 mt-1.5 leading-snug">
                Find someone vetted. No middleman.
              </p>
            </button>
          </div>

          {mode === "pro" ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm shadow-2xl p-6 sm:p-8">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-white">Claim your founding spot</h2>
              <p className="text-sm text-white/70 mt-1">
                500 founding members only. Founder badge + extra month free. No card now — just your details.
              </p>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-white/80">What does your Ma call you?</label>
                  <input
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="First name + surname"
                    className="w-full rounded-lg border border-white/15 bg-white/5 text-white placeholder:text-white/35 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sa-gold/50 focus:border-sa-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-white/80">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@business.co.za"
                    className="w-full rounded-lg border border-white/15 bg-white/5 text-white placeholder:text-white/35 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sa-gold/50 focus:border-sa-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-white/80">Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-lg border border-white/15 bg-white/5 text-white placeholder:text-white/35 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sa-gold/50 focus:border-sa-gold/50"
                  />
                </div>

                <label className="flex items-start gap-2.5 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    required
                    className="mt-0.5 size-4 rounded border-white/30 text-sa-gold focus:ring-sa-gold cursor-pointer shrink-0"
                  />
                  <span className="text-white/65">
                    I agree to the{" "}
                    <Link to="/terms" className="text-sa-gold font-semibold hover:underline">Terms</Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-sa-gold font-semibold hover:underline">Privacy Policy</Link>.
                  </span>
                </label>

                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? "Locking in your spot…" : "Claim my founding spot →"}
                </Button>

                <p className="text-center text-[11px] text-white/55 leading-relaxed">
                  No card. No commitment. We'll only nudge you when we open the doors.
                </p>

                <p className="text-center text-xs text-white/55">
                  Already have an account?{" "}
                  <Link to="/login" className="text-sa-gold font-semibold hover:underline">Log in</Link>
                </p>
              </form>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm shadow-2xl p-6 sm:p-8">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-white">
                Find someone who can do it properly.
              </h2>
              <p className="text-sm text-white/70 mt-2 leading-relaxed">
                No signup needed. Browse vetted SA pros and contact them direct — no commission, no middleman, no chancer.
              </p>

              <ul className="mt-5 space-y-2.5 text-sm text-white/75">
                <li className="flex gap-2.5">
                  <span className="text-sa-gold mt-0.5">→</span>
                  Real reviews, real pros across all nine provinces.
                </li>
                <li className="flex gap-2.5">
                  <span className="text-sa-gold mt-0.5">→</span>
                  Tap, reveal contact, and sort it out yourself.
                </li>
                <li className="flex gap-2.5">
                  <span className="text-sa-gold mt-0.5">→</span>
                  Free to use. Always.
                </li>
              </ul>

              <Button onClick={goBrowse} size="lg" className="w-full mt-6">
                Browse the directory →
              </Button>

              <div className="mt-4 pt-4 border-t border-white/10 text-center">
                <p className="text-xs text-white/60">
                  Want pros to quote you instead?
                </p>
                <button
                  onClick={goPostJob}
                  className="mt-1.5 text-sm font-bold text-sa-gold hover:underline"
                >
                  Post a request →
                </button>
              </div>
            </div>
          )}

          <button
            onClick={skipToBrowse}
            className="mt-4 w-full text-center text-xs text-white/45 hover:text-white/80 underline-offset-4 hover:underline"
          >
            Just want to peek? Browse without signing up.
          </button>
        </section>
      </main>

      <footer className="relative border-t border-white/10 mt-10">
        <div className="mx-auto max-w-6xl px-5 py-6 text-xs text-white/45 flex flex-wrap gap-4 justify-between">
          <span>© {new Date().getFullYear()} Sjoh. Proudly South African.</span>
          <span className="flex gap-4">
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default EarlyAccessLanding;
