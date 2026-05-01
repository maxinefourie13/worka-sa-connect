## Two small changes

### 1. Cookie consent — make it stand out and feel like a "you should respond to this" prompt

File: `src/components/CookieConsent.tsx`

Currently it sits as a charcoal panel pinned to the bottom — visually it disappears into the dark landing page. Rework it so it clearly demands attention, both on the early-access landing and (after launch) on the homepage for first-time visitors.

Changes:

- **Centered modal style on desktop, bottom sheet on mobile.** Render a soft full-page overlay (`bg-black/55 backdrop-blur-[2px]`) behind the card so the rest of the page dims. The card sits centered on `sm+`, full-width bottom sheet on mobile. Higher z-index (`z-[80]`) so it floats above everything including the header.
- **Coral as the dominant surface.** Card background switches from `bg-neutral-900/95` to a coral gradient (`from-primary to-[hsl(5_85%_64%)]`) with white text, a soft coral glow ring (`ring-1 ring-white/20`, `shadow-[0_20px_60px_-15px_hsl(5_100%_60%/0.55)]`), and a rotated coffee/rusk emoji badge in the corner. The whole thing reads as a coral attention card, not a quiet footer note.
- **Bigger heading + clearer hierarchy.** Headline jumps to `text-xl sm:text-2xl` and sits next to a circular white chip containing the ☕ emoji. Body copy stays the same words, but in cream-white (`text-white/90`).
- **Button restyle for contrast on coral:**
  - Primary `Shot, dunk away ☕` → solid white pill with coral text (`bg-white text-primary font-extrabold`), small lift on hover.
  - `Just the essentials` → outlined pill (`border-white/40 text-white hover:bg-white/10`).
  - `No rusks for me` → low-key text link (`text-white/70 underline-offset-4 hover:underline`).
- **Entrance.** Add a subtle scale + fade-in (`animate-in fade-in zoom-in-95 duration-300`) and a small `animate-pulse`-once coral glow on first paint so it visually pings without being annoying.
- **Behaviour stays the same** — soft gate, dismissable, choice persisted in `localStorage.sjoh_cookie_consent`. Already mounted globally in `src/App.tsx` so it'll show on the homepage for new users post-launch automatically.
- **Body scroll lock** while open so it really feels like a modal you need to deal with (toggled via `document.body.style.overflow`).

No other files need touching for the cookie change — `App.tsx` mount stays as-is.

### 2. Swap mascot to the new (bigger) hoodie frenchie

The new image is `user-uploads://dog-2.png` — a back-shot frenchie in a coral Sjoh hoodie. Use it on the early-access landing in place of the current `sjoh-mascot.png`.

Steps:

- Copy `user-uploads://dog-2.png` → `src/assets/sjoh-mascot-hoodie.png`.
- In `src/pages/EarlyAccessLanding.tsx`:
  - Swap the import: `import sjohMascot from "@/assets/sjoh-mascot-hoodie.png"`.
  - Bump sizing on **both** placements:
    - Desktop (under perks): `w-[280px] xl:w-[340px]` → `w-[420px] xl:w-[520px]`, and remove the `hidden lg:flex` constraint so it shows from `md:` up. Wrap in a soft coral radial glow (`bg-[radial-gradient(closest-side,hsl(5_100%_74%/0.35),transparent_70%)]`) so the dog feels haloed against the charcoal.
    - Mobile (above signup card): `w-[200px] sm:w-[240px]` → `w-[280px] sm:w-[340px]`, same coral halo.
  - Keep `drop-shadow-2xl` and `select-none / draggable={false}`.

The old `sjoh-mascot.png` stays in the repo (still used elsewhere) — we just stop importing it on this page.

### Files touched

- `src/components/CookieConsent.tsx` — coral modal restyle + scroll lock.
- `src/assets/sjoh-mascot-hoodie.png` — new asset (copied from upload).
- `src/pages/EarlyAccessLanding.tsx` — swap mascot import, enlarge both placements, add coral halo.

No DB, RLS, auth, or routing changes.
