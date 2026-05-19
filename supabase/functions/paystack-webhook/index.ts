// Receives all Paystack webhooks. Verifies HMAC, dedupes, then routes by purpose.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { createHmac } from 'node:crypto';

// Webhook is public — verify_jwt should be false in supabase/config.toml.

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const computed = createHmac('sha512', secret).update(rawBody).digest('hex');
  return computed === signature;
}

function asRecord(value: unknown): Record<string, any> | null {
  return value && typeof value === 'object' ? value as Record<string, any> : null;
}

function textValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readCustomerCode(data: Record<string, any>): string | null {
  const customer = asRecord(data.customer);
  return textValue(customer?.customer_code)
    ?? textValue(data.customer_code)
    ?? textValue(data.customer);
}

function readSubscriptionCode(data: Record<string, any>): string | null {
  const subscription = asRecord(data.subscription);
  return textValue(subscription?.subscription_code)
    ?? textValue(data.subscription_code);
}

function readPlanCode(data: Record<string, any>): string | null {
  const planObject = asRecord(data.plan_object);
  const plan = asRecord(data.plan);
  return textValue(planObject?.plan_code)
    ?? textValue(plan?.plan_code)
    ?? textValue(data.plan);
}

function readNextPaymentDate(data: Record<string, any>): string | null {
  const subscription = asRecord(data.subscription);
  return textValue(data.next_payment_date)
    ?? textValue(data.next_payment)
    ?? textValue(subscription?.next_payment_date);
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
    event === 'charge.success' && purpose === 'urgent_fee'   ? 'urgent_fee_charge'  :
    event === 'charge.success' && purpose === 'urgent_boost' ? 'urgent_boost'       :
    event === 'subscription.disable'   ? 'subscription_disable' :
    event === 'invoice.payment_failed' ? 'subscription_payment_failed' :
    'other';

  const billingCycle: 'monthly' | 'annual' =
    meta.billing_cycle === 'annual' ? 'annual' : 'monthly';

  const { data: insertedEvent, error: insErr } = await admin
    .from('payment_events')
    .insert({
      user_id: userId ?? null,
      paystack_reference: reference,
      paystack_event: event,
      kind,
      amount_cents: amount ?? null,
      currency: data.currency ?? 'ZAR',
      billing_cycle: kind === 'subscription_charge' ? billingCycle : null,
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
      // Normalize legacy tier names to the live enum values.
      const rawTier = String(meta.tier ?? '');
      const tier =
        rawTier === 'hustler'  ? 'basic' :
        rawTier === 'main-oke' ? 'verified_pro' :
        (rawTier as 'basic' | 'verified_pro');
      // Paystack returns next_payment_date on subscription events; for charge.success
      // we approximate based on billing cycle.
      const renewalMs = billingCycle === 'annual'
        ? 365 * 24 * 60 * 60 * 1000
        : 30  * 24 * 60 * 60 * 1000;
      const nextRenewal = new Date(Date.now() + renewalMs).toISOString();
      const customerCode = readCustomerCode(data);
      const subscriptionCode = readSubscriptionCode(data) ?? readPlanCode(data);
      const { error } = await admin.rpc('apply_subscription_payment', {
        _user_id: userId,
        _tier: tier,
        _customer_code: customerCode,
        _subscription_code: subscriptionCode,
        _next_renewal: nextRenewal,
        _billing_cycle: billingCycle,
      });
      if (error) processError = error.message;
    } else if (kind === 'urgent_fee_charge') {
      // Urgent SOS feature was removed — ignore legacy webhooks gracefully.
      processError = null;
    } else if (kind === 'urgent_boost' && userId) {
      const opportunityId = meta.opportunity_id as string | undefined;
      if (!opportunityId) {
        processError = 'urgent_boost missing opportunity_id metadata';
      } else {
        const { error } = await admin.rpc('apply_urgent_boost', {
          _opportunity_id: opportunityId,
          _user_id: userId,
          _amount_cents: amount ?? 5000,
          _reference: reference,
        });
        if (error) processError = error.message;
      }
    } else if (event === 'subscription.create') {
      // The initial charge.success event can arrive before Paystack gives us the
      // durable SUB_* code. Store it as soon as the subscription event lands so
      // later disable/failure webhooks can match the account reliably.
      const subCode = readSubscriptionCode(data);
      const customerCode = readCustomerCode(data);
      const nextPayment = readNextPaymentDate(data);

      if (subCode && customerCode) {
        const updates: Record<string, string | null> = {
          paystack_subscription_code: subCode,
          updated_at: new Date().toISOString(),
        };
        if (nextPayment) updates.next_renewal_at = nextPayment;

        const { error } = await admin
          .from('provider_balances')
          .update(updates)
          .eq('paystack_customer_code', customerCode);
        if (error) processError = error.message;
      }
    } else if (kind === 'subscription_disable' || kind === 'subscription_payment_failed') {
      const subCode = readSubscriptionCode(data) ?? readPlanCode(data);
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
