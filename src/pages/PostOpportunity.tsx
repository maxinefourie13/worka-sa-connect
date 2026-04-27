import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { LiabilityDisclaimer } from "@/components/LiabilityDisclaimer";
import { CATEGORIES, CATEGORY_GROUPS, PROVINCES } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { findProhibited, PROHIBITED_MESSAGE } from "@/lib/prohibitedKeywords";

const PostOpportunity = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [groupSlug, setGroupSlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const subCats = groupSlug ? CATEGORIES.filter((c) => c.groupSlug === groupSlug) : [];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!agreeTerms) {
      toast({ title: "Tick the box, boet", description: "You need to agree to the Terms before posting.", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    const form = new FormData(e.currentTarget as HTMLFormElement);
    const titleVal = String(form.get("title") ?? "");
    const descVal = String(form.get("description") ?? "");
    const reqVal = String(form.get("requirements") ?? "");

    const banned = findProhibited(`${titleVal}\n${descVal}\n${reqVal}`);
    if (banned) {
      toast({ title: "Aikona!", description: PROHIBITED_MESSAGE, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const category = CATEGORIES.find((c) => c.slug === categorySlug);
    const group = CATEGORY_GROUPS.find((g) => g.slug === groupSlug);

    const payload = {
      client_id: user.id,
      title: titleVal,
      description: descVal,
      category_slug: categorySlug,
      category_name: category?.name ?? group?.name ?? "Uncategorised",
      province: String(form.get("province") ?? ""),
      city: String(form.get("city") ?? ""),
      budget: Number(form.get("budget") ?? 0),
      budget_type: "estimate" as const,
      deadline: form.get("deadline") ? String(form.get("deadline")) : null,
      requirements: reqVal ? [reqVal] : [],
      posted_by_name: user.email?.split("@")[0] ?? null,
    };

    const { data: opp, error } = await supabase
      .from("opportunities")
      .insert(payload)
      .select()
      .single();

    if (error) {
      toast({ title: "Couldn't post job", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Notify all matching providers (email + push). Fire and forget.
    supabase.functions
      .invoke("notify-new-job", { body: { opportunity_id: opp.id } })
      .catch((e) => console.error("[notify-new-job]", e));

    setSubmitted(true);
    toast({
      title: "Sharp-sharp!",
      description: "Your job is live. The okes are warming up their bakkies.",
    });
    setTimeout(() => navigate("/opportunities"), 1500);
  };

  if (submitted) {
    return (
      <SiteLayout>
        <div className="container py-24 max-w-lg text-center">
          <div className="size-16 rounded-full bg-primary-light text-primary mx-auto flex items-center justify-center mb-6">
            <CheckCircle2 className="size-8" />
          </div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Sharp-sharp!</h1>
          <p className="mt-3 text-ink-2">Your job is live. The okes are warming up their bakkies.</p>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="container py-12 max-w-2xl">
        <Link to="/opportunities" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="size-4" /> Back to opportunities
        </Link>
        <header className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
            What's the damage?
          </h1>
          <p className="mt-2 text-ink-2">Get responses from real okes ready to help. You contact them directly — no middleman.</p>
        </header>

        <form onSubmit={onSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-5 shadow-card">
          <Field label="What do you need?" required>
            <input required name="title" className="input" placeholder="E.g., The geyser is crying, please help." />
          </Field>
          <Field label="Description" required>
            <textarea required name="description" rows={4} className="input resize-none" placeholder="Don't hold back. Tell the okes exactly how bad the DIY disaster is..." />
          </Field>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Category group" required>
              <select
                required
                className="input cursor-pointer"
                value={groupSlug}
                onChange={(e) => {
                  setGroupSlug(e.target.value);
                  setCategorySlug("");
                }}
              >
                <option value="">Select a group</option>
                {CATEGORY_GROUPS.map((g) => <option key={g.slug} value={g.slug}>{g.name}</option>)}
              </select>
            </Field>
            <Field label="Service" required>
              <select
                required
                className="input cursor-pointer"
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                disabled={!groupSlug}
              >
                <option value="">{groupSlug ? "Select a service" : "Pick a group first"}</option>
                {subCats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Province" required>
              <select required name="province" className="input cursor-pointer">
                <option value="">Select a province</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="City / suburb" required>
              <input required name="city" className="input" placeholder="e.g. Sandton" />
            </Field>
            <Field label="Budget (R)" required>
              <input required name="budget" type="number" min="0" className="input" placeholder="What are you willing to spend?" />
            </Field>
            <Field label="Deadline">
              <input name="deadline" type="date" className="input" />
            </Field>
            <Field label="Contact preference">
              <select className="input cursor-pointer">
                <option>WhatsApp</option>
                <option>Phone call</option>
                <option>Email</option>
                <option>In-platform messages</option>
              </select>
            </Field>
          </div>
          <Field label="Specific requirements">
            <textarea name="requirements" rows={3} className="input resize-none" placeholder="Certifications, references, insurance, etc." />
          </Field>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button type="submit" size="lg" className="flex-1" disabled={submitting}>
              {submitting ? "Just now, just now…" : "Let's Gooi"}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
          font-size: 0.875rem;
          font-family: inherit;
          color: hsl(var(--foreground));
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input:focus {
          outline: none;
          border-color: hsl(var(--primary));
          box-shadow: 0 0 0 3px hsl(var(--primary) / 0.15);
        }
      `}</style>
    </SiteLayout>
  );
};

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <label className="block">
    <span className="block text-sm font-semibold mb-1.5">
      {label} {required && <span className="text-primary">*</span>}
    </span>
    {children}
  </label>
);

export default PostOpportunity;
