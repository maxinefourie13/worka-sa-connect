import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ClipboardList,
  Send,
  Handshake,
  ShieldCheck,
  CheckCircle2,
  Siren,
  Search,
  Sparkles,
  HeartHandshake,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessCard } from "@/components/BusinessCard";
import { JobCard } from "@/components/JobCard";
import { useBusinesses, useOpportunities } from "@/hooks/useDirectory";
import { CATEGORIES, PROVINCES } from "@/lib/mockData";
import { SeoHead } from "@/components/SeoHead";
import { cn } from "@/lib/utils";

type TabKey = "quote" | "pros";

const RequestsHub = () => {
  const [params, setParams] = useSearchParams();
  const initialTab = (params.get("tab") as TabKey) || "quote";
  const [tab, setTab] = useState<TabKey>(initialTab);

  const handleTabChange = (v: string) => {
    setTab(v as TabKey);
    const next = new URLSearchParams(params);
    if (v === "quote") next.delete("tab");
    else next.set("tab", v);
    setParams(next, { replace: true });
  };

  return (
    <SiteLayout>
      <SeoHead
        title="Get Quotes from Vetted SA Pros — Free | Sjoh"
        description="Tell us the job — vetted South African pros come back with quotes. Free for customers. No commission. No middleman."
        path="/requests"
      />
      <div className="container py-10 md:py-14">
        <header className="mb-8 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Get Quotes
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mt-2">
            Need someone who can do it properly?
          </h1>
          <p className="mt-3 text-ink-2 text-lg">
            Tell us the job — vetted SA pros come back to you with quotes. Or browse the directory and contact a pro yourself. No commission. No middleman.
          </p>
        </header>

        <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="quote" className="font-semibold">
              <Sparkles className="size-4 mr-1.5" />
              Get an instant quote
            </TabsTrigger>
            <TabsTrigger value="pros" className="font-semibold">
              <Search className="size-4 mr-1.5" />
              View our pros
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quote" className="mt-0">
            <GetQuotePanel onBrowsePros={() => handleTabChange("pros")} />
          </TabsContent>

          <TabsContent value="pros" className="mt-0">
            <BrowseProsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  );
};

export default RequestsHub;

// ============================================================
// Tab 1: Get an instant quote
// ============================================================

const STEPS = [
  {
    icon: ClipboardList,
    title: "1. Tell us the job",
    body: "Pick a category, your suburb, and what needs doing. Add photos if you've got them — pros love a clear brief.",
  },
  {
    icon: Send,
    title: "2. Vetted pros quote you",
    body: "Real SA pros in your area get notified. Most quotes land within a few hours, often faster.",
  },
  {
    icon: Handshake,
    title: "3. Pick your pro, chat direct",
    body: "Compare quotes, check reviews, then message or call your pro directly. No middleman taking a cut.",
  },
];

const CHECKLIST = [
  "What needs doing (one line is fine)",
  "Where you are — suburb + city",
  "When you need it — ASAP, this week, flexible",
  "Rough budget guide (or 'not sure')",
  "Photos if you have them",
];

const PROMISES = [
  { icon: CheckCircle2, text: "Quotes from verified pros" },
  { icon: HeartHandshake, text: "Free for you, always — no obligation" },
  { icon: ShieldCheck, text: "We vet every pro before they can quote" },
];

