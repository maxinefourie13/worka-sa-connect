// Receives all Paystack webhooks. Verifies HMAC, dedupes, then routes by purpose.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { createHmac } from 'node:crypto';

// Webhook is public — verify_jwt should be false in supabase/config.toml.

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const computed = createHmac('sha512', secret).update(rawBody).digest('hex');
  return computed === signature;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const SECRET = Deno.env.get('PAYSTACK_SECRET_KEY');
  const WEBHOOK_SECRET = Deno.env.get('PAYSTACK_WEBHOOK_SECRET') || SECRET; // Paystack signs with secret key by default
  if (!WEBHOOK_SECRET) return new Response('Server misconfigured', { status: 500 });

  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature');
  if (!verifySignature(rawBody, signature, WEBHOOK_SECRET)) {
    console.warn('Invalid Paystack signature');
    return new Response('Invalid signature', { status: 401 });
  }

  let payload: any;
  try { payload = JSON.parse(rawBody); } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  const event = String(payload.event ?? '');
  const data = payload.data ?? {};
  const reference: string = data.reference ?? data.subscription_code ?? `${event}-${Date.now()}`;

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Dedupe by paystack_reference (unique). If duplicate, just 200.
  const meta = data.metadata ?? {};
  const userId: string | undefined = meta.user_id;
  const purpose: string | undefined = meta.purpose;
  const amount: number | undefined = data.amount;

  const kind =
    event === 'charge.success' && purpose === 'subscription' ? 'subscription_charge' :
    event === 'charge.success' && purpose === 'klap_topup'   ? 'klap_topup_charge'  :
    event === 'charge.success' && purpose === 'urgent_fee'   ? 'urgent_fee_charge'  :
    event === 'subscription.disable'   ? 'subscription_disable' :
    event === 'invoice.payment_failed' ? 'subscription_payment_failed' :
    'other';

  const { data: insertedEvent, error: insErr } = await admin
    .from('payment_events')
    .insert({
      user_id: userId ?? null,
      paystack_reference: reference,
      paystack_event: event,
      kind,
      amount_cents: amount ?? null,
      currency: data.currency ?? 'ZAR',
      raw: payload,
    })
    .select()
    .single();

  if (insErr) {
    // Unique violation = already processed
    if ((insErr as any).code === '23505') return new Response('ok', { status: 200 });
    console.error('payment_events insert failed', insErr);
    return new Response('insert failed', { status: 500 });
  }

  let processError: string | null = null;
  try {
    if (kind === 'subscription_charge' && userId) {
      const tier = meta.tier as 'hustler' | 'main-oke';
      // Paystack returns next_payment_date on subscription events; for charge.success
      // we approximate: now + 30 days.
      const nextRenewal = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const customerCode = data.customer?.customer_code ?? null;
      const subscriptionCode = data.plan_object?.plan_code ?? data.plan ?? null;
      const { error } = await admin.rpc('apply_subscription_payment', {
        _user_id: userId,
        _tier: tier,
        _customer_code: customerCode,
        _subscription_code: subscriptionCode,
        _next_renewal: nextRenewal,
      });
      if (error) processError = error.message;
    } else if (kind === 'klap_topup_charge') {
      const { data: topup } = await admin
        .from('klap_topups')
        .select('id')
        .eq('paystack_reference', reference)
        .single();
      if (topup) {
        const { error } = await admin.rpc('apply_klap_topup', { _topup_id: topup.id });
        if (error) processError = error.message;
      } else {
        processError = 'topup row missing';
      }
    } else if (kind === 'urgent_fee_charge') {
      // Urgent SOS feature was removed — ignore legacy webhooks gracefully.
      processError = null;
    } else if (kind === 'subscription_disable' || kind === 'subscription_payment_failed') {
      const subCode = data.subscription_code ?? data.plan ?? null;
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
