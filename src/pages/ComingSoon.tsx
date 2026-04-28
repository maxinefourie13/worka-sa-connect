import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Check, Loader2 } from "lucide-react";
import mascot from "@/assets/sjoh-mascot.png";

type Role = "pro" | "customer";

const PERKS: Record<Role, string[]> = {
  pro: [
    "Extra month free on top of your 30-day trial",
    "Founding Pro badge on your profile",
    "First-in-line for vetting & verification",
  ],
  customer: [
    "Early access before public launch",
    "R100 off your first booked job",
    "First dibs on vetted pros in your area",
  ],
};

const ComingSoonPage = () => {
  const [role, setRole] = useState<Role>("pro");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: "Eish, that email looks off", description: "Pop in a valid address and try again." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("early_access_signups").insert({
      email: trimmed,
      role,
      source: "coming-soon",
    });
    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        setDone(true);
        toast({ title: "You're already on the list", description: "We'll be in touch when we launch." });
        return;
      }
      toast({ title: "Sjoh, something broke", description: error.message });
      return;
    }
    setDone(true);
    toast({
      title: "You're in",
      description:
        role === "pro"
          ? "We'll email you when the doors open — extra free month locked in."
          : "We'll let you know the moment we launch.",
    });
  };

  return (
    <>
      <Helmet>
        <title>Sjoh! is launching soon — Tired of hiring mamparas?</title>
        <meta
          name="description"
          content="Sjoh.co.za is launching soon. South Africa's directory of vetted service pros. Sign up for early access — pros get an extra free month, customers get R100 off."
        />
        <link rel="canonical" href="https://sjoh.co.za/" />
      </Helmet>

      <div className="min-h-dvh bg-[#0a0a0a] text-white relative overflow-hidden">
        {/* Subtle coral glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[680px] rounded-full bg-primary/15 blur-[140px]" />
        </div>

        <div className="relative container max-w-6xl py-10 md:py-14">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-[calc(100dvh-7rem)]">
            {/* Left — copy + form */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <h1 className="font-display font-extrabold tracking-tight leading-[0.95]">
                <span className="block text-white text-4xl sm:text-5xl md:text-6xl">
                  Tired of hiring
                </span>
                <span className="block text-primary text-6xl sm:text-7xl md:text-8xl mt-1">
                  mamparas?
                </span>
              </h1>

              <p className="mt-6 text-base md:text-lg text-white/70 max-w-lg mx-auto lg:mx-0">
                Sjoh.co.za is launching soon — South Africa's home for vetted service pros.
                No ghosters. No half-jobs. Just people who actually do the graft.
              </p>

              {/* Role toggle */}
              <div className="mt-8 inline-flex p-1 rounded-full bg-white/5 border border-white/10">
                {(["pro", "customer"] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setDone(false);
                    }}
                    className={`px-5 py-2 text-sm font-semibold rounded-full transition-all ${
                      role === r
                        ? "bg-primary text-primary-foreground shadow-pop"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {r === "pro" ? "I'm a Pro" : "I need a Pro"}
                  </button>
                ))}
              </div>

              {/* Perks */}
              <ul className="mt-6 space-y-2.5 text-sm md:text-base text-white/80 max-w-md mx-auto lg:mx-0">
                {PERKS[role].map((p) => (
                  <li key={p} className="flex items-start gap-3">
                    <span className="mt-0.5 size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              {/* Form */}
              {done ? (
                <div className="mt-8 p-5 rounded-2xl bg-primary/10 border border-primary/30 max-w-md mx-auto lg:mx-0">
                  <p className="font-semibold text-white">You're on the list.</p>
                  <p className="text-sm text-white/70 mt-1">
                    Keep an eye on your inbox — we'll holla the moment we launch.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={onSubmit}
                  className="mt-8 flex flex-col sm:flex-row gap-2 max-w-md mx-auto lg:mx-0"
                >
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.co.za"
                    className="flex-1 h-12 bg-white/5 border-white/15 text-white placeholder:text-white/40 focus-visible:ring-primary"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="h-12 px-6 font-semibold"
                  >
                    {loading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : role === "pro" ? (
                      "Claim my free month"
                    ) : (
                      "Get early access"
                    )}
                  </Button>
                </form>
              )}

              <p className="mt-3 text-xs text-white/40 max-w-md mx-auto lg:mx-0">
                One email when we launch. No spam, no nonsense.
              </p>
            </div>

            {/* Right — mascot */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full scale-75" />
                <img
                  src={mascot}
                  alt="Sjoh mascot — a French bulldog in a coral Sjoh hoodie"
                  className="relative w-[280px] sm:w-[360px] md:w-[440px] lg:w-[500px] h-auto drop-shadow-2xl"
                  loading="eager"
                />
              </div>
            </div>
          </div>

          {/* Footer wordmark */}
          <div className="relative mt-10 text-center">
            <p className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              sjoh<span className="text-primary">.</span>co<span className="text-primary">.</span>za
            </p>
            <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">
              Launching soon
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ComingSoonPage;
