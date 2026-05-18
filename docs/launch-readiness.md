# Sjoh Launch Readiness

This checklist covers the pieces that must be done outside the local app before launch.

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
- Confirm live keys are saved as Supabase secrets:
  - `PAYSTACK_SECRET_KEY`
  - `PAYSTACK_WEBHOOK_SECRET` if different from the secret key
  - `PAYSTACK_PLAN_VERIFIED_PRO_MONTHLY`
  - `PAYSTACK_PLAN_VERIFIED_PRO_ANNUAL` if annual billing stays enabled
  - `PAYSTACK_PLAN_BASIC_MONTHLY` / `PAYSTACK_PLAN_BASIC_ANNUAL` if basic listings stay enabled
- Confirm the Paystack webhook points to:
  - `https://omhjcalrfhswjmanriqv.supabase.co/functions/v1/paystack-webhook`
- Test a card-required trial, first subscription charge, failed charge, cancellation, and webhook state update.

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
