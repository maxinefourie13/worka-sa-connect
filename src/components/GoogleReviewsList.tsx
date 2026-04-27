import { useEffect, useState } from "react";
import { Star, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GoogleReview {
  id: string;
  author_name: string;
  author_photo_url: string | null;
  rating: number;
  text: string | null;
  relative_time: string | null;
  time: string | null;
}

interface BusinessGoogleData {
  google_place_id?: string | null;
  google_maps_url?: string | null;
  google_rating?: number | null;
  google_review_count?: number | null;
}

interface Props {
  businessId?: string;
  business?: BusinessGoogleData;
}

export const GoogleReviewsList = ({ businessId, business }: Props) => {
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!businessId || !business?.google_place_id) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from("business_google_reviews")
      .select("id, author_name, author_photo_url, rating, text, relative_time, time")
      .eq("business_id", businessId)
      .order("time", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (cancelled) return;
        setReviews((data as GoogleReview[]) ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [businessId, business?.google_place_id]);

  if (!business?.google_place_id) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6 mb-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-secondary flex items-center justify-center font-display font-bold text-foreground">
            G
          </div>
          <div>
            <p className="font-display text-base font-semibold leading-tight">From Google</p>
            <p className="text-xs text-ink-2 mt-0.5 flex items-center gap-1.5 tabular-nums">
              <span className="font-semibold text-foreground">
                {business.google_rating?.toFixed(1) ?? "—"}
              </span>
              <Star className="size-3.5 text-accent fill-accent" />
              <span className="text-muted-foreground">
                · {business.google_review_count ?? 0} review{business.google_review_count === 1 ? "" : "s"}
              </span>
            </p>
          </div>
        </div>
        {business.google_maps_url && (
          <a
            href={business.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-accent hover:underline inline-flex items-center gap-1"
          >
            View on Google <ExternalLink className="size-3" />
          </a>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="text-xs text-muted-foreground">No review text available — check the rating on Google.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="border-t border-border pt-3 first:border-0 first:pt-0">
              <div className="flex items-start gap-3">
                {r.author_photo_url ? (
                  <img src={r.author_photo_url} alt={r.author_name} className="size-9 rounded-full object-cover" loading="lazy" />
                ) : (
                  <div className="size-9 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                    {r.author_name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{r.author_name}</p>
                    <p className="text-[11px] text-muted-foreground">{r.relative_time ?? ""}</p>
                  </div>
                  <p className="text-xs text-accent font-bold tabular-nums mt-0.5">
                    {"★".repeat(r.rating)}<span className="text-muted-foreground">{"★".repeat(5 - r.rating)}</span>
                  </p>
                  {r.text && <p className="text-sm text-ink-2 mt-2 leading-relaxed whitespace-pre-line">{r.text}</p>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {business.google_maps_url && (
        <p className="text-[10px] text-muted-foreground mt-4 text-center">
          Reviews via Google.{" "}
          <a href={business.google_maps_url} target="_blank" rel="noopener noreferrer" className="underline">
            See all on Google →
          </a>
        </p>
      )}
    </div>
  );
};
