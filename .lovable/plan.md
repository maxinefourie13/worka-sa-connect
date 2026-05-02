# Site-wide audit: dead buttons + advertise-vs-logic mismatches

I scanned every page and component for: links to nonexistent routes, permanently disabled buttons, mock-only forms, "coming soon" stubs presented as live features, and copy that contradicts the actual code/pricing model. Here's what I found and what to fix.

## Critical (broken on the published site right now)

### 1. `/auth` route doesn't exist → silent 404 when logged-out users click "Send Quote" or a paid plan
- `src/components/ApplyButton.tsx:98` → `navigate("/auth")` — this is exactly the *"clicked Send Quote, nothing happens"* bug from earlier.
- `src/pages/Pricing.tsx:32` → same bug when picking a plan while logged out.
- Routes only define `/login`. Fix: change both to `navigate("/login?next=" + encodeURIComponent(currentPath))` so they bounce back after sign-in.

### 2. `/list` (Apply as a Pro) is a fake mock
- `src/pages/ListBusiness.tsx` is the **primary site-wide CTA** ("Apply as a Pro" in the header, "List your business" everywhere) but the entire page is uncontrolled inputs with no form state, no Supabase write, no submit handler. Clicking "Confirm and Publish" just advances the step counter to a green "You're listed on Sjoh" screen — nothing was actually saved.
- It also still advertises **stale plans**: `Free / Standard (R0 for 3 months) / Featured R250` — current model per memory is **Basic R50 + Verified Pro R250 with a 30-day trial (2 months for early access)**.

  Fix: this is a bigger job — for *now* I'll (a) replace the fake plans with the correct ones from `SJOH_TIERS` so at least the copy is honest, and (b) add a clear "Early access — full sign-up opens soon. Drop your email to be first in" form on Step 4 that actually writes to the waitlist (same flow the early-access landing uses). Building the real multi-step business signup is a separate, larger task — flagged.

### 3. `/services/branding-design` → 404 (3 dead links)
- `src/pages/ListBusiness.tsx:127`, `src/components/ProfileVisibilityWarning.tsx:102`, `src/components/dashboard/BusinessGalleryCard.tsx:138`.
- No `/services/*` route exists, and `branding-design` isn't a known category, so it falls through to `Navigate to="/404"` → which itself isn't a route → 404.

  Fix: link these to `/directory?category=graphic-design` (closest real category) or remove the link and just say *"Find a designer in the directory →"* pointing at `/directory`.

### 4. `<Navigate to="/404">` is itself a dead route
- `src/pages/CategoryLocationPage.tsx:50`. There's no `/404` route — only the catch-all `*`. Lands on NotFound by accident, but the URL bar then says `/404` which is confusing and not crawlable.

  Fix: render `<NotFound />` directly, or use `<Navigate replace to="/" />`.

### 5. `<a href="#">` website link on every business profile
- `src/pages/BusinessProfile.tsx:397` — the website link in the contact rail is hardcoded to `#`, so clicking it just jumps to top of page.

  Fix: use `business.website` with `https://` prefix if missing, `target="_blank" rel="noopener noreferrer"`.

## High (advertise ≠ reality)

### 6. Pricing FAQ contradicts the Urgent Boost section
- `src/pages/Pricing.tsx:17` FAQ says: *"customers can flag it as Eish! Urgent at no extra charge"*.
- `src/pages/Pricing.tsx:188` same page says: *"Mark a job Urgent for R50"*.
- Memory says **Urgent Boost is R50**, customer-funded. Fix the FAQ answer.

### 7. Pricing copy uses old "klaxon" / Klaps-era voice
- `Pricing.tsx:188` says "we klaxon every verified pro" — replace with on-brand SA copy ("we WhatsApp every verified pro within 10km, top of the feed, instant push").

### 8. Directory pagination is fake
- `src/pages/Directory.tsx:259-263` renders `Previous / 1 / 2 / 3 / Next` buttons that are static — no state, no slicing, no page param. Looks live; isn't.

  Fix: hide pagination entirely until real paging is implemented (the dataset is small enough that it isn't needed yet).

### 9. Dashboard "Add Promotion" button is permanently disabled
- `src/pages/Dashboard.tsx:502` → `<Button disabled title="Promotions editor lands soon">`. Page also says *"Run limited-time offers to attract new customers"* as if it's a real feature.

  Fix: hide the button entirely and reword the empty state to *"Promotions are coming soon — we'll buzz you when they're live."* (don't tease an action you can't do).

### 10. Dashboard "Upload certificate" toast says "coming soon"
- `src/pages/Dashboard.tsx:330` — button just toasts "Upload (coming soon)".

  Fix: hide the upload button until real upload is built, or swap for an existing certificate-request flow if there is one. Same principle: don't show buttons that don't do anything.

### 11. Header always shows "Send Quotes" nav even for non-pros
- `src/components/SiteHeader.tsx:24` puts `/leads` in the nav for everyone. A logged-out browser or a customer sees it, clicks → Opportunities page in pro view, with paywalls everywhere.

  Fix: keep "Send Quotes" only when the user has a `pro` role / has a business listing. For everyone else, the "Get Quotes" link is enough.

## Medium (cosmetic / smaller)

### 12. `BusinessProfile` reveal buttons stay disabled after one click misuse
- Spot-check only — `revealing` toggles correctly. Skipping unless I see a concrete bug.

### 13. `/example-listing` "Reveal phone / WhatsApp / Email" — already fixed last turn.

## Files to edit

- `src/components/ApplyButton.tsx` — `/auth` → `/login?next=...`
- `src/pages/Pricing.tsx` — `/auth` → `/login?next=/pricing`; fix Urgent FAQ; rewrite "klaxon" sentence in Sjoh voice.
- `src/pages/ListBusiness.tsx` — replace stale `PLANS` with real tiers from `SJOH_TIERS`; replace mock submit with a real "join the waitlist" handler that writes to the same path the early-access landing uses; fix `/services/branding-design` link.
- `src/components/ProfileVisibilityWarning.tsx` — fix `/services/branding-design` link.
- `src/components/dashboard/BusinessGalleryCard.tsx` — fix `/services/branding-design` link.
- `src/pages/CategoryLocationPage.tsx` — render `<NotFound />` instead of redirecting to `/404`.
- `src/pages/BusinessProfile.tsx` — make the website link real (`href={normaliseUrl(business.website)}` + `target="_blank"`).
- `src/pages/Directory.tsx` — remove the fake pagination block.
- `src/pages/Dashboard.tsx` — remove disabled "Add Promotion" button + reword empty state; remove the "coming soon" certificate upload button.
- `src/components/SiteHeader.tsx` — gate the `/leads` ("Send Quotes") nav item on having a pro role / business.

## Out of scope for this pass

- Building the **real** multi-step business sign-up flow at `/list` (that's a project on its own — I'll just stop the page from lying for now).
- Building the **promotions editor** and the **certificate upload** — both stubs hidden, not implemented.
- Building **real pagination** on the directory — hidden, not implemented.

Want me to go ahead and apply all of the above? Reply "go" and I'll fix them in one batch.
