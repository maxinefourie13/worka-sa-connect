
# Pre-launch cleanup + admin view + terminology fix

Five things, in order. Plus a clear answer on what publishing actually exposes.

---

## 1. Kill the mock numbers on the dashboard

Right now the Overview shows hardcoded "1,284 profile views / 38 enquiries / 318 followers" and a fake activity feed (Naledi Properties, Sipho M.). Same for Followers (fake list of 6 names) and the Leads tab inside the dashboard (pulls from `OPPORTUNITIES` mock).

**Changes (`src/pages/Dashboard.tsx`):**

- **Overview stats** → replace the three `StatCard`s with real values from a small `useMyBusinessStats(businessId)` hook that queries: `business_follows` count, `contact_reveals` count for the last 30 days, and a placeholder "Profile views" of `—` until we wire view tracking. Each card gets an empty-state hint ("No views yet — share your profile link").
- **Recent activity** → query the union of: latest `business_follows`, latest `contact_reveals`, latest `proposals` for the user's business. If empty, show a friendly empty state: "No activity yet, boet. Share your profile to get the ball rolling." with a "Copy profile link" button.
- **Followers section** → replace the hardcoded array with a live query of `business_follows` joined to `profiles` for display name. Empty state: "Nobody's followed you yet — once customers do, you'll see them here."
- **Dashboard "Leads" tab** (`OpportunitiesSection`) → swap `OPPORTUNITIES.slice(0,4)` for live `proposals` where `provider_id = auth.uid()`, joined to `opportunities` for title/budget. Empty state: "You haven't sent any quotes yet. [Find work →]"
- **Promotions section** → today shows two mock promos. Replace with a live query of `promotions` where the business is the user's. Empty state with "Add Promotion" CTA. (Functional add/edit can wait — at minimum stop showing fake data.)
- **Plan label** stays as-is (it's already live from `useProviderAccess`).

---

## 2. Rename Leads / Requests → Get Quotes / Send Quotes

Customer-side becomes **"Get Quotes"** (post a job, get pros to quote you). Pro-side becomes **"Send Quotes"** (browse jobs, send a quote). The customer-side page also doubles as the directory entry point.

**Routing (`src/App.tsx`):**

- Keep URLs `/requests` and `/leads` (good for SEO + back-compat) but rename in the UI everywhere. No URL change.
- Header nav (`SiteHeader.tsx`):
  - "Browse" stays (links to `/directory`)
  - "Requests" → **"Get Quotes"** (`/requests`)
  - "Leads" → **"Send Quotes"** (`/leads`)
  - "Pricing" stays
- Footer links updated to match.

**Page copy (`src/pages/Opportunities.tsx`):**

- Customer view header: "Get Quotes" / "Tell pros what you need." Sub: "Post a request, or browse the directory below."
- Pro view header: "Send Quotes" / "New jobs in your area."
- Filter chip "Show only Verified Pros" (which currently filters by client history) → rename to "Trusted clients only" since "Verified Pros" is misleading on the request feed.
- Result counter: "X jobs to quote" (pro) / "X open requests" (customer).

**Customer-side directory blend:** On the customer `/requests` page, add a top-of-page collapsible "Browse the directory instead" panel that surfaces the same search/category/province inputs as `/directory` and links into it. Keeps the path you described: post a request OR browse the full directory from one screen.

**Dashboard sidebar (`SECTIONS` array):**

- "My Quotes" → **"Quotes I sent"**
- "Leads" → **"Won jobs"** (since this section shows proposals you've made)

**JobCard / ProposalModal CTAs:**

- "Send Quote" stays as the standard CTA on non-urgent jobs.
- "Claim Lead" (urgent flow) → rename to **"Claim urgent job"** for clarity. The mechanic stays the same (Verified Pro only, first-come for contact details).

---

## 3. Fix the gallery upload

Current `BusinessGalleryCard.tsx` flow looks correct, but the storage policy in `20260430174501_*.sql` requires `(storage.foldername(name))[1] = b.id::text` AND that `auth.uid() = b.owner_id`. The component uploads to `${businessId}/${uuid}.${ext}` which matches, so the policy *should* pass.

**Most likely real causes (will diagnose in build mode):**

1. The `business_images` row insert might fail silently — the toast surfaces it, but if RLS blocks it the upload object is orphaned.
2. The lightbox in `PublicBusinessGallery.tsx` is already wired with shadcn `Dialog` — works, but the dashboard card has no preview/lightbox.

**Changes:**

- Wrap upload in proper try/catch with a clear error toast that prints both storage and DB errors separately.
- After a successful storage upload but failed DB insert, delete the orphaned object.
- **Add a lightbox to the dashboard card** (`BusinessGalleryCard.tsx`) — same `Dialog` pattern as `PublicBusinessGallery.tsx`. Click a thumbnail → full-size preview, with a "Remove" button inside the dialog.
- Verify file input opens — confirmed by looking at the code, the `onClick={() => fileInputRef.current?.click()}` is wired correctly. If it still doesn't open in the user's browser, check console for a click handler being swallowed (will verify via console logs in build mode).

---

## 4. Admin "view as" mode

Quick way for you to see every screen as a logged-in pro without having to seed test accounts.

**Approach (no impersonation tokens — too risky):** Add an admin-only toggle that fakes the dashboard data layer for the *current* admin session.

- New page `/admin/preview` (admin-gated) that lists: every published business, every dashboard section, links to view each profile, each lead detail, each request, billing/verification states.
- Add an "Admin tools" item to the `SiteHeader` dropdown (only when `isAdmin`) with links to:
  - `/admin/preview` (new) — directory of all businesses + states
  - `/admin/founding-members` (existing)
  - `/admin/disputes` (existing)
  - `/admin/concierge` (existing)
- On the new preview page, render each Dashboard section in turn with a sample business's data passed in, so you can scroll the whole pro experience top to bottom.

This is read-only and uses your existing admin role check via `useUserRoles().isAdmin`. No auth.users impersonation, no security holes.

---

## 5. What happens when you publish

Right now `is_published: false`. When you click Publish:

- **Anyone with the link** can hit `https://sjoh.co.za` and see:
  - Homepage, directory (currently empty since `useDirectory` returns `[]` when DB is empty), all programmatic SEO routes (will mostly 404-ish empty), pricing, terms, privacy
  - Login / Register / Apply as a Pro flows — fully functional, anyone can sign up
  - The `/requests` board — public, anyone sees customer requests if any exist
- **New signups can immediately:**
  - Create an account (email/password — Google sign-in is wired but auto-confirm is on for email per current settings; verify before launch)
  - Post a request (`/requests/new` is gated to logged-in)
  - Apply to list a business (`/list`) — creates a `businesses` row in `workshop` status, *not* visible in the public directory until they flip to active
  - Subscribe to a plan via Paystack (live keys depending on `payments.ts` config)

**You said: "I don't want them to access the full site yet."** Two options for soft-launch — pick one in the next message:

- **A. Email-collector landing only** — restore a coming-soon page at `/` that just collects `early_access_signups` and gates everything else behind admin login. No directory, no requests board, no pro applications.
- **B. Open everything** — what's wired now. Pros can apply, customers can post, but the directory is empty so it'll feel quiet.

My recommendation: **B with a top banner** that says "Sjoh is in early access — first 100 pros get founding-member pricing". You already have `FoundingSpotsBanner`. Real activity beats a coming-soon page for SEO and word-of-mouth.

---

## Out of scope (track separately)

- Real "Profile views" tracking (needs a `business_views` table + insert from public profile page)
- Functional Promotions add/edit form
- Concierge & Dispute admin UI polish
- Paystack hardening (already handed off as a Codex prompt)

---

## Questions I need answered before building

1. **Soft-launch mode** — A (coming-soon) or B (open with banner)?
2. **Admin preview page** — am I on the right track with a read-only `/admin/preview`, or do you want a true "log in as this user" impersonation? (The latter is doable but needs an edge function + careful RLS work.)
