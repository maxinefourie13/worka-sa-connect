import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  LayoutGrid, User, Sparkles, Briefcase, Users, CreditCard, Plus,
  ShieldCheck, Bell, Mail, FileText, MessageCircle, Lock,
} from "lucide-react";
import { QuotesSection } from "@/components/dashboard/QuotesSection";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { BUSINESSES, formatRand, OPPORTUNITIES, PROMOTIONS, SJOH_TIERS } from "@/lib/mockData";
import { VerificationBadges } from "@/components/VerificationBadges";
import { toast } from "@/hooks/use-toast";
import { useVerification } from "@/hooks/useVerification";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { payments } from "@/lib/payments";
import { requestPushPermission, disablePush, isPushConfigured } from "@/lib/push";
import { GoogleReviewsCard } from "@/components/dashboard/GoogleReviewsCard";
import { SubscriptionGapBanner } from "@/components/SubscriptionGapBanner";
import { ProfileVisibilityWarning } from "@/components/ProfileVisibilityWarning";
import { ReferAProCard } from "@/components/dashboard/ReferAProCard";
import { SecondaryCategoriesCard } from "@/components/dashboard/SecondaryCategoriesCard";
import { PrivacySection } from "@/components/dashboard/PrivacySection";
import { useProviderAccess } from "@/hooks/useProviderAccess";
import { cn } from "@/lib/utils";

type SectionKey = "overview" | "quotes" | "verification" | "profile" | "promotions" | "opportunities" | "followers" | "billing" | "privacy";
const SECTIONS: { key: SectionKey; label: string; icon: typeof LayoutGrid }[] = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "quotes", label: "My Quotes", icon: FileText },
  { key: "verification", label: "Verification", icon: ShieldCheck },
  { key: "profile", label: "My Profile", icon: User },
  { key: "promotions", label: "Promotions", icon: Sparkles },
  { key: "opportunities", label: "Leads", icon: Briefcase },
  { key: "followers", label: "Followers", icon: Users },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "privacy", label: "Data & Privacy", icon: Lock },
];