const GetQuotePanel = ({ onBrowsePros }: { onBrowsePros: () => void }) => {
  const { data: opportunities } = useOpportunities();
  const recent = opportunities.slice(0, 3);

  return (
    <div className="space-y-12">
      {/* Hero CTA card */}
      <section className="rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-glow text-primary-foreground p-8 md:p-12 shadow-elegant relative overflow-hidden">
        <div className="absolute -top-20 -right-20 size-72 rounded-full bg-primary-foreground/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
            Tell us what you need. Pros come to you.
          </h2>
          <p className="mt-3 text-primary-foreground/90 text-base md:text-lg">
            Post your job in under 2 minutes. Vetted pros in your area will quote you back — free, no obligation.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="ink" size="lg" asChild className="font-bold">
              <Link to="/requests/new">
                Post your request <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={onBrowsePros}
              className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
            >
              Or browse pros yourself
            </Button>
          </div>
        </div>
      </section>

      {/* Three-step explainer */}
      <section>
        <h3 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight mb-6">
          How it works
        </h3>
        <div className="grid md:grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <div
              key={s.title}
              className="lift-card rounded-2xl border border-border bg-card p-6"
            >
              <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <s.icon className="size-6" strokeWidth={2.25} />
              </div>
              <h4 className="font-display text-lg font-extrabold tracking-tight">
                {s.title}
              </h4>
              <p className="text-ink-2 text-sm mt-2 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you'll need + What you get back, side-by-side */}
      <section className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Before you start
          </span>
          <h4 className="font-display text-xl md:text-2xl font-extrabold tracking-tight mt-2">
            What you'll need to send
          </h4>
          <p className="text-ink-2 text-sm mt-2">
            Have these ready — it'll take you 2 minutes, tops.
          </p>
          <ul className="mt-5 space-y-3">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="size-3.5" strokeWidth={2.5} />
                </span>
                <span className="text-sm text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-6 md:p-8">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            What you get back
          </span>
          <h4 className="font-display text-xl md:text-2xl font-extrabold tracking-tight mt-2">
            Quotes from vetted pros, in your inbox
          </h4>
          <p className="text-ink-2 text-sm mt-2">
            We don't take a cent from you. Promise.
          </p>
          <ul className="mt-5 space-y-3">
            {PROMISES.map((p) => (
              <li key={p.text} className="flex items-start gap-3">
                <span className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5">
                  <p.icon className="size-3.5" strokeWidth={2.5} />
                </span>
                <span className="text-sm font-medium text-foreground">{p.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Urgent strip */}
      <section className="rounded-2xl border border-amber/40 bg-amber/10 p-6 md:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="size-11 rounded-xl bg-amber/20 text-amber flex items-center justify-center shrink-0">
            <Siren className="size-5" strokeWidth={2.5} />
          </span>
          <div>
            <h4 className="font-display text-lg font-extrabold tracking-tight">
              In a hurry? Mark it Urgent.
            </h4>
            <p className="text-sm text-ink-2 mt-1">
              For <strong>R50</strong>, your post jumps to the top of every pro's feed and pings our top operators direct. Use it for burst pipes, locked-out emergencies, last-minute jobs.
            </p>
          </div>
        </div>
      </section>

      {/* Big CTA again */}
      <section className="rounded-2xl border-2 border-primary/30 bg-card p-6 md:p-8 text-center">
        <h3 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">
          Ready? Post your request — it's free.
        </h3>
        <p className="text-ink-2 mt-2 max-w-xl mx-auto">
          Takes about 2 minutes. You'll start getting quotes shortly after.
        </p>
        <Button size="lg" asChild className="mt-5 font-bold">
          <Link to="/requests/new">
            Post your request <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>

      {/* Recent requests strip — social proof */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Live on Sjoh right now
              </span>
              <h3 className="font-display text-2xl font-extrabold tracking-tight mt-1">
                Recent requests from other Saffas
              </h3>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {recent.map((o) => (
              <JobCard key={o.id} job={o} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// ============================================================
// Tab 2: View our pros
// ============================================================

const BrowseProsPanel = () => {
  const { data: businesses } = useBusinesses();
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [province, setProvince] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const filtered = useMemo(() => {
    return businesses.filter((b) => {
      if (keyword) {
        const k = keyword.toLowerCase();
        if (
          !b.name.toLowerCase().includes(k) &&
          !b.category.toLowerCase().includes(k) &&
          !(b.tags || []).some((t) => t.toLowerCase().includes(k))
        )
          return false;
      }
      if (category && b.categorySlug !== category) return false;
      if (province && b.province !== province) return false;
      if (verifiedOnly && !b.isVerified) return false;
      return true;
    });
  }, [businesses, keyword, category, province, verifiedOnly]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 md:p-7">
        <div className="flex items-start gap-4">
          <span className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Search className="size-5" strokeWidth={2.5} />
          </span>
          <div>
            <h3 className="font-display text-xl md:text-2xl font-extrabold tracking-tight">
              Browse vetted SA pros
            </h3>
            <p className="text-ink-2 text-sm mt-1">
              Prefer to pick someone yourself? Filter by category and province, check reviews, then message direct. Same vetted pros, no quoting required.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-3 flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 px-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search pros, services, or tags…"
            className="w-full py-2 bg-transparent outline-none text-sm"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="text-sm font-medium border border-border rounded-md px-3 py-2 bg-background cursor-pointer min-w-[180px]"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="text-sm font-medium border border-border rounded-md px-3 py-2 bg-background cursor-pointer min-w-[180px]"
        >
          <option value="">All provinces</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          onClick={() => setVerifiedOnly((v) => !v)}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-md border transition-all",
            verifiedOnly
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-ink-2 border-border hover:border-primary",
          )}
        >
          <ShieldCheck className="size-3.5" strokeWidth={2.5} />
          Verified only
        </button>
      </div>

      <div className="text-sm text-muted-foreground tabular-nums">
        {filtered.length} {filtered.length === 1 ? "pro" : "pros"}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-ink-2">Aikona — nothing matches your filters yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="rounded-2xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground p-6 md:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <div>
          <h4 className="font-display text-lg md:text-xl font-extrabold tracking-tight">
            Don't want to pick? Let pros come to you.
          </h4>
          <p className="text-primary-foreground/85 text-sm mt-1">
            Post your request and we'll bring the quotes to your inbox — free.
          </p>
        </div>
        <Button variant="ink" asChild className="font-bold shrink-0">
          <Link to="/requests/new">
            Get instant quotes <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
};
