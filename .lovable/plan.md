# Restructure categories into 11 groups + 64 sub-categories

Replace the flat 12-category list with a two-tier taxonomy. The 11 groups become primary navigation; sub-categories sit underneath.

## Data shape (`src/lib/mockData.ts`)

Update the `Category` interface to support a parent group, and add a new `CATEGORY_GROUPS` array.

```ts
export interface CategoryGroup {
  slug: string;     // e.g. "home-maintenance"
  name: string;     // "Home & Maintenance"
  emoji: string;    // placeholder until custom symbols arrive
}

export interface Category {
  slug: string;     // e.g. "plumbing"
  name: string;     // "Plumbing"
  groupSlug: string;// "home-maintenance"
  emoji: string;
  count: number;
}
```

Replace the existing `CATEGORIES` array with the full 64 sub-cats below, each tagged with its group slug. Mock counts kept in a believable range.

**Groups:** home-maintenance, cleaning-domestic, garden-outdoor, automotive, construction-renovation, events-occasions, business-digital, personal-lifestyle, moving-logistics, pet-services, specialist-ondemand.

**Sub-categories:** all 64 from the approved list (Plumbing, Electrical, Handyman, …, Inspection Services).

## Existing mock business data

Mock businesses currently use slugs like `electrical`, `photography`, `catering`, `it`, `transport`. Re-map them to the new sub-cat slugs:
- `electrical` → `electrical` (kept)
- `photography` → `photography` (kept, now under events-occasions)
- `catering` → `catering` (kept, now under events-occasions)
- `it` → `it-support`
- `transport` → `furniture-removal`
- `construction` (Cape Steel Works) → `steelwork-fabrication`

Any other reference inside `BUSINESSES`/`OPPORTUNITIES` gets re-pointed accordingly so the seeded data still resolves.

## UI updates

1. **Homepage popular tiles** (`src/pages/Index.tsx`) — show the 11 **groups** as the "Browse by category" grid (instead of the first 6 sub-cats). Each tile links to `/directory?group=<slug>`.

2. **Homepage popular pills** (the small row above the search) — show 6 high-intent sub-cats: Plumbing, Electrical, Home Cleaning, Garden Services, Mechanics, Web Design.

3. **Directory page** (`src/pages/Directory.tsx`):
   - Read both `?group=` and `?category=` from the URL.
   - Sidebar Category filter becomes a collapsible accordion: 11 group headers, sub-cats nested. Checking a group selects all its sub-cats.
   - Header crumbs show the active group when one is selected.

4. **Listing wizard** (`src/pages/ListBusiness.tsx`) — Category select becomes two dropdowns: pick group → sub-category populates from that group.

5. **Post-opportunity form** (`src/pages/PostOpportunity.tsx`) — same two-step group → sub-cat select.

## Out of scope
- Custom icons/symbols (waiting on uploads — emojis remain as placeholders).
- Imagery (waiting on uploads).
- SEO — resumes after this. ← reminder

## Files
- `src/lib/mockData.ts` — interfaces, `CATEGORY_GROUPS`, expanded `CATEGORIES`, business slug remap.
- `src/pages/Index.tsx` — group grid + sub-cat pills.
- `src/pages/Directory.tsx` — accordion filter, group URL param.
- `src/pages/ListBusiness.tsx` — two-step category select.
- `src/pages/PostOpportunity.tsx` — two-step category select.
