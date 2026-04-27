// Preview a Google Maps URL: resolve to a Place ID and return rating/review count
// so the owner can confirm before importing.
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
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) throw new Error("Not authenticated");

    const body = await req.json();
    const businessId: string = body.businessId;
    const mapsUrl: string = body.mapsUrl;
    if (!businessId || !mapsUrl) throw new Error("businessId and mapsUrl are required");

    // Verify caller owns this business
    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .select("id, owner_id")
      .eq("id", businessId)
      .maybeSingle();
    if (bizErr) throw bizErr;
    if (!biz || biz.owner_id !== userData.user.id) throw new Error("Not allowed");

    const placeId = await resolvePlaceIdFromUrl(mapsUrl, apiKey);
    const details = await fetchPlaceDetails(placeId, apiKey);

    return new Response(
      JSON.stringify({
        placeId: details.placeId,
        name: details.name,
        rating: details.rating,
        reviewCount: details.userRatingCount,
        googleMapsUri: details.googleMapsUri,
        reviewSample: details.reviews.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[google-places-link]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
