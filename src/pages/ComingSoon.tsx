import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Check, Loader2, Flame, ArrowRight } from "lucide-react";
import mascot from "@/assets/sjoh-mascot-glow.png";
import sjohLogo from "@/assets/sjoh-logo-white.png";
import { Typewriter } from "@/components/Typewriter";
import { CATEGORIES, CATEGORY_GROUPS, PROVINCES } from "@/lib/mockData";

type Role = "pro" | "customer";

const HERO_PHRASES = [
  "hiring mamparas?",
  "ghosting tradies?",
  "half-done jobs?",
  "no-shows on Saturday?",
  "paying twice for one job?",
];

const PERKS: Record<Role, string[]> = {
  pro: [
    "2 months FREE on R50 On the Map listing (Founding Members only)",
    "Founding Member badge on your profile",
    "First-in-line for vetting & verification",
  ],
  customer: [
    "Free R50 Urgent Boost voucher (first 500 customers)",
    "First dibs on vetted pros in your area",
    "Post jobs free with your own budget — pros come to you",
  ],
};

type SpotCount = { role: string; claimed: number; cap: number; remaining: number };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const ComingSoonPage = () => {
  // Default to "pro" — filling 500 founding spots is the active goal
  const [role, setRole] = useState<Role>("pro");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [claimedFounding, setClaimedFounding] = useState<boolean | null>(null);
  const [spots, setSpots] = useState<Record<Role, SpotCount | null>>({
    pro: null,
    customer: null,
  });
  const navigate = useNavigate();

  // Customer fields (email-only flow)
  const [customerEmail, setCustomerEmail] = useState("");

  // Pro fields (full signup → onboarding)
  const [proBusinessName, setProBusinessName] = useState("");
  const [proEmail, setProEmail] = useState("");
  const [proPassword, setProPassword] = useState("");
  const [proProvince, setProProvince] = useState("");
  const [proCity, setProCity] = useState("");
  const [proCategorySlug, setProCategorySlug] = useState("");

  const refreshCounts = async () => {
    const { data } = await supabase.rpc("get_founding_spot_counts");
    if (data) {
      const next: Record<Role, SpotCount | null> = { pro: null, customer: null };
      for (const row of data as SpotCount[]) {
        if (row.role === "pro" || row.role === "customer") {
          next[row.role as Role] = row;
        }
      }
      setSpots(next);
    }
  };

  useEffect(() => {
    refreshCounts();
  }, []);

  const currentRemaining = spots[role]?.remaining ?? 500;
  const spotsGone = currentRemaining <= 0;

  // -------- Customer flow (email capture only) --------
  const onSubmitCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customerEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: "Eish, that email looks off", description: "Pop in a valid address and try again." });
      return;
    }
    setLoading(true);
    const signupId = crypto.randomUUID();
    const { error } = await supabase.from("early_access_signups").insert({
      id: signupId,
      email: trimmed,
      role: "customer",
      source: "coming-soon",
    });
    if (error) {
      setLoading(false);
      if (error.code === "23505") {
        setDone(true);
        toast({ title: "You're already on the list", description: "We'll be in touch when we launch." });
        return;
      }
      toast({ title: "Sjoh, something broke", description: error.message });
      return;
    }

    const { data: claimed } = await supabase.rpc("claim_founding_spot", { _signup_id: signupId });
    const gotSpot = claimed === true;
    setClaimedFounding(gotSpot);

    const templateName = gotSpot ? "early-access-customer" : "early-access-customer-waitlist";
    supabase.functions
      .invoke("send-transactional-email", {
        body: { templateName, recipientEmail: trimmed, idempotencyKey: `early-access-${signupId}` },
      })
      .catch((err) => console.warn("Welcome email queue failed", err));

    setLoading(false);
    setDone(true);
    refreshCounts();
    toast({
      title: gotSpot ? "You're a Founding Member 🎉" : "You're on the list",
      description: gotSpot
        ? "Check your inbox — your free R50 voucher is locked in."
        : "Founding spots are gone, but you're on the waitlist. Check your inbox.",
    });
  };

  // -------- Pro flow (full signup → onboarding) --------
  const onSubmitPro = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = proEmail.trim().toLowerCase();
    const name = proBusinessName.trim();

    if (!name) {
      toast({ title: "Business name?", description: "Tell us what to call your hustle." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Eish, that email looks off", description: "Pop in a valid address." });
      return;
    }
    if (proPassword.length < 8) {
      toast({ title: "Password too short", description: "At least 8 characters, boet." });
      return;
    }
    if (!proProvince || !proCity.trim() || !proCategorySlug) {
      toast({ title: "Almost there", description: "Pick your province, city and main service." });
      return;
    }

    setLoading(true);

    // 1. Create the auth account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: proPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { display_name: name },
      },
    });

    if (signUpError) {
      setLoading(false);
      toast({
        title: "Couldn't create your account",
        description: signUpError.message,
        variant: "destructive",
      });
      return;
    }

    // If email confirmation is on, signUpData.session will be null. We still
    // record the early-access signup + business so they can finish later.
    const userId = signUpData.user?.id;
    if (!userId) {
      setLoading(false);
      toast({
        title: "Almost there",
        description: "Couldn't read your new account. Try logging in once you've verified your email.",
        variant: "destructive",
      });
      return;
    }

    // 2. Record the early-access signup (best-effort, ignore duplicates)
    const signupId = crypto.randomUUID();
    await supabase.from("early_access_signups").insert({
      id: signupId,
      email,
      role: "pro",
      source: "coming-soon-pro-signup",
    });
    const { data: claimed } = await supabase.rpc("claim_founding_spot", { _signup_id: signupId });
    const gotSpot = claimed === true;
    setClaimedFounding(gotSpot);

    // 3. Create the pre-launch business shell
    const category = CATEGORIES.find((c) => c.slug === proCategorySlug);
    const slugBase = slugify(name);
    const slug = `${slugBase}-${userId.slice(0, 6)}`;

    const { error: bizError } = await supabase.from("businesses").insert({
      owner_id: userId,
      name,
      slug,
      email,
      city: proCity.trim(),
      province: proProvince,
      category_slug: proCategorySlug,
      category_name: category?.name ?? proCategorySlug,
      tags: [],
      // pre_launch defaults to true at the DB level — be explicit anyway
      pre_launch: true,
    });

    if (bizError) {
      setLoading(false);
      console.error("Business insert failed", bizError);
      toast({
        title: "Account created, but the listing didn't save",
        description: "Log in and finish setup from your dashboard.",
        variant: "destructive",
      });
      // We still navigate them somewhere useful
      if (signUpData.session) navigate("/dashboard");
      return;
    }

    // 4. Send the founding-pro welcome email (fire-and-forget)
    const templateName = gotSpot ? "early-access-pro" : "early-access-pro-waitlist";
    supabase.functions
      .invoke("send-transactional-email", {
        body: { templateName, recipientEmail: email, idempotencyKey: `early-access-${signupId}` },
      })
      .catch((err) => console.warn("Welcome email queue failed", err));

    setLoading(false);

    // 5. Either drop them straight into the dashboard (if email auto-confirm is on),
    //    or show a "verify your email" success state.
    if (signUpData.session) {
      toast({
        title: "Lekker — you're a Founding Pro 🎉",
        description: "Let's polish your profile while we wait for launch day.",
      });
      navigate("/dashboard");
    } else {
      setDone(true);
      toast({
        title: "Check your inbox to verify",
        description: "We've sent a verification link. Once you click it, log in to finish your profile.",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Sjoh! is launching soon — Tired of hiring mamparas?</title>
        <meta
          name="description"
          content="Sjoh.co.za is launching soon. South Africa's directory of vetted service pros. Sign up for early access — first 500 pros get 3 months free."
        />
        <link rel="canonical" href="https://sjoh.co.za/" />
      </Helmet>

      <div className="min-h-dvh text-white relative overflow-hidden bg-[radial-gradient(ellipse_at_top,#2a2a2e_0%,#141416_45%,#08080a_100%)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 size-[800px] rounded-full bg-primary/[0.06] blur-[160px]" />
        </div>

        <div className="relative container max-w-6xl py-10 md:py-14">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-[calc(100dvh-7rem)]">
            {/* Left — copy + form */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <h1 className="font-display font-extrabold tracking-tight leading-[0.95]">
                <img
                  src={sjohLogo}
                  alt="Sjoh!"
                  className="block h-20 sm:h-24 md:h-28 w-auto mx-auto lg:mx-0"
                />
                <span className="block text-white text-4xl sm:text-5xl md:text-6xl mt-5">
                  Tired of
                </span>
                <span className="block text-primary text-5xl sm:text-6xl md:text-7xl mt-2 min-h-[2.2em] leading-[1.1]">
                  <Typewriter
                    phrases={HERO_PHRASES}
                    typingSpeed={70}
                    erasingSpeed={35}
                    holdDuration={1800}
                    accentClassName="text-primary"
                    reserveCurrentPhraseSpace
                  />
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
                      setClaimedFounding(null);
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

              {/* Live founding-spot counter */}
              {spots[role] && (
                <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 border border-primary/30 text-sm font-semibold">
                  <Flame className="size-4 text-primary" strokeWidth={2.5} />
                  {spotsGone ? (
                    <span className="text-white/80">
                      Founding spots gone — waitlist still open
                    </span>
                  ) : (
                    <span className="text-white">
                      <span className="text-primary">{currentRemaining}</span>
                      <span className="text-white/70"> / 500 founding spots left</span>
                    </span>
                  )}
                </div>
              )}

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

              {/* ---- Form: Customer (email-only) or Pro (full signup) ---- */}
              {done ? (
                <div className="mt-8 p-5 rounded-2xl bg-primary/10 border border-primary/30 max-w-md mx-auto lg:mx-0 text-left">
                  {role === "pro" ? (
                    <>
                      <p className="font-semibold text-white">
                        Check your inbox to verify
                      </p>
                      <p className="text-sm text-white/70 mt-1">
                        We've sent a verification link. Once you click it, log in to
                        finish setting up your profile in Workshop Mode.
                      </p>
                    </>
                  ) : claimedFounding ? (
                    <>
                      <p className="font-semibold text-white">
                        Lekker — you're a Founding Member 🎉
                      </p>
                      <p className="text-sm text-white/70 mt-1">
                        Your free R50 Urgent Boost voucher is locked in. Check your
                        inbox — we'll send the code at launch.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-white">
                        You're on the waitlist.
                      </p>
                      <p className="text-sm text-white/70 mt-1">
                        Founding spots are gone, but you'll still be first in line
                        when we open to the public. Check your inbox.
                      </p>
                    </>
                  )}
                </div>
              ) : role === "customer" ? (
                <form
                  onSubmit={onSubmitCustomer}
                  className="mt-8 flex flex-col sm:flex-row gap-2 max-w-md mx-auto lg:mx-0"
                >
                  <Input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="your@email.co.za"
                    className="flex-1 h-12 bg-white/5 border-white/15 text-white placeholder:text-white/40 focus-visible:ring-primary"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="h-12 px-6 font-semibold"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : spotsGone ? "Join the waitlist" : "Claim my R50 voucher"}
                  </Button>
                </form>
              ) : (
                <form
                  onSubmit={onSubmitPro}
                  className="mt-8 grid gap-3 max-w-md mx-auto lg:mx-0 text-left"
                >
                  <Input
                    type="text"
                    required
                    maxLength={120}
                    value={proBusinessName}
                    onChange={(e) => setProBusinessName(e.target.value)}
                    placeholder="Business name"
                    className="h-12 bg-white/5 border-white/15 text-white placeholder:text-white/40 focus-visible:ring-primary"
                  />
                  <Input
                    type="email"
                    required
                    maxLength={255}
                    value={proEmail}
                    onChange={(e) => setProEmail(e.target.value)}
                    placeholder="your@email.co.za"
                    className="h-12 bg-white/5 border-white/15 text-white placeholder:text-white/40 focus-visible:ring-primary"
                  />
                  <Input
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    value={proPassword}
                    onChange={(e) => setProPassword(e.target.value)}
                    placeholder="Password (8+ characters)"
                    className="h-12 bg-white/5 border-white/15 text-white placeholder:text-white/40 focus-visible:ring-primary"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      required
                      value={proProvince}
                      onChange={(e) => setProProvince(e.target.value)}
                      className="h-12 px-3 rounded-md bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="" className="bg-neutral-900">Province</option>
                      {PROVINCES.map((p) => (
                        <option key={p} value={p} className="bg-neutral-900">{p}</option>
                      ))}
                    </select>
                    <Input
                      type="text"
                      required
                      maxLength={80}
                      value={proCity}
                      onChange={(e) => setProCity(e.target.value)}
                      placeholder="City / suburb"
                      className="h-12 bg-white/5 border-white/15 text-white placeholder:text-white/40 focus-visible:ring-primary"
                    />
                  </div>
                  <select
                    required
                    value={proCategorySlug}
                    onChange={(e) => setProCategorySlug(e.target.value)}
                    className="h-12 px-3 rounded-md bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" className="bg-neutral-900">Main service you offer</option>
                    {CATEGORY_GROUPS.map((g) => (
                      <optgroup key={g.slug} label={`${g.emoji} ${g.name}`} className="bg-neutral-900">
                        {CATEGORIES.filter((c) => c.groupSlug === g.slug).map((c) => (
                          <option key={c.slug} value={c.slug} className="bg-neutral-900">{c.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="h-12 px-6 font-semibold mt-1"
                  >
                    {loading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        {spotsGone ? "Join the waitlist" : "Claim my Founding Pro spot"}
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-white/50 text-center mt-1">
                    Already signed up? <a href="/login" className="text-primary font-semibold hover:underline">Log in</a>
                  </p>
                </form>
              )}

              <p className="mt-3 text-xs text-white/50 max-w-md mx-auto lg:mx-0 leading-relaxed">
                By signing up you're opting in to launch news and the occasional promo from Sjoh — and Founding Members score bonus perks. No spam, unsubscribe anytime.
              </p>
            </div>

            {/* Right — mascot */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <img
                src={mascot}
                alt="Sjoh mascot — a French bulldog in a coral Sjoh hoodie"
                className="w-[360px] sm:w-[460px] md:w-[560px] lg:w-[640px] xl:w-[720px] h-auto"
                loading="eager"
              />
            </div>
          </div>

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
