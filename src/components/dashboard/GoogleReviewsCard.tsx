import { useState } from "react";
import { Star, ExternalLink, RefreshCw, Link2, Unlink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMyBusiness } from "@/hooks/useMyBusiness";

interface PreviewState {
  placeId: string;
  name: string;
  rating: number | null;
  reviewCount: number | null;
  googleMapsUri: string | null;
}

export const GoogleReviewsCard = () => {
  const { business, refresh, loading } = useMyBusiness();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  if (loading) return null;
  if (!business) return null;

  const isLinked = !!business.google_place_id;

  const handlePreview = async () => {
    if (!url.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-places-link", {
        body: { businessId: business.id, mapsUrl: url.trim() },
      });
      if (error || !data || data.error) throw new Error(data?.error || error?.message || "Lookup failed");
      setPreview({
        placeId: data.placeId,
        name: data.name,
        rating: data.rating,
        reviewCount: data.reviewCount,
        googleMapsUri: data.googleMapsUri,
      });
    } catch (e) {
      toast({
        title: "Aikona!",
        description: e instanceof Error ? e.message : "Couldn't fetch that listing.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-places-import", {
        body: { businessId: business.id, placeId: preview.placeId, mapsUrl: preview.googleMapsUri ?? url.trim() },
      });
      if (error || !data || data.error) throw new Error(data?.error || error?.message || "Import failed");
      toast({
        title: "Lekker — linked!",
        description: `Pulled ${data.importedReviews} review${data.importedReviews === 1 ? "" : "s"} from Google.`,
      });
      setPreview(null);
      setUrl("");
      await refresh();
    } catch (e) {
      toast({
        title: "Aikona!",
        description: e instanceof Error ? e.message : "Import failed.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleRefresh = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-places-import", {
        body: { businessId: business.id },
      });
      if (error || !data || data.error) throw new Error(data?.error || error?.message || "Refresh failed");
      toast({ title: "Refreshed!", description: `Now showing ${data.importedReviews} latest review${data.importedReviews === 1 ? "" : "s"}.` });
      await refresh();
    } catch (e) {
      toast({
        title: "Eish",
        description: e instanceof Error ? e.message : "Refresh failed.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm("Unlink your Google Reviews? Your imported reviews will be removed from your Sjoh profile.")) return;
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("google-places-unlink", {
        body: { businessId: business.id },
      });
      if (error) throw error;
      toast({ title: "Unlinked", description: "Google Reviews removed from your profile." });
      await refresh();
    } catch (e) {
      toast({
        title: "Aikona!",
        description: e instanceof Error ? e.message : "Unlink failed.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-display text-lg font-semibold tracking-tight flex items-center gap-2">
            <Star className="size-4 text-accent fill-accent" />
            Google Reviews
          </h3>
          <p className="text-xs text-ink-2 mt-1">
            Pull your real Google rating & latest reviews onto your Sjoh profile. Instant trust, no extra work.
          </p>
        </div>
        {isLinked && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-primary-light text-primary px-2 py-1 rounded">
            <Check className="size-3" /> Linked
          </span>
        )}
      </div>

      {isLinked ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-secondary rounded-lg px-4 py-3">
            <div>
              <p className="font-display text-2xl font-semibold tabular-nums">
                {business.google_rating?.toFixed(1) ?? "—"}
                <Star className="size-4 inline -mt-1 ml-1 text-accent fill-accent" />
              </p>
              <p className="text-[11px] text-muted-foreground">
                {business.google_review_count ?? 0} Google review{business.google_review_count === 1 ? "" : "s"}
              </p>
            </div>
            {business.google_maps_url && (
              <a
                href={business.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-[11px] font-bold text-accent hover:underline inline-flex items-center gap-1"
              >
                View on Google <ExternalLink className="size-3" />
              </a>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Auto-refreshes weekly. Last refreshed{" "}
            {business.google_reviews_last_fetched_at
              ? new Date(business.google_reviews_last_fetched_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })
              : "—"}
            .
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={busy} className="gap-1.5">
              <RefreshCw className={busy ? "size-3.5 animate-spin" : "size-3.5"} /> Refresh now
            </Button>
            <Button variant="ghost" size="sm" onClick={handleUnlink} disabled={busy} className="gap-1.5 text-destructive hover:text-destructive">
              <Unlink className="size-3.5" /> Unlink
            </Button>
          </div>
        </div>
      ) : preview ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Found on Google</p>
            <p className="font-display text-base font-semibold">{preview.name}</p>
            <p className="text-xs text-ink-2 mt-1">
              <strong className="text-foreground">{preview.rating?.toFixed(1) ?? "—"} ★</strong>{" "}
              ({preview.reviewCount ?? 0} review{preview.reviewCount === 1 ? "" : "s"})
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleConfirm} disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold gap-1.5">
              <Check className="size-4" /> Yes — link this listing
            </Button>
            <Button variant="ghost" onClick={() => setPreview(null)} disabled={busy}>
              Not the right one
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            We'll show your Google rating and the 5 most recent reviews on your profile, with a link back to Google. No reviews are altered.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-ink-2 block">
            Paste your Google Maps URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-accent"
            />
            <Button onClick={handlePreview} disabled={busy || !url.trim()} className="gap-1.5">
              <Link2 className="size-4" /> Find
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Search for your business on Google Maps, tap "Share" → "Copy link", paste here.
          </p>
        </div>
      )}
    </div>
  );
};
