import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutGrid, User, Sparkles, Briefcase, Users, CreditCard, Plus,
  Check,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { BUSINESSES, formatRand, OPPORTUNITIES, PROMOTIONS } from "@/lib/mockData";
import { cn } from "@/lib/utils";

type SectionKey = "overview" | "profile" | "promotions" | "opportunities" | "followers" | "billing";
const SECTIONS: { key: SectionKey; label: string; icon: typeof LayoutGrid }[] = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "profile", label: "My Profile", icon: User },
  { key: "promotions", label: "Promotions", icon: Sparkles },
  { key: "opportunities", label: "Opportunities", icon: Briefcase },
  { key: "followers", label: "Followers", icon: Users },
  { key: "billing", label: "Billing", icon: CreditCard },
];

const Dashboard = () => {
  const [section, setSection] = useState<SectionKey>("overview");
  const me = BUSINESSES[0]; // mock "logged in" business

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <div className="flex-1 container py-8">
        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* Sidebar */}
          <aside>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className={cn("size-10 rounded-lg flex items-center justify-center font-display font-bold text-foreground bg-card border border-border", me.gradient)} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{me.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{me.plan} plan</p>
                </div>
              </div>
              <nav className="mt-3 space-y-0.5">
                {SECTIONS.map((s) => {
                  const Icon = s.icon;
                  const active = section === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setSection(s.key)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors text-left",
                        active ? "bg-primary-light text-primary" : "text-ink-2 hover:bg-secondary",
                      )}
                    >
                      <Icon className="size-4" />
                      {s.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="space-y-6">
            {section === "overview" && <OverviewSection />}
            {section === "profile" && <ProfileSection />}
            {section === "promotions" && <PromotionsSection />}
            {section === "opportunities" && <OpportunitiesSection />}
            {section === "followers" && <FollowersSection />}
            {section === "billing" && <BillingSection />}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="bg-card border border-border rounded-xl p-5">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      {hint && <span className="text-xs text-primary font-semibold">{hint}</span>}
    </div>
    <p className="font-display text-3xl font-medium tabular-nums mt-4">{value}</p>
  </div>
);

const OverviewSection = () => (
  <>
    <header className="flex items-center justify-between">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">Overview</h1>
        <p className="text-sm text-ink-2 mt-1">Your performance over the last 30 days.</p>
      </div>
      <Button>
        <Plus className="size-4" />Add Promotion
      </Button>
    </header>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Profile views" value="1,284" hint="+12%" />
      <StatCard label="Enquiries" value="38" hint="+5" />
      <StatCard label="Followers" value="318" hint="+24" />
      <StatCard label="Active promotions" value="2" />
    </div>
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="font-display text-lg font-semibold mb-4">Recent activity</h2>
      <ul className="space-y-3 text-sm">
        <li className="flex items-center justify-between py-2 border-b border-border last:border-0">
          <span>New enquiry from <strong>Naledi Properties</strong></span>
          <span className="text-xs text-muted-foreground">2h ago</span>
        </li>
        <li className="flex items-center justify-between py-2 border-b border-border last:border-0">
          <span><strong>Sipho M.</strong> started following you</span>
          <span className="text-xs text-muted-foreground">5h ago</span>
        </li>
        <li className="flex items-center justify-between py-2">
          <span>Your listing was viewed <strong>83 times</strong> yesterday</span>
          <span className="text-xs text-muted-foreground">1d ago</span>
        </li>
      </ul>
    </div>
  </>
);

const ProfileSection = () => (
  <>
    <header>
      <h1 className="font-display text-3xl font-medium tracking-tight">My Profile</h1>
      <p className="text-sm text-ink-2 mt-1">Edit how your business appears on Sjoh.</p>
    </header>
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Business name"><input className="db-input" defaultValue="Khumalo Electrical Contractors" /></Field>
        <Field label="Phone"><input className="db-input" defaultValue="+27 11 234 5678" /></Field>
        <Field label="Email"><input className="db-input" defaultValue="hello@khumaloelec.co.za" /></Field>
        <Field label="Website"><input className="db-input" defaultValue="khumaloelec.co.za" /></Field>
      </div>
      <Field label="Description">
        <textarea rows={4} className="db-input resize-none" defaultValue="Master electricians serving Gauteng since 2009. Certified installations, COC inspections, solar PV, and 24/7 emergency callouts." />
      </Field>
      <div className="flex justify-end gap-3 pt-3 border-t border-border">
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
    <DbStyle />
  </>
);

const PromotionsSection = () => (
  <>
    <header className="flex items-center justify-between">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">Promotions</h1>
        <p className="text-sm text-ink-2 mt-1">Run limited-time offers to attract new customers.</p>
      </div>
      <Button><Plus className="size-4" />Add Promotion</Button>
    </header>
    <div className="space-y-3">
      {PROMOTIONS.slice(0, 2).map((p) => (
        <div key={p.id} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-primary-light text-primary px-2 py-0.5 rounded">Active</span>
              <h3 className="font-semibold">{p.title}</h3>
            </div>
            <p className="text-sm text-ink-2 mt-1">{p.description}</p>
            <p className="text-xs text-muted-foreground mt-2">Expires {p.expiresAt}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Edit</Button>
            <Button variant="ghost" size="sm">End</Button>
          </div>
        </div>
      ))}
    </div>
  </>
);

const OpportunitiesSection = () => (
  <>
    <header>
      <h1 className="font-display text-3xl font-medium tracking-tight">Opportunities</h1>
      <p className="text-sm text-ink-2 mt-1">Track jobs you've applied to.</p>
    </header>
    <div className="bg-card border border-border rounded-xl divide-y divide-border">
      {OPPORTUNITIES.slice(0, 4).map((o, i) => (
        <div key={o.id} className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className="size-10 rounded-lg bg-secondary flex items-center justify-center text-xl shrink-0">{o.emoji}</span>
            <div className="min-w-0">
              <Link to={`/opportunities/${o.id}`} className="font-semibold text-sm hover:text-primary truncate block">{o.title}</Link>
              <p className="text-xs text-muted-foreground mt-0.5">{o.city} · {formatRand(o.budget)}</p>
            </div>
          </div>
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded whitespace-nowrap",
            i === 0 ? "bg-accent/15 text-accent" : i === 1 ? "bg-primary-light text-primary" : "bg-secondary text-muted-foreground",
          )}>
            {i === 0 ? "Pending" : i === 1 ? "Accepted" : "Awaiting reply"}
          </span>
        </div>
      ))}
    </div>
  </>
);

