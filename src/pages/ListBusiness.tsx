import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, ArrowRight, ArrowLeft, CheckCircle2, Upload } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { CATEGORIES, CATEGORY_GROUPS, PROVINCES } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const STEPS = ["Basics", "Profile", "Choose Plan", "Review", "Done"] as const;

const PLANS = [
  { id: "free", name: "Free", price: "R 0/mo", desc: "Get listed. Start showing up." },
  { id: "standard", name: "Standard", price: "R 0 for 3 months", desc: "Full profile, promotions, opportunities.", recommended: true },
  { id: "featured", name: "Featured", price: "R 250/mo", desc: "Get seen first. Top of search and homepage." },
];

const ListBusiness = () => {
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState("standard");
  const [groupSlug, setGroupSlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const navigate = useNavigate();

  const subCats = groupSlug ? CATEGORIES.filter((c) => c.groupSlug === groupSlug) : [];

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <SiteLayout>
      <div className="container py-12 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="size-4" /> Back home
        </Link>

        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between gap-1">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-3 flex-1 last:flex-none">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "size-8 rounded-full flex items-center justify-center text-xs font-bold tabular-nums",
                      i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-foreground text-background" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {i < step ? <Check className="size-4" /> : i + 1}
                  </span>
                  <span className={cn("text-sm font-semibold hidden sm:inline", i === step ? "text-foreground" : "text-muted-foreground")}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-px flex-1 mx-1", i < step ? "bg-primary" : "bg-border")} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-semibold">Business basics</h2>
                <p className="text-sm text-ink-2 mt-1">Tell us who you are and how to reach you.</p>
              </div>
              <Field label="Business name"><input className="input" placeholder="e.g. Khumalo Electrical Contractors" /></Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Category group">
                  <select
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
                <Field label="Service">
                  <select
                    className="input cursor-pointer"
                    value={categorySlug}
                    onChange={(e) => setCategorySlug(e.target.value)}
                    disabled={!groupSlug}
                  >
                    <option value="">{groupSlug ? "Select a service" : "Pick a group first"}</option>
                    {subCats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Province">
                  <select className="input cursor-pointer">
                    <option value="">Select a province</option>
                    {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="City / Suburb"><input className="input" placeholder="e.g. Sandton" /></Field>
                <Field label="Phone"><input className="input" placeholder="+27 ..." /></Field>
                <Field label="Email"><input type="email" className="input" placeholder="hello@yourbiz.co.za" /></Field>
                <Field label="Website (optional)"><input className="input" placeholder="yourbiz.co.za" /></Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-semibold">Profile details</h2>
                <p className="text-sm text-ink-2 mt-1">Show people what you do.</p>
              </div>
              <Field label="Description">
                <textarea rows={4} className="input resize-none" placeholder="What you do, who you serve, what makes you good." />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <UploadField label="Logo" />
                <UploadField label="Cover image" />
              </div>
              <Field label="Services offered (comma separated)">
                <input className="input" placeholder="e.g. COC inspections, solar PV, emergency callouts" />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-semibold">Choose your plan</h2>
                <p className="text-sm text-ink-2 mt-1">You can upgrade or downgrade anytime.</p>
              </div>
              <div className="space-y-3">
                {PLANS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlan(p.id)}
                    className={cn(
                      "w-full text-left border rounded-xl p-4 flex items-center gap-4 transition-all",
                      plan === p.id ? "border-primary bg-primary-light/40 shadow-soft" : "border-border hover:border-primary/40",
                    )}
                  >
                    <span className={cn("size-5 rounded-full border-2 shrink-0 flex items-center justify-center", plan === p.id ? "border-primary bg-primary" : "border-border")}>
                      {plan === p.id && <Check className="size-3 text-primary-foreground" strokeWidth={3} />}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{p.name}</span>
                        {p.recommended && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary-light px-2 py-0.5 rounded">Recommended</span>
                        )}
                      </div>
                      <p className="text-xs text-ink-2 mt-0.5">{p.desc}</p>
                    </div>
                    <span className="font-display font-semibold whitespace-nowrap">{p.price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-semibold">Review and confirm</h2>
                <p className="text-sm text-ink-2 mt-1">
                  {plan === "free"
                    ? "You'll be listed on Sjoh in seconds."
                    : "We'll start your 3-month free Standard plan. No card required."}
                </p>
              </div>
              <div className="rounded-xl border border-border p-5 bg-secondary/40">
                <p className="text-sm font-semibold mb-2">Selected plan</p>
                <p className="font-display text-xl font-semibold capitalize">{plan}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {plan === "free" && "R 0 / month — basic listing."}
                  {plan === "standard" && "R 0 for the first 3 months, then R 50 / month. Cancel anytime."}
                  {plan === "featured" && "R 250 / month — top of search and homepage placement."}
                </p>
              </div>
              {plan !== "free" && (
                <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                  Stripe checkout will appear here in the live version.
                </div>
              )}

              {/* Mandatory WhatsApp consent — POPIA-compliant, NOT pre-checked */}
              <label className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 cursor-pointer hover:border-primary/40 transition-colors">
                <input
                  type="checkbox"
                  checked={whatsappConsent}
                  onChange={(e) => setWhatsappConsent(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-border accent-primary cursor-pointer shrink-0"
                />
                <span className="text-sm text-ink-2 leading-relaxed">
                  <strong className="text-foreground">I explicitly consent</strong> to receive lead alerts via WhatsApp from Sjoh,
                  and I understand I can opt out at any time from my dashboard. Standard
                  message rates may apply.
                </span>
              </label>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-8">
              <div className="size-16 rounded-full bg-primary-light text-primary mx-auto flex items-center justify-center mb-6">
                <CheckCircle2 className="size-8" />
              </div>
              <h2 className="font-display text-3xl font-medium tracking-tight">You're listed on Sjoh.</h2>
              <p className="mt-3 text-ink-2 max-w-md mx-auto">
                Your profile is live in the directory. Start posting promotions and sending quotes on customer requests from your dashboard.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
                <Button variant="outline" onClick={() => navigate("/directory")}>View Directory</Button>
              </div>
            </div>
          )}

          {step < 4 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button variant="ghost" onClick={prev} disabled={step === 0}>
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button onClick={next} disabled={step === 3 && !whatsappConsent}>
                {step === 3 ? (
                  <>Confirm and Publish</>
                ) : (
                  <>Continue <ArrowRight className="size-4" /></>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .input {
          width: 100%; padding: 0.625rem 0.875rem;
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
          font-size: 0.875rem; font-family: inherit; color: hsl(var(--foreground));
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input:focus { outline: none; border-color: hsl(var(--primary)); box-shadow: 0 0 0 3px hsl(var(--primary) / 0.15); }
      `}</style>
    </SiteLayout>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="block text-sm font-semibold mb-1.5">{label}</span>
    {children}
  </label>
);

const UploadField = ({ label }: { label: string }) => (
  <label className="block">
    <span className="block text-sm font-semibold mb-1.5">{label}</span>
    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 cursor-pointer transition-colors">
      <Upload className="size-5 mx-auto text-muted-foreground" />
      <p className="text-xs text-muted-foreground mt-2">Click to upload</p>
    </div>
  </label>
);

export default ListBusiness;
