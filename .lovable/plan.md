## What's changing

Two independent upgrades:

1. **Bidding becomes a true open auction.** Proposals are unlimited and free for every signed-in pro. Klaps stop being a "ticket to bid" and become **bid currency**: the pro picks any amount from 1 up to their balance, that's how much they pay, and the client's list is sorted by bid amount (highest first, ties broken by time). Spend more → ranked higher. Spend nothing → still on the list, just at the bottom.
2. **Google Reviews import.** A business owner can link their Google Maps listing to their Sjoh profile. We pull their official Google rating, total review count, and up to 5 most recent reviews via the Google Places API. A "★ 4.8 on Google (152) — view on Google" badge shows on the profile, and the imported reviews appear in a new "From Google" section under the Reviews tab. Auto-refreshes weekly.

---

## 1. Open-auction bidding

### Behaviour
- Every signed-in pro can submit unlimited proposals — no monthly cap, no Klap cost to enter.
- In the proposal modal, the existing 3-tier "Standard / Boost / Top Spot" picker is replaced with a **single "Bid Klaps" slider + number input**: 0 to (your balance), default 0.
- Live preview shows: *"You'd be ranked #N of M bidders with a 25-Klap bid. Top bid is currently 40 Klaps."*
- On submit, Klaps are deducted immediately and locked to that proposal. No refunds, no escrow.
- Client's bid list (in their job dashboard) is sorted **bid amount DESC, then created_at ASC**. Bid amount is shown as a coral chip on each proposal card. Bids of 0 still appear, just at the bottom under a "Other proposals" divider.
- Pros can **top up an existing bid** from the dashboard ("Outbid by Khumalo Electrical — add Klaps?") with a one-click +5 / +10 / custom action. Top-up adds to `klaps_spent` on that proposal.
- Empty-balance state on the modal: "Out of Klaps, eish! Submit free or top up to bid."

### Tier changes
- The three monthly Klap allowances (5 / 50 / 200) **stay** — Klaps are still the perk you get with your subscription, just used differently.
- "Verified Oke / Hustler / Main Oke" copy on the pricing page reframes Klaps as "bid budget" instead of "bids per month".

### Database
- `proposals.klaps_spent` already exists (currently always 1). We allow `0..N` and use it as the bid amount.
- New RPC `place_bid(_opportunity_id, _message, _quote_amount, _bid_klaps, _business_id)` — single transaction that creates the proposal AND deducts `_bid_klaps` from `provider_balances.klaps_remaining` (validates ≥ 0 and ≤ balance, allows 0). Replaces the current `spend_klap` flow for proposals.
- New RPC `top_up_bid(_proposal_id, _additional_klaps)` — adds to `klaps_spent` on a proposal owned by the caller, deducts from balance. Only allowed while opportunity status is `open`.
- Both RPCs `SECURITY DEFINER`, locked to `authenticated`, internal `FOR UPDATE` lock on `provider_balances` to prevent race overspend.
- Drop the `spend_klap` RPC (or keep as no-op). Proposal RLS insert policy stays as-is (provider must own the business and not be suspended).

### Code
- `src/lib/klapStore.tsx` — replace `BoostTier` / `BOOST_OPTIONS` / `klapJob` with a `placeBid(jobId, jobTitle, bidAmount)` and `previewBid(jobId, bidAmount)` returning `{projectedRank, total, topBid}`.
- `src/components/ProposalModal.tsx` — remove `BoostSelector`, add new `BidSlider` component (slider + numeric input + live rank preview + balance hint). Submit button copy: bid > 0 → "Klap this Job for N Klaps", bid = 0 → "Submit proposal (no bid)".
- `src/components/JobCard.tsx` & client dashboard proposal list — sort by bid desc, render bid chip, add "Top up bid" button for the pro's own active proposals.
- `src/pages/Pricing.tsx` (or wherever tiers display) — update Klap descriptions to "X Klaps/month bid budget".
- Mock data: update seed bids so amounts vary (1–80 range).

### Edge cases
- Submitting a proposal with 0 Klaps is valid → appears at bottom.
- If two bids tie, earlier wins (existing behaviour).
- Topping up after the opportunity closes is rejected by the RPC.
- Suspended businesses still blocked by existing RLS check.

---

## 2. Google Reviews import

### Behaviour
- New section in the business owner's dashboard: **"Link Google Reviews"**.
- Owner pastes their Google Maps URL (e.g. `https://maps.app.goo.gl/...` or full place URL). We resolve the Place ID via the Places API and store it on the business.
- Once linked, we fetch and cache: rating, total ratings count, up to 5 most recent reviews (author name, rating, text, time, profile photo URL), the Google Maps URL, and last-fetched timestamp.
- On the public profile (`BusinessProfile.tsx`):
  - Header rating chip shows both Sjoh rating and "★ 4.8 on Google (152)" with a "View on Google" link (required by Google policy).
  - Reviews tab gets a **"From Google"** subsection above the native Sjoh reviews, with each review credited to "via Google" and a link out.
