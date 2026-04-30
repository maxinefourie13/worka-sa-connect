import { useNavigate } from "react-router-dom";
import { Check, Siren, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SJOH_TIERS, formatRand } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { payments } from "@/lib/payments";
import { useAuth } from "@/hooks/useAuth";

const FAQS = [
  { q: "How does the free trial work?", a: "New providers get 30 days on Basic Listing free — no card required. Early-access members get 2 months. After that, it is R50/month to stay listed." },
  { q: "What is the difference between Basic Listing and Verified Pro?", a: "Basic Listing (R50/mo) keeps you in the directory so customers can find and contact you directly. Verified Pro (R250/mo) adds the verified badge, top placement, and the ability to send quotes on customer requests." },
  { q: "Do you take commission on the work I do?", a: "Never. Sjoh is a directory — payments happen directly between you and your customer. We don't touch your money." },
  { q: "What is the Eish! Urgent option?", a: "Posting a request is always free. If it's urgent, customers can flag it as Eish! Urgent at no extra charge — it gets pinned to the top of the feed for 72 hours and notifies Verified Pros nearby." },
  { q: "What is Sjoh's Law?", a: "Three strikes and you're out. Flake on a job, do dangerous work, or refuse to pay for completed work — that's a strike. Three strikes and your ID is permanently banned." },
  { q: "Can I cancel any time?", a: "Yes. Cancel or downgrade from your dashboard. No contracts, no cancellation fees." },
];

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleTierClick = (slug: string) => {
    if (!user) { navigate("/auth"); return; }
    if (slug === "basic" || slug === "verified_pro") {
      payments.startSubscription(slug);
    } else {
      navigate("/list");
    }
  };

  return (
    <SiteLayout>
      <div className="container py-16 md:py-20">
        <header className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Provider plans</span>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mt-3 text-balance">
            No commission. Just a small monthly fee.
          </h1>
          <p className="mt-4 text-lg text-ink-2">
            Get listed, get found, keep 100% of what you earn.
          </p>
        </header>

        {/* Bold no-commission promise — kills the "hidden costs" red-team */}
        <div className="max-w-3xl mx-auto mb-12 rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 md:p-6 flex items-start gap-4">
          <span className="size-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-display font-extrabold text-lg">0%</span>
          <div className="text-sm md:text-base">
            <p className="font-display font-extrabold tracking-tight text-foreground">
              0% commission. You keep every cent you earn.
            </p>
            <p className="text-ink-2 mt-1.5">
              Your monthly plan covers <strong>unlimited quotes</strong> and your directory listing.
              We don't take a cut of your invoice, we don't charge per message, and we don't touch your Paystack payouts. Clients pay you directly.
            </p>
          </div>
        </div>


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
                  Verified
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
                onClick={() => handleTierClick(t.slug)}
              >
                {t.slug === "basic_trial" ? "Start free trial" : `Choose ${t.name}`}
              </Button>
            </div>
          ))}
        </div>

        {/* Founding-member perk */}
        <p className="mt-6 text-center text-sm text-ink-2 max-w-2xl mx-auto">
          <Sparkles className="size-4 text-accent inline -mt-0.5 mr-1" strokeWidth={2.5} />
          <strong className="text-foreground">Founding members</strong> get <strong>1 free proposal a month</strong> — even on the On the Map plan. Our thank-you for showing up early.
        </p>

        {/* Eish Urgent */}
        <section className="mt-16 max-w-4xl mx-auto rounded-2xl p-8 md:p-10 bg-foreground text-background">
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