const FollowersSection = () => {
  const followers = ["Thandi Nkosi", "Pieter van Wyk", "Naledi M.", "Sipho D.", "Adam K.", "Liam Petersen"];
  return (
    <>
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">Followers</h1>
        <p className="text-sm text-ink-2 mt-1">318 people follow your business.</p>
      </header>
      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        {followers.map((f) => (
          <div key={f} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold">{f.charAt(0)}</div>
              <span className="text-sm font-medium">{f}</span>
            </div>
            <Button variant="ghost" size="sm">Message</Button>
          </div>
        ))}
      </div>
    </>
  );
};

const BillingSection = () => (
  <>
    <header>
      <h1 className="font-display text-3xl font-medium tracking-tight">Billing</h1>
      <p className="text-sm text-ink-2 mt-1">Manage your plan and payment details.</p>
    </header>
    <div className="bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground rounded-xl p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/85">Current plan</p>
      <p className="font-display text-3xl font-semibold mt-2">Featured</p>
      <p className="text-sm text-primary-foreground/85 mt-1">R 150 / month · next billing on 14 May 2026</p>
      <div className="mt-5 flex gap-3">
        <Button variant="ink">Change Plan</Button>
        <Button variant="ghost" className="text-white hover:bg-white/10">Cancel Plan</Button>
      </div>
    </div>
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-display text-lg font-semibold mb-4">Payment method</h3>
      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded bg-secondary flex items-center justify-center font-bold text-xs">VISA</div>
          <div>
            <p className="text-sm font-semibold">Visa ending 4242</p>
            <p className="text-xs text-muted-foreground">Expires 09/27</p>
          </div>
        </div>
        <Button variant="outline" size="sm">Update</Button>
      </div>
    </div>
  </>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="block text-sm font-semibold mb-1.5">{label}</span>
    {children}
  </label>
);

const DbStyle = () => (
  <style>{`
    .db-input { width: 100%; padding: 0.625rem 0.875rem; background: hsl(var(--background));
      border: 1px solid hsl(var(--border)); border-radius: var(--radius);
      font-size: 0.875rem; font-family: inherit; color: hsl(var(--foreground));
      transition: border-color 0.15s, box-shadow 0.15s; }
    .db-input:focus { outline: none; border-color: hsl(var(--primary)); box-shadow: 0 0 0 3px hsl(var(--primary) / 0.15); }
  `}</style>
);

export default Dashboard;
