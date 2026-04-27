// Initiates a Paystack subscription for a paid tier.
// Returns a hosted-checkout URL the client redirects to.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

const PAYSTACK_BASE = 'https://api.paystack.co';

type Tier = 'hustler' | 'main-oke';

const TIER_AMOUNTS: Record<Tier, number> = {
  // amounts in kobo (cents)
  'hustler': 5000,    // R50
  'main-oke': 25000,  // R250
};

function planCodeFor(tier: Tier): string | undefined {
  return tier === 'hustler'
    ? Deno.env.get('PAYSTACK_PLAN_HUSTLER')
    : Deno.env.get('PAYSTACK_PLAN_MAIN_OKE');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SECRET = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!SECRET) throw new Error('PAYSTACK_SECRET_KEY not configured');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claims.claims.sub as string;
    const userEmail = claims.claims.email as string;

    const body = await req.json().catch(() => ({}));
    const tier = body.tier as Tier;
    const callbackUrl = String(body.callback_url ?? '');
    if (tier !== 'hustler' && tier !== 'main-oke') {
      return new Response(JSON.stringify({ error: 'Invalid tier' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const planCode = planCodeFor(tier);

    // Initialize a transaction. If a plan is configured, attaching `plan` makes
    // Paystack auto-create a subscription on success.
    const initRes = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userEmail,
        amount: TIER_AMOUNTS[tier],
        currency: 'ZAR',
        callback_url: callbackUrl || undefined,
        plan: planCode || undefined,
        metadata: {
          user_id: userId,
          purpose: 'subscription',
          tier,
        },
      }),
    });

    const initJson = await initRes.json();
    if (!initRes.ok || !initJson.status) {
      return new Response(JSON.stringify({ error: 'Paystack init failed', details: initJson }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      authorization_url: initJson.data.authorization_url,
      reference: initJson.data.reference,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
