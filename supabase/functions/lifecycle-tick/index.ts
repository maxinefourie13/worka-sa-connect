// Daily lifecycle sweep — runs run_lifecycle_sweep() which:
//  - hides workshop-listings whose trial expired with no paid sub
//  - archives listings whose paid sub lapsed > 30 days ago
//  - runs the existing inactivity transitions
// Verified businesses are exempt from all of the above.
// Triggered daily by pg_cron (see migration in lovable.md / supabase scheduled jobs).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await admin.rpc('run_lifecycle_sweep');
    if (error) throw error;

    console.log('lifecycle-tick result', data);
    return new Response(JSON.stringify({ ok: true, result: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('lifecycle-tick failed', msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
