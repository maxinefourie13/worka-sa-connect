## Goal

While the directory is still mostly empty, show a single dummy "Example Business" card in every category/location view, clearly labelled as a preview ("This is what your listing will look like"). It should never look like a real pro — no contact details, no clickable profile that suggests it's bookable.

## Approach

Create one shared synthetic `Business` object and inject it into the lists in three places. No DB writes — purely client-side, easy to remove later.

### 1. New file: `src/lib/exampleBusiness.ts`

Exports:
- `EXAMPLE_BUSINESS_ID = "example-listing"` (sentinel id we can detect anywhere).
- `buildExampleBusiness(category, categorySlug, province?, city?)` → returns a `Business` shaped object:
  - `name: "Example Business"`
  - `description: "This is what your listing will look like — your name, photo, services, and reviews live here. List your business to claim a real card."`
  - `tags: ["Sample listing", "Preview"]`
  - `isVerified: false`, `plan: "free"`, `rating: 0`, `reviewCount: 0`, `followers: 0`
  - `image: undefined` so the warm gradient cover renders (no fake stock photo)
  - `slug: "example-listing"` so we can intercept the click

### 2. `src/components/BusinessCard.tsx`

- Detect `business.id === EXAMPLE_BUSINESS_ID`.
- When true:
  - Replace the `<Link>` wrapper with a `<div>` (not navigable).
  - Add a coral dashed border + a small badge in the top-left corner: **"Sample listing"** (replacing the Promo slot for this card only).
  - Replace the Follow button with a `<Link to="/list">List your business →</Link>` styled as the primary CTA.
  - Override the rating row with the copy: *"This is what your listing will look like."*
- Keep the avatar circle, gradient cover, name, category/city, and tag chips intact so it visually matches a real card.

### 3. Inject into the three list sources

**`src/hooks/useDirectory.tsx`** — in `useBusinesses()`, after fetching from `businesses_public`, prepend one example card built with a generic category (e.g. `CATEGORIES[0]`). The Directory + Index pages will then naturally surface it. To make sure it appears for every category filter, the Directory's filter logic currently does `cats.includes(b.categorySlug)` — so we instead make the example card pass any category filter by giving it a special slug `"*"` and patching the filter to always keep `EXAMPLE_BUSINESS_ID` regardless of `cats`/`provs`/`verifiedOnly`/`promoOnly`/`topRated`. Same treatment in `GroupLanding.tsx`'s filter.

**`src/pages/CategoryLocationPage.tsx`** — after the Supabase `setRows(list)`, prepend a synthetic `BizRow` built from `categoryName`, `categorySlug`, `provinceName`, `cityName`. Render it inline in the existing card grid with the same dashed-coral preview styling and a "List your business" CTA instead of a profile link. Skip it from the JSON-LD array (don't pollute structured data).

**`src/pages/Index.tsx`** — already consumes `useBusinesses()`, so the example will show up automatically on the homepage carousel/list. Confirm the home renders use `BusinessCard` (it does via `useBusinesses`).

### 4. Sort safety

In Directory and GroupLanding sort handlers, pin the example card to the top of the list regardless of sort mode so it's always the first card a visitor sees.

### 5. Easy removal

Everything is gated behind `EXAMPLE_BUSINESS_ID`. To remove later: delete `exampleBusiness.ts` and the three small injection blocks.

## Out of scope

- No DB seeding.
- No changes to admin, dashboard, opportunities, or business profile page (clicking is disabled, so no profile route needed).
- No JSON-LD / SEO output for the example card.
