// Persist a Google Maps link on a business and import its rating + up to 5 reviews.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { resolvePlaceIdFromUrl, fetchPlaceDetails } from "../_shared/google-places.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) throw new Error("Not authenticated");

    const body = await req.json();
    const businessId: string = body.businessId;
    const mapsUrl: string | undefined = body.mapsUrl;
    const placeIdInput: string | undefined = body.placeId;
    if (!businessId) throw new Error("businessId is required");
    if (!mapsUrl && !placeIdInput) throw new Error("mapsUrl or placeId is required");

    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .select("id, owner_id, google_reviews_last_fetched_at")
      .eq("id", businessId)
      .maybeSingle();
    if (bizErr) throw bizErr;
    if (!biz || biz.owner_id !== userData.user.id) throw new Error("Not allowed");

    // Manual refresh rate limit: 1/hour
    if (!mapsUrl && biz.google_reviews_last_fetched_at) {
      const last = new Date(biz.google_reviews_last_fetched_at).getTime();
      if (Date.now() - last < 3600_000) {
        throw new Error("Already refreshed in the last hour. Try again later.");
      }
    }

    const placeId = placeIdInput ?? (await resolvePlaceIdFromUrl(mapsUrl!, apiKey));
    const details = await fetchPlaceDetails(placeId, apiKey);

    // Update business row (use admin client to bypass the protect-fields trigger restrictions
    // — owner-update is allowed by RLS but the trigger runs only for non-admin updates;
    // google_* fields aren't in the trigger lock-list so the user client works too. We use
    // user client to keep it simple.)
    const { error: upErr } = await supabase
      .from("businesses")
      .update({
        google_place_id: details.placeId,
        google_maps_url: details.googleMapsUri ?? mapsUrl ?? null,
        google_rating: details.rating,
        google_review_count: details.userRatingCount,
        google_reviews_last_fetched_at: new Date().toISOString(),
      })
      .eq("id", businessId);
    if (upErr) throw upErr;

    // Replace cached reviews
    await admin.from("business_google_reviews").delete().eq("business_id", businessId);
    if (details.reviews.length > 0) {
      const rows = details.reviews.map((r) => ({
        business_id: businessId,
        author_name: r.authorName,
        author_photo_url: r.authorPhotoUrl,
        rating: r.rating,
        text: r.text,
        relative_time: r.relativePublishTimeDescription,
        time: r.publishTime,
        language: r.languageCode,
      }));
      const { error: insErr } = await admin.from("business_google_reviews").insert(rows);
      if (insErr) throw insErr;
    }

    return new Response(
      JSON.stringify({
        placeId: details.placeId,
        rating: details.rating,
        reviewCount: details.userRatingCount,
        importedReviews: details.reviews.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[google-places-import]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
