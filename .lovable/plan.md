# Sjoh! Copy Voice + Programmatic SEO

Two parallel workstreams: (1) brand-voice copy injection across every user-facing flow, (2) programmatic SEO routing infrastructure for local search ranking.

---

## Part 1 — Sjoh! Master Copy Injection

Apply the cheeky SA voice from the guide across all touchpoints. Save the full guide to memory so every future screen uses it automatically.

### Screens to update

**Auth (`src/pages/Auth.tsx`)**
- Register header → "Pull in, boet." / subtext "The graft is waiting. Let's get you set up."
- First name placeholder → "What does your Ma call you?"
- Surname → "And your surname?"
- Phone → "Drop your digits so we can send the OTP."
- Password → "Make it stronger than Ouma's rusks."
- Submit button → "Let's Gooi"
- Client-side variant uses "Pull in, my china." (chosen by role on the page)

**Post Opportunity (`src/pages/PostOpportunity.tsx`)**
- Header → "What's the damage?"
- Title placeholder → "E.g., The geyser is crying, please help."
- Description placeholder → "Don't hold back. Tell the okes exactly how bad the DIY disaster is..."
- Urgent toggle label → "Eish! It's a crisis. Wake everyone up! (Pushes you to the top)"
- Submit → "Put it out there"
- Success toast → "Sharp-sharp! Your job is live. The okes are warming up their bakkies."

**Provider Dashboard (`src/pages/Dashboard.tsx`)**
- Welcome → "Howzit, [Name]. Ready to dala what you must?"
- Empty state for matched jobs → "Eish, it's a bit quiet today. Gooi a braai while you wait for the next job to drop."
- Fresh job tag → "🔥 Fresh Graft!"
- Bid button (where shown on opportunity cards) → "Klap this Job"
- Bid sent toast → "Quote sent! Now we hold thumbs."

**Money screens (`src/pages/Pricing.tsx`, `src/components/TopUpModal.tsx`)**
- Out-of-klaps state → "Sjoh! You're out of ammo, boet."
- Top-up header → "Load the Kroon."
- R50 tier blurb → "For the price of a pie and a Coke, keep the graft rolling."
- Purchase button → "KLAP HOM PAPPIE"
- Payment success toast → "Chankura sorted. Your account is topped up. Back to work!"

**Loading states** — new shared `<SjohSpinner />` in `src/components/SjohSpinner.tsx` that rotates:
- "Hold tight... we're making a plan."
- "Searching... faster than a taxi skipping a robot."
- "Just now, just now..."
- "Sorting the chankura..." (payment-context variant via prop)

Wire into existing loading spinners (Auth, Pricing, TopUpModal, Dashboard payment redirects).

**Errors**
- `src/pages/NotFound.tsx` → header "Eish! We took a wrong turn.", subtext "We can't find the page you're looking for. The taxi definitely dropped us at the wrong rank.", button "Take me back to the graft"
- Payment failure toast (in `src/lib/payments.ts` callback handler) → header "Aikona!", body "Your card just bounced harder than a pothole on the N1. Check your balance and let's give it another gooi.", button "Try Again"

**Reviews (`src/components/` review form, used on `BusinessProfile`)**
- Prompt → "How was the graft?"
- Body placeholder → "Did they sort it out, or did they leave a mess?"
- Star labels: 5 → "Lekker! Absolute Main Oke." · 3 → "It's fine, standard." · 1 → "Gatvol. Total Pampoen."

### Memory
Save `mem://design/sjoh-copy-voice` with the full guide so every future screen pulls from it. Add a one-liner to `mem://index.md` Core: "Use Sjoh SA copy voice — see design/sjoh-copy-voice for full guide."

---

## Part 2 — Programmatic SEO Architecture

Goal: rank for `[category] in [city]` queries with auto-generated landing pages backed by the database.

### Routing

New dynamic route added to `src/App.tsx` **above** the catch-all:
```
/services/:categorySlug/:provinceSlug/:citySlug   →  <CategoryLocationPage />
/services/:categorySlug/:provinceSlug             →  <CategoryProvincePage />
/services/:categorySlug                           →  <CategoryIndexPage />
```

