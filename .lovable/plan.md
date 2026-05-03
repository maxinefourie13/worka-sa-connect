## Goal

Stop treating SA green as the dominant brand color. Use **green, gold, red, blue equally** as accents on a **white surface + charcoal ink** base. No single flag color should "own" the UI.

## Base (unchanged structure, tightened)

- `--background`: white `#FFFFFF` (drop the cool off-white tint so charcoal+white reads cleaner)
- `--foreground` / ink: charcoal `#0F1117`
- `--muted-foreground`: charcoal-2 `#3A3D4A`
- `--border`: `#E4E6ED`

The four flag accents (`sa-green`, `sa-gold`, `sa-red`, `sa-blue`) become **peer accents** — none is wired to `--primary` as a global brand. Buttons, links, badges, gradients all rotate through them by *meaning*, not by hierarchy.

## Token model change

Today `--primary = green` so every default Button, ring, link and focus state turns green → green dominates the page. Fix:

- Introduce a neutral interactive primary: `--primary = charcoal` (`230 22% 8%`), `--primary-foreground = white`. Default Buttons become charcoal-on-white (Upwork-clean), which lets the four flag colors stand out as accents.
- Keep all four flag colors as **named tokens** of equal weight:
  - `--sa-green`  157 100% 22%
  - `--sa-gold`   43 100% 55%
  - `--sa-red`    3 73% 53%
  - `--sa-blue`   227 100% 29%
- Replace the single `--accent` (gold) with role-based tokens used per meaning:
  - `--success` → green (verified hire, completed, paid)
  - `--accent` / highlight → gold (founding member, badges, ribbons)
  - `--destructive` / urgent → red (boosts, errors, "Eish!")
  - `--info` → blue (links, trust, verified pro)
- `--ring` and selection: charcoal (neutral), not green.

## Per-meaning assignments (locked)

| Surface | Color |
|---|---|
| Default Button / form focus / nav active | charcoal |
| Verified Hire badge, "Completed", success toast | green |
| Founding Member, Featured ribbon, gold star, hover highlight | gold |
| Urgent Boost, destructive action, "Eish!" error, hot lead | red |
| Verified Pro badge, links, info banners, trust marks | blue |

## Rotations (where multiple items appear together)

- **Hero typewriter** (`Typewriter.tsx`): rotate green → gold → red → blue per phrase (re-add red — fine here, it's not an error context).
- **Category tiles** (Index/GroupLanding): round-robin all 4 colors.
- **Business card gradients** `--grad-1..6`: keep current 4-color rotation but swap order so green isn't first twice.
- **Sample gradient**: already 4-color; keep.

## Files to edit

- `src/index.css` — rewrite `--background` to pure white, `--primary` to charcoal, add `--success` token, drop the green-as-primary glow (use charcoal glow + per-color soft tints). Adjust `--ring`, `::selection`, `--shadow-coral` (rename mentally to gold glow only where used).
- `tailwind.config.ts` — add `success` color mapped to `--success`; keep `sa.*` group; ensure `info` already wired.
- `src/components/Typewriter.tsx` — extend `ACCENT_ROTATION` to include `text-destructive` (red).
- `src/components/SiteHeader.tsx` / `SiteFooter.tsx` — logo dot rotates or uses charcoal; active nav underline → charcoal (not green).
- `src/components/VerifiedBadge.tsx` — currently gold; split into two: Verified **Pro** uses blue, Verified **Hire** uses green. Update `VerificationBadges.tsx` accordingly.
- `src/components/FoundingSpotsBanner.tsx` — gold (already correct, verify).
- `src/components/UrgentBoostButton.tsx` + `src/components/ui/flame-button.tsx` — red→gold gradient (already partly there, confirm no green leakage).
- `src/components/ui/button.tsx` — default variant becomes charcoal; add `variant="success"` (green), keep `accent` (gold), `destructive` (red), add `info` (blue).
- `src/pages/Pricing.tsx` — Basic neutral, Verified Pro card: **blue** border + **gold** "popular" ribbon (was green border).
- `src/pages/Index.tsx` + `src/pages/GroupLanding.tsx` — category tile color rotation across all 4 accents.
- `src/components/BusinessCard.tsx` — verify gradient rotation reads balanced.
- `src/lib/invoice.ts`, `src/lib/quotation.ts` — header accent: charcoal (neutral document), not green.
- Sweep: `rg -n "text-primary|bg-primary|border-primary|ring-primary"` and re-evaluate each — many should move to charcoal default or to a specific flag color by meaning.

## Memory update

Rewrite Core to: "Charcoal + white base. Green/gold/red/blue are **equal** accents assigned by meaning (success/highlight/urgent/info). No single flag color is the global brand." Update the per-meaning table above into `mem://design/sa-palette` (new file) and trim the index.

## QA

- `/`, `/directory`, `/pricing`, `/dashboard`, `/business/:slug`, `/list-business`, `/login` at 849px and desktop.
- Count visible accent occurrences on `/` and `/pricing` — green/gold/red/blue should each appear at least once and none should dominate.
- `rg -n "text-primary|bg-primary"` returns only intentional charcoal usages.
- AA contrast: charcoal on white ✓, white on green/blue/red ✓, charcoal on gold ✓.
