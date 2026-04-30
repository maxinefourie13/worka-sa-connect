## Production Hardening Audit — Status Report

### Scoreboard

| Phase | Area | Status |
|---|---|---|
| 1 | Auth + protected routes | Complete |
| 2 | Quote acceptance + RLS for contact PII | **Complete** |
| 3 | Pro lifecycle (KYC, plans, suspension, disputes) | Complete |
| 4 | Bot shielding on public business profile | **Partial — tel:/mailto: still rendered post-reveal** |
| 5 | Programmatic SEO routing `/:cat/:province/:city` | Complete |
| 6 | Per-page SeoHead + JSON-LD | Complete (one minor JSON-LD bug) |
| 7 | Sitemap edge function | **Partial — only emits verified businesses; new public routes added but `/services/*` legacy path not aliased; admin/dashboard not explicitly noindex'd everywhere** |
| 8 | Dispute log + privacy/data-export | Complete |

---

### Phase 2 — Security: VERIFIED COMPLETE

- `accept_quote(uuid)` exists in DB. Confirmed signature: only the customer (`o.client_id = auth.uid()`) can flip a proposal to `accepted`; raises on anyone else. `LeadDetail.tsx` calls it via `supabase.rpc("accept_quote", …)`.
- `get_revealed_contact(uuid)` was tightened in migration `20260430102021` — urgent_emergency early-reveal branch removed. Contact only returns when viewer is owner OR (provider AND status=accepted).
- `REVOKE SELECT (client_phone, client_email, contact_preference) ON public.opportunities FROM anon, authenticated` is in place.
- `businesses_public` view excludes phone/email; base `businesses` table has no public SELECT policy.
- `reveal_contact(uuid)` RPC for business profiles is rate-limited + logs to `contact_reveals`.

No gaps here.

### Phase 4 — Bot Shielding: PARTIAL

Reveal gating works (auth + rate-limited RPC), but **once revealed the rendered DOM contains scrapable `tel:` and `mailto:` links** in `src/pages/BusinessProfile.tsx`:

- L374, L416, L478 — `<a href={`tel:${phone}`}>`
- L384, L424, L491 — `<a href={`mailto:${email}`}>`

A scraper that solves the auth wall once (or harvests a session cookie) gets a clean structured handle. Industry pattern: render contact as obfuscated text + onClick handler that invokes `window.location.href = atob(...)` so there's no machine-parseable href in the DOM. Phone digits should also not appear in the visible text node verbatim (use a span split by zero-width chars, or only render after click).

Also: `business.website` link on L393 has `href="#"` — broken UX, unrelated but worth fixing in same pass.

### Phase 5–7 — SEO: MOSTLY COMPLETE, SMALL GAPS

What works:
- Routes `/:categorySlug`, `/:categorySlug/:provinceSlug`, `/:categorySlug/:provinceSlug/:citySlug` all wired in `App.tsx` and render `CategoryLocationPage`.
- Each level builds a unique canonical, title, meta description, `Service` JSON-LD with `ItemList` of `LocalBusiness` entries, plus `BreadcrumbList`.
- Reserved-slug guard prevents `/requests`, `/leads`, `/quote`, `/admin`, etc. from being swallowed.
- `categoryKeyword()` keyword-mapping is in place ("Plumber" not "Plumbing").
- Sitemap emits per-business + per-(cat) + per-(cat,province) + per-(cat,province,city) URLs with lastmod.
- `robots.txt` allows all bots and points at the sitemap function.

Gaps:
1. **Memory says** SEO pages live at `/services/:cat/...` — actual routes are root-level `/:cat/...`. Either the memory is stale or we're missing the `/services/*` alias. Currently no redirect from `/services/plumbing/...` → `/plumbing/...`, so old backlinks would 404.
2. **Admin pages have `noindex`** (`Concierge`, `Disputes`) but `Dashboard`, `ListBusiness`, `PostOpportunity`, and the `/leads` and `/requests` board itself do not — these will get crawled and may rank for the wrong queries.
3. **`BusinessProfile` JSON-LD** uses `business.reviews.length` instead of `business.review_count` for `aggregateRating.reviewCount` — undercounts when only a sample of reviews is loaded.
4. **Sitemap** doesn't expose individual `/business/:slug` pages for businesses where `is_verified = false` — that's intentional, but it also doesn't include all category roots when no verified business exists in that category yet (the page renders, but is invisible to crawlers).

### Other minor production gaps surfaced during scan

- `BusinessProfile.tsx` `business.website` rendered as `<a href="#">` (line 393).
- `useRevealContact` toast on auth-wall says "Sign in to see contact details" but doesn't push the user to `/login` — friction.
- No `<meta name="robots" content="noindex">` on `/dashboard`, `/list`, `/requests/new`, `/leads/:id`, `/requests/:id` — they're behind auth but bots that follow internal links will hit them and waste crawl budget.

---

## Action Plan — grouped to save credits

Each phase is a single, focused commit. Stop after each one for review.

### Phase A — Bot-shield BusinessProfile (1 round)
- Replace all six `tel:`/`mailto:` `<a>` tags with click-to-act buttons. On click: build the `tel:`/`mailto:`/`wa.me` URL in JS and `window.location.assign(...)` (or `window.open` for whatsapp). DOM never contains a parseable href.
- Render the visible phone number through a tiny obfuscation helper (e.g. insert zero-width spaces every 2 digits) so plain-text scrapers get garbage but humans see the right number.
- Fix `business.website` `href="#"` → real URL with `rel="noopener nofollow"`.
- Fix `aggregateRating.reviewCount` to use `business.review_count`.

### Phase B — Crawl hygiene (1 round)
- Add `noindex` via `SeoHead` on: `Dashboard`, `ListBusiness`, `PostOpportunity`, `LeadDetail` (when accessed via `/leads/:id`), `Opportunities` (board itself can stay indexable, but `/leads/:id` should be noindex), `Auth` pages.
- Add a 301 redirect route `/services/:categorySlug/*` → `/:categorySlug/*` in `App.tsx` to preserve any `/services/...` backlinks that match the old memory contract. Update memory index to reflect the actual root-level pattern.
- Sitemap: emit category-only roots (`/:cat`) for every known category in `CATEGORIES`, even when no verified business exists yet, so the SEO surface is discoverable from day one.

### Phase C — Reveal-flow polish (1 round, optional)
- `useRevealContact`: when `!session`, redirect to `/login?next=<current>` instead of just toasting.
- Log the `reveal_contact` event with a `source` tag (`profile_sidebar` vs `mobile_sticky` vs `header_button`) so we can later see which CTA actually drives reveals.

No DB migrations needed for any phase — all client-side except an optional column on `contact_reveals` if you want the source tag in Phase C.
