import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Search, Star, ArrowRight, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";
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
import heroGroup2 from "@/assets/hero-group-2.jpg";
import heroGroup3 from "@/assets/hero-group-3.jpg";
import solarInstaller from "@/assets/solar-installer.jpg";

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

const HERO_SERVICE_CARDS = [
  { title: "Wedding photographer", meta: "Cape Town · ready to book", color: "var(--sa-pink)" },
  { title: "Electrical COC", meta: "Pretoria · quote requested", color: "var(--sa-gold)" },
  { title: "Website refresh", meta: "Remote · budget shared", color: "var(--sa-peri)" },
  { title: "Garden service", meta: "Durban · this week", color: "var(--sa-green)" },
];

const MESSAGE_THREAD = [
  { who: "Customer", text: "Thank you, the photos came out beautifully. I found you so quickly on Sjoh." },
  { who: "Pro", text: "Ah, I’m so glad. It helps when the job brief is already clear before we chat." },
  { who: "Customer", text: "Five stars. I’m sending your profile to my cousin for her event too." },
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
      <section
        className="relative overflow-hidden border-b border-white/10 bg-[#050505]"
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="container relative pt-14 pb-12 lg:pt-20 lg:pb-16">
          <div className="grid lg:grid-cols-[minmax(0,0.96fr)_minmax(420px,0.74fr)] gap-8 lg:gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/8 border border-white/15 text-xs font-semibold mb-4 text-white/85">
                <span className="size-2 rounded-full" style={{ background: "var(--sa-pink)" }} />
                No commission. No middlemen. Real grafters.
              </span>
              <div className="mb-6 max-w-md">
                <FoundingSpotsBanner />
              </div>

              <div className="min-h-[12rem] sm:min-h-[10.5rem] lg:min-h-[13.5rem] flex items-center">
                <h1 className="font-display-bold text-4xl sm:text-5xl md:text-6xl leading-[1.03] max-w-4xl text-balance text-white">
                  <Typewriter
                    phrases={HERO_PHRASES}
                    randomize
                    typingSpeed={75}
                    erasingSpeed={35}
                    holdDuration={3200}
                    accentRotation={["text-sa-pink", "text-sa-gold", "text-sa-peri", "text-sa-red"]}
                  />
                </h1>
              </div>

              <p className="mt-7 mb-3 text-sm md:text-base font-semibold uppercase tracking-widest text-white/55">
                What do you need?
              </p>

              <form
                onSubmit={onSearch}
                className="w-full max-w-3xl bg-card p-2 rounded-[1.35rem] shadow-card border border-border flex flex-col md:flex-row gap-2 transition-shadow focus-within:shadow-pop"
              >
                <div className="flex-1 flex items-center gap-3 px-4">
                  <Search className="size-4 text-muted-foreground shrink-0" />
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    type="text"
                    placeholder="Search plumbers, electricians, designers..."
                    className="w-full py-3.5 bg-transparent outline-none text-base placeholder:text-muted-foreground font-medium"
                  />
                </div>
                <div className="hidden md:block w-px bg-border my-2" />
                <div className="relative md:min-w-[190px]">
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

              <div className="mt-7 flex flex-wrap gap-2 max-w-2xl">
                <span className="text-xs font-semibold uppercase tracking-widest text-white/55 self-center mr-1">
                  Popular:
                </span>
                {popularCats.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/directory?category=${c.slug}`}
                    className="text-sm font-medium px-3.5 py-1.5 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/40 hover:-translate-y-0.5 transition-all duration-200 ease-out"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="relative min-h-[540px] hidden lg:block">
              <div className="absolute right-0 top-2 w-[88%] overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.06] p-3 shadow-pop">
                <img src={heroGroup2} alt="South Africans using Sjoh" className="h-[390px] w-full rounded-[1.45rem] object-cover" />
                <div className="absolute left-7 top-7 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                  Real people. Real work. All over SA.
                </div>
                <div className="absolute bottom-7 left-7 right-7 rounded-[1.4rem] border border-white/20 bg-white/18 p-4 text-white shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-white/65">Search in progress</div>
                      <div className="mt-1 font-display text-xl font-extrabold">Find a trusted pro</div>
                    </div>
                    <span className="rounded-full bg-sa-gold px-3 py-1 text-xs font-black text-sa-dark">9 provinces</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
                    <ShieldCheck className="size-4 text-sa-green" />
                    Reviews, verified badges, clear job details
                  </div>
                </div>
              </div>

              <div className="absolute -left-2 top-20 w-52 rotate-[-3deg] rounded-[1.5rem] border-2 border-black bg-sa-gold p-4 text-sa-dark shadow-[8px_8px_0_rgba(255,255,255,0.16)]">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                  <Clock className="size-4" /> Warm lead
                </div>
                <p className="mt-2 text-sm font-bold leading-snug">Already knows the job, location, and budget.</p>
              </div>

              <div className="absolute -left-8 bottom-12 w-72 rounded-[1.4rem] border border-white/15 bg-[#111]/90 p-3 shadow-pop backdrop-blur-md">
                <div className="px-2 pb-2 text-[10px] font-black uppercase tracking-widest text-white/42">Live requests</div>
                {HERO_SERVICE_CARDS.map((card) => (
                  <div key={card.title} className="flex items-center justify-between gap-3 border-b border-white/10 py-2.5 last:border-0">
                    <div>
                      <p className="text-sm font-extrabold text-white">{card.title}</p>
                      <p className="text-[11px] text-white/48">{card.meta}</p>
                    </div>
                    <span className="size-3 rounded-full" style={{ background: card.color }} />
                  </div>
                ))}
              </div>

              <div className="absolute right-5 -bottom-1 flex items-center gap-2 rounded-full border border-white/15 bg-white px-4 py-2 text-sm font-black text-sa-dark shadow-xl">
                <Star className="size-4 fill-sa-gold text-sa-gold" /> 4.9 average rating
              </div>
            </div>
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

      {/* ========== PHOTO BAND — local work, product cards ========== */}
      <section className="bg-[#050505] px-4 py-16">
        <div className="container">
          <div className="relative min-h-[620px] overflow-hidden rounded-[2.25rem] border border-white/10">
            <img src={heroGroup1} alt="South Africans using Sjoh" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/28 to-black/8" />
            <div className="relative z-[1] flex min-h-[620px] flex-col justify-end p-6 md:p-10">
              <div className="max-w-2xl">
                <div className="text-[11px] font-bold tracking-[0.1em] uppercase mb-4 text-white/62">
                  ● Real help, close by
                </div>
                <h2 className="font-display-bold text-white text-4xl md:text-6xl leading-[1.02] mb-4">
                  Find the skill.<br />Check the reviews.<br />Get it <span className="text-sa-gold">sorted.</span>
                </h2>
                <p className="text-white/70 text-base leading-relaxed max-w-md mb-7">
                  Search the directory, post a request, or list your business where people are already looking for exactly what you do.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { title: "Post a request", body: "Share the job once and let interested pros come back to you.", cta: "Start here", to: "/requests/new" },
                  { title: "Browse vetted pros", body: "Compare profiles, reviews, work areas, and services across SA.", cta: "Open directory", to: "/directory" },
                  { title: "List your business", body: "Turn searches into warm leads from people ready to hire.", cta: "Apply as a pro", to: "/list" },
                ].map((card) => (
                  <Link
                    key={card.title}
                    to={card.to}
                    className="group min-h-[190px] rounded-[1.4rem] border border-white/18 bg-white/16 p-5 text-white backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/22"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-white/55">{card.cta}</span>
                      <span className="grid size-9 place-items-center rounded-full bg-sa-gold text-sa-dark transition group-hover:rotate-[-12deg]">
                        <ArrowRight className="size-4" />
                      </span>
                    </div>
                    <h3 className="mt-10 font-display text-2xl font-extrabold">{card.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/68">{card.body}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== TRUST MESSAGES ========== */}
      <section className="bg-[#101010] py-20">
        <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="text-[11px] font-bold tracking-[0.1em] uppercase mb-4 text-sa-pink">
              ● After the job
            </div>
            <h2 className="font-display-bold text-white text-4xl md:text-5xl leading-[1.03]">
              Good work turns into the next warm lead.
            </h2>
            <p className="mt-4 max-w-md text-white/62">
              Sjoh gives customers confidence before they hire, and gives business owners leads that already understand what they need.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 md:p-6">
            <img src={solarInstaller} alt="South African service provider at work" className="absolute inset-0 h-full w-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-[1] ml-auto max-w-xl space-y-3">
              {MESSAGE_THREAD.map((msg, i) => (
                <div
                  key={`${msg.who}-${msg.text}`}
                  className={`max-w-[86%] rounded-[1.35rem] border p-4 text-sm shadow-xl backdrop-blur-xl ${
                    i % 2 === 0
                      ? "mr-auto border-white/15 bg-white/90 text-sa-dark"
                      : "ml-auto border-sa-gold/40 bg-sa-gold/95 text-sa-dark"
                  }`}
                >
                  <div className="mb-1 text-[10px] font-black uppercase tracking-widest opacity-55">{msg.who}</div>
                  <p className="font-semibold leading-relaxed">{msg.text}</p>
                </div>
              ))}
              <div className="ml-auto flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/45 px-4 py-2 text-xs font-bold text-white">
                <CheckCircle2 className="size-4 text-sa-green" />
                Verified review captured on Sjoh
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS — rotated colored cards ========== */}
      <section className="bg-[#101010] py-20">
        <div className="container">
          <div className="text-center mb-16">
            <div className="text-[11px] font-bold tracking-[0.1em] uppercase mb-3" style={{ color: "var(--sa-pink)" }}>
              ● How Sjoh works
            </div>
            <h2 className="font-display-bold text-4xl md:text-5xl leading-[1.03] text-white">
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
      <section className="bg-[#050505] border-y border-white/10">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {[
              { v: "0%", l: "Commission on jobs", c: "var(--sa-red)" },
              { v: "240+", l: "Service categories", c: "var(--sa-navy)" },
              { v: "11", l: "Industry groups", c: "var(--sa-green)" },
              { v: "9", l: "Provinces covered", c: "var(--sa-pink)" },
            ].map((s) => (
              <div key={s.l} className="flex flex-col items-center text-center pt-4 md:pt-0">
                <span className="font-display-bold text-5xl md:text-6xl tabular-nums" style={{ color: s.c }}>
                  {s.v}
                </span>
                <span className="text-sm font-medium text-white/55 mt-2">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CATEGORIES GRID ========== */}
      <section className="bg-[#101010] border-b border-white/10">
        <div className="container py-20">
          <div className="flex items-end justify-between mb-10">
            <div className="max-w-xl">
              <h2 className="font-display-bold text-3xl md:text-5xl leading-[1.03] text-white">
                Browse by category
              </h2>
              <p className="mt-3 text-white/55">From electricians to event planners — everything you need.</p>
            </div>
            <Link to="/directory" className="text-sm font-semibold hover:underline hidden md:inline-block text-sa-gold">
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
                  className="group bg-white/[0.06] border border-white/10 rounded-xl p-5 flex items-center gap-4 hover:border-sa-gold hover:bg-white/[0.1] hover:-translate-y-1 hover:shadow-card transition-all duration-300 ease-out"
                >
                  <span className="size-11 rounded-xl bg-white/10 text-sa-gold flex items-center justify-center shrink-0 group-hover:bg-sa-gold group-hover:text-sa-dark group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Icon className="size-5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-white group-hover:text-sa-gold transition-colors leading-snug">{g.name}</p>
                    <p className="text-xs text-white/45 mt-0.5 tabular-nums">{g.subCount} services</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== FEATURED BUSINESSES ========== */}
      <section className="bg-[#050505] py-20">
        <div className="container">
        <div className="flex items-end justify-between mb-10">
          <div className="max-w-xl">
            <h2 className="font-display-bold text-3xl md:text-5xl leading-[1.03] text-white">
              Featured businesses
            </h2>
            <p className="mt-3 text-white/55">Verified, top-rated, and active on Sjoh.</p>
          </div>
          <Link to="/directory" className="text-sm font-semibold hover:underline hidden md:inline-block text-sa-gold">
            See all
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
        </div>
      </section>

      {/* ========== LATEST CUSTOMER REQUESTS ========== */}
      <section className="bg-[#101010] border-y border-white/10">
        <div className="container py-20">
          <div className="flex items-end justify-between mb-10">
            <div className="max-w-xl">
              <h2 className="font-display-bold text-3xl md:text-5xl leading-[1.03] text-white">
                Latest customer requests
              </h2>
              <p className="mt-3 text-white/55">Real requests posted by people and businesses across SA.</p>
            </div>
            <Link to="/requests" className="text-sm font-semibold hover:underline hidden md:inline-block text-sa-gold">
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
          <h2 className="font-display-bold text-white text-5xl md:text-6xl leading-[1.02] mb-5">
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
            { num: "9", lbl: "Provinces covered", bg: "var(--sa-pink)", color: "#fff", rot: "-0.8deg" },
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
