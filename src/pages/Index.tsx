import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Search, ArrowRight, Sparkles, Briefcase, UserPlus, Users } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { BusinessCard } from "@/components/BusinessCard";
import { JobCard } from "@/components/JobCard";
import { BUSINESSES, OPPORTUNITIES, CATEGORIES, PROVINCES, PROMOTIONS, STATS } from "@/lib/mockData";

const HOW_IT_WORKS = [
  { icon: Search, title: "Tell us what you need", body: "Search the directory or post a job in seconds." },
  { icon: Users, title: "Get real people", body: "Local businesses ready to help — across all nine provinces." },
  { icon: UserPlus, title: "Choose who you trust", body: "Browse profiles, reviews, and active promotions." },
  { icon: Briefcase, title: "Get it done", body: "Contact them directly. No middleman. No commission." },
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

  const featured = BUSINESSES.slice(0, 6);
  const latest = OPPORTUNITIES.slice(0, 3);
  const popularCats = CATEGORIES.slice(0, 6);

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid-soft opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="container relative pt-20 pb-24 lg:pt-28 lg:pb-32 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold mb-6">
            <Sparkles className="size-3.5" /> Free for the first 3 months on Standard
          </span>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-balance leading-[1.05] max-w-4xl mx-auto">
            Find who does <span className="italic font-normal text-primary">the work</span>.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-ink-2 max-w-xl mx-auto text-pretty">
            The reliable directory for South African trades, professional services, and the people building our communities.
          </p>

          {/* Search */}
          <form
            onSubmit={onSearch}
            className="mt-10 w-full max-w-3xl mx-auto bg-card p-2 rounded-2xl shadow-soft border border-border flex flex-col md:flex-row gap-2 transition-shadow focus-within:shadow-pop"
          >
            <div className="flex-1 flex items-center gap-3 px-4">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                type="text"
                placeholder="Plumber, photographer, accountant…"
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
            <Button type="submit" variant="ink" size="lg" className="rounded-lg">
              Search
            </Button>
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

      {/* Stats bar */}
      <section className="bg-card border-b border-border">
        <div className="container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-border/60">
            {[
              { v: STATS.businesses.toLocaleString("en-ZA"), l: "Businesses listed" },
              { v: STATS.opportunities.toLocaleString("en-ZA"), l: "Open opportunities" },
              { v: STATS.categories.toString(), l: "Categories" },
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
            How Worka works
          </h2>
          <p className="mt-3 text-ink-2">
            Whether you're hiring or hustling, Worka brings the right people together.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {HOW_IT_WORKS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 hover:shadow-card transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="size-10 rounded-lg bg-primary-light text-primary flex items-center justify-center">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-xs font-bold tracking-widest text-muted-foreground tabular-nums">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold mt-5">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-2 leading-relaxed">{s.body}</p>
              </div>
            );
          })}
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
            <Link to="/directory" className="text-sm font-semibold text-primary hover:underline hidden md:flex items-center gap-1">
              Browse all <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                to={`/directory?category=${c.slug}`}
                className="group bg-background border border-border rounded-lg p-4 flex items-center gap-3 hover:border-primary hover:bg-primary-light/40 transition-all"
              >
                <span className="text-2xl">{c.emoji}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{c.count.toLocaleString("en-ZA")} listings</p>
                </div>
              </Link>
            ))}
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
            <p className="mt-3 text-ink-2">Verified, top-rated, and active on Worka.</p>
          </div>
          <Link to="/directory" className="text-sm font-semibold text-primary hover:underline hidden md:flex items-center gap-1">
            See all <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
      </section>

      {/* Latest opportunities */}
      <section className="bg-card border-y border-border">
        <div className="container py-20">
          <div className="flex items-end justify-between mb-10">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
                Latest opportunities
              </h2>
              <p className="mt-3 text-ink-2">Real jobs posted by people and businesses across SA.</p>
            </div>
            <Link to="/opportunities" className="text-sm font-semibold text-primary hover:underline hidden md:flex items-center gap-1">
              View board <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid lg:grid-cols-3 gap-5">
            {latest.map((o) => (
              <JobCard key={o.id} job={o} />
            ))}
          </div>
        </div>
      </section>

      {/* Active promotions — dark section */}
      <section className="bg-foreground text-background">
        <div className="container py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-accent">Limited time</span>
              <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-2">
                Active promotions
              </h2>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {PROMOTIONS.map((p) => (
              <div
                key={p.id}
                className={`rounded-2xl p-7 bg-gradient-to-br ${p.gradient} text-white flex flex-col min-h-[260px]`}
              >
                <div className="flex items-start justify-between mb-auto">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded">
                    Promo
                  </span>
                  {p.discountPercent && (
                    <span className="font-display text-3xl font-bold tabular-nums">
                      -{p.discountPercent}%
                    </span>
                  )}
                </div>
                <div className="mt-8">
                  <h3 className="font-display text-xl font-semibold leading-snug">{p.title}</h3>
                  <p className="mt-2 text-sm text-white/85">{p.description}</p>
                  <div className="mt-5 pt-5 border-t border-white/20 flex items-center justify-between text-xs">
                    <span className="font-semibold">{p.businessName}</span>
                    <span className="text-white/75">Ends {p.expiresAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="bg-primary text-primary-foreground">
        <div className="container py-16 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-medium tracking-tight max-w-3xl mx-auto text-balance">
            List your business free for 3 months.
          </h2>
          <p className="mt-4 text-primary-foreground/85 max-w-xl mx-auto">
            No card required. Get found by the people looking for what you do.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="ink" size="lg" asChild>
              <Link to="/list">List Your Business</Link>
            </Button>
            <Button variant="outline" size="lg" className="bg-transparent border-white/30 text-white hover:bg-white/10" asChild>
              <Link to="/pricing">See Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default HomePage;
