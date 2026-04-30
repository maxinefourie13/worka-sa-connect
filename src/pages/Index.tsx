import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Search } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { FlameButton } from "@/components/ui/flame-button";
import { BusinessCard } from "@/components/BusinessCard";
import { JobCard } from "@/components/JobCard";
import { Typewriter } from "@/components/Typewriter";
import { FoundingSpotsBanner } from "@/components/FoundingSpotsBanner";
import { CATEGORIES, CATEGORY_GROUPS, PROVINCES, STATS } from "@/lib/mockData";
import { useBusinesses, useOpportunities } from "@/hooks/useDirectory";
import { getCategoryGroupIcon } from "@/lib/categoryIcons";

const HOW_IT_WORKS = [
  { title: "Tell us what you need", body: "Search the directory or post a request in seconds." },
  { title: "Get real people", body: "Local businesses ready to help — across all nine provinces." },
  { title: "Choose who you trust", body: "Browse profiles, reviews, and active promotions." },
  { title: "Get it done", body: "Contact them directly. No middleman. No commission." },
];

const HERO_PHRASES = [
  "Sjoh! Tired of hiring mamparas? Find a vetted pro.",
  "Sjoh! Bank balance looking like the temperature? Sell your skills.",
  "Sjoh! Your husband's DIY is a crime scene. Hire an actual professional.",
  "Sjoh! Too much month at the end of the money? Start a hustle.",
  "Sjoh! Kitchen looking like a swimming pool? Dala a vetted plumber.",
  "Sjoh! Turn your 'I know a guy' status into a legit business.",
  
  "Sjoh! Power bill giving you chest pains? Offer your services.",
  "Sjoh! Don't let a mampara tile your bathroom. Get real quotes.",
  "Sjoh! Got skills but no leads? List your services today.",
  "Sjoh! Cousin's wiring giving you static shocks? Get a qualified electrician.",
  "Sjoh! Stop grafting for your uncle. Start your own business.",
  "Sjoh! Because 14 phone calls is 13 too many. Just post the job.",
  "Sjoh! Can fix what the chancers broke? We need you.",
  "Sjoh! Locked out in your old PJs? We've got vetted locksmiths.",
];

