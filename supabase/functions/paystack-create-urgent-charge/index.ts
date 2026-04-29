// Initialises a one-off Paystack transaction for an Urgent Job Boost (R50).
// On success, the existing paystack-webhook handler picks up the metadata and
// calls apply_urgent_boost to mark the opportunity as boosted.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

const PAYSTACK_BASE = 'https://api.paystack.co';
const URGENT_BOOST_AMOUNT_KOBO = 5000; // R50 in cents/kobo

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SECRET = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!SECRET) throw new Error('PAYSTACK_SECRET_KEY not configured');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claims.claims.sub as string;
    const userEmail = claims.claims.email as string;

    const body = await req.json().catch(() => ({}));
    const opportunityId = String(body.opportunity_id ?? '');
    const callbackUrl = String(body.callback_url ?? '');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(opportunityId)) {
      return new Response(JSON.stringify({ error: 'Invalid opportunity_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the user owns this opportunity (RLS would let them see all,
    // but only the owner should be allowed to boost it).
    const { data: opp, error: oppErr } = await supabase
      .from('opportunities')
      .select('id, client_id, status, urgent_boost_paid_at, title')
      .eq('id', opportunityId)
      .single();
    if (oppErr || !opp) {
      return new Response(JSON.stringify({ error: 'Opportunity not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (opp.client_id !== userId) {
      return new Response(JSON.stringify({ error: 'You do not own this opportunity' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (opp.status !== 'open') {
      return new Response(JSON.stringify({ error: 'Only open jobs can be boosted' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Block re-boost while still active (72h window)
    if (opp.urgent_boost_paid_at) {
      const boostedAt = new Date(opp.urgent_boost_paid_at).getTime();
      const stillActive = Date.now() - boostedAt < 72 * 60 * 60 * 1000;
      if (stillActive) {
        return new Response(JSON.stringify({ error: 'This job is already boosted' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const initRes = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userEmail,
        amount: URGENT_BOOST_AMOUNT_KOBO,
        currency: 'ZAR',
        callback_url: callbackUrl || undefined,
        metadata: {
          user_id: userId,
          purpose: 'urgent_boost',
          opportunity_id: opportunityId,
          opportunity_title: opp.title,
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
