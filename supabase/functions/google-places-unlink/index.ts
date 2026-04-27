// Unlink a business's Google Reviews — clears columns and deletes cached reviews.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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
    if (!businessId) throw new Error("businessId is required");

    const { data: biz } = await supabase
      .from("businesses").select("id, owner_id").eq("id", businessId).maybeSingle();
    if (!biz || biz.owner_id !== userData.user.id) throw new Error("Not allowed");

    await supabase.from("businesses").update({
      google_place_id: null,
      google_maps_url: null,
      google_rating: null,
      google_review_count: null,
      google_reviews_last_fetched_at: null,
    }).eq("id", businessId);

    await admin.from("business_google_reviews").delete().eq("business_id", businessId);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[google-places-unlink]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
