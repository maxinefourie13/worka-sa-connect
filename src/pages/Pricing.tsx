import { Link } from "react-router-dom";
import { Check, Zap, Siren } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SJOH_TIERS, KLAP_PACKS, formatRand } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const FAQS = [
  { q: "What are Klaps?", a: "A Klap is one job pitch. Every time you want to bid on a job posted on Sjoh, it costs 1 Klap. Each tier comes with a monthly Klap allowance, and you can top up anytime with a Six-Pack or a Crate." },
  { q: "How does the Dala Trial work?", a: "All new providers get 3 months free with 5 Klaps a month — enough to land your first job. No card required to start." },
  { q: "What happens if I run out of Klaps?", a: "You'll see a top-up prompt next time you try to Klap a job. Buy a Six-Pack (R50 = 10 Klaps) or a Crate (R150 = 40 Klaps) and keep grafting." },
  { q: "Do you take commission on the work I do?", a: "Never. Sjoh is a directory and a bidding platform — payments happen directly between you and your client. We don't touch your money." },
  { q: "What is Sjoh's Law?", a: "Three strikes and you're out. Flake on a job, do dangerous work, or refuse to pay for completed work — that's a strike. Three strikes and your ID is permanently banned. Zero pampoens allowed." },
  { q: "Can I cancel any time?", a: "Yes. Cancel or downgrade from your dashboard. No contracts, no cancellation fees." },
];

const Pricing = () => {
  return (
    <SiteLayout>
      <div className="container py-16 md:py-20">
        <header className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Provider plans</span>
          <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight mt-3 text-balance">
            No commission. Just Klaps.
          </h1>
          <p className="mt-4 text-lg text-ink-2">
            Pay a small monthly fee, get Klaps to bid on jobs, keep 100% of what you earn.
          </p>
        </header>

        {/* Tiers */}
        <div className="grid lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {SJOH_TIERS.map((t) => (
            <div
              key={t.slug}
              className={cn(
                "relative bg-card border rounded-2xl p-7 flex flex-col",
                t.popular
                  ? "border-primary shadow-pop lg:scale-[1.03]"
                  : t.featured
                  ? "border-foreground shadow-pop"
                  : "border-border shadow-card",
              )}
            >
              {t.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Most popular
                </span>
              )}
              {t.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  For the main okes
                </span>
              )}
              <h3 className="font-display text-2xl font-semibold">{t.name}</h3>
              <p className="text-sm text-ink-2 mt-1">{t.blurb}</p>
              <div className="mt-6 pb-6 border-b border-border">
                <span className="font-display text-5xl font-medium tracking-tight">
                  {t.price === 0 ? "R 0" : formatRand(t.price)}
                </span>
                <span className="text-sm text-muted-foreground"> {t.period}</span>
              </div>
              <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-accent">
                <Zap className="size-4" strokeWidth={2.5} />
                <span className="tabular-nums">{t.klapsPerMonth} Klaps</span>
                <span className="text-muted-foreground font-normal">per month</span>
              </div>
              <ul className="mt-5 space-y-3 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="size-4 text-primary mt-0.5 shrink-0" strokeWidth={3} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={t.popular ? "default" : t.featured ? "ink" : "outline"}
                size="lg"
                className="mt-7"
                asChild
              >
                <Link to="/list">
                  {t.slug === "dala-trial" ? "Start free for 3 months" : `Choose ${t.name}`}
                </Link>
              </Button>
            </div>
          ))}
        </div>

        {/* What are Klaps */}
        <section className="mt-20 max-w-4xl mx-auto bg-card border border-border rounded-2xl p-8 md:p-10">
          <div className="flex items-start gap-4">
            <span className="size-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0">
              <Zap className="size-6" strokeWidth={2.5} />
            </span>
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-medium tracking-tight">
                What's a Klap?
              </h2>
              <p className="mt-2 text-ink-2">
                A Klap is one shot at a job. See a job you want? Hit <strong>[Klap it]</strong> to send your pitch.
                Each Klap costs 1 from your monthly allowance. Run out? Top up below — no commitment.
              </p>
            </div>
          </div>
        </section>

        {/* Top-up packs */}
        <section className="mt-10 max-w-4xl mx-auto">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center mb-5">
            Top-up packs
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {KLAP_PACKS.map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  "rounded-2xl border p-6 flex items-center justify-between gap-4",
                  i === 1 ? "border-accent bg-accent/5" : "border-border bg-card",
                )}
              >
                <div>
                  <p className="font-display text-xl font-semibold">{p.name}</p>
                  <p className="font-display text-3xl font-medium tabular-nums mt-2">
                    +{p.klaps} <span className="text-sm font-sans text-muted-foreground">Klaps</span>
                  </p>
                  <p className="text-xs text-ink-2 mt-1">{p.blurb}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-2xl font-semibold">{formatRand(p.price)}</p>
                  {i === 1 && (
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest text-accent">
                      Best value
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Eish Urgent */}
        <section className="mt-10 max-w-4xl mx-auto rounded-2xl p-8 md:p-10 bg-foreground text-background">
          <div className="flex items-start gap-4">
            <span className="size-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0">
              <Siren className="size-6" strokeWidth={2.5} />
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Client side</span>
              <h2 className="font-display text-2xl md:text-3xl font-medium tracking-tight mt-1">
                Eish! Urgent — R50 SOS
              </h2>
              <p className="mt-2 text-background/85">
                Burst geyser at 9pm? Locked out in your PJs? Mark a job <strong>Urgent</strong> for R50 and we klaxon every verified pro within 10km. Top of feed, flashing coral border, instant push.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
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
                <AccordionContent className="text-ink-2 pb-5">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </SiteLayout>
  );
};

export default Pricing;
