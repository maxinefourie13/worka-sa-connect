# Workshop Mode + Profile Lifecycle

## Goal

Founding pros can sign up properly on the landing page, build their full profile, and access their dashboard immediately — but every authenticated screen makes it impossible to miss that we're in **Workshop Mode** (pre-launch, no customers yet). When the trial ends, **nothing is auto-billed** — but profiles that go quiet auto-hide from the directory so we never look like a graveyard.

---

## Part 1 — Workshop Mode (founding-pro signup + pre-launch UX)

### The flow

1. Visitor lands on `sjoh.co.za` — sees coming-soon page with role toggle.
2. **"I'm a Pro"** (default — filling 500 founding spots is the priority): form expands to business name, email, password, province, city, category → **Claim my Founding Pro spot**.
3. Submit → creates auth account → claims founding spot → creates `businesses` row marked `pre_launch = true` → redirects to onboarding wizard (`/list`) for description, photos, services.
4. After onboarding → `/dashboard` with persistent **Workshop Mode banner**.
5. Welcome email confirms — no action required.
6. **"I need a Pro"** → unchanged email-only capture.

### Workshop Mode treatment (every authenticated screen)

Persistent coral banner:
> Workshop Mode — Sjoh hasn't launched yet. Customers can't see your profile or post jobs. We'll holla the moment we open the doors.

Empty states:
- **Dashboard:** "You're a Founding Pro. Your profile is ready and waiting. Until launch, polish your listing — first impressions matter."
- **Opportunities:** "No jobs yet — we haven't opened the doors to customers. When we launch, this is where new jobs land."
- **Profile:** "This is exactly what customers will see at launch. Make it count."
- **Pricing:** "Your 3 months free starts on launch day, not now."
- **Reviews:** "Reviews unlock at launch."

Hidden while `pre_launch = true`: bid buttons, Klap top-ups, payment CTAs, public directory listing, sitemap entry.
Visible: edit profile, photos, services, hours, Google Place link.

### Auth setup

Email + password, Google sign-in. Email verification on. HIBP check on. No auto-confirm.

---

## Part 2 — Profile Lifecycle (the "no dead profiles" layer)

### Why

The trial is free and won't auto-bill (CPA risk + "you charged me before any customer came" complaints aren't worth it). But that means some profiles will go quiet. Solution: **active profiles stay visible, dormant ones quietly disappear, archived ones vanish.** Owners can reactivate with one click.

### The states

A new column on `businesses` — `listing_status` — drives everything:

| Status | Trigger | Public sees | Owner sees |
|---|---|---|---|
| `workshop` | `pre_launch = true` | Hidden | Workshop Mode banner |
| `active` | `pre_launch = false` AND logged in within 60 days | Listed normally | Normal dashboard |
| `dormant` | No login in 60 days | Hidden from search; profile page shows "currently unavailable, check back soon" | Yellow banner: "Your listing is paused — log in once a month to stay visible. Click here to reactivate." |
| `archived` | No login in 6 months | Fully hidden (404) | Banner: "Your listing is archived. Reactivate to go live again." |

`last_active_at` is bumped on every authenticated request (cheap — server-side update on session refresh).

### The trial-ending nudge sequence

Three emails, fully informational, no surprise charges:

- **T-15 days** (75 days into trial): "Heads up — your free Workshop Mode trial ends in 15 days. After that, your profile stays live but you'll need to subscribe to refill Klaps for bidding. Nothing happens automatically."
- **T-5 days** (85 days): "5 days left on your free trial. Pick a plan now or stay on the free tier — your call. No card, no auto-charge."
- **T-day** (90 days): "Your free trial just ended. Your profile is still live, but you're on the free tier (no monthly Klaps). Subscribe anytime to start bidding again."

Plus the dormancy nudges:
- **Day 45** (no login): "Quick check-in — log in to keep your Sjoh listing visible. Profiles inactive for 60 days get paused."
- **Day 60** (auto-paused): "Your listing is paused. One click reactivates it — link below."
- **Day 150** (warning): "Your paused listing will be archived in 30 days unless you log back in."
- **Day 180** (archived): "Your listing has been archived. Reactivate anytime in the next 6 months and we'll bring it back exactly as it was."

### Reactivation

A single button in the dashboard banner. Sets `last_active_at = now()`, recomputes `listing_status` to `active` (or `workshop` if still pre-launch). No re-onboarding, no data loss.