const Dashboard = () => {
  const [section, setSection] = useState<SectionKey>("overview");
  const me = BUSINESSES[0]; // mock "logged in" business
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    if (params.get("paid") === "1") {
      toast({
        title: "Chankura sorted.",
        description: "Your account is topped up. Back to work!",
      });
      params.delete("paid");
      setParams(params, { replace: true });
    }
    if (params.get("boost") === "success") {
      toast({
        title: "Boosted, boet!",
        description: "Your job is now pinned to the top of the feed for 72 hours.",
      });
      params.delete("boost");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

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
                  <p className="text-xs text-muted-foreground">The Pro</p>
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
            {section === "overview" && <OverviewSection onJump={setSection} />}
            {section === "quotes" && <QuotesSection />}
            {section === "verification" && <VerificationSection />}
            {section === "profile" && <ProfileSection />}
            {section === "promotions" && <PromotionsSection />}
            {section === "opportunities" && <OpportunitiesSection />}
            {section === "followers" && <FollowersSection />}
            {section === "billing" && <BillingSection />}
            {section === "privacy" && <PrivacySection />}
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

const OverviewSection = ({ onJump }: { onJump: (s: SectionKey) => void }) => {
  const { user } = useAuth();
  const access = useProviderAccess();
  const firstName =
    (user?.user_metadata?.display_name as string | undefined)?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "boet";

  const planLabel =
    access.tier === "verified_pro" ? "Verified Pro"
    : access.tier === "basic" ? "Basic Listing"
    : access.tier === "verified_pro_trial" ? "Verified Pro · Trial"
    : access.tier === "basic_trial" ? "Basic · Trial"
    : access.tier === "locked" ? "Account paused"
    : "No plan";

  return (
    <>
      <SubscriptionGapBanner />
      <ProfileVisibilityWarning />
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">
            Howzit, {firstName}. Ready to dala what you must?
          </h1>
          <p className="text-sm text-ink-2 mt-1">Your performance over the last 30 days.</p>
        </div>
        <Button>
          <Plus className="size-4" />Add Promotion
        </Button>
      </header>

      {/* Plan highlight */}
      <button
        onClick={() => onJump("billing")}
        className="w-full text-left bg-foreground text-background rounded-xl p-6 flex items-center justify-between gap-5 hover:opacity-95 transition-opacity"
      >
        <div className="flex items-center gap-4">
          <span className="size-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center">
            <CreditCard className="size-6" strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-background/70">Your plan</p>
            <p className="font-display text-3xl font-semibold mt-1">
              {planLabel}
              {access.isOnTrial && (
                <span className="text-base text-background/60 font-normal"> · {access.trialDaysLeft}d left</span>
              )}
            </p>
          </div>
        </div>
        <span className="text-sm font-semibold text-accent">Manage →</span>
      </button>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Profile views" value="1,284" hint="+12%" />
        <StatCard label="Enquiries" value="38" hint="+5" />
        <StatCard label="Followers" value="318" hint="+24" />
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

      <ReferAProCard />
    </>
  );
};

const VerificationSection = () => {
  const verification = useVerification();
  // Mock cert data — to be wired to real businesses table later.
  const me = BUSINESSES[0];

  const verifyLabel: Record<typeof verification.status, string> = {
    not_required: "Upgrade to verify",
    required: "Verify now",
    pending: "Verifying…",
    verified: "✓ Verified",
    failed: "Try again",
    expired: "Re-verify",
  };

  const verifyHint: Record<typeof verification.status, string> = {
    not_required: "Available on paid tiers — your badge stays once verified.",
    required: "Subscription active. Tap to verify your ID and unlock the Ready for Work badge.",
    pending: "We're processing your verification. This usually takes under a minute.",
    verified: verification.expiresAt
      ? `Re-verify by ${new Date(verification.expiresAt).toLocaleDateString("en-ZA")}`
      : "Verified — keep grafting.",
    failed: "We couldn't verify your ID. Try again with a clearer photo.",
    expired: "Your verification expired. Re-verify to bring back your badge.",
  };

  return (
    <>
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">Verification</h1>
        <p className="text-sm text-ink-2 mt-1">Your trust badges, visible on every listing.</p>
      </header>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" /> No Tjops verification
            </h2>
            <p className="text-sm text-ink-2 mt-1">Verified pros land 3x more enquiries.</p>
          </div>
        </div>
        <div className="mt-5">
          <VerificationBadges
            idVerified={verification.isIdVerified}
            certifiedPro={false}
            certifications={[]}
          />
        </div>
        <div className="mt-5 grid sm:grid-cols-2 gap-3">
          <div className="border border-border rounded-lg p-4">
            <p className="text-sm font-semibold">ID & Selfie</p>
            <p className="text-xs text-muted-foreground mt-1">{verifyHint[verification.status]}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              disabled={
                verification.loading ||
                verification.status === "pending" ||
                verification.status === "verified" ||
                verification.status === "not_required"
              }
              onClick={() => verification.startVerification()}
            >
              {verifyLabel[verification.status]}
            </Button>
          </div>
          <div className="border border-border rounded-lg p-4">
            <p className="text-sm font-semibold">Trade certificates</p>
            <p className="text-xs text-muted-foreground mt-1">
              Upload to become a Certified Pro
            </p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => toast({ title: "Upload (coming soon)", description: "Certificate uploads land in the next update." })}>
              Upload certificate
            </Button>
          </div>
        </div>
      </div>

      <NotificationPrefsCard />
    </>
  );
};

const ProfileSection = () => {
  const { user } = useAuth();
  const [myBiz, setMyBiz] = useState<{ id: string; category_slug: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id, category_slug")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (data) setMyBiz({ id: data.id, category_slug: data.category_slug });
    })();
  }, [user]);

  return (
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
      {myBiz && (
        <SecondaryCategoriesCard
          businessId={myBiz.id}
          primaryCategorySlug={myBiz.category_slug}
        />
      )}
      <GoogleReviewsCard />
      <DbStyle />
    </>
  );
};

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
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Leads</h1>
      <p className="text-sm text-ink-2 mt-1">Customer requests you've quoted on.</p>
    </header>
    <div className="bg-card border border-border rounded-xl divide-y divide-border">
      {OPPORTUNITIES.slice(0, 4).map((o, i) => (
        <div key={o.id} className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className="size-10 rounded-lg bg-secondary flex items-center justify-center text-xl shrink-0">{o.emoji}</span>
            <div className="min-w-0">
              <Link to={`/requests/${o.id}`} className="font-semibold text-sm hover:text-primary truncate block">{o.title}</Link>
              <p className="text-xs text-muted-foreground mt-0.5">{o.city} · {formatRand(o.budget)}</p>
            </div>
          </div>
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded whitespace-nowrap",
            i === 0 ? "bg-accent/15 text-accent" : i === 1 ? "bg-primary-light text-primary" : "bg-secondary text-muted-foreground",
          )}>
            {i === 0 ? "Pending" : i === 1 ? "Won" : "Lost"}
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
          <div key={f} className="p-4 flex items-center gap-3">
            <div className="size-9 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold">{f.charAt(0)}</div>
            <span className="text-sm font-medium">{f}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-2 mt-3">
        Followers see your updates and promotions in their feed. Direct messaging isn't part of Sjoh — keep contact on the public profile so customers reach you on your terms.
      </p>
    </>
  );
};

