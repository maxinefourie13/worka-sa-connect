## Goal

Founding members can sign up properly on the landing page, build their full business profile, and access their dashboard immediately — but every authenticated screen makes it impossible to miss that we're in **Workshop Mode** (pre-launch, no customers yet, jobs unlock at launch).

## The flow

1. Visitor lands on `sjoh.co.za` — sees coming-soon page with role toggle (existing).
2. **"I'm a Pro"** → form expands to: business name, email, password, province, city, category, **Claim my Founding Pro spot** button.
3. Submit → creates auth account → claims founding spot → creates `businesses` row marked `pre_launch = true` → redirects to existing onboarding wizard (`/list`) to add description, photos, services.
4. After onboarding → lands in `/dashboard` with persistent **Workshop Mode banner** at top.
5. Welcome email arrives in inbox as confirmation (no link required to act on).
6. **"I need a Pro"** → unchanged (email-only capture).

## Workshop Mode treatment (everywhere a logged-in pro looks)

**Persistent coral banner on every authenticated page:**
> 🚧 Workshop Mode — Sjoh hasn't launched yet. Customers can't see your profile or post jobs. We'll let you know the moment we open the doors.

**Empty-state copy on each section:**
- **Dashboard home:** Big "You're a Founding Pro" card — *"Your profile is ready and waiting. Until launch, polish your listing — first impressions matter."*
- **Opportunities/Jobs:** *"No jobs yet — we haven't opened the doors to customers. When we launch, this is where new jobs in your area land. Get your profile sharp so you're first in line."*
- **Profile/Business page:** *"This is exactly what customers will see at launch. Make it count."*
- **Pricing/billing:** *"Your 3 months free starts on launch day, not now. Nothing to pay yet."*
- **Reviews:** *"Reviews unlock at launch."*

**Hidden until launch (pre_launch = true):**
- Place-bid buttons / proposal modal
- Klap top-ups / payment CTAs
- Public directory listing (filtered out of public queries)

**Visible (encouraged):**
- Edit profile, upload photos, add services, set hours, link Google Place ID
- Browse other founding pros' profiles (helps signal "we're real")

## Database changes

```
ALTER TABLE businesses ADD COLUMN pre_launch boolean NOT NULL DEFAULT true;
CREATE INDEX idx_businesses_pre_launch ON businesses(pre_launch) WHERE pre_launch = false;
```

Update public-facing queries (directory, search, category pages, sitemap, business profile public view) to filter `WHERE pre_launch = false`. Owner-side queries (dashboard, edit) ignore the flag — owners always see their own business.

Same flag pattern for `opportunities` if needed later, but at launch the table is empty anyway, so skip for now.

## Auth setup

We need real auth on the live site for the first time. Defaults:
- Email + password (primary)
- Google sign-in (one-tap, lower friction)
- No phone/SAML
- Auto-confirm email signups: **off** (users must verify email — keeps spam signups out)
- Password leaked-password check: **on** (HIBP)

Existing `Login` / `Register` / `ForgotPassword` / `ResetPassword` pages already exist at `/login`, `/register`, `/forgot-password`, `/reset-password` — we'll route founding pros into the new bespoke flow instead, but those pages stay live as the post-onboarding return path.

## Files that will change

**New:**
- `src/components/WorkshopModeBanner.tsx` — coral persistent banner shown on all authenticated layouts
- `src/components/FoundingProSignupForm.tsx` — the inline signup form on the landing page (replaces the current single email input when "I'm a Pro" is selected)
- `supabase/migrations/<timestamp>_add_pre_launch_to_businesses.sql` — adds the flag + index

**Edited:**
- `src/pages/ComingSoon.tsx` — when role is "pro", show the full signup form. When role is "customer", keep current email-only flow.
- `src/pages/ListBusiness.tsx` — on submit, set `pre_launch = true` on the new business row. Update step copy to reflect Workshop Mode.
- `src/pages/Dashboard.tsx` — wrap content with `WorkshopModeBanner` + add Founding Pro hero card + update empty states
- `src/pages/Opportunities.tsx` — pre-launch empty state
- `src/pages/Pricing.tsx` — Workshop Mode messaging ("free starts at launch")
- `src/components/ProposalModal.tsx` / bid buttons — hide when business is `pre_launch`
- `src/hooks/useDirectory.tsx` — filter out `pre_launch = true` listings from public results
- `src/hooks/useBusinessBySlug.tsx` — return 404 for public visitors hitting a pre-launch profile (owners still see their own)
- `src/pages/Directory.tsx`, `src/pages/CategoryLocationPage.tsx`, `src/pages/GroupLanding.tsx` — apply pre_launch filter
- `supabase/functions/sitemap-xml/index.ts` — exclude pre-launch businesses
- `supabase/functions/_shared/transactional-email-templates/early-access-pro.tsx` — update copy: "your profile is built and ready, see you at launch" instead of "we'll let you know to set up"

**Welcome email tweak:**
The pro welcome email becomes a confirmation, not a CTA: "Lekker — you're a Founding Pro. Your profile is locked in and ready for launch day. We'll holla when we open the doors."

## Launch day toggle (kept simple)

When you're ready to go live, you (or admin) run:
```
UPDATE businesses SET pre_launch = false WHERE pre_launch = true;
```
And swap the `/` route from `<ComingSoon />` to `<Index />`. That's it. We can build a 1-click admin button later if useful.

## Out of scope for this loop

- Customer-side accounts (still email capture only, as requested)
- The voucher redemption system (Phase 3 in your roadmap)
- Klaps removal / new pricing page (Phase 2 in your roadmap — separate chat)
- Smile ID verification flow during onboarding (can stay as-is, just won't trigger billing yet)
- Admin "promote all to live" button (one SQL command for now)

## Open question — landing page form weighting

When a visitor lands, which path is the default? You hinted at this earlier but didn't pick:

- **(a)** Customer form by default, "I'm a Pro" button swaps it
- **(b)** Equal-weight toggle, no default — they pick before seeing any form
- **(c)** Pro form by default (since filling 500 founding spots is the priority right now), customer signup tucked below

I'd default to **(c)** during the founding-spot phase since that's the active goal — but tell me if you want (a) or (b) instead and I'll wire it that way.

## After this is built

1. You sign up as your own first Founding Pro to test the full flow
2. Test signup, profile build, dashboard, all empty states, Workshop Mode banner
3. Hit publish, point sjoh.co.za at it
4. Start teasing
