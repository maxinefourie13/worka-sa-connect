import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, Plus, Sparkles, ExternalLink, Trash2 } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { SeoHead } from "@/components/SeoHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CATEGORIES, PROVINCES } from "@/lib/mockData";

interface ConciergeJob {
  id: string;
  title: string;
  description: string;
  category_name: string;
  category_slug: string;
  province: string;
  city: string;
  external_contact_url: string | null;
  created_at: string;
  status: string;
}

const ConciergeAdmin = () => {
  const { user } = useAuth();
  const { loading: rolesLoading, isAdmin } = useUserRoles();

  const [jobs, setJobs] = useState<ConciergeJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categorySlug, setCategorySlug] = useState<string>("");
  const [province, setProvince] = useState<string>("");
  const [city, setCity] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [budget, setBudget] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("opportunities")
      .select("id,title,description,category_name,category_slug,province,city,external_contact_url,created_at,status")
      .eq("is_concierge_lead", true)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      toast({ title: "Couldn't load concierge jobs", description: error.message, variant: "destructive" });
    } else {
      setJobs((data ?? []) as ConciergeJob[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin]);

  if (rolesLoading) {
    return (
      <SiteLayout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </SiteLayout>
    );
  }
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !categorySlug || !province || !city.trim() || !externalUrl.trim()) {
      toast({ title: "Fill in every field", description: "Concierge leads need full context for pros.", variant: "destructive" });
      return;
    }
    try {
      new URL(externalUrl);
    } catch {
      toast({ title: "External link looks off", description: "Paste a full URL (https://… or https://wa.me/…).", variant: "destructive" });
      return;
    }

    const cat = CATEGORIES.find((c) => c.slug === categorySlug);
    if (!cat) return;

    setSubmitting(true);
    const { error } = await supabase.from("opportunities").insert({
      title: title.trim(),
      description: description.trim(),
      category_slug: cat.slug,
      category_name: cat.name,
      province,
      city: city.trim(),
      budget: budget ? Number(budget) : 0,
      budget_type: "estimate",
      requirements: [],
      posted_by_name: "Sjoh Concierge",
      external_contact_url: externalUrl.trim(),
      is_concierge_lead: true,
      client_id: null,
      status: "open",
    } as any);
    setSubmitting(false);

    if (error) {
      toast({ title: "Couldn't post the lead", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Concierge lead posted ✓", description: "Pros in the area will see it now." });
    setTitle(""); setDescription(""); setCategorySlug(""); setProvince(""); setCity(""); setExternalUrl(""); setBudget("");
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this concierge lead from the feed?")) return;
    const { error } = await supabase.from("opportunities").delete().eq("id", id);
    if (error) {
      toast({ title: "Couldn't remove", description: error.message, variant: "destructive" });
      return;
    }
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  return (
    <SiteLayout>
      <SeoHead title="Concierge — Sjoh Admin" description="Inject sourced leads into the Sjoh feed." noindex />
      <div className="container py-10 max-w-5xl">
        <header className="mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <Sparkles className="size-3.5" /> Admin · Concierge
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight mt-2">
            Inject a real lead into the feed
          </h1>
          <p className="mt-2 text-ink-2 max-w-2xl">
            Found a job on Facebook, WhatsApp, or somewhere else? Paste the details here. It posts to the live feed with a
            "Sourced by Sjoh Concierge" badge. Pros get instant value, no signup needed from the client.
          </p>
        </header>

        <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-4 mb-10">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Job title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Need a plumber in Fourways" maxLength={120} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">External contact link</label>
              <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://wa.me/27… or https://facebook.com/…" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Paste the original FB post or summarise the WhatsApp request. Include scope, urgency, anything useful."
              maxLength={2000}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</label>
              <Select value={categorySlug} onValueChange={setCategorySlug}>
                <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Province</label>
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger><SelectValue placeholder="Choose province" /></SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">City / area</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Fourways" maxLength={80} />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estimated budget (R)</label>
              <Input type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={submitting} className="gap-1.5">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Post concierge lead
            </Button>
          </div>
        </form>

        <h2 className="font-display text-xl font-extrabold tracking-tight mb-4">Live concierge leads</h2>
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : jobs.length === 0 ? (
          <p className="text-muted-foreground text-sm">No concierge leads in the feed yet.</p>
        ) : (
          <ul className="space-y-3">
            {jobs.map((j) => (
              <li key={j.id} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold">{j.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {j.category_name} · {j.city}, {j.province} · {new Date(j.created_at).toLocaleDateString("en-ZA")}
                  </p>
                  <p className="text-sm text-ink-2 mt-2 line-clamp-2">{j.description}</p>
                  {j.external_contact_url && (
                    <a
                      href={j.external_contact_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                    >
                      <ExternalLink className="size-3" /> Original source
                    </a>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => remove(j.id)} className="text-destructive shrink-0">
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SiteLayout>
  );
};

export default ConciergeAdmin;