const BillingSection = () => {
  const { user } = useAuth();
  const access = useProviderAccess();
  const tierSlug =
    access.tier === "verified_pro" || access.tier === "verified_pro_trial" ? "verified_pro"
    : access.tier === "basic" || access.tier === "basic_trial" ? "basic"
    : "basic_trial";
  const tier = SJOH_TIERS.find((t) => t.slug === tierSlug) ?? SJOH_TIERS[0];
  const [liveSub, setLiveSub] = useState<{
    billing_cycle: "monthly" | "annual";
    next_renewal_at: string | null;
    tier: string | null;
  } | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("provider_balances")
        .select("billing_cycle, next_renewal_at, tier")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setLiveSub(data as typeof liveSub);
    })();
  }, [user]);

  const isPaid = liveSub?.tier === "basic" || liveSub?.tier === "verified_pro";
  const isMonthlyPaid = isPaid && liveSub?.billing_cycle === "monthly";
  const monthlyPrice = liveSub?.tier === "verified_pro" ? 250 : liveSub?.tier === "basic" ? 50 : 0;
  const yearlySaving = monthlyPrice * 12 - Math.round(monthlyPrice * 12 * 0.9);

  const switchToAnnual = async () => {
    if (!liveSub?.tier || (liveSub.tier !== "basic" && liveSub.tier !== "verified_pro")) return;
    setSwitching(true);
    await payments.startSubscription(liveSub.tier as "basic" | "verified_pro", "annual");
    setSwitching(false);
  };

  const renewalLabel = liveSub?.next_renewal_at
    ? new Date(liveSub.next_renewal_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <>
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">Billing</h1>
        <p className="text-sm text-ink-2 mt-1">Manage your plan and payment details.</p>
      </header>

      {/* No-commission promise — kills the "hidden costs" fear */}
      <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <span className="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-display font-extrabold">0%</span>
          <div className="min-w-0">
            <p className="font-display text-base font-extrabold tracking-tight">0% commission. You keep every cent you earn.</p>
            <p className="text-sm text-ink-2 mt-1">
              Your monthly fee covers <strong>unlimited quotes</strong>, your directory listing, and customer alerts.
              No per-message fees, no per-job cuts, no Paystack surprises — clients pay you directly.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-foreground text-background rounded-xl p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-background/70">Current plan</p>
        <p className="font-display text-3xl font-semibold mt-2">{tier.name}</p>
        <p className="text-sm text-background/75 mt-1">
          {isPaid ? (
            liveSub?.billing_cycle === "annual"
              ? `${formatRand(Math.round(monthlyPrice * 12 * 0.9))} /year · billed yearly`
              : `${formatRand(monthlyPrice)} /month`
          ) : (
            tier.price === 0 ? "Free trial" : `${formatRand(tier.price)} ${tier.period}`
          )}
        </p>
        {renewalLabel && (
          <p className="text-xs text-background/60 mt-1">Next renewal: {renewalLabel}</p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
            <Link to="/pricing">Change Plan</Link>
          </Button>
          <Button variant="ghost" className="text-white hover:bg-white/10">Cancel Plan</Button>
        </div>
      </div>

      {/* Switch-to-yearly nudge for monthly paid subscribers */}
      {isMonthlyPaid && yearlySaving > 0 && (
        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-display text-base font-extrabold tracking-tight">
              Same plan, {formatRand(yearlySaving)} less. Switch to yearly?
            </p>
            <p className="text-sm text-ink-2 mt-1">
              Pay for the year and save 10%. Sorted.
            </p>
          </div>
          <Button onClick={switchToAnnual} disabled={switching} className="shrink-0">
            {switching ? "Sorting…" : "Switch to yearly"}
          </Button>
        </div>
      )}

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
};

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

const NotificationPrefsCard = () => {
  const { user } = useAuth();
  const [emailOn, setEmailOn] = useState(true);
  const [pushOn, setPushOn] = useState(false);
  const [waOn, setWaOn] = useState(false);
  const [waNumber, setWaNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"email" | "push" | "wa" | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("provider_balances")
        .select("email_alerts_optin, push_alerts_optin, whatsapp_alerts_optin, whatsapp_number")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setEmailOn(data.email_alerts_optin ?? true);
        setPushOn(data.push_alerts_optin ?? false);
        setWaOn((data as any).whatsapp_alerts_optin ?? false);
        setWaNumber((data as any).whatsapp_number ?? "");
      }
      setLoading(false);
    })();
  }, [user]);

  const toggleEmail = async () => {
    setBusy("email");
    const next = !emailOn;
    const { error } = await supabase.rpc("set_email_alerts_optin", { _enabled: next });
    if (error) {
      toast({ title: "Eish, couldn't save", description: error.message, variant: "destructive" });
    } else {
      setEmailOn(next);
      toast({ title: next ? "Email alerts on ⚡" : "Email alerts off", description: next ? "We'll holla when fresh graft lands." : "We'll keep schtum on email." });
    }
    setBusy(null);
  };

  const togglePush = async () => {
    setBusy("push");
    try {
      if (!pushOn) {
        if (!isPushConfigured()) {
          toast({ title: "Push not ready yet", description: "Sjoh! is still wiring up push notifications. Try again soon.", variant: "destructive" });
          setBusy(null);
          return;
        }
        const id = await requestPushPermission();
        if (id) {
          setPushOn(true);
          toast({ title: "Push alerts on 🔔", description: "We'll buzz you the second a job lands." });
        } else {
          toast({ title: "Permission needed", description: "Allow notifications in your browser to enable push.", variant: "destructive" });
        }
      } else {
        await disablePush();
        setPushOn(false);
        toast({ title: "Push alerts off", description: "No more buzzes. Sharp." });
      }
    } catch (e: any) {
      toast({ title: "Aikona, push failed", description: String(e?.message ?? e), variant: "destructive" });
    }
    setBusy(null);
  };

  const saveWhatsApp = async (enable: boolean) => {
    setBusy("wa");
    const cleaned = waNumber.replace(/[^0-9+]/g, "");
    if (enable && cleaned.length < 8) {
      toast({ title: "Need a valid number", description: "Pop in your WhatsApp number with country code (e.g. +27821234567).", variant: "destructive" });
      setBusy(null);
      return;
    }
    const { error } = await supabase.rpc("set_whatsapp_alerts", { _enabled: enable, _number: cleaned });
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    } else {
      setWaOn(enable);
      setWaNumber(cleaned);
      toast({
        title: enable ? "WhatsApp alerts on 💬" : "WhatsApp alerts off",
        description: enable
          ? "We'll ping your WhatsApp the second a fresh lead drops in your area."
          : "No more WhatsApp pings from Sjoh.",
      });
    }
    setBusy(null);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-start gap-3 mb-5">
        <span className="size-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
          <Bell className="size-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold">Job alerts</h2>
          <p className="text-sm text-ink-2 mt-1">
            Get notified the second new graft lands in your category &amp; city.
          </p>
        </div>
      </div>

      {/* Email */}
      <div className="flex items-center justify-between gap-3 py-3 border-t border-border">
        <div className="flex items-start gap-3 min-w-0">
          <Mail className="size-4 text-ink-2 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Email me when new jobs land</p>
            <p className="text-xs text-muted-foreground mt-0.5">Inbox alert with the brief + budget. Capped at 5/day.</p>
          </div>
        </div>
        <button
          onClick={toggleEmail}
          disabled={loading || busy === "email"}
          className={cn(
            "relative w-12 h-7 rounded-full transition-colors shrink-0 disabled:opacity-50",
            emailOn ? "bg-accent" : "bg-secondary",
          )}
          aria-label="Toggle email alerts"
        >
          <span className={cn(
            "absolute top-0.5 size-6 rounded-full bg-white shadow-sm transition-transform",
            emailOn ? "translate-x-5" : "translate-x-0.5",
          )} />
        </button>
      </div>

      {/* Push */}
      <div className="flex items-center justify-between gap-3 py-3 border-t border-border">
        <div className="flex items-start gap-3 min-w-0">
          <Bell className="size-4 text-ink-2 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Browser push notifications</p>
            <p className="text-xs text-muted-foreground mt-0.5">Instant buzz on your phone or laptop. No email noise.</p>
          </div>
        </div>
        {pushOn ? (
          <Button size="sm" variant="outline" onClick={togglePush} disabled={busy === "push"} className="shrink-0">
            {busy === "push" ? "..." : "Disable"}
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={togglePush}
            disabled={busy === "push"}
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold shrink-0 gap-1.5"
          >
            <Bell className="size-3.5" strokeWidth={2.5} />
            {busy === "push" ? "..." : "Enable Job Alerts"}
          </Button>
        )}
      </div>

      {/* WhatsApp — App-Fatigue fix: bring leads to where Pros already live */}
      <div className="py-3 border-t border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <MessageCircle className="size-4 text-ink-2 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">WhatsApp me when fresh leads drop</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Lead alerts on WhatsApp — no need to keep checking the app. Capped at 5/hour.
              </p>
            </div>
          </div>
          {waOn && (
            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/30">
              On
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <input
            type="tel"
            inputMode="tel"
            value={waNumber}
            onChange={(e) => setWaNumber(e.target.value)}
            placeholder="+27 82 123 4567"
            className="db-input flex-1"
            disabled={loading || busy === "wa"}
          />
          {waOn ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => saveWhatsApp(false)}
              disabled={busy === "wa"}
              className="shrink-0"
            >
              {busy === "wa" ? "..." : "Turn off"}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => saveWhatsApp(true)}
              disabled={busy === "wa"}
              className="shrink-0 gap-1.5"
            >
              <MessageCircle className="size-3.5" strokeWidth={2.5} />
              {busy === "wa" ? "Saving…" : "Enable WhatsApp alerts"}
            </Button>
          )}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Standard WhatsApp message rates apply on Twilio's side. We'll only send when a lead matches your category &amp; area.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;

