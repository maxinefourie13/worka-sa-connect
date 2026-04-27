// Receives Smile ID verification result. Verifies signature, then writes the
// boolean result to provider_balances via apply_verification_result.
// We never touch raw ID images — Smile ID stores those.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { createHmac } from 'node:crypto';

function verifyHmac(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const computed = createHmac('sha256', secret).update(rawBody).digest('hex');
  return computed === signature;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const rawBody = await req.text();
  const signature = req.headers.get('x-smile-signature');
  const secret = Deno.env.get('SMILE_ID_API_KEY');

  // In stub mode the secret may not be set — accept unsigned calls only when stubbing.
  const mode = (Deno.env.get('SMILE_ID_MODE') ?? 'stub').toLowerCase();
  if (mode === 'live') {
    if (!secret || !verifyHmac(rawBody, signature, secret)) {
      return new Response('Invalid signature', { status: 401 });
    }
  }

  let payload: any;
  try { payload = JSON.parse(rawBody); } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  const jobId: string | undefined = payload.job_id;
  // Smile ID success codes: '0810', '0811', '0812' indicate verified.
  // Adjust per real Smile ID response shape when going live.
  const resultCode: string | undefined = payload.ResultCode ?? payload.result_code;
  const verified = payload.verified ?? (resultCode ? ['0810', '0811', '0812'].includes(resultCode) : false);

  if (!jobId) return new Response('job_id required', { status: 400 });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Look up user by smile_id_job_id (set during init).
  const { data: row } = await admin
    .from('provider_balances')
    .select('user_id')
    .eq('smile_id_job_id', jobId)
    .maybeSingle();

  if (!row) return new Response('Unknown job', { status: 404 });

  const { error } = await admin.rpc('apply_verification_result', {
    _user_id: row.user_id,
    _job_id: jobId,
    _verified: verified,
  });
  if (error) {
    console.error('apply_verification_result failed', error);
    return new Response('apply failed', { status: 500 });
  }

  return new Response('ok', { status: 200 });
});
