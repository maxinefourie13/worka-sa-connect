import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Search, Star, MessageCircle, Leaf, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { FlameButton } from "@/components/ui/flame-button";
import { BusinessCard } from "@/components/BusinessCard";
import { JobCard } from "@/components/JobCard";
import { Typewriter } from "@/components/Typewriter";
import { FoundingSpotsBanner } from "@/components/FoundingSpotsBanner";
import { CATEGORIES, CATEGORY_GROUPS, PROVINCES } from "@/lib/mockData";
import { useBusinesses, useOpportunities } from "@/hooks/useDirectory";
import { getCategoryGroupIcon } from "@/lib/categoryIcons";
import heroGroup1 from "@/assets/hero-group-1.jpg";
import heroGroup3 from "@/assets/hero-group-3.jpg";
import sjohIconV2 from "@/assets/sjoh-icon-v2.png";

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

const MARQUEE_ITEMS = [
  "No commission",
  "Vetted pros",
  "All 9 provinces",
  "240+ categories",
  "Real South Africans",
  "No middleman",
  "Lekker service",
];

const HOW_STEPS = [
  { n: "01", icon: "🔍", title: "Tell us what you need", body: "Search the directory or post a request in seconds.", bg: "var(--sa-gold)", color: "var(--sa-dark)", rot: "-1.5deg" },
  { n: "02", icon: "👥", title: "Get real people", body: "Local businesses ready to help across all nine provinces.", bg: "var(--sa-red)", color: "#fff", rot: "1.2deg" },
  { n: "03", icon: "⭐", title: "Choose who you trust", body: "Browse profiles, reviews, and active promotions.", bg: "var(--sa-navy)", color: "#fff", rot: "-0.8deg" },
  { n: "04", icon: "✅", title: "Get it done", body: "Contact them directly. No middleman. No commission.", bg: "var(--sa-green)", color: "#fff", rot: "1.5deg" },
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
    subCount: CATEGORIES.filter((c) => c.groupSlug === g.slug).length,
  }));

  return (
    <SiteLayout>
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden border-b border-border" style={{ background: "radial-gradient(ellipse 90% 70% at 50% -10%, #C7DCFF 0%, #E8F1FF 45%, hsl(var(--background)) 80%), hsl(var(--background))" }}>
        {/* Spinning sticker top-left with new painterly icon */}
        <div
          aria-hidden
          className="hidden md:grid place-items-center absolute z-[3] sa-sticker-spin"
          style={{
            width: 130, height: 130, borderRadius: "50%",
            top: 80, left: "6%",
            background: "var(--sa-dark)",
            boxShadow: "var(--sa-shadow-pop)",
          }}
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
            <defs>
              <path id="sticker-circ" d="M 50,50 m -40,0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" />
            </defs>
            <text fontSize="11" fontWeight="800" letterSpacing="2.5" style={{ fill: "#fff" }}>
              <textPath href="#sticker-circ">SJOH! · LEKKER · SJOH! · LEKKER · </textPath>
            </text>
          </svg>
          <img src={sjohIconV2} alt="" className="relative z-10 w-14 h-14 object-contain" />
        </div>

        <div className="container relative pt-20 pb-24 lg:pt-28 lg:pb-32 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/75 backdrop-blur border border-white/85 text-xs font-semibold mb-4 text-[#3a3d4a]">
            <span className="size-2 rounded-full" style={{ background: "var(--sa-navy)" }} />
            No commission. No middlemen. Real grafters.
          </span>
          <div className="mb-8 flex justify-center">
            <FoundingSpotsBanner />
          </div>

          {/* Typewriter — Unbounded display */}
          <div className="min-h-[14rem] sm:min-h-[12rem] md:min-h-[13rem] lg:min-h-[14rem] flex items-center justify-center">
            <h1
              className="font-display-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.0] max-w-5xl mx-auto text-balance"
              style={{ color: "var(--sa-dark)" }}
            >
              <Typewriter
                phrases={HERO_PHRASES}
                randomize
                typingSpeed={75}
                erasingSpeed={35}
                holdDuration={3200}
              />
            </h1>
          </div>

          <p className="mt-10 mb-3 text-sm md:text-base font-semibold uppercase tracking-widest text-muted-foreground">
            What do you need?
          </p>

          <form
            onSubmit={onSearch}
            className="w-full max-w-3xl mx-auto bg-card p-2 rounded-2xl shadow-card border border-border flex flex-col md:flex-row gap-2 transition-shadow focus-within:shadow-pop"
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
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-xs">▾</span>
            </div>
            <FlameButton type="submit" size="lg">Find a Pro</FlameButton>
          </form>

          {/* Popular pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground self-center mr-1">
              Popular:
            </span>
            {popularCats.map((c) => (
              <Link
                key={c.slug}
                to={`/directory?category=${c.slug}`}
                className="text-sm font-medium px-3.5 py-1.5 rounded-full border border-border bg-card hover:border-accent hover:bg-accent-soft hover:-translate-y-0.5 hover:shadow-card transition-all duration-200 ease-out"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Floating peeking cards (desktop only) */}
        <div className="hidden lg:block">
          <div
            className="absolute z-[4] bg-white rounded-xl shadow-pop flex items-center gap-2 px-3.5 py-2.5 sa-float-bob"
            style={{ top: 160, right: "18%", ["--rot" as string]: "-2deg", animationDelay: "0s" }}
          >
            <Star className="size-4" style={{ color: "var(--sa-gold)", fill: "var(--sa-gold)" }} />
            <strong className="text-sm font-extrabold">4.9</strong>
            <span className="text-[11px] font-medium opacity-55">284 reviews</span>
          </div>
          <div
            className="absolute z-[4] rounded-xl shadow-pop flex flex-col items-start gap-0.5 px-3.5 py-2.5 sa-float-bob"
            style={{ top: 260, right: "8%", background: "var(--sa-navy)", color: "#fff", ["--rot" as string]: "3deg", animationDelay: "1.1s" }}
          >
            <div className="font-extrabold text-sm leading-tight">Thabo's<br />Plumbing</div>
            <div className="text-[10px] mt-1 opacity-70">Sandton · 2.4km</div>
          </div>
          <div
            className="absolute z-[4] rounded-full shadow-pop flex items-center gap-2 px-4 py-2 sa-float-bob"
            style={{ top: 380, right: "20%", background: "var(--sa-peri)", color: "#fff", ["--rot" as string]: "-1.5deg", animationDelay: "0.6s" }}
          >
            <Leaf className="size-3.5" /> <span className="text-xs font-bold">Garden</span>
          </div>
          <div
            className="absolute z-[4] rounded-full shadow-pop flex items-center gap-2 px-4 py-2 sa-float-bob"
            style={{ top: 460, right: "10%", background: "var(--sa-red)", color: "#fff", ["--rot" as string]: "2deg", animationDelay: "1.8s" }}
          >
            <MessageCircle className="size-3.5" /> <span className="text-xs font-bold">3 quotes</span>
          </div>
        </div>
      </section>

      {/* ========== MARQUEE STRIP ========== */}
      <div
        aria-hidden
        className="overflow-hidden whitespace-nowrap py-3.5"
        style={{ background: "var(--sa-gold)", borderTop: "3px solid var(--sa-dark)", borderBottom: "3px solid var(--sa-dark)" }}
      >
        <div className="inline-flex sa-marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((t, i) => (
            <span
              key={i}
              className="font-display-bold inline-flex items-center gap-3.5 px-8 text-[17px]"
              style={{ color: "var(--sa-dark)" }}
            >
              {t}
              <span className="text-xs opacity-50">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ========== DARK PHOTO-SPLIT — "Let the pros come to you" ========== */}
      <section className="grid md:grid-cols-2 min-h-[560px]" style={{ background: "var(--sa-dark)" }}>
        <div className="px-8 md:px-14 py-16 md:py-20 flex flex-col justify-center">
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase mb-5" style={{ color: "rgba(255,255,255,0.38)" }}>
            ● Two ways to find help
          </div>
          <h2 className="font-display-bold text-white text-5xl md:text-6xl leading-[0.92] mb-7">
            Let the pros<br />come to <span style={{ color: "var(--sa-gold)" }}>you.</span>
          </h2>
          <p className="text-white/60 text-base leading-relaxed max-w-md mb-8">
            Tell us what you need and available pros in your area send quotes within hours. No chase, no chancers — real vetted businesses only.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild className="font-bold rounded-full" style={{ background: "var(--sa-gold)", color: "var(--sa-dark)" }}>
              <Link to="/requests/new">Get Quotes <ArrowRight className="size-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="font-bold rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20">
              <Link to="/directory">Search Directory</Link>
            </Button>
          </div>
        </div>
        <div className="relative overflow-hidden min-h-[320px]">
          <img src={heroGroup1} alt="Real South Africans on Sjoh" className="w-full h-full object-cover" />
          <div
            className="absolute font-display-bold text-[13px] leading-tight px-4 py-2.5 rounded-2xl shadow-xl"
            style={{ background: "var(--sa-gold)", color: "var(--sa-dark)", top: "16%", right: "7%", transform: "rotate(4deg)" }}
          >
            THAT'S<br />LEKKER! 👌
          </div>
          <div
            className="absolute text-xs font-extrabold px-4 py-2.5 rounded-2xl shadow-xl"
            style={{ background: "var(--sa-green)", color: "#fff", top: "44%", left: "6%", transform: "rotate(-3deg)" }}
          >
            Join our chat? :)
          </div>
          <div
            className="absolute text-xs font-extrabold px-4 py-2.5 rounded-2xl shadow-xl bg-white"
            style={{ color: "var(--sa-dark)", bottom: "20%", right: "9%", transform: "rotate(2deg)" }}
          >
            Hey! Quick quote?
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS — rotated colored cards ========== */}
      <section className="bg-card py-20">
        <div className="container">
          <div className="text-center mb-16">
            <div className="text-[11px] font-bold tracking-[0.1em] uppercase mb-3" style={{ color: "var(--sa-peri)" }}>
              ● How Sjoh works
            </div>
            <h2 className="font-display-bold text-4xl md:text-5xl leading-[0.95]" style={{ color: "var(--sa-dark)" }}>
              Four steps.<br />One sorted job.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {HOW_STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-3xl p-7 flex flex-col gap-3.5 min-h-[260px] transition-transform duration-200 hover:translate-y-[-4px]"
                style={{ background: s.bg, color: s.color, transform: `rotate(${s.rot})` }}
              >
                <div className="font-display-bold text-4xl opacity-20">{s.n}</div>
                <div className="size-11 rounded-xl bg-black/10 grid place-items-center text-xl">{s.icon}</div>
                <h3 className="font-display-bold text-base mt-auto leading-tight">{s.title}</h3>
                <p className="text-[13px] leading-snug opacity-75">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== STATS BAR ========== */}
      <section className="bg-background border-y border-border">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-border/60">
            {[
              { v: "0%", l: "Commission on jobs", c: "var(--sa-red)" },
              { v: "240+", l: "Service categories", c: "var(--sa-navy)" },
              { v: "11", l: "Industry groups", c: "var(--sa-green)" },
              { v: "9", l: "Provinces covered", c: "var(--sa-gold)" },
            ].map((s) => (
              <div key={s.l} className="flex flex-col items-center text-center pt-4 md:pt-0">
                <span className="font-display-bold text-5xl md:text-6xl tabular-nums" style={{ color: s.c }}>
                  {s.v}
                </span>
                <span className="text-sm font-medium text-muted-foreground mt-2">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CATEGORIES GRID ========== */}
      <section className="bg-card border-b border-border">
        <div className="container py-20">
          <div className="flex items-end justify-between mb-10">
            <div className="max-w-xl">
              <h2 className="font-display-bold text-3xl md:text-5xl leading-[0.95]" style={{ color: "var(--sa-dark)" }}>
                Browse by category
              </h2>
              <p className="mt-3 text-ink-2">From electricians to event planners — everything you need.</p>
            </div>
            <Link to="/directory" className="text-sm font-semibold hover:underline hidden md:inline-block" style={{ color: "var(--sa-navy)" }}>
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
                  className="group bg-background border border-border rounded-xl p-5 flex items-center gap-4 hover:border-primary hover:bg-primary-light/40 hover:-translate-y-1 hover:shadow-card transition-all duration-300 ease-out"
                >
                  <span className="size-11 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Icon className="size-5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm group-hover:text-primary transition-colors leading-snug">{g.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">{g.subCount} services</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== FEATURED BUSINESSES ========== */}
      <section className="container py-20">
        <div className="flex items-end justify-between mb-10">
          <div className="max-w-xl">
            <h2 className="font-display-bold text-3xl md:text-5xl leading-[0.95]" style={{ color: "var(--sa-dark)" }}>
              Featured businesses
            </h2>
            <p className="mt-3 text-ink-2">Verified, top-rated, and active on Sjoh.</p>
          </div>
          <Link to="/directory" className="text-sm font-semibold hover:underline hidden md:inline-block" style={{ color: "var(--sa-navy)" }}>
            See all
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
      </section>

      {/* ========== LATEST CUSTOMER REQUESTS ========== */}
      <section className="bg-card border-y border-border">
        <div className="container py-20">
          <div className="flex items-end justify-between mb-10">
            <div className="max-w-xl">
              <h2 className="font-display-bold text-3xl md:text-5xl leading-[0.95]" style={{ color: "var(--sa-dark)" }}>
                Latest customer requests
              </h2>
              <p className="mt-3 text-ink-2">Real requests posted by people and businesses across SA.</p>
            </div>
            <Link to="/requests" className="text-sm font-semibold hover:underline hidden md:inline-block" style={{ color: "var(--sa-navy)" }}>
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

      {/* ========== CTA — green section with tilted stat cards ========== */}
      <section className="relative overflow-hidden grid md:grid-cols-2 gap-12 px-8 md:px-14 py-20" style={{ background: "var(--sa-green)" }}>
        <img
          aria-hidden
          src={heroGroup3}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none mix-blend-luminosity"
        />
        <div
          className="absolute pointer-events-none rounded-full opacity-15"
          style={{ width: 500, height: 500, background: "var(--sa-gold)", top: -200, right: -100 }}
        />
        <div
          className="absolute pointer-events-none rounded-full opacity-10"
          style={{ width: 300, height: 300, background: "var(--sa-navy)", bottom: -100, left: "30%" }}
        />
        <div className="relative z-[1]">
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
            ● For service providers
          </div>
          <h2 className="font-display-bold text-white text-5xl md:text-6xl leading-[0.92] mb-5">
            Get found by<br />people already<br />
            <span className="px-3 py-1 rounded-lg" style={{ background: "var(--sa-gold)", color: "var(--sa-dark)" }}>
              looking.
            </span>
          </h2>
          <p className="text-white/75 text-base leading-relaxed max-w-md mb-8">
            List your business on Sjoh and start getting real enquiries from local clients. We don't take a cut of your work — ever.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button size="lg" asChild className="font-bold rounded-full" style={{ background: "var(--sa-gold)", color: "var(--sa-dark)" }}>
              <Link to="/list">Apply as a Pro <ArrowRight className="size-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="font-bold rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20">
              <Link to="/pricing">30-day free trial</Link>
            </Button>
          </div>
        </div>
        <div className="relative z-[1] flex flex-col gap-4">
          {[
            { num: "0%", lbl: "Commission on jobs", bg: "var(--sa-gold)", color: "var(--sa-dark)", rot: "-1.5deg" },
            { num: "240+", lbl: "Service categories", bg: "var(--sa-navy)", color: "#fff", rot: "1.2deg" },
            { num: "9", lbl: "Provinces covered", bg: "var(--sa-red)", color: "#fff", rot: "-0.8deg" },
          ].map((s) => (
            <div
              key={s.lbl}
              className="rounded-3xl px-7 py-6 flex items-center gap-6"
              style={{ background: s.bg, color: s.color, transform: `rotate(${s.rot})` }}
            >
              <div className="font-display-bold text-5xl tabular-nums shrink-0">{s.num}</div>
              <div className="text-sm font-semibold opacity-75">{s.lbl}</div>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
};

export default HomePage;
