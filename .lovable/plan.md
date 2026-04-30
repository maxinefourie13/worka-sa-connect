## Red-Team hardening pass

### 1. Database — Lock contact reveal strictly to acceptance

New migration `lock_contact_reveal_to_acceptance.sql`:

- Replace `public.get_revealed_contact(_proposal_id uuid)` so it returns contact details **only** when:
  - viewer is the opportunity owner (reason `'owner'`), OR
  - the proposal's `status = 'accepted'` AND the viewer is that proposal's `provider_id` (reason `'accepted'`).
- **Remove the `urgent_emergency` early-reveal branch entirely.** Urgent jobs no longer leak contact at proposal time — they only get faster acceptance via the boost queue.
- Add a defensive `CHECK`-style validation trigger on `opportunities`: when a proposal flips a row's downstream state, no path other than `accept_quote` may set `client_phone`/`client_email` exposure.
- Re-`REVOKE SELECT (client_phone, client_email, contact_preference) ON public.opportunities FROM anon, authenticated;` (idempotent — guards against drift).
- `GRANT EXECUTE ON FUNCTION public.get_revealed_contact(uuid) TO authenticated;`

### 2. SEO & routing hardening (`src/lib/seo.ts`)

- Add a `CATEGORY_KEYWORD_MAP: Record<string, string>` that maps category slugs to the noun a searcher actually types (e.g. `photography → photographer`, `plumbing → plumber`, `electrical → electrician`, `painting → painter`, `tiling → tiler`, `roofing → roofer`, `catering → caterer`, `tutoring → tutor`, `web-design → web designer`, `graphic-design → graphic designer`, `copywriting → copywriter`, `mechanics → mechanic`). Fallback: category name.
- Export a `categoryKeyword(slug)` helper used in headings / `<title>` / meta description.
- **Strip phone numbers from JSON-LD.** In `buildLocationJsonLd`, remove the `telephone` field on each `LocalBusiness` ItemList entry. Drop `phone` from `BusinessForJsonLd` (or keep type but ignore in output) so scrapers can't harvest numbers via structured data.
- Extend `RESERVED_TOP_LEVEL_SLUGS` with the now-live customer/pro routes: `requests`, `leads`, `quote`, `unsubscribe`, `preview-home`, `terms`, `privacy`. (Guards the programmatic `/:categorySlug` route from swallowing them.)

### 3. Public category page (`src/pages/CategoryLocationPage.tsx`)

- Switch the listing query from `from("businesses")` to `from("businesses_public")`. The view already excludes `phone`, `email`, and other PII columns — public pages must not query the base table.
- Drop `phone` from the row type and from the JSON-LD payload (matches the seo.ts change).
- Use `categoryKeyword(...)` for the `<h1>` and `<title>` ("Find a Plumber in Cape Town" reads better and ranks better than "Find Plumbing").
- Keep `is_verified = true` filter and the existing reserved-slug guard, which now covers `/requests` and `/leads` automatically.

### 4. Lead detail copy (`src/pages/LeadDetail.tsx`)

- The "no contact yet" empty state currently says urgent + R250 + KYC unlocks contact on quote send. Rewrite to:
  > "Contact details are hidden until the customer accepts your quote. This applies to every job, urgent or not — it's how we protect the customer and you."
- Remove the `revealReason === "urgent_emergency"` branch from the success header (matches DB change). Keep `'owner'` and `'accepted'`.
- Keep the safety / verify-on-arrival amber banner.

### 5. Business profile follower bug (`src/pages/BusinessProfile.tsx`)

Current code calls `setFollowers(business.followers)` directly inside the render body — a render-phase state update that will warn and can re-render-loop under strict mode.

- Replace the inline `if (business && followers === 0 ...) setFollowers(...)` block with a `useEffect([business?.id, business?.followers])` that syncs the local follower count when the business resolves or changes.
- Move the `useAuth()` and `useRevealContact()` hook calls **above** the early `if (loading) / if (!business) return` guards so hooks are always called in the same order. (Right now they sit after the early returns, which is a hooks-order violation waiting to happen on slug change.)

### 6. Sitemap (`supabase/functions/sitemap-xml/index.ts`)

Extend `STATIC_ROUTES` with the new public surface:
```
"/", "/directory", "/requests", "/leads", "/pricing", "/list", "/terms", "/privacy"
```
Drop `/opportunities` (now a redirect — no need to expose it to crawlers and risk soft-404s).

### Technical notes

- `businesses_public` view confirmed present with columns: id, owner_id, slug, name, category_*, province, city, address, website, description, tags, hours, image_url, plan, is_verified, certified_pro, certifications, rating, review_count, followers_count, response_rate, pre_launch, created_at, updated_at — no phone/email. Safe drop-in.
- The new migration is additive (`CREATE OR REPLACE FUNCTION`) so existing callers (`LeadDetail.tsx`) keep working — they just stop seeing the urgent-emergency reason code.
- No `_redirects` files — Lovable hosting handles SPA fallback automatically.

### Out of scope / not changed

- Paystack, dispute log, referral, secondary categories, WhatsApp consent flows — already shipped, no regressions expected from this pass.
