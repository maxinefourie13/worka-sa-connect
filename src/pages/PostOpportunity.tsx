import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { CATEGORIES, CATEGORY_GROUPS, PROVINCES } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PostOpportunity = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [groupSlug, setGroupSlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("");

  const subCats = groupSlug ? CATEGORIES.filter((c) => c.groupSlug === groupSlug) : [];

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast({
      title: urgent ? "Urgent job posted" : "Job posted",
      description: urgent
        ? "R50 urgent fee applied. Your job has priority visibility."
        : "Real people will start responding shortly.",
    });
    setTimeout(() => navigate("/opportunities"), 2000);
  };

  if (submitted) {
    return (
      <SiteLayout>
        <div className="container py-24 max-w-lg text-center">
          <div className="size-16 rounded-full bg-primary-light text-primary mx-auto flex items-center justify-center mb-6">
            <CheckCircle2 className="size-8" />
          </div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Job posted</h1>
          <p className="mt-3 text-ink-2">Real people will start responding shortly.</p>
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
            Tell people what you need done
          </h1>
          <p className="mt-2 text-ink-2">Get responses from businesses ready to help. You contact them directly — no middleman.</p>
        </header>

        <form onSubmit={onSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-5 shadow-card">
          <Field label="What do you need?" required>
            <input required className="input" placeholder="e.g. Fix a leaking pipe in Centurion" />
          </Field>
          <Field label="Description" required>
            <textarea required rows={4} className="input resize-none" placeholder="Describe the job clearly so the right people respond." />
          </Field>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Category" required>
              <select required className="input cursor-pointer">
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Province" required>
              <select required className="input cursor-pointer">
                <option value="">Select a province</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="City / suburb" required>
              <input required className="input" placeholder="e.g. Sandton" />
            </Field>
            <Field label="Budget (R)" required>
              <input required type="number" min="0" className="input" placeholder="What are you willing to spend?" />
            </Field>
            <Field label="Deadline">
              <input type="date" className="input" />
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
            <textarea rows={3} className="input resize-none" placeholder="Certifications, references, insurance, etc." />
          </Field>

          {/* Urgent upgrade */}
          <button
            type="button"
            onClick={() => setUrgent((u) => !u)}
            className={cn(
              "w-full text-left border rounded-xl p-4 flex items-start gap-3 transition-all",
              urgent ? "border-accent bg-accent/10" : "border-border hover:border-accent/50",
            )}
          >
            <span className={cn(
              "size-5 rounded-md border-2 shrink-0 flex items-center justify-center mt-0.5",
              urgent ? "border-accent bg-accent" : "border-border",
            )}>
              {urgent && <CheckCircle2 className="size-3.5 text-accent-foreground" strokeWidth={3} />}
            </span>
            <div className="flex-1">
              <span className="font-semibold text-sm">Mark as urgent — R50</span>
              <p className="text-xs text-ink-2 mt-1">
                Your job gets priority visibility so businesses can respond faster. An <span className="font-bold tracking-wider text-accent">URGENT</span> badge appears on your post.
              </p>
            </div>
          </button>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button type="submit" size="lg" className="flex-1">
              {urgent ? "Post job (R50 urgent)" : "Post job"}
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