Slug format kept lowercase-kebab (`plumbers`, `gauteng`, `johannesburg`). Existing `businesses` table already stores `category_slug`, `province`, `city` — we'll add a `city_slug` computed query helper (slugified at read time; no schema change needed initially).

### Page template (`src/pages/CategoryLocationPage.tsx`)

Queries Supabase:
```
businesses
  where category_slug = :categorySlug
    and lower(province) matches :provinceSlug
    and lower(city) matches :citySlug
    and is_verified = true
  order by rating desc, review_count desc
```

Layout:
- H1: `Find the Best [Category Name] in [City Name]`
- Intro paragraph (templated, SA voice)
- Grid of verified Pro cards (reuse existing business card)
- Empty state in Sjoh voice: "Eish, no verified okes here yet. Be the first to list."
- Internal links to sibling cities + parent category (helps crawl depth)

### SEO head management

Install `react-helmet-async`, wrap `<App />` with `HelmetProvider`. New `src/components/SeoHead.tsx` accepts `title`, `description`, `canonical`, `jsonLd`. Used by every dynamic page.

For `/services/:cat/:prov/:city`:
- `<title>`: `Top [Category] in [City] | Verified Pros | Sjoh!`
- meta description: `Looking for a trusted [Category] in [City]? Get quotes from verified professionals. No scammers, just real okes.`
- canonical: full URL
- JSON-LD: `Service` + `ItemList` of `LocalBusiness` entries (name, address, aggregateRating from each business row)

### Sitemap

New Supabase Edge Function `sitemap-xml` (public, `verify_jwt = false`):
- Queries distinct `(category_slug, province, city)` combos from `businesses` where `is_verified = true`
- Emits valid `sitemap.xml` with `<lastmod>` from `max(updated_at)` per group
- Includes static routes (`/`, `/directory`, `/pricing`, etc.) and category index pages
- Cache header `s-maxage=3600`

Add a thin redirect so `/sitemap.xml` on the app domain proxies to the function (via a small `<Route path="/sitemap.xml">` that does a `window.location.replace` is **not** SEO-friendly). Instead: document that the sitemap URL submitted to Google is the edge function URL directly: `https://zwgjbffesalpiaaycbac.supabase.co/functions/v1/sitemap-xml`. Update `public/robots.txt` to reference it.

### Slug helpers

New `src/lib/seo.ts`:
- `slugify(s: string)` — lowercase, dash-separated
- `categoryNameFromSlug`, `provinceNameFromSlug`, `cityNameFromSlug` reverse helpers using existing province/city lookups
- `buildLocationCanonical(cat, prov, city)`

### Crawl note (SPA)

Lovable's hosting serves SPA-fallback `index.html` for all unknown paths, so deep links like `/services/plumbers/gauteng/johannesburg` resolve correctly. Modern Googlebot renders JS, so client-side `react-helmet-async` meta tags are indexed. We rely on this rather than SSR.

---

## Technical summary

**New files**
- `src/components/SjohSpinner.tsx`
- `src/components/SeoHead.tsx`
- `src/pages/CategoryLocationPage.tsx` (also handles province + category-only modes via optional params)
- `src/lib/seo.ts`
- `supabase/functions/sitemap-xml/index.ts`
- `mem://design/sjoh-copy-voice`

**Edited files**
- `src/App.tsx` — add HelmetProvider + 3 new SEO routes
- `src/pages/Auth.tsx`, `PostOpportunity.tsx`, `Dashboard.tsx`, `Pricing.tsx`, `NotFound.tsx`
- `src/components/TopUpModal.tsx`, review form component
- `src/lib/payments.ts` — payment failure copy
- `public/robots.txt` — add `Sitemap:` line
- `supabase/config.toml` — register `sitemap-xml` function with `verify_jwt = false`
- `mem://index.md`

**Dependencies**
- `react-helmet-async`

**No schema changes** — all SEO data derives from existing `businesses` columns.
