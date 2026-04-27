// Charges a client to mark an opportunity Urgent. The opportunity is created
// up-front (not yet urgent); the webhook flips is_urgent on success.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

const PAYSTACK_BASE = 'https://api.paystack.co';
const URGENT_FEE = 2000; // R20

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SECRET = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!SECRET) throw new Error('PAYSTACK_SECRET_KEY not configured');

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
    const userEmail = claims.claims.email as string;

    const body = await req.json().catch(() => ({}));
    const opportunityId = String(body.opportunity_id ?? '');
    const callbackUrl = String(body.callback_url ?? '');
    if (!opportunityId) {
      return new Response(JSON.stringify({ error: 'opportunity_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const initRes = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        amount: URGENT_FEE,
        currency: 'ZAR',
        callback_url: callbackUrl || undefined,
        metadata: { user_id: userId, purpose: 'urgent_fee', opportunity_id: opportunityId },
      }),
    });
    const initJson = await initRes.json();
    if (!initRes.ok || !initJson.status) {
      return new Response(JSON.stringify({ error: 'Paystack init failed', details: initJson }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { error: insErr } = await admin.from('urgent_fees').insert({
      client_id: userId,
      opportunity_id: opportunityId,
      amount_cents: URGENT_FEE,
      paystack_reference: initJson.data.reference,
    });
    if (insErr) console.error('urgent_fees insert failed', insErr);

    return new Response(JSON.stringify({
      authorization_url: initJson.data.authorization_url,
      reference: initJson.data.reference,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
