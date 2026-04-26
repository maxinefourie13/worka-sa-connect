import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const TIERS = [
  {
    name: "Free",
    price: "R 0",
    period: "/month",
    blurb: "A basic listing to get you found.",
    features: [
      "Basic listing (name, category, location, contact)",
      "Searchable in directory",
      "No expiry, no card required",
    ],
    cta: "Create Free Listing",
    variant: "outline" as const,
  },
  {
    name: "Standard",
    price: "R 0",
    period: " for 3 months, then R 50/month",
    blurb: "Everything you need to run a serious profile.",
    popular: true,
    features: [
      "Full profile with photos and gallery",
      "Post unlimited promotions",
      "Receive and respond to opportunities",
      "Follower notifications",
      "Collect customer reviews",
    ],
    cta: "Start Free — 3 Months on Us",
    variant: "default" as const,
  },
  {
    name: "Featured",
    price: "R 150",
    period: "/month",
    blurb: "Top-of-results placement and a featured badge.",
    features: [
      "Everything in Standard",
      "Top of search results in your category",
      "Featured badge on your listing",
      "Priority placement on the homepage grid",
    ],
    cta: "Get Featured",
    variant: "ink" as const,
  },
];

const FAQS = [
  { q: "Can I cancel at any time?", a: "Yes. You can cancel or downgrade your plan from your dashboard at any time. There are no contracts or cancellation fees." },
  { q: "How does the 3-month free trial work?", a: "All new businesses on the Standard plan get the first three months free. We'll send a reminder before billing kicks in. No card required to start." },
  { q: "What payment methods do you accept?", a: "We accept all major South African credit and debit cards via Stripe. Billing is in South African Rand (ZAR)." },
  { q: "Is my data protected?", a: "Yes. Worka is fully POPIA-compliant. We never sell your information and you can request deletion at any time." },
  { q: "Do you charge commission on jobs?", a: "No. Worka is a directory and opportunity board — payments between businesses and clients happen off-platform. We charge businesses a flat monthly subscription only." },
  { q: "What does verification involve?", a: "We check your business registration (CIPC), contact details, and any relevant trade certifications. Verified businesses get a badge on their profile." },
];

const Pricing = () => {
  return (
    <SiteLayout>
      <div className="container py-16 md:py-20">
        <header className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Pricing</span>
          <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight mt-3 text-balance">
            Simple plans. No commission. No surprises.
          </h1>
          <p className="mt-4 text-lg text-ink-2">
            Choose how visible you want to be. All prices in South African Rand.
          </p>
        </header>

        <div className="grid lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`relative bg-card border rounded-2xl p-7 flex flex-col ${
                t.popular ? "border-primary shadow-pop lg:scale-[1.03]" : "border-border shadow-card"
              }`}
            >
              {t.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-2xl font-semibold">{t.name}</h3>
              <p className="text-sm text-ink-2 mt-1">{t.blurb}</p>
              <div className="mt-6 pb-6 border-b border-border">
                <span className="font-display text-5xl font-medium tracking-tight">{t.price}</span>
                <span className="text-sm text-muted-foreground">{t.period}</span>
              </div>
              <ul className="mt-6 space-y-3 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="size-4 text-primary mt-0.5 shrink-0" strokeWidth={3} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button variant={t.variant} size="lg" className="mt-7" asChild>
                <Link to="/list">{t.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

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
