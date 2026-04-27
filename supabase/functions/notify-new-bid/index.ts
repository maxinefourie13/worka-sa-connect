// Sends an email to a client when a provider submits a new bid on their job.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Verify caller
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const proposalId = String(body?.proposal_id ?? "");
    if (!proposalId) {
      return new Response(JSON.stringify({ error: "proposal_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Load proposal + opportunity + business
    const { data: proposal, error: pErr } = await admin
      .from("proposals")
      .select("id, message, quote_amount, opportunity_id, business_id")
      .eq("id", proposalId)
      .maybeSingle();
    if (pErr || !proposal) {
      return new Response(JSON.stringify({ error: "proposal not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: opp } = await admin
      .from("opportunities")
      .select("id, title, client_id, city")
      .eq("id", proposal.opportunity_id)
      .maybeSingle();
    if (!opp) {
      return new Response(JSON.stringify({ error: "opportunity not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: biz } = await admin
      .from("businesses")
      .select("id, name, is_verified")
      .eq("id", proposal.business_id)
      .maybeSingle();

    // Look up client email via auth admin
    const { data: clientUser } = await admin.auth.admin.getUserById(opp.client_id);
    const clientEmail = clientUser?.user?.email;
    if (!clientEmail) {
      return new Response(JSON.stringify({ error: "client email missing" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send via shared transactional sender
    const { error: sendErr } = await admin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "new-bid-on-job",
        recipientEmail: clientEmail,
        idempotencyKey: `new-bid-${proposalId}`,
        templateData: {
          jobTitle: opp.title,
          businessName: biz?.name ?? "A Sjoh! pro",
          isVerified: !!biz?.is_verified,
          quoteAmount: proposal.quote_amount,
          pitch: (proposal.message ?? "").slice(0, 200),
          jobUrl: `https://sjoh.co.za/opportunities/${opp.id}`,
        },
      },
    });

    if (sendErr) {
      console.error("notify-new-bid send error", sendErr);
      return new Response(JSON.stringify({ ok: false, error: String(sendErr) }), {
        status: 200, // don't fail the bid because email failed
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-new-bid", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
