// Cron-invoked refresh: re-fetches Google reviews for businesses that haven't been
// refreshed in 7 days. Limited to 25 businesses per run to control API spend.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { fetchPlaceDetails } from "../_shared/google-places.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is not configured");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const cutoff = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
    const { data: businesses, error } = await admin
      .from("businesses")
      .select("id, google_place_id")
      .not("google_place_id", "is", null)
      .or(`google_reviews_last_fetched_at.is.null,google_reviews_last_fetched_at.lt.${cutoff}`)
      .limit(25);
    if (error) throw error;

    const results: Array<{ businessId: string; ok: boolean; error?: string }> = [];
    for (const biz of businesses ?? []) {
      try {
        const details = await fetchPlaceDetails(biz.google_place_id!, apiKey);
        await admin.from("businesses").update({
          google_rating: details.rating,
          google_review_count: details.userRatingCount,
          google_reviews_last_fetched_at: new Date().toISOString(),
        }).eq("id", biz.id);

        await admin.from("business_google_reviews").delete().eq("business_id", biz.id);
        if (details.reviews.length > 0) {
          await admin.from("business_google_reviews").insert(
            details.reviews.map((r) => ({
              business_id: biz.id,
              author_name: r.authorName,
              author_photo_url: r.authorPhotoUrl,
              rating: r.rating,
              text: r.text,
              relative_time: r.relativePublishTimeDescription,
              time: r.publishTime,
              language: r.languageCode,
            })),
          );
        }
        results.push({ businessId: biz.id, ok: true });
      } catch (e) {
        results.push({ businessId: biz.id, ok: false, error: e instanceof Error ? e.message : String(e) });
      }
    }

    return new Response(JSON.stringify({ refreshed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[google-places-refresh]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
