// Initiates a Smile ID verification flow.
// In stub mode (default until Smile ID partner account activates), this auto-fires
// a "verified" webhook after a short delay so the entire UX can be QA'd end-to-end.
// In live mode, returns the params the Smile ID Web SDK needs to launch directly
// in the user's browser. Raw ID images NEVER touch our backend (POPIA compliance).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claims.claims.sub as string;

    const mode = (Deno.env.get('SMILE_ID_MODE') ?? 'stub').toLowerCase();
    const jobId = `sjoh-${userId.substring(0, 8)}-${Date.now()}`;

    // Mark verification as pending (RLS-allowed via the user-scoped client).
    await userClient.rpc('mark_verification_pending', { _job_id: jobId });

    if (mode === 'stub') {
      // Auto-fire success webhook in 2s using service role (bypasses webhook signature).
      const admin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      // Fire-and-forget; client polls or uses realtime to see status flip.
      setTimeout(async () => {
        try {
          await admin.rpc('apply_verification_result', {
            _user_id: userId,
            _job_id: jobId,
            _verified: true,
          });
        } catch (e) {
          console.error('stub verification failed', e);
        }
      }, 2000);

      return new Response(JSON.stringify({
        mode: 'stub',
        job_id: jobId,
        message: 'Stub mode — verification will auto-complete in ~2 seconds.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Live mode — return Smile ID Web SDK config.
    const partnerId = Deno.env.get('SMILE_ID_PARTNER_ID');
    const apiKey = Deno.env.get('SMILE_ID_API_KEY');
    if (!partnerId || !apiKey) {
      return new Response(JSON.stringify({ error: 'Smile ID not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      mode: 'live',
      job_id: jobId,
      partner_id: partnerId,
      // The actual signature should be generated server-side per Smile ID docs.
      // This is a placeholder shape; replace with real signature generation when SDK is wired.
      product: 'biometric_kyc',
      country: 'ZA',
      id_type: 'NATIONAL_ID',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
