import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Briefcase } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/JobCard";
import { OPPORTUNITIES, CATEGORIES, PROVINCES } from "@/lib/mockData";

const Opportunities = () => {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [province, setProvince] = useState("");

  const filtered = useMemo(() => {
    return OPPORTUNITIES.filter((o) => {
      if (keyword && !o.title.toLowerCase().includes(keyword.toLowerCase())) return false;
      if (category && o.categorySlug !== category) return false;
      if (province && o.province !== province) return false;
      return true;
    });
  }, [keyword, category, province]);

  return (
    <SiteLayout>
      <div className="container py-12">
        <header className="mb-8 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Opportunity board</span>
          <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight mt-2">
            Real work, posted by real people.
          </h1>
          <p className="mt-3 text-ink-2">
            Browse opportunities from homeowners and businesses across South Africa. Apply directly — no middlemen.
          </p>
        </header>

        {/* Post CTA banner */}
        <div className="rounded-2xl bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground p-6 md:p-8 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="size-12 rounded-xl bg-white/15 flex items-center justify-center">
              <Briefcase className="size-6" />
            </span>
            <div>
              <h2 className="font-display text-xl md:text-2xl font-semibold">Need work done?</h2>
              <p className="text-primary-foreground/85 text-sm mt-1">
                Post an opportunity and let qualified businesses come to you. It's free.
              </p>
            </div>
          </div>
          <Button variant="ink" size="lg" asChild>
            <Link to="/opportunities/new"><Plus className="size-4" />Post an Opportunity</Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-3 flex flex-col md:flex-row gap-3 mb-8">
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
