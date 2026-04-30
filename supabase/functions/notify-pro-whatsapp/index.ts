// Sjoh — notify-pro-whatsapp
// Sends a WhatsApp lead alert via Twilio to opted-in Pros.
// Auth: requires a valid user JWT, but the Pro must own the destination row.
// Throttled: a Pro receives at most 5 WhatsApp alerts per hour (in-DB rate_limits).
//
// If Twilio is not yet configured, the function returns a soft 200 with
// `{ delivered: false, reason: "twilio_not_configured" }` so callers don't break.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const TWILIO_GATEWAY = 'https://connector-gateway.lovable.dev/twilio';

const BodySchema = z.object({
  opportunity_id: z.string().uuid(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing authorization' }, 401);
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return json({ error: 'Not authenticated' }, 401);
    }
    const userId = userData.user.id;

    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // 1. Check Pro opt-in & destination number
    const { data: prefs } = await admin
      .from('provider_balances')
      .select('whatsapp_alerts_optin, whatsapp_number')
      .eq('user_id', userId)
      .maybeSingle();

    if (!prefs?.whatsapp_alerts_optin || !prefs.whatsapp_number) {
      return json({ delivered: false, reason: 'not_opted_in' }, 200);
    }

    // 2. Throttle: max 5 alerts/hour per Pro
    const { count } = await admin
      .from('rate_limits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'wa_lead_alert')
      .gte('created_at', new Date(Date.now() - 3600_000).toISOString());

    if ((count ?? 0) >= 5) {
      return json({ delivered: false, reason: 'rate_limited' }, 200);
    }

    // 3. Load the lead
    const { data: opp } = await admin
      .from('opportunities')
      .select('id, title, city, province, category_name, budget')
      .eq('id', parsed.data.opportunity_id)
      .maybeSingle();

    if (!opp) {
      return json({ error: 'Opportunity not found' }, 404);
    }

    // 4. Twilio configured?
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const twilioKey = Deno.env.get('TWILIO_API_KEY');
    const twilioFrom = Deno.env.get('TWILIO_WHATSAPP_FROM'); // e.g. "whatsapp:+14155238886"
    if (!lovableKey || !twilioKey || !twilioFrom) {
      return json(
        {
          delivered: false,
          reason: 'twilio_not_configured',
          hint: 'Connect Twilio + set TWILIO_WHATSAPP_FROM secret to enable WhatsApp alerts.',
        },
        200,
      );
    }

    const link = `https://sjoh.co.za/leads/${opp.id}`;
    const body =
      `Sjoh! New ${opp.category_name} lead in ${opp.city}, ${opp.province}.\n\n` +
      `"${opp.title}"\nBudget: R${Math.round(Number(opp.budget ?? 0))}\n\n` +
      `Quote it: ${link}`;

    const twilioRes = await fetch(`${TWILIO_GATEWAY}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        'X-Connection-Api-Key': twilioKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: `whatsapp:${prefs.whatsapp_number}`,
        From: twilioFrom,
        Body: body,
      }),
    });
    const twilioData = await twilioRes.json();
    if (!twilioRes.ok) {
      console.error('Twilio send failed', twilioRes.status, twilioData);
      return json({ delivered: false, reason: 'twilio_error', status: twilioRes.status }, 200);
    }

    await admin.from('rate_limits').insert({ user_id: userId, action: 'wa_lead_alert' });

    return json({ delivered: true, sid: twilioData.sid }, 200);
  } catch (err: unknown) {
    console.error('notify-pro-whatsapp error', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: message }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
