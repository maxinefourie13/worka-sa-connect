# Sjoh launch checklist

You're close. The brand, design system, copy voice, schema, edge functions and Paystack flow are all in. What's left splits into **must-fix before launch**, **should-fix**, and **nice-to-have**.

---

## 1. Must-fix (blockers)

### 1a. Security findings (2 errors, 9 warnings)
A scan just flagged real holes — these MUST go before opening signups.

- **Privilege escalation on `user_roles`** (error). Any signed-in user can `INSERT` themselves an `admin` row. Fix: add an explicit policy `INSERT ... WITH CHECK (public.has_role(auth.uid(), 'admin'))` and remove any permissive ALL policy without WITH CHECK.
- **Business contact details exposed** (error). `businesses.email` / `businesses.phone` readable by every signed-in user via the `businesses` table. Fix: drop the broad SELECT policy on `businesses` for non-owners and route the public read through the existing `businesses_public` view (which can omit sensitive columns). Owners keep full SELECT on their own row.
- **Proposal column-level updates** (warn). Providers can `UPDATE` `status` and `klaps_spent` on their own proposals. Fix: replace the update policy with a `BEFORE UPDATE` trigger that blocks changes to `status`, `klaps_spent`, `business_id`, `opportunity_id` from non-service-role callers.
- **`klap_events` insert validation** (warn). Add a trigger that verifies `opportunity_id` / `proposal_id` exist and the inserter owns the linked business.
- **7× SECURITY DEFINER functions exposed to anon/authenticated** (warn). Audit each function in `public`, `REVOKE EXECUTE ... FROM anon, authenticated` on anything that isn't an explicit RPC (e.g. internal helpers like `has_role`, balance triggers).

### 1b. Wire pages off mock data
Right now most of the app reads `mockData.ts` instead of the database. For launch, at minimum:

- `Directory.tsx` — list real `businesses_public` with filters (category, province, search).
- `Index.tsx` — featured businesses + opportunities from DB; categories can stay seeded.
- `BusinessProfile.tsx` — fetch by slug from `businesses_public` (+ `business_verified_status`, `reviews`, `business_google_reviews`); fall through to 404 instead of `BUSINESSES[0]`.
- `Opportunities.tsx` — real `opportunities` with category/province filters.
- `Dashboard.tsx` — replace `me = BUSINESSES[0]` with `useMyBusiness()`; show real proposals, balance, promotions.
- Keep `mockData` only for static seed data (categories, provinces, tier copy, klap packs).

### 1c. Finish the bidding flow (plan §1)
Migration + `klapStore` + `ProposalModal` refactor for the open-auction flow. The schema already has `proposals.klaps_spent`; need the `place_bid` / `top_up_bid` RPCs and the new `BidSlider` UI.

### 1d. Auth hardening
- Confirm **email confirmations are ON** in auth settings (no auto-confirm).
- Enable **Password HIBP check** (Auth settings → Email).
- Set **Site URL** = `https://sjoh.co.za` and add `https://www.sjoh.co.za` + preview URL to the redirect allowlist.
- Confirm Google OAuth provider configured with prod redirect URIs.

---

## 2. Should-fix (do before telling anyone about it)

### 2a. Google Reviews import (plan §2)
Edge functions are scaffolded. Missing pieces:
- Add `GOOGLE_PLACES_API_KEY` secret (I'll prompt).
- Wire real Places API calls (currently stubs).
- Schedule the daily `pg_cron` → `google-places-refresh` job.
- Add the "View on Google" link + chip in `BusinessProfile`.

### 2b. SEO + sharing
- Verify `SeoHead` is on every public route (Index, Directory, BusinessProfile, CategoryLocationPage, GroupLanding, Pricing, ListBusiness).
- Confirm `sitemap-xml` edge function returns real businesses + the programmatic `/services/:cat/:province/:city` matrix.
- Add OG image (1200×630) — currently missing or generic.
- `public/robots.txt` allows `/` and points to sitemap.

### 2c. Email
- Connect a custom email domain (`mail.sjoh.co.za`) so auth + transactional emails don't land in spam.
- Customise the Supabase auth email templates with Sjoh voice (use `email_domain--scaffold_auth_email_templates`).

### 2d. Payments end-to-end test
- Verify `paystack-webhook` is publicly reachable (it's `verify_jwt = false` ✓) and the webhook URL is registered in Paystack dashboard.
- Run one real Hustler subscription + one Klap pack purchase against live keys; confirm `provider_balances` updates.

### 2e. Legal & trust
- Terms, Privacy, Acceptable Use pages (link from footer + signup).
- POPIA notice on signup ("we process your data per our Privacy Policy").
- The `LiabilityDisclaimer` already exists — make sure it renders on Post Job and Proposal Modal.

---

## 3. Nice-to-have (post-launch is fine)

- Notifications: `notify-new-bid` / `notify-new-job` exist — confirm they fire and add an in-app inbox.
- Smile ID verification flow (`smile-id-init` / `smile-id-webhook`) wired into onboarding for the "Verified Oke" badge.
- Analytics (Plausible or PostHog) on key funnels: signup → list business, post job → first bid, view profile → reveal contact.
- Error monitoring (Sentry).
- Mobile QA pass on the 778-wide breakpoint and below.

---

## Suggested build order (one message per chunk)

1. **Security migration** — fix the two errors + the proposal/klap_events triggers + revoke EXECUTE on internal definer fns.
2. **Bidding flow** — migration + RPCs + `klapStore` + `ProposalModal` + dashboard sort.
3. **Wire pages off mock data** — Directory, Index featured, BusinessProfile, Opportunities, Dashboard.
4. **Google Reviews** — secret + real Places calls + UI + cron.
5. **Auth + email hardening** — settings, custom email domain, templates.
6. **SEO polish + OG image + legal pages**.
7. **Live Paystack smoke test, then publish**.

Reply "go" and I'll start at step 1 (security fixes) — that's the highest-risk one and unblocks everything else.