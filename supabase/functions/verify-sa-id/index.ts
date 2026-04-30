// ThisIsMe KYC verification edge function for Sjoh.
// Accepts a POST { business_id, id_number, first_name, last_name } from a signed-in
// business owner, calls the ThisIsMe API, and on success stamps the businesses row
// with kyc_verified = true + kyc_reference (their transaction ID) for our audit trail.
//
// Secrets used (set via Lovable Cloud secrets — DO NOT hardcode):
//   THIS_IS_ME_API_KEY    — bearer token / API key issued by ThisIsMe
//   THIS_IS_ME_ENDPOINT   — full URL of the ThisIsMe ID-verification endpoint
//
// Note: the exact request/response shape depends on the ThisIsMe contract you sign.
// The TODO blocks below mark the spots to adjust once the contract is finalised.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const BodySchema = z.object({
  business_id: z.string().uuid(),
  id_number: z
    .string()
    .trim()
    .regex(/^\d{13}$/, "South African ID number must be 13 digits"),
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Sign in to verify your ID" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims?.sub) {
    return json({ error: "Unauthorized" }, 401);
  }
  const userId = claimsData.claims.sub as string;

  // ── Validate input ──────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.flatten().fieldErrors }, 400);
  }
  const { business_id, id_number, first_name, last_name } = parsed.data;

  // ── Confirm caller owns this business ───────────────────────────────────────
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: biz, error: bizError } = await admin
    .from("businesses")
    .select("id, owner_id, kyc_verified")
    .eq("id", business_id)
    .maybeSingle();

  if (bizError) return json({ error: "Could not load business" }, 500);
  if (!biz) return json({ error: "Business not found" }, 404);
  if (biz.owner_id !== userId) {
    return json({ error: "Only the business owner can verify their ID" }, 403);
  }
  if (biz.kyc_verified) {
    return json({ ok: true, already_verified: true }, 200);
  }

  // ── Call ThisIsMe ───────────────────────────────────────────────────────────
  const apiKey = Deno.env.get("THIS_IS_ME_API_KEY");
  const endpoint = Deno.env.get("THIS_IS_ME_ENDPOINT");
  if (!apiKey || !endpoint) {
    return json(
      { error: "KYC provider is not configured yet. Please try again shortly." },
      503,
    );
  }

  let providerResponse: Response;
  try {
    providerResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // TODO: confirm the auth scheme with ThisIsMe — most SA KYC vendors use
        // "Authorization: Bearer <key>" or a custom "x-api-key" header.
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        // TODO: rename these fields to match the exact ThisIsMe request schema
        // (e.g. they may expect `IDNumber`, `FirstName`, `Surname`, etc.).
        id_number,
        first_name,
        last_name,
        reference: business_id,
      }),
    });
  } catch (err) {
    console.error("ThisIsMe network error", err);
    return json({ error: "Could not reach the KYC provider. Try again." }, 502);
  }

  let providerJson: any = null;
  try {
    providerJson = await providerResponse.json();
  } catch {
    providerJson = null;
  }

  if (!providerResponse.ok) {
    console.error("ThisIsMe non-2xx", providerResponse.status, providerJson);
    return json(
      { error: "KYC provider rejected the request", details: providerJson },
      502,
    );
  }

  // ── Parse the ThisIsMe response ─────────────────────────────────────────────
  // TODO: adjust to match ThisIsMe's actual response. Most providers return
  // something like:
  //   {
  //     "status": "VERIFIED" | "FAILED" | "PENDING",
  //     "transaction_id": "abc123",
  //     "match_score": 0.97,
  //     ...
  //   }
  // Treat anything other than the documented success flag as a failed verify.
  const verified =
    providerJson?.status === "VERIFIED" ||
    providerJson?.verified === true ||
    providerJson?.result === "success";

  // TODO: confirm which field carries the audit/transaction ID. Common names:
  //   transaction_id, transactionId, reference, tx_ref, id
  const kycReference: string | null =
    providerJson?.transaction_id ??
    providerJson?.transactionId ??
    providerJson?.reference ??
    providerJson?.id ??
    null;

  if (!verified) {
    return json(
      {
        ok: false,
        verified: false,
        reason: providerJson?.reason ?? "Could not verify this ID",
      },
      200,
    );
  }

  // ── Persist success on the business row ─────────────────────────────────────
  const { error: updateError } = await admin
    .from("businesses")
    .update({
      kyc_verified: true,
      kyc_reference: kycReference,
      kyc_verified_at: new Date().toISOString(),
    })
    .eq("id", business_id);

  if (updateError) {
    console.error("Failed to store KYC result", updateError);
    return json({ error: "Verified, but failed to save result" }, 500);
  }

  return json({ ok: true, verified: true, kyc_reference: kycReference }, 200);
});

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
