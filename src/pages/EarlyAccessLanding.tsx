import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { markEarlyAccessSeen } from "@/components/EarlyAccessGate";
import { SeoHead } from "@/components/SeoHead";
import sjohMascot from "@/assets/sjoh-mascot.png";
import sjohLogoWhite from "@/assets/sjoh-logo-white.png";

const PERKS = [
  { emoji: "🤝", title: "Direct contact", body: "No commission, no middleman. You talk straight to the pro." },
  { emoji: "✅", title: "Vetted Pros only", body: "Every Verified Pro is checked — ID, references, the lot." },
  { emoji: "💸", title: "Free to post", body: "Need a quote? Post it free. Boost it for R50 if it's urgent." },
  { emoji: "🇿🇦", title: "Proudly SA", body: "Built for South Africa, by South Africans. Plumbers to web devs." },
];

const EarlyAccessLanding = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) {
      toast({ title: "Tick the box, boet", description: "Agree to the Terms before joining.", variant: "destructive" });
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
    toast({ title: "You're in! 🎉", description: "Welcome to Sjoh. Check your email to confirm." });
    navigate("/", { replace: true });
  };

  const skipToBrowse = () => {
    markEarlyAccessSeen();
    navigate("/", { replace: true });
  };

  return (
    <div
      className="min-h-dvh w-full text-white relative overflow-hidden"
      style={{
        background:
          "radial-gradient(1200px 800px at 75% 15%, hsl(220 10% 20%) 0%, hsl(220 12% 11%) 45%, hsl(220 14% 6%) 100%)",
      }}
    >
      <SeoHead
        title="Sjoh — Early Access | Find someone who can do it properly"
        description="Join the Sjoh early access. South Africa's no-commission directory of vetted pros — from plumbers to web devs."
      />

      {/* faint coral vignette top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        style={{ background: "radial-gradient(600px 200px at 50% 0%, hsl(5 100% 74% / 0.10), transparent 70%)" }}
      />

      {/* Top bar */}
      <header className="relative border-b border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
          <img src={sjohLogoWhite} alt="Sjoh" className="h-8 sm:h-9 w-auto" />
          <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary font-bold uppercase tracking-widest border border-primary/20">
            Early Access
          </span>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-5 py-10 lg:py-16 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Pitch + mascot */}
        <section>
          <div className="inline-block text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-5 border border-primary/20">
            🇿🇦 Now in early access
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-white">
            Find someone who can do it{" "}
            <span className="text-primary">properly.</span>
          </h1>
          <p className="mt-5 text-lg text-white/70 max-w-lg">
            Sjoh is South Africa's no-commission directory of vetted pros — from plumbers and sparkies to web devs and designers. Sign up to get early access.
          </p>

          <ul className="mt-8 space-y-4">
            {PERKS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span className="text-2xl shrink-0">{p.emoji}</span>
                <div>
                  <div className="font-bold text-white">{p.title}</div>
                  <div className="text-sm text-white/65">{p.body}</div>
                </div>
              </li>
            ))}
          </ul>

          {/* Mascot below perks on desktop, hidden on mobile to save space */}
          <div className="hidden lg:flex justify-start mt-10">
            <img
              src={sjohMascot}
              alt="Sjoh mascot"
              className="w-[280px] xl:w-[340px] h-auto select-none drop-shadow-2xl"
              draggable={false}
            />
          </div>

          <div className="mt-6 lg:mt-8 hidden lg:flex items-center gap-3 text-xs text-white/60">
            <span>Already have an account?</span>
            <Link to="/login" className="font-bold text-primary hover:underline">Log in →</Link>
          </div>
        </section>

        {/* Signup card */}
        <section>
          {/* Mobile mascot above the card */}
          <div className="flex lg:hidden justify-center mb-6">
            <img
              src={sjohMascot}
              alt="Sjoh mascot"
              className="w-[200px] sm:w-[240px] h-auto select-none drop-shadow-2xl"
              draggable={false}
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm shadow-2xl p-6 sm:p-8">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-white">Pull in, boet.</h2>
            <p className="text-sm text-white/65 mt-1">Create an account to unlock Sjoh.</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-white/80">What does your Ma call you?</label>
                <input
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="First name + surname"
                  className="w-full rounded-lg border border-white/15 bg-white/5 text-white placeholder:text-white/35 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/40"
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
                  className="w-full rounded-lg border border-white/15 bg-white/5 text-white placeholder:text-white/35 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/40"
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
                  className="w-full rounded-lg border border-white/15 bg-white/5 text-white placeholder:text-white/35 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/40"
                />
              </div>

              <label className="flex items-start gap-2.5 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  required
                  className="mt-0.5 size-4 rounded border-white/30 text-primary focus:ring-primary cursor-pointer shrink-0"
                />
                <span className="text-white/65">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary font-semibold hover:underline">Terms</Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary font-semibold hover:underline">Privacy Policy</Link>.
                </span>
              </label>

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Creating account…" : "Get early access →"}
              </Button>

              <p className="text-center text-xs text-white/55">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link>
              </p>
            </form>
          </div>

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
