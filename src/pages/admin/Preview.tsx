import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ExternalLink, Search, Shield } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";

interface BizRow {
  id: string;
  name: string;
  slug: string;
  category_name: string;
  province: string;
  city: string;
  listing_status: string;
  is_verified: boolean;
  plan: string;
  owner_id: string;
  created_at: string;
}

const Preview = () => {
  const { loading: rolesLoading, isAdmin } = useUserRoles();
  const [rows, setRows] = useState<BizRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id, name, slug, category_name, province, city, listing_status, is_verified, plan, owner_id, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!cancelled) {
        setRows((data ?? []) as BizRow[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAdmin]);

  if (rolesLoading) {
    return <div className="min-h-dvh grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const needle = q.trim().toLowerCase();
    return r.name.toLowerCase().includes(needle)
      || r.city.toLowerCase().includes(needle)
      || r.category_name.toLowerCase().includes(needle);
  });

  return (
    <SiteLayout>
      <SeoHead title="Admin · Preview" description="Admin business preview" />
      <div className="container py-10">
        <header className="mb-6">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <Shield className="size-3.5" /> Admin
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight mt-2">Business preview</h1>
          <p className="text-sm text-ink-2 mt-1">
            Read-only directory of every business on Sjoh. Jump straight to their public profile or their owner-facing pages.
            (True "log in as" impersonation is queued as a follow-up — needs scoped session minting + audit logs.)
          </p>
        </header>

        <div className="bg-card border border-border rounded-xl p-3 mb-4 flex items-center gap-2">
          <Search className="size-4 text-muted-foreground ml-2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, city, or category…"
            className="border-0 focus-visible:ring-0 shadow-none"
          />
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground bg-secondary">
              <tr>
                <th className="text-left px-4 py-3">Business</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Location</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Plan</th>
                <th className="text-right px-4 py-3">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No businesses match.</td></tr>
              ) : filtered.map((b) => (
                <tr key={b.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-semibold">{b.name}</td>
                  <td className="px-4 py-3 text-ink-2">{b.category_name}</td>
                  <td className="px-4 py-3 text-ink-2">{b.city}, {b.province}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-secondary text-ink-2">
                      {b.listing_status}
                    </span>
                    {b.is_verified && (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-primary-light text-primary">
                        Verified
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-2">{b.plan}</td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/business/${b.slug}`} target="_blank">
                        Profile <ExternalLink className="size-3" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <Link to="/dashboard" className="bg-card border border-border rounded-xl p-4 hover:border-primary">
            <div className="font-semibold">Dashboard</div>
            <div className="text-xs text-muted-foreground">Your own pro view (current admin user)</div>
          </Link>
          <Link to="/admin/founding-members" className="bg-card border border-border rounded-xl p-4 hover:border-primary">
            <div className="font-semibold">Founding members</div>
            <div className="text-xs text-muted-foreground">Manage early-access spots</div>
          </Link>
          <Link to="/admin/disputes" className="bg-card border border-border rounded-xl p-4 hover:border-primary">
            <div className="font-semibold">Disputes</div>
            <div className="text-xs text-muted-foreground">Handle reported issues</div>
          </Link>
          <Link to="/admin/concierge" className="bg-card border border-border rounded-xl p-4 hover:border-primary">
            <div className="font-semibold">Concierge</div>
            <div className="text-xs text-muted-foreground">Manually-sourced leads</div>
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
};

export default Preview;
