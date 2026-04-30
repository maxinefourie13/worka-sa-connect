
You've asked for several things. I'll answer the question first, then lay out the changes, then give you the Codex prompt at the bottom.

## 1. "Claim Lead" vs "Send Quote" — what's the difference?

It's the same button (`ApplyButton.tsx` line 133), the label just changes based on whether the request is **urgent**:

- **Send Quote** — normal customer request. Pro opens the proposal modal, writes a message + price, submits a quote. Customer reviews it alongside other quotes.
- **Claim Lead** — shown when the request is marked **urgent** (e.g. burst geyser, lockout). Gated to **Verified Pro + ID-verified** only. The intent is "first qualified pro to grab it gets the contact" — no quote shopping, because the customer needs help now.

Concierge leads (admin-sourced from social media) are a separate third path: they redirect to an external WhatsApp/contact link instead of the proposal modal.

If the two-label switcheroo is confusing, I'd recommend we standardise on **"Send Quote"** everywhere and just add an "Urgent — Verified Pros only" badge on the card. Let me know if you want that as part of this round.

---

## 2. What I'll change

### A. Homepage stats — only factual numbers
Currently shows fake numbers from `STATS` in `src/lib/mockData.ts` (14,208 businesses / 2,845 requests).

Replace with 4 real, defensible stats:
- **9** Provinces covered
- **{n}** Service categories (computed from `CATEGORIES.length` — currently 114)
- **11** Category groups
- **No commission** (or "0%") — replaces fake "open requests" count with a value statement

Implementation: edit `STATS` in `mockData.ts` and the stats block in `src/pages/Index.tsx` so it pulls live counts where possible and drops the two fake numbers.

### B. Remove all seed businesses (keep a few seed requests)
- `useBusinesses` in `src/hooks/useDirectory.tsx`: when DB returns empty, return `[]` instead of falling back to `BUSINESSES`. Show a friendly "No pros listed yet — be the first" empty state on Directory + Group + Category pages.
- `useOpportunities`: keep the mock fallback for now (you said keep a few requests).
- Trim `OPPORTUNITIES` in `mockData.ts` down to ~3 realistic SA requests, and tag them `postedBy: "Sample request"` so it's obvious they're examples — or, if you'd prefer, drop them entirely too. **Default in this plan: keep 3 sample requests.**
- Featured Businesses section on the homepage hides itself when there are zero live businesses (no fake cards).

### C. Business profile gallery + completeness
The profile page (`src/pages/BusinessProfile.tsx`) currently doesn't even render the existing single `image_url`. A "full profile with gallery" needs:

1. **Schema**: new `business_images` table — `id, business_id, url, sort_order, created_at`. RLS: public SELECT, owner-only INSERT/UPDATE/DELETE. Add a Storage bucket `business-gallery` (public read, owner write).
2. **Dashboard upload UI**: a "Photos" card in the Profile section of `Dashboard.tsx` — drag/drop multiple, reorder, delete. Compress on upload using existing `src/lib/compressImage.ts`. Cap at 12 images.
3. **Profile page render**: hero image (first gallery image, fallback to `image_url`), then a gallery grid below the description with lightbox on click. Also ensure the profile page renders: services (already in `services` table), Google reviews card, hours, address, contact reveal — audit pass to confirm each section renders cleanly when data is present and degrades gracefully when missing.
4. **ListBusiness onboarding**: add a "Add a few photos" step (optional — can be done later from dashboard) so new pros land with a populated profile.

### D. Server hygiene before publishing
- Quick pass on `Dashboard.tsx` to confirm the live-data refactor we did last round still renders a sensible empty state for a brand-new pro (no business yet).
- Verify Auth flow: signup/login/email verification works end-to-end on the live domain `sjoh.co.za`.
- Make sure the early-access signup form (homepage email capture) writes to `early_access_signups` — it does, already wired.

### E. Publish
- Confirm `effective_publish_visibility: public` (it is).
- Click Publish to go live at `sjoh.co.za` after the above changes land.

Note: You'll see a button in the publish dialog — frontend changes only go live once you click "Update". Backend (DB migrations, edge functions) deploys automatically.

---

## 3. Out of scope this round (intentionally)
- Wiring Promotions / Followers / Recent activity tabs in the Dashboard (still stubs; flagged previously).
- Deciding the Claim Lead vs Send Quote rename — needs your call.
- Replacing the "Featured businesses" section with something better than an empty state (we can revisit once you have 5+ real listings).

---

## 4. Codex prompt for the payments work

Drop this whole block into Codex. It's self-contained and references actual files in this repo.

