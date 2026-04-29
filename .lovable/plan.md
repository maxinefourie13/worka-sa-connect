# Admin, lifecycle & Paystack Urgent Boost

Five connected pieces of work, sequenced so each one builds on the last.

## 1. Admin page: `/admin/founding-members`

A protected page where you can grant/revoke founding-member status and watch the 500-cap counter for both `pro` and `customer` roles.

**UI**
- Two stat tiles at top: "Pros: 12 / 500 claimed · 488 left" and same for customers, sourced from the existing `get_founding_spot_counts` RPC.
- Searchable table of all `early_access_signups` (email, role, signed-up date, claimed badge, toggle button).
- Per-row "Grant founding spot" / "Revoke" button.
- Manual add: email + role dropdown → creates a signup row already marked claimed (for people who didn't go through the form).

**Backend**
- New RPC `admin_set_founding_spot(_signup_id uuid, _claimed boolean)` — verifies caller has `'admin'` role via `has_role`, enforces the 500 cap when granting, updates `claimed_founding_spot`. SECURITY DEFINER, search_path=public.
- New RPC `admin_create_founding_signup(_email text, _role text)` — admin-only, inserts a row with `claimed_founding_spot = true`.
- New RLS SELECT policy on `early_access_signups` allowing admins to read all rows already exists; verifying it covers what we need.

**Routing/access**
- Add `/admin/founding-members` to the router. Page checks the user has the `'admin'` role via the existing `has_role` flow and shows a 403 message otherwise.
- Link to it from a small "Admin" item in `SiteHeader` user menu, only rendered when admin.

## 2. Auto monthly reset for founding-member proposals

Already done — the `submit_proposal` function rolls the counter on the 1st of each month lazily, and `useProviderAccess` mirrors that math. **No work needed.** I'll just add a small "Resets 1 [Month]" line in the dashboard subscription card so the rule is visible.

## 3. Paystack Urgent Boost (R50 one-off)

Reusing the existing Paystack integration — same secret keys, same webhook, just a new flow and event kind.

**Flow**
1. On a job-detail page or "My jobs" row (only visible to the job's `client_id`), customer clicks "🚨 Boost this job — R50".
2. Confirm modal explains what the boost does + R50 charge.
3. Edge function `paystack-create-urgent-charge` initialises a one-off Paystack transaction:
   - Amount: 5000 (cents), currency `ZAR`.
   - `metadata.kind = 'urgent_boost'`, `metadata.opportunity_id = ...`, `metadata.user_id = ...`.
   - Returns `authorization_url` → frontend redirects.
4. After payment, Paystack redirects back + fires webhook to the existing `paystack-webhook` function.
5. Webhook handler gets a new branch: when `metadata.kind === 'urgent_boost'`, it calls `apply_urgent_boost(_opportunity_id, _user_id, _amount_cents, _reference)`.

**New RPC `apply_urgent_boost`**
- SECURITY DEFINER, public schema.
- Verifies `_user_id` owns the opportunity (`client_id = _user_id`).
- Sets `urgent_boost_paid_at = now()`, `urgent_boost_amount_cents = _amount_cents`.
- Logs the event in `payment_events` (kind = `'urgent_boost'`, processed = true, raw = full webhook payload — using existing `payment_event_kind` enum, adding `'urgent_boost'` value if missing).

**Visual surface**
- Opportunity cards with `urgent_boost_paid_at IS NOT NULL` get a coral pulsing "🚨 Urgent" badge and sort to the top of `Opportunities` for the next 72h (hardcoded window from `urgent_boost_paid_at`).
- After 72h the boost expires (badge gone, normal sort) but the column stays for analytics.

## 4. Trial → paid lifecycle + lapse → archive

**`apply_subscription_payment` (already in DB)** — already converts `tier` from `basic_trial` to `basic` (or any paid tier) when Paystack confirms payment. The trial fields just become irrelevant. ✅ no change.

**New cron-driven lapse logic**
Add a single edge function `lifecycle-tick` invoked daily by `pg_cron`. It runs three SQL operations in order:

1. **Trial expired with no paid sub** → drop listing to `workshop` (hidden) — but only for unverified businesses. Verified businesses keep their listing visible (see step 5).
2. **Paid sub lapsed + 30-day grace passed** → archive — same protection: verified businesses get a manual review step before archive.
3. **Existing dormancy/inactive transitions** → call existing `transition_listing_states()` (already excludes verified via the `is_verified` filter we'll add to the SQL).

Set up via `cron.schedule('lifecycle-tick-daily', '0 3 * * *', ...)` — 3am SAST daily. Goes through `supabase.insert` (per the schedule-jobs guidance) since URLs are project-specific.

**Reactivation**
`reactivate_listing` already snaps a paying user back to `active`. Add a small banner in the dashboard for archived/workshop owners: "Your listing is hidden. Subscribe to On the Map to come back" → CTA to pricing.

## 5. Verified-badge prominence + visibility

Push verified businesses everywhere they show up, to make the upgrade obviously valuable.

**Sorting**
- `Browse`, `CategoryLocationPage`, search results: `ORDER BY is_verified DESC, certified_pro DESC, rating DESC`. Verified always above non-verified at the same rating.

**Badge rendering**
- New `<VerifiedBadge>` component: coral check icon + "Verified" pill, with tooltip "ID-verified by Sjoh".
- Render on `BusinessCard`, business profile page header, search list, every spot a business is shown.
- Non-verified businesses get a subtle "Get verified" link only on the owner's own dashboard — never shown to public viewers (avoids "untrusted" stigma).

**Encouragement on dashboard**
For Basic / trial / verified-pending owners, replace the current verification panel copy with a clear value pitch:
- "Verified businesses get **2.4× more clicks**." (placeholder stat — swap in real number when you have data.)
- "Pinned to the top of every search result."
- "Coral checkmark on your listing — instant trust."
- Single CTA: "Verify my business — included with Ready for Work".

**Always-visible rule**
Verified businesses with an active subscription are never hidden by the dormancy sweep. Update the cron in step 4 so the dormancy/archive UPDATEs include `AND is_verified = false`. Verified pros get the full 30-day grace + a separate manual review path (admin-only) before any forced archive.

## Schema changes (one migration)

```sql
-- new payment event kind
ALTER TYPE payment_event_kind ADD VALUE IF NOT EXISTS 'urgent_boost';

-- admin RPCs (founding-members admin)
CREATE OR REPLACE FUNCTION admin_set_founding_spot(_signup_id uuid, _claimed boolean) ...
CREATE OR REPLACE FUNCTION admin_create_founding_signup(_email text, _role text) ...

-- urgent boost RPC
CREATE OR REPLACE FUNCTION apply_urgent_boost(_opportunity_id uuid, _user_id uuid, _amount_cents int, _reference text) ...

-- protect verified businesses from dormancy sweeps
-- (modifies transition_listing_states with an is_verified = false filter)
```

No new tables. All changes are functions + one enum value.

## Edge functions

- `paystack-create-urgent-charge` (new) — initialises one-off transaction.
- `paystack-webhook` (existing) — add the `urgent_boost` branch.
- `lifecycle-tick` (new) — daily cron-invoked.

## Files to add

- `src/pages/admin/FoundingMembers.tsx` — admin page.
- `src/components/UrgentBoostButton.tsx` — modal + checkout call.
- `src/components/VerifiedBadge.tsx` — reusable badge.
- `src/components/SubscriptionGapBanner.tsx` — "your listing is hidden" prompt.

## Files to edit

- `src/App.tsx` — register `/admin/founding-members` route.
- `src/components/SiteHeader.tsx` — admin link in user menu.
- `src/pages/Opportunities.tsx`, `src/components/JobCard.tsx` — urgent badge + sort.
- `src/components/BusinessCard.tsx`, `src/pages/CategoryLocationPage.tsx`, `src/pages/Browse.tsx`, `src/pages/BusinessDetail.tsx` — VerifiedBadge + sort.
- `src/pages/Dashboard.tsx` — verification value-pitch panel + reset-date line + gap banner mount.
- Memory: update `mem://features/pricing-model` with lifecycle rules and the verified-priority promise.

## Out of scope (intentionally)

- Refunds / cancelling a boost.
- Variable boost pricing (R50 / R100 / R150) — sticking to flat R50 for now.
- A separate "boost dashboard" for admins. Logs land in `payment_events`, that's enough for now.
- Auto-charging the next month's subscription if Paystack's recurring fails — that's Paystack's job, the lapse logic just reacts to whatever `tier_expires_at` says.
