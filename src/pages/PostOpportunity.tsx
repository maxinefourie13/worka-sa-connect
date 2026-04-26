import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { CATEGORIES, PROVINCES } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

const PostOpportunity = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast({ title: "Opportunity posted", description: "Businesses can now apply (mock — backend coming soon)." });
    setTimeout(() => navigate("/opportunities"), 2000);
  };

  if (submitted) {
    return (
      <SiteLayout>
        <div className="container py-24 max-w-lg text-center">
          <div className="size-16 rounded-full bg-primary-light text-primary mx-auto flex items-center justify-center mb-6">
            <CheckCircle2 className="size-8" />
          </div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Opportunity posted</h1>
          <p className="mt-3 text-ink-2">Qualified businesses will start applying shortly.</p>
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
            Post an opportunity
          </h1>
          <p className="mt-2 text-ink-2">Tell us what you need. Verified businesses will apply.</p>
        </header>

        <form onSubmit={onSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-5 shadow-card">
          <Field label="Job title" required>
            <input required className="input" placeholder="e.g. Solar PV installation for office" />
          </Field>
          <Field label="Description" required>
            <textarea required rows={4} className="input resize-none" placeholder="Describe the work, scope, location specifics, and any deadlines." />
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
              <input required type="number" min="0" className="input" placeholder="e.g. 25000" />
            </Field>
            <Field label="Deadline">
              <input type="date" className="input" />
            </Field>
            <Field label="Contact preference">
              <select className="input cursor-pointer">
                <option>In-platform messages</option>
                <option>Email</option>
                <option>Phone call</option>
              </select>
            </Field>
          </div>
          <Field label="Specific requirements">
            <textarea rows={3} className="input resize-none" placeholder="Certifications, references, insurance, etc." />
          </Field>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button type="submit" size="lg" className="flex-1">Post Opportunity</Button>
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
