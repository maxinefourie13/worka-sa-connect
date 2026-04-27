import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { BUSINESSES, formatRand } from "@/lib/mockData";
import { cn } from "@/lib/utils";

type TabKey = "about" | "services" | "promotions" | "reviews";
const TABS: { key: TabKey; label: string }[] = [
  { key: "about", label: "About" },
  { key: "services", label: "Services" },
  { key: "promotions", label: "Promotions" },
  { key: "reviews", label: "Reviews" },
];

const BusinessProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const business = BUSINESSES.find((b) => b.slug === slug) ?? BUSINESSES[0];
  const [tab, setTab] = useState<TabKey>("about");
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(business.followers);

  const toggleFollow = () => {
    setFollowing((f) => {
      const next = !f;
      setFollowers((c) => (next ? c + 1 : c - 1));
      return next;
    });
  };

  return (
    <SiteLayout>
      {/* Header / cover */}
      <div className={cn("h-56 md:h-72 relative", business.gradient)}>
        <div className="container h-full relative">
          <Link
            to="/directory"
            className="absolute top-5 left-6 inline-flex items-center gap-1.5 text-white/85 hover:text-white text-sm font-medium"
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
                    {business.isVerified && (
                      <span
                        className="mt-2 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded"
                        title="Verified"
                      >
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-ink-2 flex flex-wrap items-center gap-x-3 gap-y-1">
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
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="size-3.5 fill-accent text-accent" />
                            <span className="font-semibold tabular-nums">{r.rating}.0</span>
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
                <li className="flex items-start gap-3"><MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" /><span>{business.address}</span></li>
                <li className="flex items-start gap-3"><Phone className="size-4 text-muted-foreground mt-0.5 shrink-0" /><a href={`tel:${business.phone}`} className="hover:text-primary">{business.phone}</a></li>
                <li className="flex items-start gap-3"><Mail className="size-4 text-muted-foreground mt-0.5 shrink-0" /><a href={`mailto:${business.email}`} className="hover:text-primary">{business.email}</a></li>
                <li className="flex items-start gap-3"><Globe className="size-4 text-muted-foreground mt-0.5 shrink-0" /><a href="#" className="hover:text-primary">{business.website}</a></li>
                <li className="flex items-start gap-3"><Clock className="size-4 text-muted-foreground mt-0.5 shrink-0" /><span className="text-ink-2">{business.hours}</span></li>
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
                  <a href={`tel:${business.phone}`}><Phone className="size-4" />Call</a>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <a href={`https://wa.me/${business.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/></svg>
                    WhatsApp
                  </a>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <a href={`mailto:${business.email}`}><Mail className="size-4" />Email</a>
                </Button>
              </div>
              <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                <Shield className="size-3.5 mt-0.5 shrink-0 text-primary" />
                <span>You deal with this business directly. Sjoh takes no commission.</span>
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-display text-lg font-semibold mb-2">Looking for similar?</h3>
              <p className="text-sm text-ink-2 mb-4">Browse more {business.category} businesses in {business.province}.</p>
              <Link to={`/directory?category=${business.categorySlug}`} className="text-sm font-semibold text-primary inline-flex items-center gap-1 hover:underline">
                View all <ChevronRight className="size-4" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
};

export default BusinessProfile;