- Auto-refresh weekly via `pg_cron` calling a refresh edge function. Owner can also click "Refresh now" (rate-limited to once per hour).
- Owner can unlink at any time → Sjoh profile reverts to native reviews only.

### Compliance with Google's Places API ToS
- Show at most 5 reviews (Places API only returns up to 5 anyway).
- Always include "View on Google" link on every imported review and on the badge.
- Cache for max 30 days; we refresh weekly so we're well within.
- Don't modify review text, don't strip author names/photos.

### Database
- New columns on `businesses`:
  - `google_place_id text`
  - `google_maps_url text`
  - `google_rating numeric`
  - `google_review_count integer`
  - `google_reviews_last_fetched_at timestamptz`
- New table `business_google_reviews`:
  - `id`, `business_id` (FK businesses.id, cascade), `author_name`, `author_photo_url`, `rating`, `text`, `relative_time` (Google's "2 weeks ago" string), `time` (timestamptz), `language`, `created_at`
- RLS:
  - `business_google_reviews` SELECT public (same as `businesses` reviews).
  - INSERT/UPDATE/DELETE only via SECURITY DEFINER edge function (no client writes).
- Owner can update `google_place_id` / `google_maps_url` on `businesses` via the existing UPDATE policy (already `auth.uid() = owner_id`); the protected-fields trigger doesn't need to lock these.

### Edge functions
- `google-places-link` — POST `{ businessId, mapsUrl }`. Resolves URL → Place ID (handles short URLs by following redirects), calls Places **Place Details** endpoint, returns place name + rating + review count to the client for confirmation. Validates caller owns the business.
- `google-places-import` — POST `{ businessId }`. Persists Place ID to the business, fetches details + reviews, upserts into `business_google_reviews` (replace-all strategy: delete existing, insert new), updates `businesses.google_*` columns, sets `last_fetched_at = now()`. Owner-only.
- `google-places-refresh` — Internal cron target. No body. Loops over businesses with `google_place_id IS NOT NULL` and `last_fetched_at < now() - interval '7 days'`, refreshes each (with a small per-batch limit to stay within budget). Called by `pg_cron` daily.
- `google-places-unlink` — POST `{ businessId }`. Clears columns + deletes review rows.

All four use the standard CORS + Zod validation + JWT verify pattern.

### Cron
Add a daily `pg_cron` job hitting `google-places-refresh` (uses `pg_net`, scheduled via insert tool not migration so it isn't re-run on remix).

### Code
- `src/components/dashboard/GoogleReviewsCard.tsx` — owner-side card: paste URL → preview → confirm → linked state with "Refresh now" / "Unlink" actions.
- `src/pages/BusinessProfile.tsx`:
  - Add Google rating chip next to the existing Sjoh rating.
  - In Reviews tab, add `<GoogleReviewsList business={business} />` above the existing list.
- `src/hooks/useBusiness.tsx` (or wherever business is fetched) — extend select to include the new google columns + a sub-select for `business_google_reviews` ordered by `time DESC`.
- Move `BusinessProfile` off mock data for the Google fields (it currently uses `BUSINESSES` from `mockData`); fall back to mock if no Supabase row, but read Google fields from the live row when present.

### Required secret
`GOOGLE_PLACES_API_KEY` — single key, server-side only, used by all four edge functions. The user will need to create this in Google Cloud Console (enable "Places API (New)" + billing). I'll prompt for it via `add_secret` after the plan is approved and edge function scaffolding is in place.

### Cost note for the user
Google Places "Place Details" calls cost ~$0.017 each. With weekly refreshes per linked business and ~1 link/preview call per onboarding, this stays well within Google's $200/month free credit until you have ~700+ businesses linked. We'll add per-business rate-limiting on manual refresh (1/hour) to prevent abuse.

---

## Build order

1. Migration: add columns to `businesses`, create `business_google_reviews`, create `place_bid` + `top_up_bid` RPCs, drop/replace `spend_klap`.
2. Refactor `klapStore` + `ProposalModal` + bid display in JobCard / dashboard.
3. Update pricing page Klap copy.
4. Scaffold the four `google-places-*` edge functions (with stub responses).
5. Prompt user for `GOOGLE_PLACES_API_KEY`.
6. Wire real Places API calls into the edge functions.
7. Build `GoogleReviewsCard` + integrate into `BusinessProfile`.
8. Schedule daily refresh cron via insert tool.
9. Smoke test both flows.