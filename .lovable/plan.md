
# Sjoh — group landing fix + the full "Klap it" system

Two things in this plan:

1. **Fix the group click** — clicking *Home & Maintenance* (or any group tile) currently dumps you into a flat directory pre-filtered to all sub-cats. Instead, show a proper **Group landing page** that lists the sub-categories as tiles, then drills into the directory.
2. **Build the "Klap it" feature set** end-to-end as mock UI (no payments / no backend yet) — the No Tjops verification funnel, the Klaps economy, the new tiered subscriptions, and the Eish! Urgent SOS flow.

Everything stays mock data so we can ship fast and pitch. Real auth, ID verification, payments and push notifications come later.

---

## Part 1 — Group landing page

### Routing

Add a new route: `/directory/g/:groupSlug` rendered by a new `GroupLanding.tsx`. The homepage group tiles change from `/directory?group=...` → `/directory/g/...`.

### What the page shows

- Hero strip with group emoji, name, one-line blurb, total listings count.
- "No Tjops promise" mini-banner (Verified IDs · Strikes system · Real reviews).
- **Sub-category tile grid** — every sub-cat in the group as a clickable card (emoji, name, listing count). Click → `/directory?category=<slug>`.
- "Featured providers in {Group}" — 3 BusinessCards filtered by sub-cats in the group.
- "Latest jobs in {Group}" — 3 JobCards filtered by sub-cats in the group.
- CTA: *Browse all in {Group}* → `/directory?group=<slug>` (the existing flat filtered view stays, used as the "see everything" escape hatch).

### Files
- new: `src/pages/GroupLanding.tsx`
- edit: `src/App.tsx` (register route)
- edit: `src/pages/Index.tsx` (link group tiles to `/directory/g/<slug>`)

---

## Part 2 — The "Klap it" system

All mock. No real money. We build the screens and the data so the pitch deck and demo are believable.

### 2a. Data layer (`src/lib/mockData.ts`)

Add new types and seed data:

```ts
// Provider-side wallet & verification
interface ProviderProfile {
  id: string;
  businessId: string;        // links to BUSINESSES
  idVerified: boolean;       // "Verified Oke" badge
  certifiedPro: boolean;     // PIRB / Wireman's etc — "Certified Pro" badge
  certifications: string[];  // ["PIRB", "Wireman's Licence"]
  strikes: 0 | 1 | 2 | 3;    // Sjoh's Law
  tier: "dala-trial" | "hustler" | "main-oke";
  trialEndsAt?: string;      // for dala-trial
  klapsRemaining: number;
  klapsThisMonth: number;
  urgentAlertsOptIn: boolean;
}

// Klap activity feed
interface KlapEvent {
  id: string;
  jobId: string;
  jobTitle: string;
  cost: 1;
  timestamp: string;
  outcome: "pending" | "won" | "lost";
}

// Top-up packs
const KLAP_PACKS = [
  { id: "six-pack", name: "Six-Pack", klaps: 10, price: 50 },
  { id: "crate", name: "Crate", klaps: 40, price: 150 },
];

// New tiers (replaces current Free/Standard/Featured)
const TIERS = [
  { slug: "dala-trial", name: "The Dala Trial", price: 0, period: "Free for 3 months",
    klapsPerMonth: 5, blurb: "Land your first job. Zero risk." },
  { slug: "hustler", name: "The Hustler", price: 50, period: "/month",
    klapsPerMonth: 15, blurb: "For the side-hustle and weekend pros." },
  { slug: "main-oke", name: "The Main Oke", price: 250, period: "/month",
    klapsPerMonth: 100, blurb: "Featured placement. Full-time grafters.",
    featured: true },
];
```

Also add an `isUrgent` boolean already exists on opportunities — add a few more urgent jobs to the seed for the demo, and stamp some businesses with `idVerified: true` / `certifiedPro: true`.

### 2b. UI components (new)