const HomePage = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [province, setProvince] = useState("");

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set("q", keyword);
    if (province) params.set("province", province);
    navigate(`/directory?${params.toString()}`);
  };

  const { data: allBusinesses } = useBusinesses();
  const { data: allOpps } = useOpportunities();
  const featured = allBusinesses.slice(0, 6);
  const latest = allOpps.slice(0, 3);
  const popularCatSlugs = ["plumbing", "electrical", "home-cleaning", "garden-services", "mechanics", "web-design"];
  const popularCats = popularCatSlugs
    .map((s) => CATEGORIES.find((c) => c.slug === s))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const groupCounts = CATEGORY_GROUPS.map((g) => ({
    ...g,
    count: CATEGORIES.filter((c) => c.groupSlug === g.slug).reduce((sum, c) => sum + c.count, 0),
    subCount: CATEGORIES.filter((c) => c.groupSlug === g.slug).length,
  }));

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div className="absolute inset-0 bg-grid-soft opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="container relative pt-20 pb-24 lg:pt-28 lg:pb-32 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold mb-4">
            No commission. No middlemen. Direct contact.
          </span>
          <div className="mb-8 flex justify-center">
            <FoundingSpotsBanner />
          </div>

          {/* Hero typewriter — the SA-flavoured Sjoh! line is the centrepiece */}
          <div className="min-h-[14rem] sm:min-h-[12rem] md:min-h-[13rem] lg:min-h-[14rem] flex items-center justify-center">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] max-w-5xl mx-auto text-balance text-foreground">
              <Typewriter
                phrases={HERO_PHRASES}
                randomize
                typingSpeed={75}
                erasingSpeed={35}
                holdDuration={3200}
              />
            </h1>
          </div>

          {/* Small label above the search */}
          <p className="mt-10 mb-3 text-sm md:text-base font-semibold uppercase tracking-widest text-muted-foreground">
            What do you need?
          </p>

          {/* Search */}
          <form
            onSubmit={onSearch}
            className="w-full max-w-3xl mx-auto bg-card p-2 rounded-2xl shadow-soft border border-border flex flex-col md:flex-row gap-2 transition-shadow focus-within:shadow-pop"
          >
            <div className="flex-1 flex items-center gap-3 px-4">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                type="text"
                placeholder="Search plumbers, electricians, designers…"
                className="w-full py-3.5 bg-transparent outline-none text-base placeholder:text-muted-foreground font-medium"
              />
            </div>
            <div className="hidden md:block w-px bg-border my-2" />
            <div className="relative md:min-w-[200px]">
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full pl-4 pr-10 py-3.5 bg-transparent outline-none text-base font-medium appearance-none cursor-pointer text-foreground"
              >
                <option value="">All Provinces</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-xs">▾</span>
            </div>
            <FlameButton type="submit" size="lg">
              Find a Pro
            </FlameButton>
          </form>

          {/* Popular categories */}
          <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground self-center mr-1">
              Popular:
            </span>
            {popularCats.map((c) => (
              <Link
                key={c.slug}
                to={`/directory?category=${c.slug}`}
                className="text-sm font-medium px-3.5 py-1.5 rounded-full border border-border bg-card hover:border-accent hover:bg-accent-soft transition-all"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Customer dual pathway */}
      <section className="border-b border-border bg-background">
        <div className="container py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Two ways to find help</span>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight mt-3">
              Pick the path that suits you.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            <div className="group bg-card border border-border rounded-2xl p-7 md:p-8 hover:border-primary hover:shadow-pop transition-all flex flex-col">
              <span className="inline-flex items-center self-start gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                Recommended
              </span>
              <h3 className="font-display text-2xl font-extrabold tracking-tight mt-4">
                Let the Pros come to you.
              </h3>
              <p className="mt-2 text-ink-2 leading-relaxed flex-1">
                Tell us what you need, and available pros in your area will send you quotes.
              </p>
              <Button size="lg" className="mt-6 w-full font-bold" asChild>
                <Link to="/requests/new">Get Quotes</Link>
              </Button>
            </div>
            <div className="group bg-card border border-border rounded-2xl p-7 md:p-8 hover:border-foreground hover:shadow-pop transition-all flex flex-col">
              <span className="inline-flex items-center self-start gap-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground bg-foreground/10 px-2.5 py-1 rounded-full">
                Hands-on
              </span>
              <h3 className="font-display text-2xl font-extrabold tracking-tight mt-4">
                Browse and contact directly.
              </h3>
              <p className="mt-2 text-ink-2 leading-relaxed flex-1">
                Prefer to hunt? Search our directory and contact pros on your own terms.
              </p>
              <Button size="lg" variant="ink" className="mt-6 w-full font-bold" asChild>
                <Link to="/directory">Search Directory</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-card border-b border-border">
        <div className="container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-border/60">
            {[
              { v: STATS.commission, l: "Commission on jobs" },
              { v: STATS.categories.toString(), l: "Service categories" },
              { v: STATS.categoryGroups.toString(), l: "Industry groups" },
              { v: STATS.provinces.toString(), l: "Provinces covered" },
            ].map((s) => (
              <div key={s.l} className="flex flex-col items-center text-center pt-4 md:pt-0">
                <span className="font-display text-4xl md:text-5xl font-medium tabular-nums tracking-tight">
                  {s.v}
                </span>
                <span className="text-sm font-medium text-muted-foreground mt-2">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-20">
        <div className="max-w-2xl mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
            How Sjoh works
          </h2>
          <p className="mt-3 text-ink-2">
            Find someone → Contact them → Get it done. That's it.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {HOW_IT_WORKS.map((s, i) => (
            <div
              key={s.title}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 hover:shadow-card transition-all"
            >
              <span className="font-display text-3xl font-bold text-primary tabular-nums">
                0{i + 1}
              </span>
              <h3 className="font-display text-lg font-semibold mt-5">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-2 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories grid */}
      <section className="bg-card border-y border-border">
        <div className="container py-20">
          <div className="flex items-end justify-between mb-10">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
                Browse by category
              </h2>
              <p className="mt-3 text-ink-2">From electricians to event planners — everything you need.</p>
            </div>
            <Link to="/directory" className="text-sm font-semibold text-primary hover:underline hidden md:inline-block">
              Browse all
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {groupCounts.map((g) => {
              const Icon = getCategoryGroupIcon(g.slug);
              return (
                <Link
                  key={g.slug}
                  to={`/directory/g/${g.slug}`}
                  className="group bg-background border border-border rounded-lg p-5 flex items-center gap-4 hover:border-primary hover:bg-primary-light/40 transition-all"
                >
                  <span className="size-11 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="size-5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm group-hover:text-primary transition-colors leading-snug">{g.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                      {g.subCount} services · {g.count.toLocaleString("en-ZA")} listings
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured businesses */}
      <section className="container py-20">
        <div className="flex items-end justify-between mb-10">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
              Featured businesses
            </h2>
            <p className="mt-3 text-ink-2">Verified, top-rated, and active on Sjoh.</p>
          </div>
          <Link to="/directory" className="text-sm font-semibold text-primary hover:underline hidden md:inline-block">
            See all
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
      </section>

      {/* Latest customer requests */}
      <section className="bg-card border-y border-border">
        <div className="container py-20">
          <div className="flex items-end justify-between mb-10">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
                Latest customer requests
              </h2>
              <p className="mt-3 text-ink-2">Real requests posted by people and businesses across SA.</p>
            </div>
            <Link to="/requests" className="text-sm font-semibold text-primary hover:underline hidden md:inline-block">
              View all requests
            </Link>
          </div>
          <div className="grid lg:grid-cols-3 gap-5">
            {latest.map((o) => (
              <JobCard key={o.id} job={o} />
            ))}
          </div>
        </div>
      </section>


      {/* CTA strip */}
      <section className="bg-primary text-primary-foreground">
        <div className="container py-16 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto text-balance">
            Get found by people already looking.
          </h2>
          <p className="mt-4 text-primary-foreground/85 max-w-xl mx-auto">
            List your business on Sjoh and start getting real enquiries from local clients. We don't take a cut of your work.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="ink" size="lg" asChild>
              <Link to="/list">Apply as a Pro</Link>
            </Button>
            <Button variant="outline" size="lg" className="bg-transparent border-white/30 text-white hover:bg-white/10" asChild>
              <Link to="/pricing">Claim your 30-Day Trial</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default HomePage;
