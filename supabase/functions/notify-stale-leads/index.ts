// Sjoh — notify-stale-leads
// Sweeps open opportunities older than 24h that haven't received a single
// quote yet, and emails the customer up to 5 fallback Pros to consider.
// Idempotent via opportunities.stale_fallback_notified_at.
//
// Designed to run on cron (e.g. hourly). Safe to invoke manually.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

interface StaleOpportunity {
  id: string;
  title: string;
  city: string;
  province: string;
  category_slug: string;
  category_name: string;
  client_id: string | null;
  client_email: string | null;
  posted_by_name: string | null;
}

interface FallbackPro {
  id: string;
  name: string;
  slug: string;
  city: string;
  province: string;
  rating: number | null;
  review_count: number | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    // 1. Find stale leads: open, >24h old, no applicants, not yet notified.
    const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data: stale, error } = await admin
      .from('opportunities')
      .select(
        'id, title, city, province, category_slug, category_name, client_id, client_email, posted_by_name',
      )
      .eq('status', 'open')
      .eq('applicants_count', 0)
      .lte('created_at', cutoff)
      .is('stale_fallback_notified_at', null)
      .limit(50);

    if (error) throw error;

    const list = (stale ?? []) as StaleOpportunity[];
    console.log(`notify-stale-leads: ${list.length} candidates`);

    let sent = 0;
    let skipped = 0;

    for (const opp of list) {
      // Resolve customer email: prefer the explicit one, fallback to auth user
      let recipient = opp.client_email?.trim() || null;
      if (!recipient && opp.client_id) {
        const { data: u } = await admin.auth.admin.getUserById(opp.client_id);
        recipient = u?.user?.email ?? null;
      }
      if (!recipient) {
        console.warn('No recipient for opportunity', opp.id);
        skipped++;
        // Still mark it so we don't re-check forever
        await admin
          .from('opportunities')
          .update({ stale_fallback_notified_at: new Date().toISOString() })
          .eq('id', opp.id);
        continue;
      }

      // 2. Find up to 5 fallback Pros via the SQL helper.
      const { data: pros, error: prosErr } = await admin.rpc(
        'find_fallback_pros_for_opportunity',
        { _opportunity_id: opp.id },
      );
      if (prosErr) {
        console.error('find_fallback_pros_for_opportunity failed', opp.id, prosErr);
        skipped++;
        continue;
      }
      const proList = (pros ?? []) as FallbackPro[];
      if (proList.length === 0) {
        // Nothing to suggest — leave the row unmarked so we try again later
        // when more pros sign up. Skip emailing this round.
        console.log('No fallback pros yet for', opp.id);
        skipped++;
        continue;
      }

      // 3. Send via the existing send-transactional-email function so it
      //    inherits suppression, throttling, and logging.
      const sendRes = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({
          template_name: 'stale-lead-fallback',
          recipient_email: recipient,
          template_data: {
            customerName: opp.posted_by_name ?? 'there',
            jobTitle: opp.title,
            jobUrl: `https://sjoh.co.za/opportunities/${opp.id}`,
            category: opp.category_name?.toLowerCase?.() ?? 'this kind of work',
            city: opp.city,
            pros: proList.map((p) => ({
              name: p.name,
              slug: p.slug,
              city: p.city,
              province: p.province,
              rating: p.rating,
              reviewCount: p.review_count,
            })),
          },
        }),
      });

      if (!sendRes.ok) {
        const errBody = await sendRes.text();
        console.error('send-transactional-email failed', opp.id, sendRes.status, errBody);
        skipped++;
        continue;
      }
      // Consume the body to avoid leaks
      await sendRes.json().catch(() => null);

      await admin
        .from('opportunities')
        .update({ stale_fallback_notified_at: new Date().toISOString() })
        .eq('id', opp.id);

      sent++;
    }

    return new Response(
      JSON.stringify({ ok: true, candidates: list.length, sent, skipped }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('notify-stale-leads failed', message);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
