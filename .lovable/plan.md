# Payments + Conditional ID Verification

## What you're getting

- **Paystack** (ZAR-native, Stripe-owned) handles every payment: provider subscriptions (R50 Hustler, R250 Main Oke), Klap top-up packs (R50 Six-Pack / R150 Crate), and client Urgent Job fees.
- **Smile ID** handles identity verification — but only after a successful subscription payment. Free trial users never get prompted, never cost you a verification fee, and never get the Verified badge.
- **POPIA-safe**: raw ID images go to Smile ID, never your database. You store only the verification reference, the boolean result, and the timestamp.
- **Annual re-verification**: badge expires 12 months after last successful verification. User is prompted on next paid action.
- **Downgrade behaviour**: badge hidden when subscription lapses. Returns instantly on resubscribe (no re-verification needed unless 12 months have passed).
- **Ship-before-Smile-ID-activates**: a feature flag auto-approves verifications in dev. Day your Partner ID arrives, you paste two secrets — zero code changes.

---

## User journey

```text
Free Trial sign-up
   |
   v
[Use the app, no badge, 5 Klaps/mo]
   |
   v
Click "Upgrade to Hustler" (R50/mo)
   |
   v
Paystack hosted checkout (card / EFT / SnapScan)
   |
   v
Paystack webhook -> mark subscription active
                 -> top up Klap balance (15 Klaps)
                 -> set verification_status = 'required'
   |
   v
App shows "Verify your identity to unlock the Verified Pro badge" prompt
   |
   v
User opens Smile ID web SDK -> ID + selfie + liveness
   |
   v
Smile ID webhook (true/false)
   |
   v
   true  -> is_id_verified = true, expires_at = now + 12 months, show coral check
   false -> is_id_verified = false, prompt to retry
```

A paid user who skips verification still has a working subscription — they just don't get the badge until they complete it.

---

## What gets built

### 1. Database additions

Migration adds three things to your existing schema:

- **`provider_balances`** gains:
  - `is_id_verified boolean default false`
  - `verification_status` enum: `not_required` | `required` | `pending` | `verified` | `failed` | `expired`
  - `verification_expires_at timestamptz`
  - `smile_id_job_id text` — opaque reference for audit, no PII
  - `paystack_customer_code text`, `paystack_subscription_code text`
  - `tier_expires_at timestamptz` — drives the "downgrade hides badge" rule

- **`payment_events`** new table — append-only audit log of every Paystack webhook (event type, reference, amount, raw payload). Lets you reconcile and debug.

- **`klap_topups`** new table — links a Paystack reference to a Klap pack purchase so we never double-credit on webhook replay.

- **`urgent_fees`** new table — tracks the R-amount a client paid to mark a job urgent, linked to the opportunity.

A daily Postgres job flips `verification_status` to `expired` when `verification_expires_at < now()`. The badge query checks both `is_id_verified = true` AND `tier_expires_at > now()` AND `verification_expires_at > now()`.

### 2. Paystack integration (4 edge functions)

- **`paystack-create-subscription`** — called from the Pricing page. Creates a Paystack customer + subscription for the chosen plan (`PLN_xxx` for Hustler / Main Oke), returns the hosted checkout URL.
- **`paystack-create-topup`** — called from the Klap top-up modal. Creates a one-shot transaction for the selected pack, returns checkout URL.
- **`paystack-create-urgent-fee`** — called when a client toggles Urgent on a new opportunity. Returns checkout URL; the opportunity is only marked urgent after the webhook confirms.
- **`paystack-webhook`** — single endpoint Paystack calls back to. Verifies HMAC signature, dedupes via `payment_events`, then routes by event type:
  - `charge.success` on a subscription -> activate plan, top up monthly Klaps, set `verification_status = 'required'`
  - `charge.success` on a topup -> credit Klaps from `klap_topups` mapping
  - `charge.success` on urgent fee -> flip `is_urgent = true` on the opportunity
  - `subscription.disable` / `invoice.payment_failed` -> set `tier_expires_at`, badge auto-hides

### 3. Smile ID integration (2 edge functions + 1 component)

- **`smile-id-init`** — generates a one-time `signature` and `job_id`, returns them to the client so the Smile ID Web SDK can launch directly in the user's browser. No image data ever touches your backend.
- **`smile-id-webhook`** — receives the verification result. Verifies HMAC, updates `is_id_verified`, sets 12-month `verification_expires_at`, logs to `payment_events`.
- **`<VerifyIdentity>`** React component — modal that loads the Smile ID Web SDK, shows progress states, and reflects webhook result via Supabase Realtime.

**Feature flag**: env var `SMILE_ID_MODE = 'stub' | 'live'`.
- `stub` (default while account pending) -> `smile-id-init` skips the SDK and returns a mock job ID, then `smile-id-webhook` is auto-fired by a 2-second timer with `verified = true`. Lets you demo and QA the full UX before Smile ID activates.
- `live` -> real SDK, real webhooks. Switch the env var, no code change.

### 4. UI changes

- **Pricing page** — "Upgrade" buttons now hit `paystack-create-subscription` and redirect to checkout.
- **Dashboard** — new "Identity verification" card showing current status with action button (Verify now / Pending / Verified ✓ / Re-verify required).
- **Top-up modal** — wired to `paystack-create-topup`.
- **Post Opportunity** — Urgent toggle now triggers a paid checkout step with clear "R X to boost this job to the top of the urgent feed" copy.
- **BusinessCard / BusinessProfile** — the existing coral check (Verified Pro) now reads from the live `is_id_verified` flag instead of mock data, AND respects the "subscription active" guard so the badge disappears the moment a sub lapses.
- **Header dropdown** — gentle nudge "Get verified" link for paid users who haven't verified yet.

---

## What you'll need to do

1. **Create your Paystack account** (paystack.com, ~5 minutes). Activate test mode and grab the Test Secret Key + Test Public Key from Settings → API Keys & Webhooks. I'll prompt you to paste them when we get there.
2. **Create three Paystack Plans** in the dashboard:
   - Hustler — R50/month — code `PLN_hustler`
   - Main Oke — R250/month — code `PLN_main_oke`
   - (Klap packs and Urgent fees are one-shot transactions — no plan needed.)
3. **Apply for Smile ID Partner account** (smileidentity.com → "Get Started"). Tell them you're a SA marketplace doing KYC on subscribed providers. They'll ask for CIPC docs. Takes 2–5 business days. Until then we run in stub mode.
4. **Add your live Paystack webhook URL to the Paystack dashboard** (I'll give you the exact URL after the edge function deploys).

I'll handle everything else.

---

## Build order

1. Database migration (verification fields + audit tables).
2. Paystack edge functions + webhook + frontend wiring.
3. Smile ID stub mode + verification UI flow.
4. Badge logic update across BusinessCard, BusinessProfile, Dashboard.
5. Annual expiry cron + downgrade handling.

Each step compiles and runs on its own. After step 2 you can already take real test payments. After step 3 the verification UX is fully clickable in stub mode.

## Cost shape (so you know what you're signing up for)

- **Paystack**: 1.5% + R1 per transaction (capped at R100). Free for amounts under R1000. No monthly fee.
- **Smile ID**: ~R8–R15 per verification (varies with volume). Only charged on paid signups. Zero cost on free-trial users.
- **Lovable Cloud**: edge function invocations + DB rows are well within the free tier at your stage.