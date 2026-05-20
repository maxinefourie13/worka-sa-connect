// PayFast Instant Transaction Notification (ITN) webhook.
// Public endpoint — verify_jwt = false. Validates signature + posts back to PayFast
// for a server-to-server confirmation, then updates provider_balances + payment_events.
//
// PayFast docs: https://developers.payfast.co.za/docs#step_4_confirm_payment

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { createHash } from 'node:crypto';

function payfastValidateHost(): string {
  const mode = (Deno.env.get('PAYFAST_MODE') ?? 'sandbox').toLowerCase();
  return mode === 'live' ? 'www.payfast.co.za' : 'sandbox.payfast.co.za';
}

function pfEncode(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, '+');
}

function md5(input: string): string {
  return createHash('md5').update(input).digest('hex');
}

// PayFast ITN: rebuild signature from all posted fields except `signature` itself,
// in the original POST order, joined with '&', then append &passphrase=… if set.
function verifyItnSignature(orderedPairs: Array<[string, string]>, providedSig: string, passphrase: string): boolean {
  const pairs: string[] = [];
  for (const [key, value] of orderedPairs) {
    if (key === 'signature') continue;
    if (value === undefined || value === null) continue;
    pairs.push(`${key}=${pfEncode(String(value).trim())}`);
  }
  if (passphrase) pairs.push(`passphrase=${pfEncode(passphrase.trim())}`);
  const computed = md5(pairs.join('&'));
  return computed.toLowerCase() === (providedSig ?? '').toLowerCase();
}

async function postBackValidate(rawBody: string): Promise<boolean> {
  try {
    const res = await fetch(`https://${payfastValidateHost()}/eng/query/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: rawBody,
    });
    const text = (await res.text()).trim();
    return text === 'VALID';
  } catch (err) {
    console.error('[payfast-itn] postback validate failed', err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const PASSPHRASE = Deno.env.get('PAYFAST_PASSPHRASE') ?? '';
  const rawBody = await req.text();

  // Parse keeping original key order for signature verification.
  const params = new URLSearchParams(rawBody);
  const ordered: Array<[string, string]> = [];
  const map: Record<string, string> = {};
  for (const [k, v] of params.entries()) {
    ordered.push([k, v]);
    map[k] = v;
  }

  const providedSig = map.signature ?? '';
  if (!(await verifyItnSignature(ordered, providedSig, PASSPHRASE))) {
    console.warn('[payfast-itn] invalid signature');
    return new Response('Invalid signature', { status: 401 });
  }

  if (!(await postBackValidate(rawBody))) {
    console.warn('[payfast-itn] postback validation failed');
    return new Response('Postback invalid', { status: 401 });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const paymentStatus = (map.payment_status ?? '').toUpperCase();
  const userId = map.custom_str1 || null;
  const purpose = map.custom_str2 || null;
  const tierRaw = map.custom_str3 || null;
  const billingCycleRaw = (map.custom_str4 || 'monthly').toLowerCase();
  const billingCycle: 'monthly' | 'annual' = billingCycleRaw === 'annual' ? 'annual' : 'monthly';

  const pfToken = map.token || null; // recurring token for cancellations/future charges
  const reference = map.pf_payment_id || map.m_payment_id || `payfast-${Date.now()}`;
  const amountGross = parseFloat(map.amount_gross ?? '0');
  const amountCents = Number.isFinite(amountGross) ? Math.round(amountGross * 100) : null;

  const kind =
    paymentStatus === 'COMPLETE' && purpose === 'subscription' ? 'subscription_charge' :
    paymentStatus === 'CANCELLED' ? 'subscription_disable' :
    paymentStatus === 'FAILED' ? 'subscription_payment_failed' :
    'other';

  // Dedupe by reference + provider (paystack_reference column is just an opaque key).
  const { data: insertedEvent, error: insErr } = await admin
    .from('payment_events')
    .insert({
      user_id: userId,
      paystack_reference: `pf:${reference}`,
      paystack_event: paymentStatus || 'unknown',
      kind,
      amount_cents: amountCents,
      currency: 'ZAR',
      billing_cycle: kind === 'subscription_charge' ? billingCycle : null,
      provider: 'payfast',
      raw: { headers: Object.fromEntries(req.headers), body: map },
    })
    .select()
    .single();

  if (insErr) {
    if ((insErr as { code?: string }).code === '23505') return new Response('ok', { status: 200 });
    console.error('[payfast-itn] payment_events insert failed', insErr);
    return new Response('insert failed', { status: 500 });
  }

  let processError: string | null = null;
  try {
    if (kind === 'subscription_charge' && userId && tierRaw === 'verified_pro') {
      const renewalMs = billingCycle === 'annual'
        ? 365 * 24 * 60 * 60 * 1000
        : 30  * 24 * 60 * 60 * 1000;
      const nextRenewal = new Date(Date.now() + renewalMs).toISOString();

      // Reuse the existing RPC. PayFast token goes into the subscription_code slot
      // so it stays addressable for later disable events; customer_code stays null.
      const { error } = await admin.rpc('apply_subscription_payment', {
        _user_id: userId,
        _tier: 'verified_pro',
        _customer_code: null,
        _subscription_code: pfToken ? `pf:${pfToken}` : `pf:${reference}`,
        _next_renewal: nextRenewal,
        _billing_cycle: billingCycle,
      });
      if (error) processError = error.message;

      // Also stash the raw PayFast token on its own column for cancellation flows.
      if (!error && pfToken) {
        await admin
          .from('provider_balances')
          .update({ payfast_token: pfToken, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
      }
    } else if (kind === 'subscription_disable' || kind === 'subscription_payment_failed') {
      const subCode = pfToken ? `pf:${pfToken}` : null;
      if (subCode) {
        const { error } = await admin.rpc('lapse_subscription', { _subscription_code: subCode });
        if (error) processError = error.message;
      }
    }
  } catch (err) {
    processError = err instanceof Error ? err.message : 'Unknown';
  }

  await admin
    .from('payment_events')
    .update({
      processed: !processError,
      processed_at: new Date().toISOString(),
      error_message: processError,
    })
    .eq('id', insertedEvent.id);

  return new Response('ok', { status: 200 });
});
