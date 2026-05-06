import { useNavigate } from "react-router-dom";
import { Check, Siren, Sparkles, Zap } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SJOH_TIERS, formatRand } from "@/lib/mockData";
import { payments } from "@/lib/payments";
import { useAuth } from "@/hooks/useAuth";

const FAQS = [
  {
    q: "How does the free trial work?",
    a: "Sign up, complete your profile, and you get 30 days free — no card, no upfront commitment. Founding members get an extended 2-month trial. After your trial it's R250/month, or R150/month locked in forever for the first 500 founding members.",
  },
  {
    q: "Do you take commission on the work I do?",
    a: "Never. Sjoh is a directory — payments happen directly between you and your customer. We don't touch your money, your invoice, or your quote. 0% commission means 0% commission.",
  },
  {
    q: "What does the Coral Checkmark actually mean?",
    a: "It means your SA ID has been verified by a third-party identity service. Customers know you are who you say you are. It's a once-off verification — no recurring cost.",
  },
  {
    q: "Why do I need to verify my ID to get the Checkmark?",
    a: "Because customers are letting strangers into their homes. The Checkmark tells them you've been ID-verified, not just self-registered. It costs a small once-off fee to cover our verification provider — and it sets you apart from every unverified competitor on other platforms.",
  },
  {
    q: "What is the Eish! Urgent Boost?",
    a: "Posting a job is always free for customers. If it's a real emergency — burst geyser, locked out, no power — they can boost their job to Eish! Urgent for R50. It pins to the top of the feed for 72 hours, gets a flashing coral border, and pings every Verified Pro within 10km on WhatsApp.",
  },
  {
    q: "What is Sjoh's Law?",
    a: "Three strikes and you're out. Flake on a job, do dangerous work, or refuse to pay for completed work — that's a strike. Three strikes and your ID is permanently banned from the platform.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes. Cancel from your dashboard whenever you want. No contracts, no cancellation fees, no hard feelings. Your listing stays active until the end of your billing period.",
  },
  {
    q: "I already have a good reputation. Why do I need Sjoh?",
    a: "Because your reputation is currently stuck in your phone. Sjoh gives it a home — a verified, portable profile with real reviews, a Trust Index, and a Coral Checkmark that follows you everywhere. Stop being 'a guy in a WhatsApp group' and start being a professional.",
  },
];

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const tier = SJOH_TIERS[0];

  const handleStart = () => {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent("/pricing")}`);
      return;
    }
    payments.startSubscription("verified_pro", "monthly");
  };

  return (
    <SiteLayout>
      <div className="container py-16 md:py-20">

        <header className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Simple pricing</span>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mt-3 text-balance">
            One plan. Everything included.
          </h1>
          <p className="mt-4 text-lg text-ink-2">
            No tiers. No upsells. No commission. Just a small monthly fee
            to get your business properly in front of the right people.
          </p>
        </header>

        <div className="max-w-xl mx-auto">
          <div className="relative bg-card border-2 border-primary rounded-3xl p-8 md:p-10 shadow-pop">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full animate-soft-bob">
              30-day free trial — no card needed
            </span>

            <div className="mt-2 mb-6">
              <h2 className="font-display text-3xl font-bold">{tier.name}</h2>
              <p className="text-ink-2 mt-2">{tier.blurb}</p>
            </div>

            <div className="pb-7 border-b border-border">
              <div className="flex items-end gap-1">
                <span className="font-display text-6xl font-medium tracking-tight">
                  {formatRand(tier.price)}
                </span>
                <span className="text-muted-foreground mb-2 text-base">/month</span>
              </div>
              <p className="mt-2 text-sm text-ink-2">After your 30-day free trial. Cancel anytime.</p>
            </div>

            <ul className="mt-7 space-y-3.5">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <Check className="size-4 text-primary mt-0.5 shrink-0" strokeWidth={3} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Button size="lg" className="w-full mt-8 text-base font-bold h-14" onClick={handleStart}>
              Start your free 30 days
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              No card required to start. You choose when you're ready to pay.
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-accent/40 bg-accent/5 p-5 flex items-start gap-3">
            <Sparkles className="size-5 text-accent shrink-0 mt-0.5" strokeWidth={2.5} />
            <div className="text-sm">
              <p className="font-bold text-foreground">
                Founding Member pricing — {formatRand(tier.founderPrice!)}/month, locked forever.
              </p>
              <p className="text-ink-2 mt-1">
                The first 500 pros who join get our founder rate of R150/month — never increases,
                even when the price does. Plus your Coral Checkmark verification is on us.{" "}
                <span className="font-semibold text-foreground">Don't let someone else take your spot.</span>
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mt-16 rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 md:p-8 flex items-start gap-5 hover:border-primary hover:shadow-pop transition-all duration-300">
          <span className="size-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-display font-extrabold text-xl animate-pulse-ring">
            0%
          </span>
          <div>
            <p className="font-display font-extrabold tracking-tight text-lg text-foreground">
              You keep every cent you earn.
            </p>
            <p className="text-ink-2 mt-2 text-sm md:text-base">
              Your R250/month covers unlimited quotes, your full directory listing, and every feature
              in the platform. We don't take a cut of your invoice, charge per message, or touch your
              Paystack payouts. Clients pay you directly — always.
            </p>
          </div>
        </div>

        <section className="mt-14 max-w-3xl mx-auto rounded-2xl p-8 md:p-10 bg-foreground text-background">
          <div className="flex items-start gap-4">
            <span className="size-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0">
              <Siren className="size-6" strokeWidth={2.5} />
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent">For customers</span>
              <h2 className="font-display text-2xl md:text-3xl font-medium tracking-tight mt-1">
                Eish! Urgent — R50 SOS
              </h2>
              <p className="mt-2 text-background/85 text-sm md:text-base">
                Burst geyser at 9pm? Locked out in your PJs? Customers can boost a job to{" "}
                <strong>Eish! Urgent</strong> for R50 — we WhatsApp every Verified Pro within 10km,
                pin it to the top of the feed for 72 hours, and slap a flashing coral border on it. Sorted.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-14 max-w-3xl mx-auto grid sm:grid-cols-3 gap-4 text-center">
          {[
            { icon: <Zap className="size-5" />, title: "No hidden fees", body: "R250/month is all you pay. No setup fee, no listing fee, no per-quote charge." },
            { icon: <Check className="size-5" />, title: "Cancel anytime", body: "Month-to-month. No contracts. Stop whenever you like — no penalty." },
            { icon: <Sparkles className="size-5" />, title: "Built for SA", body: "ZAR pricing, SA ID verification, WhatsApp-first comms. Made here, for here." },
          ].map((s) => (
            <div key={s.title} className="bg-card border border-border rounded-xl p-5">
              <span className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                {s.icon}
              </span>
              <p className="font-semibold text-sm">{s.title}</p>
              <p className="text-xs text-ink-2 mt-1.5 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-24 max-w-2xl mx-auto">
          <h2 className="font-display text-3xl font-medium tracking-tight text-center mb-10">
            Frequently asked
          </h2>
          <Accordion type="single" collapsible className="bg-card border border-border rounded-2xl overflow-hidden">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`f-${i}`} className="border-b border-border last:border-0 px-5">
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-ink-2 pb-5">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-20 text-center">
          <p className="text-ink-2 text-sm mb-4">Ready to stop being a secret?</p>
          <Button size="lg" className="text-base font-bold px-10 h-14" onClick={handleStart}>
            Start your free 30 days — no card needed
          </Button>
        </div>

      </div>
    </SiteLayout>
  );
};

export default Pricing;
