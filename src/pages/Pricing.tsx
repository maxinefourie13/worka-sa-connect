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
    blurb: "Get listed. Start showing up.",
    features: [
      "Basic listing",
      "Contact details",
      "Search visibility",
      "No expiry",
    ],
    cta: "Start free",
    variant: "outline" as const,
  },
  {
    name: "Standard",
    price: "R 50",
    period: "/month — free for the first 3 months",
    blurb: "For businesses ready to grow.",
    popular: true,
    features: [
      "Full profile with photos",
      "Post promotions",
      "Apply to job opportunities",
      "Collect reviews",
      "Follower notifications",
    ],
    cta: "Start free for 3 months",
    variant: "default" as const,
  },
  {
    name: "Featured",
    price: "R 250",
    period: "/month",
    blurb: "Get seen first.",
    features: [
      "Everything in Standard",
      "Appear at top of search",
      "Featured badge",
      "Priority homepage placement",
    ],
    cta: "Get featured",
    variant: "ink" as const,
  },
];

const FAQS = [
  { q: "Can I cancel at any time?", a: "Yes. You can cancel or downgrade your plan from your dashboard at any time. There are no contracts or cancellation fees." },
  { q: "How does the 3-month free trial work?", a: "All new businesses on the Standard plan get the first three months free. We'll send a reminder before billing kicks in. No card required to start." },
  { q: "What payment methods do you accept?", a: "We accept all major South African credit and debit cards. Billing is in South African Rand (ZAR)." },
  { q: "Is my data protected?", a: "Yes. Sjoh is fully POPIA-compliant. We never sell your information and you can request deletion at any time." },
  { q: "Do you charge commission on jobs?", a: "No. Sjoh is a directory — payments between businesses and clients happen off-platform. We don't take a cut of your work. We just help the right clients find you." },
  { q: "What does verification involve?", a: "We check your business registration (CIPC), contact details, and any relevant trade certifications. Verified businesses get a badge on their profile." },
];

const Pricing = () => {
  return (
    <SiteLayout>
      <div className="container py-16 md:py-20">
        <header className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Pricing</span>
          <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight mt-3 text-balance">
            No commission. No hidden fees.
          </h1>
          <p className="mt-4 text-lg text-ink-2">
            You deal directly with your clients. Choose how visible you want to be.
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
