import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, ShieldCheck, Construction, MapPin, Clock, Siren } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/JobCard";
import { CATEGORIES, PROVINCES } from "@/lib/mockData";
import { useOpportunities } from "@/hooks/useDirectory";
import { useMyBusiness } from "@/hooks/useMyBusiness";
import { cn } from "@/lib/utils";

type SortMode = "nearest" | "newest" | "urgent";

const Opportunities = () => {
  const location = useLocation();
  const isProView = location.pathname.startsWith("/leads");
  const { data: opportunities } = useOpportunities();
  const { business: myBiz } = useMyBusiness();
  const isWorkshopMode = !!myBiz?.pre_launch;
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [province, setProvince] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>(isProView && myBiz?.city ? "nearest" : "newest");

  // Mock client hiring history — keyed by job id. In production this comes from a server-side count.
  const clientHireHistory = useMemo<Record<string, number>>(
    () => ({
      "o1": 4,
      "o3": 7,
      "o5": 2,
      "o6": 1,
    }),
    [],
  );

  const proCity = isProView ? myBiz?.city : undefined;
  const proProvince = isProView ? myBiz?.province : undefined;

  const filtered = useMemo(() => {
    const list = opportunities.filter((o) => {
      if (keyword && !o.title.toLowerCase().includes(keyword.toLowerCase())) return false;
      if (category && o.categorySlug !== category) return false;
      if (province && o.province !== province) return false;
      // "Verified Pros only" filter — keeps jobs where the client has prior history (proxy for trust).
      if (verifiedOnly && !clientHireHistory[o.id]) return false;
      return true;
    });

    // Sort: nearest first uses Pro's city/province match; tie-broken by recency.
    const ts = (o: { createdAt?: string }) => (o.createdAt ? new Date(o.createdAt).getTime() : 0);
    const score = (o: { city: string; province: string }) => {
      if (proCity && o.city.trim().toLowerCase() === proCity.trim().toLowerCase()) return 2;
      if (proProvince && o.province === proProvince) return 1;
      return 0;
    };

    if (sortMode === "urgent") {
      return [...list].sort((a, b) => {
        const ua = a.urgentBoostPaidAt ? 1 : 0;
        const ub = b.urgentBoostPaidAt ? 1 : 0;
        if (ua !== ub) return ub - ua;
        return ts(b) - ts(a);
      });
    }
    if (sortMode === "nearest" && (proCity || proProvince)) {
      return [...list].sort((a, b) => {
        const sa = score(a);
        const sb = score(b);
        if (sa !== sb) return sb - sa;
        return ts(b) - ts(a);
      });
    }
    // newest (default)
    return [...list].sort((a, b) => ts(b) - ts(a));
  }, [opportunities, keyword, category, province, verifiedOnly, clientHireHistory, sortMode, proCity, proProvince]);

  const verifiedCount = opportunities.filter((o) => clientHireHistory[o.id]).length;

  return (
    <SiteLayout>
      <div className="container py-12">
        <header className="mb-8 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            {isProView ? "Send Quotes" : "Get Quotes"}
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mt-2">
            {isProView ? "Find work. Send a quote." : "Tell pros what you need done."}
          </h1>
          <p className="mt-3 text-ink-2">
            {isProView
              ? "Real customer requests, ready for a quote. Contact the customer directly once they accept — no commission."
              : "Post a request and pros will quote you. Or browse the directory and contact someone yourself — no middleman, no commission."}
          </p>
        </header>

        {isWorkshopMode && isProView && (
          <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 md:p-8 mb-10 flex items-start gap-4">
            <span className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Construction className="size-5" strokeWidth={2.5} />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold">No leads yet — we haven't opened the doors to customers.</h2>
              <p className="text-sm text-ink-2 mt-1.5">
                When we launch, this is where new customer requests in your area land. Until then, get your profile sharp so you're first in line. We'll holla the moment we open.
              </p>
            </div>
          </div>
        )}

        {/* Post CTA banner — customer view only */}
        {!isProView && (
          <div className="rounded-2xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground p-6 md:p-8 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight">Need work done?</h2>
              <p className="text-primary-foreground/85 text-sm mt-1">
                Post a request — pros will send you quotes. Or use the filters below to browse what's already on offer.
              </p>
            </div>
            <Button variant="ink" size="lg" asChild>
              <Link to="/requests/new">Get Quotes</Link>
            </Button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-3 flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2 px-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={isProView ? "Search leads…" : "Search requests…"}
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
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="text-sm font-medium border border-border rounded-md px-3 py-2 bg-background cursor-pointer min-w-[180px]"
          >
            <option value="">All provinces</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Filter + sort chips */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => setVerifiedOnly((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all",
              verifiedOnly
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-ink-2 border-border hover:border-primary",
            )}
            title="Only show jobs from clients who've hired on Sjoh before"
          >
            <ShieldCheck className="size-3.5" strokeWidth={2.5} />
            {verifiedOnly ? "Showing trusted clients only" : `Trusted clients only (${verifiedCount})`}
          </button>

          {isProView && (
            <div className="ml-auto inline-flex rounded-full border border-border bg-card p-0.5 text-xs font-bold uppercase tracking-widest">
              {([
                { key: "nearest", label: "Nearest", icon: MapPin, disabled: !proCity && !proProvince },
                { key: "newest", label: "Newest", icon: Clock, disabled: false },
                { key: "urgent", label: "Urgent", icon: Siren, disabled: false },
              ] as const).map((s) => (
                <button
                  key={s.key}
                  onClick={() => !s.disabled && setSortMode(s.key)}
                  disabled={s.disabled}
                  title={s.disabled ? "Set your business city to sort by nearest" : `Sort by ${s.label.toLowerCase()}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors disabled:opacity-40",
                    sortMode === s.key ? "bg-foreground text-background" : "text-ink-2 hover:text-foreground",
                  )}
                >
                  <s.icon className="size-3.5" strokeWidth={2.5} />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground mb-4 tabular-nums flex items-center gap-2">
          <span>{filtered.length} {isProView
            ? `job${filtered.length === 1 ? "" : "s"} to quote`
            : `open request${filtered.length === 1 ? "" : "s"}`}</span>
          {isProView && sortMode === "nearest" && proCity && (
            <span className="text-ink-2">· nearest to <span className="font-semibold text-foreground">{proCity}</span></span>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <p className="text-ink-2">Aikona — nothing matches your filters yet.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-5">
            {filtered.map((o) => (
              <JobCard
                key={o.id}
                job={o}
                clientHireCount={clientHireHistory[o.id]}
                isProView={isProView}
                proCity={proCity}
              />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
};

export default Opportunities;
