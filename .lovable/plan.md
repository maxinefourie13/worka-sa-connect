# Annual Billing — Pay Yearly, Save 10%

## Pricing

| Plan | Monthly | Annual (save 10%) | Effective /mo |
|---|---|---|---|
| Basic | R50/mo | **R540/year** | R45/mo |
| Verified Pro | R250/mo | **R2,700/year** | R225/mo |

Trial rules unchanged: 30-day trial on Basic (2 months for early access) — applies to annual too. Trial converts to whichever cycle was selected at signup.

## Scope

### 1. Database (migration)
- Add `billing_cycle` enum (`monthly` | `annual`) — default `monthly`.
- Add columns to `provider_balances`:
  - `billing_cycle billing_cycle NOT NULL DEFAULT 'monthly'`
  - `next_renewal_at timestamptz` (display only — Paystack remains source of truth)
- Add columns to `payment_events`: `billing_cycle billing_cycle` (nullable, populated from webhook metadata).
- No data migration needed — existing rows default to `monthly`.

### 2. Paystack edge functions
- **`paystack-create-subscription`**: accept `billing_cycle: 'monthly' | 'annual'` + `tier: 'basic' | 'verified_pro'`. Map to one of 4 Paystack plan codes via env vars:
  - `PAYSTACK_PLAN_BASIC_MONTHLY`
  - `PAYSTACK_PLAN_BASIC_ANNUAL`
  - `PAYSTACK_PLAN_VERIFIED_PRO_MONTHLY`
  - `PAYSTACK_PLAN_VERIFIED_PRO_ANNUAL`
  - I'll prompt you to add the two new annual plan codes as secrets after you create them in the Paystack dashboard.
- **`paystack-webhook`**: read `metadata.billing_cycle` from charge → write to `provider_balances.billing_cycle` and `payment_events.billing_cycle`. Compute `next_renewal_at` from interval.

### 3. Pricing page (`src/pages/Pricing.tsx`)
- Monthly / Annual toggle at top (segmented control, coral accent).
- Annual view: show R540 / R2,700, "Save R60 / R300 a year" badge, sub-label "≈R45/mo, billed yearly".
- SA voice: *"Pay for the year, save a couple hundred bucks."*

### 4. Signup wizard (`src/pages/ListBusiness.tsx`)
- Step 3 ("Choose Plan"): same toggle. Selected `billing_cycle` flows into the Paystack checkout call on Step 4.

### 5. Dashboard (`src/pages/Dashboard.tsx`)
- Show current cycle + next renewal date in subscription card.
- For monthly subscribers past trial: show one-line nudge — *"Switch to yearly, save R300. Sorted."* with a "Switch to annual" button → calls a new edge function `paystack-change-billing-cycle` that updates the Paystack subscription to the annual plan code (effective next renewal — Option B, no proration).

### 6. Copy
SA voice throughout. Examples:
- Toggle: `Monthly` / `Yearly — save 10%`
- Confirmation: *"Lekker. You're on Verified Pro, billed yearly. Next renewal 30 April 2027."*
- Switch nudge: *"Same plan, R300 less. Switch to yearly?"*

## Out of Scope (this round)
- Mid-cycle proration / refunds when downgrading annual → monthly.
- Partial-year refunds on cancellation (annual = non-refundable, stated in Terms).
- Promo codes / additional discount stacking.

## Manual Steps You'll Need to Do
1. **Create 2 new plans in Paystack dashboard** (Basic Annual R540, Verified Pro Annual R2,700, interval = `annually`).
2. Paste the 2 new plan codes when I prompt for secrets.

## Files Touched
- `supabase/migrations/<new>.sql` (new)
- `supabase/functions/paystack-create-subscription/index.ts`
- `supabase/functions/paystack-webhook/index.ts`
- `supabase/functions/paystack-change-billing-cycle/index.ts` (new)
- `src/pages/Pricing.tsx`
- `src/pages/ListBusiness.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Terms.tsx` (add line about annual non-refundable)
- Update `mem://features/pricing-model` to reflect annual option.

Approve and I'll build it.