import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Siren } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/JobCard";
import { OPPORTUNITIES, CATEGORIES, PROVINCES } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const Opportunities = () => {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [province, setProvince] = useState("");
  const [urgentOnly, setUrgentOnly] = useState(false);

  const filtered = useMemo(() => {
    const list = OPPORTUNITIES.filter((o) => {
      if (keyword && !o.title.toLowerCase().includes(keyword.toLowerCase())) return false;
      if (category && o.categorySlug !== category) return false;
      if (province && o.province !== province) return false;
      if (urgentOnly && !o.isUrgent) return false;
      return true;
    });
    // Always sort urgent jobs first
    return [...list].sort((a, b) => Number(b.isUrgent) - Number(a.isUrgent));
  }, [keyword, category, province, urgentOnly]);

  const urgentCount = OPPORTUNITIES.filter((o) => o.isUrgent).length;

  return (
    <SiteLayout>
      <div className="container py-12">
        <header className="mb-8 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Opportunity board</span>
          <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight mt-2">
            Tell people what you need done.
          </h1>
          <p className="mt-3 text-ink-2">
            Get responses from businesses ready to help. Contact them directly — no middleman, no commission.
          </p>
        </header>

        {/* Post CTA banner */}
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground p-6 md:p-8 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-semibold">Need work done?</h2>
            <p className="text-primary-foreground/85 text-sm mt-1">
              Post a job and let real people come to you. Mark it Urgent for instant response.
            </p>
          </div>
          <Button variant="ink" size="lg" asChild>
            <Link to="/opportunities/new">Post a Job</Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-3 flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2 px-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search opportunities…"
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

        {/* Urgent filter chip */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setUrgentOnly((u) => !u)}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all",
              urgentOnly
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-card text-ink-2 border-border hover:border-accent",
            )}
          >
            <Siren className="size-3.5" />
            {urgentOnly ? "Showing urgent only" : `Eish! Urgent (${urgentCount})`}
          </button>
        </div>

        <div className="text-sm text-muted-foreground mb-4 tabular-nums">
          {filtered.length} opportunit{filtered.length === 1 ? "y" : "ies"} found
        </div>

        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <p className="text-ink-2">No opportunities match your filters.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-5">
            {filtered.map((o) => (
              <JobCard key={o.id} job={o} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
};

export default Opportunities;
