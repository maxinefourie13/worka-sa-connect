import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MessageCircle, MapPin, Clock, Globe } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { BUSINESS_VERIFICATION, formatRand } from "@/lib/mockData";
import { VerificationBadges } from "@/components/VerificationBadges";
import { ReportProfileButton } from "@/components/ReportProfileButton";
import { GoogleReviewsList } from "@/components/GoogleReviewsList";
import { useBusinessBySlug } from "@/hooks/useBusinessBySlug";
import { useReveal } from "@/hooks/useReveal";
import { useRevealContact } from "@/hooks/useRevealContact";
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
  google_place_id?: string | null;
  google_maps_url: string | null;
  google_rating: number | null;
  google_review_count: number | null;
}

const Reveal = ({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={cn(
        "transition-all duration-700 ease-out will-change-[opacity,transform]",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className,
      )}
    >
      {children}
    </div>
  );
};

const BusinessProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const { business, googleRating, googleReviewCount, googleMapsUrl, loading } = useBusinessBySlug(slug);
  const [tab, setTab] = useState<TabKey>("about");
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);

  // Sync follower count once business resolves.
  if (business && followers === 0 && business.followers > 0) {
    // initial set without an effect (idempotent under React 18 strict mode)
    setFollowers(business.followers);
  }

  if (loading) {
    return (
      <SiteLayout>
        <div className="container py-24 text-center text-muted-foreground">Loading…</div>
      </SiteLayout>
    );
  }

  if (!business) {
    return (
      <SiteLayout>
        <div className="container py-24 text-center">
          <h1 className="font-display text-3xl font-medium">Sjoh, can't find that one.</h1>
          <Link to="/directory" className="text-primary hover:underline mt-4 inline-block">
            Back to directory
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const live: LiveGoogleData | null = googleRating !== null || googleMapsUrl
    ? { id: business.id, google_maps_url: googleMapsUrl, google_rating: googleRating, google_review_count: googleReviewCount }
    : null;

  const toggleFollow = () => {
    setFollowing((f) => {
      const next = !f;
      setFollowers((c) => (next ? c + 1 : c - 1));
      return next;
    });
  };

  const { contact: revealed, loading: revealing, reveal, revealed: isRevealed } = useRevealContact(business.id);
  // Use revealed contact if available, otherwise fall back to whatever the row gave us
  // (owners reading their own listing still get email/phone directly via RLS).
  const phone = revealed?.phone ?? business.phone ?? "";
  const email = revealed?.email ?? business.email ?? "";
  const hasContact = !!(phone || email);
  const phoneDigits = phone.replace(/\D/g, "");

  const handleReveal = async () => { await reveal(); };

  return (
    <SiteLayout>
      {/* Header / cover */}
      <div className={cn("h-44 sm:h-56 md:h-72 relative overflow-hidden", !business.image && business.gradient)}>
        {business.image && (
          <>
            <img
              src={business.image}
              alt={`${business.name} — ${business.category}`}
              className="absolute inset-0 size-full object-cover animate-scale-in"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-black/30" />
          </>
        )}
        <div className="container h-full relative">
          <Link
            to="/directory"
            className="absolute top-4 left-4 sm:top-5 sm:left-6 inline-flex items-center gap-1.5 text-white/90 hover:text-white text-xs sm:text-sm font-medium drop-shadow transition-colors"
          >
            <ArrowLeft className="size-4" /> <span className="hidden xs:inline">Back to directory</span><span className="xs:hidden">Back</span>
          </Link>
          {business.plan === "featured" && (
            <span className="absolute top-4 right-4 sm:top-5 sm:right-6 bg-foreground/85 text-background text-[10px] font-bold tracking-widest uppercase px-2 sm:px-2.5 py-1 rounded animate-fade-in">
              Featured
            </span>
          )}
        </div>
      </div>

      <div className="container -mt-12 sm:-mt-16 relative pb-28 lg:pb-20">
        <div className="grid lg:grid-cols-[1fr_340px] gap-6 lg:gap-10">
          {/* Main */}
          <div className="min-w-0">
            <Reveal>
              <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 shadow-card">
                <div className="flex flex-col md:flex-row md:items-end gap-4 sm:gap-5">
                  <div className="size-20 sm:size-24 rounded-2xl bg-card border-4 border-card shadow-soft flex items-center justify-center font-display font-bold text-3xl sm:text-4xl text-foreground -mt-16 sm:-mt-20 transition-transform duration-500 hover:scale-105">
                    {business.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight leading-tight break-words">
                      {business.name}
                    </h1>
                    <VerificationBadges
                      idVerified={BUSINESS_VERIFICATION[business.id]?.idVerified ?? business.isVerified}
                      certifiedPro={BUSINESS_VERIFICATION[business.id]?.certifiedPro ?? false}
                      certifications={BUSINESS_VERIFICATION[business.id]?.certifications ?? []}
                      className="mt-2"
                    />
                    <p className="mt-2 text-xs sm:text-sm text-ink-2 flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1">
                      <span>{business.category}</span>
                      <span className="opacity-50">·</span>
                      <span>{business.city}, {business.province}</span>
                      <span className="opacity-50">·</span>
                      <span>
                        <span className="font-semibold text-accent">{business.rating.toFixed(1)}</span>{" "}
                        <span className="text-muted-foreground">({business.reviewCount} reviews)</span>
                      </span>
                    </p>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{followers} followers</p>
                  </div>
                  {/* Desktop / tablet action buttons */}
                  <div className="hidden sm:flex flex-wrap gap-2">
                    <Button variant={following ? "soft" : "default"} onClick={toggleFollow} className="transition-all hover:scale-[1.02]">
                      {following ? "Following" : "Follow"}
                    </Button>
                    <Button variant="outline" className="transition-all hover:scale-[1.02]">Contact</Button>
                    <Button
                      variant="outline"
                      asChild
                      className="bg-[#25D366]/5 border-[#25D366]/40 text-[#1da851] hover:bg-[#25D366]/10 hover:text-[#1da851] transition-all hover:scale-[1.02]"
                    >
                      <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer">
                        WhatsApp
                      </a>
                    </Button>
                  </div>
                  {/* Mobile follow button only (the rest live in the sticky bottom bar) */}
                  <div className="sm:hidden">
                    <Button
                      variant={following ? "soft" : "default"}
                      onClick={toggleFollow}
                      size="sm"
                      className="w-full transition-all"
                    >
                      {following ? "Following" : "Follow"}
                    </Button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="mt-6 sm:mt-8 border-b border-border flex gap-1 -mx-4 sm:-mx-6 px-4 sm:px-6 md:-mx-8 md:px-8 overflow-x-auto sticky top-14 sm:top-16 bg-card z-10 scrollbar-thin">
                  {TABS.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={cn(
                        "px-3 sm:px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap",
                        tab === t.key
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="mt-6 sm:mt-8 animate-fade-in" key={tab}>
                  {tab === "about" && (
                    <div className="space-y-6 sm:space-y-8">
                      <Reveal>
                        <h2 className="font-display text-lg sm:text-xl font-semibold mb-2 sm:mb-3">About</h2>
                        <p className="text-sm sm:text-base text-ink-2 leading-relaxed">{business.description}</p>
                      </Reveal>
                      <Reveal delay={80}>
                        <h2 className="font-display text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Services overview</h2>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {business.services.map((s, i) => (
                            <div
                              key={s.name}
                              style={{ animationDelay: `${i * 60}ms` }}
                              className="border border-border rounded-lg p-4 transition-all duration-300 hover:border-foreground/30 hover:shadow-soft hover:-translate-y-0.5 animate-fade-up"
                            >
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
                      </Reveal>
                    </div>
                  )}

                  {tab === "services" && (
                    <div className="space-y-3">
                      {business.services.map((s, i) => (
                        <div
                          key={s.name}
                          style={{ animationDelay: `${i * 50}ms` }}
                          className="border border-border rounded-lg p-4 sm:p-5 flex items-start justify-between gap-3 sm:gap-4 transition-all duration-300 hover:border-foreground/30 hover:shadow-soft hover:-translate-y-0.5 animate-fade-up"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-sm sm:text-base">{s.name}</p>
                            <p className="text-xs sm:text-sm text-ink-2 mt-1">{s.description}</p>
                          </div>
                          <p className="font-display font-semibold text-base sm:text-lg whitespace-nowrap shrink-0">
                            {s.priceType === "quote" ? "On quote" : `${s.priceType === "from" ? "From " : ""}${formatRand(s.priceFrom)}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {tab === "promotions" && (
                    business.hasPromo ? (
                      <Reveal>
                        <div className="rounded-2xl p-5 sm:p-7 bg-gradient-to-br from-accent to-accent/70 text-white shadow-pop">
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded">Active promo</span>
                          <h3 className="font-display text-xl sm:text-2xl font-semibold mt-4">Special offer running this month</h3>
                          <p className="mt-2 text-sm sm:text-base text-white/85">Check this business's listing on the directory for the latest discount details.</p>
                        </div>
                      </Reveal>
                    ) : (
                      <p className="text-muted-foreground text-sm">No active promotions right now.</p>
                    )
                  )}

                  {tab === "reviews" && (
                    <div className="space-y-4">
                      {live && <GoogleReviewsList businessId={live.id} business={live} />}
                      {business.reviews.map((r, i) => (
                        <div
                          key={r.id}
                          style={{ animationDelay: `${i * 60}ms` }}
                          className="border border-border rounded-lg p-4 sm:p-5 transition-all duration-300 hover:border-foreground/30 hover:shadow-soft animate-fade-up"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm">{r.reviewerName}</p>
                              {r.reviewerCompany && (
                                <p className="text-xs text-muted-foreground truncate">{r.reviewerCompany}</p>
                              )}
                            </div>
                            <span className="font-semibold tabular-nums text-accent text-sm shrink-0">{r.rating}.0 ★</span>
                          </div>
                          <p className="text-sm text-ink-2 mt-3 leading-relaxed">{r.body}</p>
                          <p className="text-xs text-muted-foreground mt-3">{r.date}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <Reveal delay={120}>
              <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-card">
                <h3 className="font-display text-lg font-semibold mb-4">Business details</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2.5">
                    <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="break-words">{business.address}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Phone className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <a href={`tel:${business.phone}`} className="hover:text-primary transition-colors break-all">{business.phone}</a>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Mail className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <a href={`mailto:${business.email}`} className="hover:text-primary transition-colors break-all">{business.email}</a>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Globe className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <a href="#" className="hover:text-primary transition-colors break-all">{business.website}</a>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Clock className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-ink-2">{business.hours}</span>
                  </li>
                </ul>
                <div className="mt-5 pt-5 border-t border-border">
                  <p className="text-xs text-muted-foreground">Response rate</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary transition-[width] duration-1000 ease-out"
                        style={{ width: `${business.responseRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{business.responseRate}%</span>
                  </div>
                </div>
                {/* Desktop call/whatsapp/email — mobile shows sticky bar instead */}
                <div className="hidden sm:grid mt-5 grid-cols-3 gap-2">
                  <Button variant="default" className="w-full transition-all hover:scale-[1.03]" asChild>
                    <a href={`tel:${business.phone}`}><Phone className="size-4" />Call</a>
                  </Button>
                  <Button variant="outline" className="w-full transition-all hover:scale-[1.03]" asChild>
                    <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="size-4" />WhatsApp
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full transition-all hover:scale-[1.03]" asChild>
                    <a href={`mailto:${business.email}`}><Mail className="size-4" />Email</a>
                  </Button>
                </div>
                <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                  You deal with this business directly. Sjoh takes no commission.
                </p>
                <div className="mt-3 pt-3 border-t border-border flex justify-center">
                  <ReportProfileButton businessId={business.id} businessName={business.name} />
                </div>
              </div>
            </Reveal>

            <Reveal delay={180}>
              <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 transition-shadow hover:shadow-card">
                <h3 className="font-display text-lg font-semibold mb-2">Looking for similar?</h3>
                <p className="text-sm text-ink-2 mb-4">Browse more {business.category} businesses in {business.province}.</p>
                <Link
                  to={`/directory?category=${business.categorySlug}`}
                  className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1 transition-all hover:gap-2"
                >
                  View all <span aria-hidden>→</span>
                </Link>
              </div>
            </Reveal>
          </aside>
        </div>
      </div>

      {/* Mobile sticky action bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border shadow-pop animate-fade-up">
        <div className="container py-2.5 grid grid-cols-3 gap-2">
          <Button variant="default" size="sm" className="w-full gap-1.5" asChild>
            <a href={`tel:${business.phone}`}><Phone className="size-4" />Call</a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 bg-[#25D366]/5 border-[#25D366]/40 text-[#1da851] hover:bg-[#25D366]/10 hover:text-[#1da851]"
            asChild
          >
            <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" />WhatsApp
            </a>
          </Button>
          <Button variant="outline" size="sm" className="w-full gap-1.5" asChild>
            <a href={`mailto:${business.email}`}><Mail className="size-4" />Email</a>
          </Button>
        </div>
      </div>
    </SiteLayout>
  );
};

export default BusinessProfile;
