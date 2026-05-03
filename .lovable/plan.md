## Goal

Swap the coral-only brand for a **South African flag multi-accent system**. The neutral base (off-white background, near-black ink) stays the same — the flag colours show up as accents across buttons, badges, category tiles, gradients and highlights. Etsy-warm × Upwork-clean stays intact.

## New palette (HSL tokens in `src/index.css`)

```text
sa-green   #007A4D   hsl(157 100% 24%)   primary buttons, brand
sa-gold    #FFB81C   hsl(43 100% 55%)    highlights, badges, hover
sa-red     #DE3831   hsl(3  73% 53%)     urgent / destructive / "Boost"
sa-blue    #002395   hsl(227 100% 29%)   links, info, trust badges
sa-black   #000000                        ink (already in use)
sa-white   #FFFFFF                        surfaces (already in use)
bg / ink / border / muted              unchanged from today
```

Contrast: green and blue both pass AA on white for body+UI. Gold is reserved for fills with dark text or as a thin highlight (never gold text on white).

## Token mapping

| Token | Today (coral) | New |
|---|---|---|
| `--primary` / `--ring` | coral-deep | **sa-green** (157 90% 22% for AA) |
| `--primary-glow` | coral light | **sa-green** lighter tint |
| `--primary-light` | peach | **green-soft** (157 50% 95%) |
| `--accent` | coral | **sa-gold** (warm highlight) |
| `--accent-soft` | peach | gold-soft (43 100% 92%) |
| `--destructive` | red | **sa-red** |
| `--info` (new) | — | **sa-blue** |
| Selection / focus glow | coral | green |
| Sample-gradient (`.sample-gradient`) | black ↔ coral | rotates **green → gold → red → blue** |
| Business gradients `--grad-1..6` | warm-only | rebalanced: green, gold, red, blue, green/gold, blue/red |

## Component-level sweeps

1. **Hero typewriter** (`src/pages/Index.tsx`) — coral text → cycles through green/gold/blue per phrase (red kept out of the typewriter to avoid "error" feel).
2. **Buttons** — default uses green; `variant="accent"` uses gold; "Urgent Boost" / `flame-button` uses red→gold gradient.
3. **Badges** — Verified Pro → blue, Verified Hire → green, Urgent → red, Founding Member → gold.
4. **Category tiles** (`src/lib/categoryIcons.tsx` consumers) — round-robin the 4 flag accents instead of all-coral.
5. **Header / Footer** (`SiteHeader`, `SiteFooter`) — logo dot + active link underline → green; CTA stays primary (green).
6. **Toasters / EmailUnsubscribe / VerifiedReviewPage** — accent classes already use `bg-accent` so they inherit the new gold automatically; no per-file copy changes needed.
7. **Pricing page** — Basic card neutral, Verified Pro card uses green border + gold "popular" ribbon.
8. **Tailwind config** (`tailwind.config.ts`) — add `sa: { green, gold, red, blue }` colour group + `info` token wired to `--info`.

## Files touched

- `src/index.css` — token rewrite (primary, accent, destructive, ring, gradients, sample-gradient, selection)
- `tailwind.config.ts` — add `sa.*` and `info` colours
- `src/pages/Index.tsx` — typewriter colour cycle
- `src/components/SiteHeader.tsx`, `src/components/SiteFooter.tsx` — brand mark colour
- `src/components/VerifiedBadge.tsx`, `src/components/VerificationBadges.tsx`, `src/components/FoundingSpotsBanner.tsx`, `src/components/UrgentBoostButton.tsx`, `src/components/ui/flame-button.tsx` — re-tint to per-meaning flag colour
- `src/components/BusinessCard.tsx` (+ anywhere `bg-grad-*` is set) — confirm new gradients still read well
- `src/pages/Pricing.tsx` — popular ribbon → gold, recommended border → green
- Category tile renderer (likely `src/pages/Index.tsx` / `GroupLanding.tsx`) — accent rotation

No DB / RPC / edge function changes. Pure visual.

## Memory update

Rewrite the Core memory: remove "No green anywhere" and "coral is the brand". Replace with the SA flag multi-accent rule, token map, and the per-meaning colour assignments (green = primary, gold = highlight, red = urgent/destructive, blue = trust/info). Keep typography, voice, pricing, hero rules unchanged.

## QA after build

- Eyeball `/`, `/directory`, `/pricing`, `/dashboard`, `/business/:slug`, `/list-business`, `/login` at 849px and desktop.
- Confirm no remaining coral hex codes via `rg -n "FF887C|e8665a|coral"`.
- Confirm focus rings, hover states and toasts read correctly.
- Spot-check AA contrast on green buttons and gold badges.