| File | Purpose |
|---|---|
| `src/components/KlapButton.tsx` | The bold "Klap this Job — 1 Klap" button. Disabled state when wallet is empty → opens top-up modal. |
| `src/components/TopUpModal.tsx` | Six-Pack / Crate cards, mock "Buy" → toast + bumps `klapsRemaining`. |
| `src/components/VerificationBadges.tsx` | Renders ID badge + Certified Pro coral checkmark + cert chips. |
| `src/components/UrgentBadge.tsx` | Flashing coral border wrapper + "URGENT" tag for job cards/listings. |

### 2c. Page updates

**`src/pages/Pricing.tsx`** — replace the three tiers with **Dala Trial / Hustler / Main Oke**, each showing monthly Klaps, price, blurb, and CTA. Add a small "What are Klaps?" explainer block below the tiers and a "Top-up packs" mini-section showing Six-Pack and Crate.

**`src/pages/PostOpportunity.tsx`** — the existing "Mark as urgent — R50" toggle is already there. Re-skin it as **"🚨 Eish! Urgent — R50"** with the coral flashing preview + copy: *"Klaxon every verified pro in 10km. Top of feed. Flashing coral border."* No code-flow change.

**`src/pages/Opportunities.tsx`** + **`src/components/JobCard.tsx`** — when `job.isUrgent`, wrap the card in `UrgentBadge` and sort urgent jobs to the top of the list. Add a "Urgent only" filter chip.

**`src/pages/BusinessProfile.tsx`** — render `VerificationBadges` near the business name. Show strike count only to the owner (skip for now, mock viewer = public).

**`src/pages/Dashboard.tsx`** — turn this into the **Provider control room**:
- Wallet card: current tier, Klaps remaining (e.g. `12 / 15`), reset date, [Top up] button → `TopUpModal`.
- Verification card: ID status, Certified Pro status, [Upload certificate] (mock), strike counter (0/3).
- Urgent alerts toggle.
- Recent Klap activity table (job, when, outcome).
- Tier card: current plan + [Upgrade] → `/pricing`.

**Job detail (in `Opportunities.tsx` follow-up cards / `JobCard`)** — replace the plain `Apply` button with `<KlapButton />`. Clicking deducts 1 Klap (mock state), shows a toast: *"Klap sent! The client will see your quote."*

### 2d. Header / nav

Add a small Klaps pill in `SiteHeader` for "logged-in" provider state — for the demo we just hard-code `klapsRemaining` from a mock context. Skip if it complicates things; Dashboard is enough.

### 2e. State

To keep this simple and demo-friendly, the wallet/verification state lives in a small React context (`src/lib/klapStore.tsx`) seeded from `mockData`. No persistence — refresh resets. Good enough to demo every flow.

---

## Out of scope (explicitly)

- Real payments (Paddle/Stripe) — wallet top-ups are mocked with a toast.
- Real ID verification, OCR, PIRB lookups — toggles only.
- Push notifications for Urgent alerts — UI surfaces the opt-in, no real delivery.
- Auth — everything assumes the demo user is a provider.
- SEO pass — still paused, picks up after this lands.

---

## File summary

**New**
- `src/pages/GroupLanding.tsx`
- `src/components/KlapButton.tsx`
- `src/components/TopUpModal.tsx`
- `src/components/VerificationBadges.tsx`
- `src/components/UrgentBadge.tsx`
- `src/lib/klapStore.tsx`

**Edited**
- `src/App.tsx` — new route + wrap with `KlapProvider`
- `src/pages/Index.tsx` — group tiles point to `/directory/g/<slug>`
- `src/pages/Pricing.tsx` — Dala/Hustler/Main Oke + Klap packs
- `src/pages/PostOpportunity.tsx` — re-skin Urgent block
- `src/pages/Opportunities.tsx` — urgent sort + filter
- `src/pages/BusinessProfile.tsx` — verification badges
- `src/pages/Dashboard.tsx` — provider control room
- `src/components/JobCard.tsx` — urgent wrap + Klap button
- `src/components/SiteHeader.tsx` — optional Klaps pill
- `src/lib/mockData.ts` — types, ProviderProfile seed, KLAP_PACKS, more urgent jobs

Approve and I'll build it in one pass.
