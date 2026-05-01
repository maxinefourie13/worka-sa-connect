import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { markEarlyAccessSeen } from "@/components/EarlyAccessGate";
import { SeoHead } from "@/components/SeoHead";

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
    <div className="min-h-dvh bg-background text-foreground">
      <SeoHead
        title="Sjoh — Early Access | Find someone who can do it properly"
        description="Join the Sjoh early access. South Africa's no-commission directory of vetted pros — from plumbers to web devs."
      />

      {/* Top bar */}
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
          <Link to="/" onClick={(e) => { e.preventDefault(); }} className="font-display text-2xl font-extrabold tracking-tight">
            Sjoh<span className="text-primary">.</span>
          </Link>
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-wider">
            Early Access
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 lg:py-16 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Pitch */}
        <section>
          <div className="inline-block text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-5">
            🇿🇦 Now in early access
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
            Find someone who can do it{" "}
            <span className="text-primary">properly.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-lg">
            Sjoh is South Africa's no-commission directory of vetted pros — from plumbers and sparkies to web devs and designers. Sign up to get early access.
          </p>

          <ul className="mt-8 space-y-4">
            {PERKS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span className="text-2xl shrink-0">{p.emoji}</span>
                <div>
                  <div className="font-bold">{p.title}</div>
                  <div className="text-sm text-muted-foreground">{p.body}</div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 hidden lg:flex items-center gap-3 text-xs text-muted-foreground">
            <span>Already have an account?</span>
            <Link to="/login" className="font-bold text-primary hover:underline">Log in →</Link>
          </div>
        </section>

        {/* Signup card */}
        <section>
          <div className="rounded-2xl border border-border bg-card shadow-elegant p-6 sm:p-8">
            <h2 className="font-display text-2xl font-extrabold tracking-tight">Pull in, boet.</h2>
            <p className="text-sm text-muted-foreground mt-1">Create an account to unlock Sjoh.</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5">What does your Ma call you?</label>
                <input
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="First name + surname"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.co.za"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <label className="flex items-start gap-2.5 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  required
                  className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary cursor-pointer shrink-0"
                />
                <span className="text-muted-foreground">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary font-semibold hover:underline">Terms</Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary font-semibold hover:underline">Privacy Policy</Link>.
                </span>
              </label>

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Creating account…" : "Get early access →"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link>
              </p>
            </form>
          </div>

          <button
            onClick={skipToBrowse}
            className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Just want to peek? Browse without signing up.
          </button>
        </section>
      </main>

      <footer className="border-t border-border/60 mt-10">
        <div className="mx-auto max-w-6xl px-5 py-6 text-xs text-muted-foreground flex flex-wrap gap-4 justify-between">
          <span>© {new Date().getFullYear()} Sjoh. Proudly South African.</span>
          <span className="flex gap-4">
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default EarlyAccessLanding;
