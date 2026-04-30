// Initiates a Paystack subscription for a paid tier.
// Returns a hosted-checkout URL the client redirects to.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

const PAYSTACK_BASE = 'https://api.paystack.co';

// Accept both legacy ('hustler' / 'main-oke') and current ('basic' / 'verified_pro')
// tier slugs so we don't break older clients.
type Tier = 'basic' | 'verified_pro' | 'hustler' | 'main-oke';
type BillingCycle = 'monthly' | 'annual';

function normalizeTier(t: Tier): 'basic' | 'verified_pro' {
  if (t === 'hustler') return 'basic';
  if (t === 'main-oke') return 'verified_pro';
  return t;
}

const TIER_AMOUNTS: Record<'basic' | 'verified_pro', Record<BillingCycle, number>> = {
  // amounts in kobo (cents). Annual = 10 months (10% off 12).
  basic:        { monthly: 5000,  annual: 54000  }, // R50  / R540
  verified_pro: { monthly: 25000, annual: 270000 }, // R250 / R2700
};

function planCodeFor(tier: 'basic' | 'verified_pro', cycle: BillingCycle): string | undefined {
  const env = (k: string) => Deno.env.get(k);
  if (tier === 'basic') {
    return cycle === 'annual'
      ? env('PAYSTACK_PLAN_BASIC_ANNUAL')
      : (env('PAYSTACK_PLAN_BASIC_MONTHLY') || env('PAYSTACK_PLAN_HUSTLER'));
  }
  return cycle === 'annual'
    ? env('PAYSTACK_PLAN_VERIFIED_PRO_ANNUAL')
    : (env('PAYSTACK_PLAN_VERIFIED_PRO_MONTHLY') || env('PAYSTACK_PLAN_MAIN_OKE'));
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
    const rawTier = body.tier as Tier;
    const rawCycle = (body.billing_cycle ?? 'monthly') as BillingCycle;
    const callbackUrl = String(body.callback_url ?? '');

    if (!['basic', 'verified_pro', 'hustler', 'main-oke'].includes(rawTier)) {
      return new Response(JSON.stringify({ error: 'Invalid tier' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (rawCycle !== 'monthly' && rawCycle !== 'annual') {
      return new Response(JSON.stringify({ error: 'Invalid billing_cycle' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const tier = normalizeTier(rawTier);
    const planCode = planCodeFor(tier, rawCycle);

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
        amount: TIER_AMOUNTS[tier][rawCycle],
        currency: 'ZAR',
        callback_url: callbackUrl || undefined,
        plan: planCode || undefined,
        metadata: {
          user_id: userId,
          purpose: 'subscription',
          tier,
          billing_cycle: rawCycle,
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
