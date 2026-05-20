# Add PayFast alongside Paystack

Goal: let businesses subscribe to Verified Pro (R250/mo) and pay Urgent Boost via **PayFast** while Paystack live-mode is still pending. Paystack code stays — PayFast becomes a second route, picked by the user at checkout.

## What you need to do first (outside the app)

1. Create / log into your PayFast account at payfast.co.za.
2. From **Settings → Integration**, grab:
   - `PAYFAST_MERCHANT_ID`
   - `PAYFAST_MERCHANT_KEY`
   - `PAYFAST_PASSPHRASE` (set one if blank — strongly recommended)
3. Decide live vs sandbox. We'll add a `PAYFAST_MODE` secret (`sandbox` or `live`) so you can test before flipping.

I'll request these via the secrets tool once you approve the plan.

## What I'll build

### 1. Edge functions (new)
- `payfast-create-subscription` — builds a signed PayFast checkout URL for the R250/mo Verified Pro recurring subscription, returns it to the client to redirect.
- `payfast-create-urgent-charge` — same pattern for one-off Urgent Boost (R50+).
- `payfast-itn` — public ITN (Instant Transaction Notification) webhook. Verifies signature + source IP + posts back to PayFast for validation, then:
  - Logs to existing `payment_events` table (extend `kind` enum if needed, add a `provider` column).
  - On successful subscription → upgrade `provider_balances.tier` to `verified_pro`, set `tier_expires_at`, store PayFast `token` as `payfast_subscription_token`.
  - On cancellation/failure → mirror the Paystack webhook behaviour.
- `verify_jwt = false` for `payfast-itn` (PayFast can't send JWT). Subscription/charge creators stay JWT-verified.

### 2. Schema changes (one migration)
- `provider_balances`: add `payfast_subscription_token text`, `payment_provider text default 'paystack'`.
- `payment_events`: add `provider text default 'paystack'` so we can tell rows apart.
- No data migration — existing Paystack rows keep working.

### 3. Frontend
- On **Pricing** + paywall CTAs, replace the single "Subscribe" button with two: **Pay with Paystack** (existing) and **Pay with PayFast**. Periwinkle primary on both, PayFast labelled clearly as the live option for now.
- Same dual-button on Urgent Boost modal.
- Success / cancel return pages reuse existing post-payment screens (PayFast `return_url` / `cancel_url`).

### 4. Secrets (added via tool after approval)
`PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, `PAYFAST_MODE`, `PUBLIC_SITE_URL` (already exists, reused for return URLs).

### 5. Launch board update
Mark Paystack live-mode as "nice-to-have" instead of blocker; PayFast becomes the launch payment rail.

## Out of scope (this plan)
- No refactor of the Paystack flow.
- No PayFast subscription cancellation UI yet — admin can cancel from PayFast dashboard; I'll add a "Cancel subscription" button in a follow-up if you want.
- No PayFast for invoicing customer→pro payments (those stay direct contact, per the no-commission model).

## Technical notes (for reference)
- PayFast signing: MD5 of URL-encoded, alpha-sorted key=value pairs + passphrase. Must match exactly on both checkout build and ITN verification.
- ITN must do three checks: signature match, source IP in PayFast's published ranges, and a POST back to `https://www.payfast.co.za/eng/query/validate` returning `VALID`.
- Subscription type = `1` (recurring), `frequency = 3` (monthly), `cycles = 0` (indefinite).
- Sandbox host: `sandbox.payfast.co.za`. Live host: `www.payfast.co.za`.

## Order of execution after approval
1. Request the 4 PayFast secrets.
2. Run the migration.
3. Build the 3 edge functions + deploy.
4. Wire the dual-button UI on Pricing + Urgent Boost.
5. Test in sandbox end-to-end (curl the create function, walk through checkout, hit ITN with a sandbox transaction).
6. Flip `PAYFAST_MODE=live` when you're ready to take real money.

Approve and I'll start with the secrets request.