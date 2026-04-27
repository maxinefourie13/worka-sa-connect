# Hero typing color + icon cleanup

## 1. Hero typewriter — color treatment

Update `src/components/Typewriter.tsx` so the typed text isn't a single flat color. Instead of just rendering `text`, the component will tokenize what's been typed and apply the coral accent to:

- The word **"Sjoh"** (and its trailing **"!"**)
- All punctuation marks: `! ? . , ' " — - : ;`

Everything else stays in charcoal (`text-foreground`).

How it will work:
- Add an optional prop `accentClassName` (default `text-primary`).
- During render, walk the current `text` string and wrap matched segments (`Sjoh!`, then individual punctuation chars) in `<span className={accentClassName}>`. Plain letters render as-is.
- The blinking caret stays `currentColor` so it inherits whichever color it lands on.
- In `src/pages/Index.tsx`, drop the `className="text-primary-glow"` on the Typewriter (so the base is foreground/charcoal) and rely on the new accent coloring inside.

Result: each phrase reads as bold charcoal with the coral "Sjoh!" shouting at the front, plus little coral accents on the punctuation as the line types out.

## 2. Icon cleanup — remove non-essential symbols

Audit of current Lucide usage and what stays vs. goes:

**Keep (functional / unavoidable):**
- `SiteHeader`: `Menu`, `X` — mobile nav toggle.
- `Index` hero: `Search` (inside the search input — it's the affordance).
- `Directory`: `Search`, `SlidersHorizontal` (filter toggle).
- `Opportunities`: `Search`, `Plus` (post-opportunity CTA).
- `PostOpportunity` / `ListBusiness` / `BusinessProfile`: `ArrowLeft` back buttons, `Upload` file inputs.
- Pricing checklist `Check` marks (these communicate "included" — keep).
- shadcn/ui internals (`select`, `dialog`, `accordion`, etc.) — these are part of the components, leave untouched.

**Remove (decorative):**
- `Index.tsx`:
  - `Sparkles` in the top "No commission" pill.
  - `ArrowRight` next to "Browse all" / "See all" / "View board" section links.
  - `UserPlus`, `Users`, `Briefcase`, `Search` icons inside the "How it works" cards — replace the icon badge with the existing `0{i+1}` step number as the visual anchor.
- `BusinessCard.tsx`: `Star`, `MapPin`, `Check`, `UserPlus` — keep the text/labels (e.g. "4.8", city name, "Verified"), drop the leading icons. Verified can stay as a small coral text badge instead.
- `JobCard.tsx`: `MapPin`, `Clock`, `Users` — same treatment, text only.
- `BusinessProfile.tsx`: drop decorative `Star`, `MapPin`, `Phone`, `Globe`, `Mail`, `Clock`, `UserPlus`, `MessageCircle`, `ChevronRight`, `Shield`. Keep `ArrowLeft` (back) and `Check` (verified bullets if used in lists). Contact rows become plain "Phone: …", "Email: …" text labels.
- `Directory.tsx`: drop `ChevronRight` breadcrumb chevron (use `/` text separator).
- `Pricing.tsx`: keep `Check` only inside feature lists. Remove any decorative ones if present.
- `ListBusiness.tsx`: keep `ArrowLeft`/`ArrowRight` (wizard nav), `Upload`, `CheckCircle2` for the success state. Drop `Sparkles`, decorative `Check` outside step lists.
- `PostOpportunity.tsx`: keep `ArrowLeft`. Remove `Sparkles`/`Zap` decorative bits; keep `CheckCircle2` only on the success confirmation.
- `Dashboard.tsx`: review imports — keep only icons attached to interactive controls (e.g. logout button if needed); strip purely decorative ones from cards and section headers.
- `SiteFooter.tsx`: already icon-free — no change.

After cleanup, prune the now-unused names from each file's `import { … } from "lucide-react"` line.

## Out of scope
- No category emoji changes yet (waiting on the custom symbols you mentioned uploading).
- No image/photo swaps (waiting on uploads).
- SEO work still paused — will prompt you to resume after this.

## Technical notes
- `Typewriter.tsx`: tokenizer is a simple regex split — `/(Sjoh!|[!?.,;:'"\-—])/g` — applied to `text` only (not `target`), so accents appear letter-by-letter as typing progresses. Caret rendering unchanged.
- No new dependencies. No design tokens added; uses existing `text-primary` (coral `#FF887C`).
- All icon removals are pure JSX edits + import pruning; layout/spacing of cards adjusted minimally (gap utilities stay, just the icon node is dropped).
