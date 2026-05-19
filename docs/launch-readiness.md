# Sjoh Launch Readiness

This checklist covers the pieces that must be done outside the local app before launch.

## How To Add Secrets

Use the helper script so secrets are hidden while typing and do not end up in shell history:

```bash
cd /Users/maxin/Downloads/sjoh
./scripts/set-supabase-secrets.sh
```

If you need to see what you are typing, run visible-entry mode instead:

```bash
cd /Users/maxin/Downloads/sjoh
SHOW_SECRETS=1 ./scripts/set-supabase-secrets.sh
```

Only use visible-entry mode when no one else can see your screen.

Add these first because they block launch testing:

- `PAYSTACK_SECRET_KEY` from Paystack live mode.
- `PAYSTACK_PLAN_VERIFIED_PRO_MONTHLY` from the live R250/month Paystack plan.
- `OPENAI_API_KEY` for the automated Sjoh ID Check.

Optional but useful before a bigger launch:

- `PAYSTACK_WEBHOOK_SECRET` if you choose a separate webhook secret. If not, the function falls back to the Paystack secret key.
- `PAYSTACK_PLAN_VERIFIED_PRO_ANNUAL` if annual billing stays enabled.
- `GOOGLE_PLACES_API_KEY` for Places imports/linking.
- `LOVABLE_API_KEY` and `LOVABLE_SEND_URL` for transactional email sending.
- `ONESIGNAL_APP_ID` and `ONESIGNAL_REST_API_KEY` for push notifications.
- `TWILIO_API_KEY` and `TWILIO_WHATSAPP_FROM` for WhatsApp notifications.

## Supabase

- Production project:
  - `omhjcalrfhswjmanriqv`
  - `https://omhjcalrfhswjmanriqv.supabase.co`
- Database migrations have been pushed to the production Supabase project.
- Edge Functions have been deployed, excluding the old third-party ID verification functions.
- Confirm the app-specific Supabase secrets are present:
  - `OPENAI_API_KEY`
  - `PAYSTACK_SECRET_KEY`
  - `PAYSTACK_WEBHOOK_SECRET` if different from the secret key
  - `PAYSTACK_PLAN_VERIFIED_PRO_MONTHLY`
  - `PAYSTACK_PLAN_VERIFIED_PRO_ANNUAL` if annual billing stays enabled
  - `PAYSTACK_PLAN_BASIC_MONTHLY` / `PAYSTACK_PLAN_BASIC_ANNUAL` if basic listings stay enabled
  - `GOOGLE_PLACES_API_KEY`
  - `ONESIGNAL_APP_ID`
  - `ONESIGNAL_REST_API_KEY`
  - `TWILIO_API_KEY`
  - `TWILIO_WHATSAPP_FROM`
  - `LOVABLE_API_KEY`
  - `PUBLIC_SITE_URL`

## Paystack

- Wait for Paystack account verification.
- Decide the final trial mechanic before launch:
  - Keep the current code and change copy to say the first month is charged immediately.
  - Or keep the “30-day free trial, card required” promise and implement a card-authorization/first-charge-later flow.
  - Do not launch paid acquisition while the copy and checkout behavior disagree.
- Confirm live keys are saved as Supabase secrets:
  - `PAYSTACK_SECRET_KEY`
  - `PAYSTACK_WEBHOOK_SECRET` if different from the secret key
  - `PAYSTACK_PLAN_VERIFIED_PRO_MONTHLY`
  - `PAYSTACK_PLAN_VERIFIED_PRO_ANNUAL` if annual billing stays enabled
  - `PAYSTACK_PLAN_BASIC_MONTHLY` / `PAYSTACK_PLAN_BASIC_ANNUAL` if basic listings stay enabled
- Confirm the Paystack webhook points to:
  - `https://omhjcalrfhswjmanriqv.supabase.co/functions/v1/paystack-webhook`
- Test a card-required trial, first subscription charge, failed charge, cancellation, and webhook state update.
- Confirm Paystack sends durable `SUB_*` subscription codes to the webhook; Sjoh stores those codes for cancellation and failed-payment matching.

## Sjoh ID Check

- Run the latest Supabase migration:
  - `supabase/migrations/20260516110940_replace_smile_with_sjoh_id_check.sql`
- Deploy the updated edge function:
  - `supabase functions deploy verify-sa-id`
- Add Supabase edge function secrets:
  - `OPENAI_API_KEY`
  - Optional: `OPENAI_VISION_MODEL`
- Do not deploy the old third-party ID verification functions.
- Test the flow:
  - Create/list a business.
  - Open `/dashboard?section=verification`.
  - Upload a clear ID image.
  - Confirm the status moves from pending/processing to verified or failed.
  - Confirm verified businesses can apply for jobs and unverified businesses cannot.

## Production Deploy

- Push the latest code to GitHub.
- Set the production frontend env vars in the deploy host:
  - `VITE_SUPABASE_PROJECT_ID=omhjcalrfhswjmanriqv`
  - `VITE_SUPABASE_URL=https://omhjcalrfhswjmanriqv.supabase.co`
  - `VITE_SUPABASE_PUBLISHABLE_KEY=<the publishable key from the local .env>`
  - Optional: `VITE_ONESIGNAL_APP_ID=<your OneSignal app id>`
- Deploy the latest build to `sjoh.co.za`.
- Confirm:
  - `https://sjoh.co.za/`
  - `https://sjoh.co.za/for-businesses`
  - `https://sjoh.co.za/for-businesses/trades`
  - `https://sjoh.co.za/pricing`
  - `https://sjoh.co.za/requests`
  - `https://sjoh.co.za/directory`
  - `https://sjoh.co.za/sitemap.xml`

## QA Journeys

- Customer journey:
  - Browse/search directory.
  - Post a job.
  - Receive a quote.
  - Accept a quote.
  - Receive quote/invoice emails.
- Business journey:
  - Visit ad landing page.
  - Create account.
  - Choose plan.
  - List business.
  - Add profile details, portfolio photos, service areas, and categories.
  - Complete Sjoh ID Check.
  - Browse opportunities.
  - Send quote.
  - Generate/send invoice.

## Legal And Trust

- Privacy policy must continue to mention uploaded ID documents and document processing.
- Terms should make clear that Sjoh ID Check is a platform trust check, not a government-certified identity verification.
- ID documents must stay in the private `id-verification-documents` bucket.
