// Builds a signed PayFast checkout URL for the Verified Pro R250/mo subscription.
// PayFast handles the hosted checkout + recurring billing; our payfast-itn function
// then receives the success notification and flips provider_balances to verified_pro.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { createHash } from 'node:crypto';
import { corsHeaders } from '../_shared/cors.ts';

type Tier = 'verified_pro';
type BillingCycle = 'monthly' | 'annual';

const TIER_AMOUNTS: Record<Tier, Record<BillingCycle, number>> = {
  // amounts in Rand (PayFast expects decimal Rand strings, not cents)
  verified_pro: { monthly: 250, annual: 2700 }, // R250 / R2700 (10 months billed yearly)
};

function payfastHost(): string {
  const mode = (Deno.env.get('PAYFAST_MODE') ?? 'sandbox').toLowerCase();
  return mode === 'live' ? 'www.payfast.co.za' : 'sandbox.payfast.co.za';
}

// PayFast signature: URL-encode each value with their RFC1738 rules,
// join sorted-by-insertion-order key=value pairs with '&', append passphrase,
// then MD5.
function pfEncode(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, '+');
}

function md5(input: string): string {
  return createHash('md5').update(input).digest('hex');
}

function signPayload(params: Record<string, string>, passphrase: string): string {
  const pairs: string[] = [];
  for (const key of Object.keys(params)) {
    const value = params[key];
    if (value === undefined || value === null || value === '') continue;
    pairs.push(`${key}=${pfEncode(String(value).trim())}`);
  }
  if (passphrase) pairs.push(`passphrase=${pfEncode(passphrase.trim())}`);
  return md5(pairs.join('&'));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const MERCHANT_ID = Deno.env.get('PAYFAST_MERCHANT_ID');
    const MERCHANT_KEY = Deno.env.get('PAYFAST_MERCHANT_KEY');
    const PASSPHRASE = Deno.env.get('PAYFAST_PASSPHRASE') ?? '';
    if (!MERCHANT_ID || !MERCHANT_KEY) throw new Error('PayFast merchant credentials not configured');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claims.claims.sub as string;
    const userEmail = (claims.claims.email as string) ?? '';

    const body = await req.json().catch(() => ({}));
    const rawTier = (body.tier as string) ?? 'verified_pro';
    const rawCycle = (body.billing_cycle ?? 'monthly') as BillingCycle;
    const returnUrl = String(body.return_url ?? body.callback_url ?? '');
    const cancelUrl = String(body.cancel_url ?? returnUrl);

    if (rawTier !== 'verified_pro') {
      return new Response(JSON.stringify({ error: 'Only verified_pro is supported via PayFast right now' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (rawCycle !== 'monthly' && rawCycle !== 'annual') {
      return new Response(JSON.stringify({ error: 'Invalid billing_cycle' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const amount = TIER_AMOUNTS.verified_pro[rawCycle].toFixed(2);
    const mPaymentId = `sjoh-${userId}-${Date.now()}`;
    const siteUrl = Deno.env.get('PUBLIC_SITE_URL') ?? 'https://sjoh.co.za';
    const notifyUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/payfast-itn`;

    // Recurring subscription: subscription_type=1, frequency=3 (monthly) or 6 (annually), cycles=0 (forever)
    // PayFast docs: https://developers.payfast.co.za/docs#subscription_payments
    const params: Record<string, string> = {
      // Merchant details
      merchant_id: MERCHANT_ID,
      merchant_key: MERCHANT_KEY,
      return_url: returnUrl || `${siteUrl}/dashboard?paid=1`,
      cancel_url: cancelUrl || `${siteUrl}/pricing?cancelled=1`,
      notify_url: notifyUrl,
      // Buyer details
      email_address: userEmail,
      // Transaction details
      m_payment_id: mPaymentId,
      amount,
      item_name: rawCycle === 'annual'
        ? 'Sjoh Verified Pro — yearly'
        : 'Sjoh Verified Pro — monthly',
      item_description: 'Sjoh Verified Pro subscription. Quote on jobs, get the trust badge, keep 100% of the money.',
      // Custom fields echoed back in the ITN
      custom_str1: userId,
      custom_str2: 'subscription',
      custom_str3: 'verified_pro',
      custom_str4: rawCycle,
      // Subscription details
      subscription_type: '1',
      billing_date: new Date().toISOString().slice(0, 10),
      recurring_amount: amount,
      frequency: rawCycle === 'annual' ? '6' : '3',
      cycles: '0',
    };

    params.signature = await signPayload(params, PASSPHRASE);

    const host = payfastHost();
    const query = Object.entries(params)
      .map(([k, v]) => `${k}=${pfEncode(String(v))}`)
      .join('&');
    const checkoutUrl = `https://${host}/eng/process?${query}`;

    return new Response(JSON.stringify({
      authorization_url: checkoutUrl,
      reference: mPaymentId,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