---

## Database changes

```sql
-- Workshop Mode
ALTER TABLE businesses ADD COLUMN pre_launch boolean NOT NULL DEFAULT true;

-- Lifecycle
ALTER TABLE businesses
  ADD COLUMN last_active_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN listing_status text NOT NULL DEFAULT 'workshop'
    CHECK (listing_status IN ('workshop','active','dormant','archived'));

CREATE INDEX idx_businesses_listing_status ON businesses(listing_status);
CREATE INDEX idx_businesses_last_active ON businesses(last_active_at);
```

RPCs:
- `set_business_pre_launch(business_id, pre_launch)` — flip workshop → active
- `bump_last_active()` — called on session refresh
- `reactivate_listing(business_id)` — owner one-click revive
- `transition_listing_states()` — daily cron: workshop→active stays manual; active→dormant at 60d; dormant→archived at 180d

Public queries (`businesses_public` view, directory hooks, sitemap, category pages, business-by-slug) filter to `listing_status = 'active'`. Owner queries always show their own row.

### Daily cron

`pg_cron` job at 04:00 SAST:
1. Run `transition_listing_states()`
2. Enqueue trial-ending emails (T-15, T-5, T-day) based on `provider_balances.trial_ends_at`
3. Enqueue dormancy emails (D-45, D-60, D-150, D-180) based on `last_active_at`

Each email type checks `email_send_log` to avoid duplicates.

---

## Files

**New:**
- `src/components/WorkshopModeBanner.tsx`
- `src/components/DormantBanner.tsx` (yellow, "your listing is paused")
- `src/components/ArchivedBanner.tsx` (with reactivate button)
- `src/components/FoundingProSignupForm.tsx`
- `src/hooks/useBumpLastActive.tsx` — fires once per session
- `supabase/functions/_shared/transactional-email-templates/trial-ending-15.tsx`
- `supabase/functions/_shared/transactional-email-templates/trial-ending-5.tsx`
- `supabase/functions/_shared/transactional-email-templates/trial-ended.tsx`
- `supabase/functions/_shared/transactional-email-templates/dormancy-warning.tsx` (45d)
- `supabase/functions/_shared/transactional-email-templates/listing-paused.tsx` (60d)
- `supabase/functions/_shared/transactional-email-templates/archive-warning.tsx` (150d)
- `supabase/functions/_shared/transactional-email-templates/listing-archived.tsx` (180d)
- `supabase/functions/lifecycle-cron/index.ts` — runs nightly via pg_cron
- Two migrations: schema + cron schedule

**Edited:**
- `src/pages/ComingSoon.tsx`, `src/pages/ListBusiness.tsx`, `src/pages/Dashboard.tsx`, `src/pages/Opportunities.tsx`, `src/pages/Pricing.tsx`
- `src/components/SiteHeader.tsx` — banner picker (workshop / dormant / archived)
- `src/hooks/useDirectory.tsx`, `src/hooks/useBusinessBySlug.tsx`
- `src/pages/Directory.tsx`, `src/pages/CategoryLocationPage.tsx`, `src/pages/GroupLanding.tsx`
- `supabase/functions/sitemap-xml/index.ts`
- `supabase/functions/_shared/transactional-email-templates/registry.ts`
- `supabase/functions/_shared/transactional-email-templates/early-access-pro.tsx`

---

## Out of scope

- Customer-side accounts (still email capture only)
- Voucher redemption (Phase 3)
- Klaps overhaul / new pricing (Phase 2)
- Smile ID at signup (untouched)
- Admin "promote all to live" button (one SQL command for now)

---

## Launch day

```sql
UPDATE businesses
SET pre_launch = false, listing_status = 'active', last_active_at = now()
WHERE pre_launch = true;
```
Swap `/` route from `<ComingSoon />` to `<Index />`. Done.

---

## Build order

1. **Migration** — `pre_launch` + lifecycle columns + RPCs
2. **Workshop Mode UI** — landing form, banner, empty states, public-query filters
3. **Lifecycle UI** — dormant/archived banners, reactivate button, `useBumpLastActive`
4. **Email templates** — all 7 new ones
5. **Cron edge function + pg_cron schedule** — last, once everything else is verified

That way you can test signup + Workshop Mode end-to-end before the lifecycle automation kicks in.