```
You are working in a React 18 + Vite + TypeScript + Tailwind project (Lovable
project ID 5bc0edda-5b82-456e-972c-379b2b4c90fc) called Sjoh — a South African
service-provider directory. Backend is Supabase (project ref zwgjbffesalpiaaycbac).
Payment provider is Paystack ZA. The domain is sjoh.co.za.

GOAL
Production-harden the Paystack subscription + Urgent Boost flows so we can
accept real money on launch day.

PRICING MODEL (source of truth — do not change):
- Basic Listing: R50/mo or R540/yr (10% off). Listed in directory only.
- Verified Pro: R250/mo or R2700/yr. Can send quotes + claim leads.
- 30-day free trial on Basic (2 months for early-access founding members).
- Posting jobs is free. Urgent Boost on a job: from R50.
- Zero commission on completed work.

EXISTING CODE TO READ FIRST
- src/lib/payments.ts — client-side checkout starter
- src/pages/Pricing.tsx — pricing page
- src/components/ApplyButton.tsx — gating logic for proposals
- src/hooks/useProviderAccess.tsx — tier/trial/verification checks
- supabase/functions/paystack-create-subscription/index.ts
- supabase/functions/paystack-create-urgent-charge/index.ts
- supabase/functions/paystack-webhook/index.ts
- DB tables: provider_balances (tier, trial_ends_at, paystack_customer_code,
  paystack_subscription_code, tier_expires_at, billing_cycle, next_renewal_at),
  payment_events, opportunities (urgent_boost_paid_at, urgent_boost_amount_cents)

TASKS

1. Webhook hardening (paystack-webhook):
   - Verify x-paystack-signature HMAC-SHA512 against PAYSTACK_SECRET_KEY on
     every request. Reject 401 if mismatch.
   - Make all event handling idempotent keyed on (paystack_reference, event).
     Insert into payment_events with processed=false first; only mutate
     provider_balances/opportunities once; mark processed=true.
   - Handle these events end-to-end: charge.success, subscription.create,
     subscription.disable, invoice.payment_failed, invoice.update,
     invoice.create. For subscription.disable, set tier='basic_trial'
     (downgrade) only AFTER tier_expires_at passes.
   - Surface clear logs (function_id + reference) for every branch.

2. Subscription lifecycle:
   - On charge.success for purpose='subscription', upsert
     provider_balances.{tier, billing_cycle, paystack_subscription_code,
     paystack_customer_code, next_renewal_at, tier_expires_at}.
   - tier_expires_at = paid_until + 3-day grace.
   - Add a daily lifecycle-tick that downgrades expired pros to basic_trial
     and emails them ('Your Verified Pro lapsed').

3. Annual billing UX:
   - Pricing page: monthly/annual toggle that recomputes the price and
     passes billing_cycle to startSubscription(). Show 'Save R60 / R300'
     savings copy.
   - Confirm Paystack plan codes are wired for both cycles via env:
     PAYSTACK_PLAN_BASIC_MONTHLY, PAYSTACK_PLAN_BASIC_ANNUAL,
     PAYSTACK_PLAN_VERIFIED_PRO_MONTHLY, PAYSTACK_PLAN_VERIFIED_PRO_ANNUAL.
     Fail loudly in the edge function if a required plan is missing.

4. Urgent Boost:
   - Audit paystack-create-urgent-charge — must validate the opportunity
     belongs to auth.uid() and amount is one of {5000, 10000, 25000} kobo.
   - On webhook charge.success for purpose='urgent_boost', set
     opportunities.{is_urgent=true, urgent_boost_paid_at=now,
     urgent_boost_amount_cents}.
   - Trigger notify-pro-whatsapp + notify-new-job for matching Verified Pros
     in the same province + category.

5. Customer billing portal (minimal):
   - Add a 'Billing' card to src/pages/Dashboard.tsx showing: current tier,
     billing cycle, next renewal date, last invoice amount, 'Cancel
     subscription' button (calls a new edge function paystack-cancel-sub
     that hits POST /subscription/disable on Paystack and writes a row to
     payment_events). Cancellation keeps access until tier_expires_at.

6. Tests / sanity:
   - Add a TEST_MODE flag (env) so the create-subscription function uses
     Paystack test secret key when set; document toggle in README.
   - Add a curl example in README for replaying a webhook locally with a
     valid signature.

CONSTRAINTS
- Never edit src/integrations/supabase/client.ts or types.ts.
- Edge functions: validate JWT in code, return CORS headers on every
  response (including errors), use parameterized supabase calls only.
- Use the migration tool for any schema changes.
- All copy must match Sjoh SA voice (see existing strings in
  src/lib/payments.ts toasts for tone — chankura / boet / aikona).

DELIVERABLE
A PR-style summary listing every file changed with a 1-line reason, plus
one paragraph on what I (the operator) need to do in the Paystack dashboard
(create plans, set webhook URL, copy plan codes into env).
```

---

## Approve and I'll execute parts 1–E (everything except payments). Reply with any changes — for example "skip the gallery for now" or "rename Claim Lead to Send Quote everywhere".
