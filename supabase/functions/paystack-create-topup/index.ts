// Initiates a one-shot Paystack transaction for a Klap top-up pack.
// Records a pending row in klap_topups; webhook will credit Klaps on success.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

const PAYSTACK_BASE = 'https://api.paystack.co';

const PACKS = {
  'six-pack': { klaps: 6,  amount: 5000  }, // R50
  'crate':    { klaps: 20, amount: 15000 }, // R150
} as const;
type PackSlug = keyof typeof PACKS;

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
    const pack = body.pack as PackSlug;
    const callbackUrl = String(body.callback_url ?? '');
    if (!PACKS[pack]) {
      return new Response(JSON.stringify({ error: 'Invalid pack' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { klaps, amount } = PACKS[pack];

    const initRes = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        amount,
        currency: 'ZAR',
        callback_url: callbackUrl || undefined,
        metadata: { user_id: userId, purpose: 'klap_topup', pack, klaps },
      }),
    });
    const initJson = await initRes.json();
    if (!initRes.ok || !initJson.status) {
      return new Response(JSON.stringify({ error: 'Paystack init failed', details: initJson }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Record pending purchase using service role (RLS prevents user inserts).
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { error: insErr } = await admin.from('klap_topups').insert({
      user_id: userId,
      pack_slug: pack,
      klaps,
      amount_cents: amount,
      paystack_reference: initJson.data.reference,
    });
    if (insErr) console.error('klap_topups insert failed', insErr);

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
