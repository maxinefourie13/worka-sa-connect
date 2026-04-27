import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { BUSINESSES, BUSINESS_VERIFICATION, formatRand } from "@/lib/mockData";
import { VerificationBadges } from "@/components/VerificationBadges";
import { ReportProfileButton } from "@/components/ReportProfileButton";
import { GoogleReviewsList } from "@/components/GoogleReviewsList";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type TabKey = "about" | "services" | "promotions" | "reviews";
const TABS: { key: TabKey; label: string }[] = [
  { key: "about", label: "About" },
  { key: "services", label: "Services" },
  { key: "promotions", label: "Promotions" },
  { key: "reviews", label: "Reviews" },
];

interface LiveGoogleData {
  id: string;
  google_place_id: string | null;
  google_maps_url: string | null;
  google_rating: number | null;
  google_review_count: number | null;
}

const BusinessProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const business = BUSINESSES.find((b) => b.slug === slug) ?? BUSINESSES[0];
  const [tab, setTab] = useState<TabKey>("about");
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(business.followers);
  const [live, setLive] = useState<LiveGoogleData | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!slug) return;
    supabase
      .from("businesses")
      .select("id, google_place_id, google_maps_url, google_rating, google_review_count")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setLive(data as LiveGoogleData);
      });
    return () => { cancelled = true; };
  }, [slug]);


  const toggleFollow = () => {
    setFollowing((f) => {
      const next = !f;
      setFollowers((c) => (next ? c + 1 : c - 1));
      return next;
    });
  };

  return (
    <SiteLayout>
      {/* Header / cover — photo when available, otherwise gradient */}
      <div className={cn("h-56 md:h-72 relative overflow-hidden", !business.image && business.gradient)}>
        {business.image && (
          <>
            <img
              src={business.image}
              alt={`${business.name} — ${business.category}`}
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-black/30" />
          </>
        )}
        <div className="container h-full relative">
          <Link
            to="/directory"
            className="absolute top-5 left-6 inline-flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium drop-shadow"
          >
            <ArrowLeft className="size-4" /> Back to directory
          </Link>
          {business.plan === "featured" && (
            <span className="absolute top-5 right-6 bg-foreground/85 text-background text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded">
              Featured
            </span>
          )}
        </div>
      </div>

      <div className="container -mt-16 relative pb-20">
        <div className="grid lg:grid-cols-[1fr_340px] gap-10">
          {/* Main */}
          <div>
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card">
              <div className="flex flex-col md:flex-row md:items-end gap-5">
                <div className="size-24 rounded-2xl bg-card border-4 border-card shadow-soft flex items-center justify-center font-display font-bold text-4xl text-foreground -mt-20">
                  {business.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
                      {business.name}
                    </h1>
                  </div>
                  <VerificationBadges
                    idVerified={BUSINESS_VERIFICATION[business.id]?.idVerified ?? business.isVerified}
                    certifiedPro={BUSINESS_VERIFICATION[business.id]?.certifiedPro ?? false}
                    certifications={BUSINESS_VERIFICATION[business.id]?.certifications ?? []}
                    className="mt-2"
                  />
                  <p className="mt-2 text-sm text-ink-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>{business.category}</span>
                    <span className="opacity-50">·</span>
                    <span>{business.city}, {business.province}</span>
                    <span className="opacity-50">·</span>
                    <span><span className="font-semibold text-accent">{business.rating.toFixed(1)}</span> ({business.reviewCount} reviews)</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{followers} followers</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant={following ? "soft" : "default"} onClick={toggleFollow}>
                    {following ? "Following" : "Follow"}
                  </Button>
                  <Button variant="outline">Contact</Button>
                  <Button
                    variant="outline"
                    asChild
                    className="bg-[#25D366]/5 border-[#25D366]/40 text-[#1da851] hover:bg-[#25D366]/10 hover:text-[#1da851]"
                  >
                    <a href={`https://wa.me/${business.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                      WhatsApp
                    </a>
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-8 border-b border-border flex gap-1 -mx-6 px-6 md:-mx-8 md:px-8 overflow-x-auto">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap",
                      tab === t.key
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="mt-8">
                {tab === "about" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="font-display text-xl font-semibold mb-3">About</h2>
                      <p className="text-ink-2 leading-relaxed">{business.description}</p>
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-semibold mb-4">Services overview</h2>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {business.services.map((s) => (
                          <div key={s.name} className="border border-border rounded-lg p-4">
                            <p className="font-semibold text-sm">{s.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                            <p className="mt-3 text-sm font-display font-semibold">
                              {s.priceType === "quote"
                                ? "On quote"
                                : `${s.priceType === "from" ? "From " : ""}${formatRand(s.priceFrom)}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {tab === "services" && (
                  <div className="space-y-3">
                    {business.services.map((s) => (
                      <div key={s.name} className="border border-border rounded-lg p-5 flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold">{s.name}</p>
                          <p className="text-sm text-ink-2 mt-1">{s.description}</p>
                        </div>
                        <p className="font-display font-semibold text-lg whitespace-nowrap">
                          {s.priceType === "quote" ? "On quote" : `${s.priceType === "from" ? "From " : ""}${formatRand(s.priceFrom)}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {tab === "promotions" && (
                  business.hasPromo ? (
                    <div className="rounded-2xl p-7 bg-gradient-to-br from-primary to-emerald-600 text-white">
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded">Active promo</span>
                      <h3 className="font-display text-2xl font-semibold mt-4">Special offer running this month</h3>
                      <p className="mt-2 text-white/85">Check this business's listing on the directory for the latest discount details.</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No active promotions right now.</p>
                  )
                )}

                {tab === "reviews" && (
                  <div className="space-y-4">
                    {business.reviews.map((r) => (
                      <div key={r.id} className="border border-border rounded-lg p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-sm">{r.reviewerName}</p>
                            {r.reviewerCompany && (
                              <p className="text-xs text-muted-foreground">{r.reviewerCompany}</p>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1 text-sm">
                            <span className="font-semibold tabular-nums text-accent">{r.rating}.0</span>
                          </div>
                        </div>
                        <p className="text-sm text-ink-2 mt-3 leading-relaxed">{r.body}</p>
                        <p className="text-xs text-muted-foreground mt-3">{r.date}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
              <h3 className="font-display text-lg font-semibold mb-4">Business details</h3>
              <ul className="space-y-3 text-sm">
                <li><span className="text-muted-foreground">Address: </span><span>{business.address}</span></li>
                <li><span className="text-muted-foreground">Phone: </span><a href={`tel:${business.phone}`} className="hover:text-primary">{business.phone}</a></li>
                <li><span className="text-muted-foreground">Email: </span><a href={`mailto:${business.email}`} className="hover:text-primary">{business.email}</a></li>
                <li><span className="text-muted-foreground">Website: </span><a href="#" className="hover:text-primary">{business.website}</a></li>
                <li><span className="text-muted-foreground">Hours: </span><span className="text-ink-2">{business.hours}</span></li>
              </ul>
              <div className="mt-5 pt-5 border-t border-border">
                <p className="text-xs text-muted-foreground">Response rate</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${business.responseRate}%` }} />
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{business.responseRate}%</span>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <Button variant="default" className="w-full" asChild>
                  <a href={`tel:${business.phone}`}>Call</a>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <a href={`https://wa.me/${business.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <a href={`mailto:${business.email}`}>Email</a>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                You deal with this business directly. Sjoh takes no commission.
              </p>
              <div className="mt-3 pt-3 border-t border-border flex justify-center">
                <ReportProfileButton businessId={business.id} businessName={business.name} />
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-display text-lg font-semibold mb-2">Looking for similar?</h3>
              <p className="text-sm text-ink-2 mb-4">Browse more {business.category} businesses in {business.province}.</p>
              <Link to={`/directory?category=${business.categorySlug}`} className="text-sm font-semibold text-primary hover:underline">
                View all →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
};

export default BusinessProfile;
