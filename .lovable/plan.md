## Goal

Adopt the new uploaded brand assets — the black "sjoh!" wordmark with periwinkle accents, plus the peace-sign + S monogram — as the official Sjoh logo and app icon. Replace the current `sjoh-logo.png`, the favicon, and the inline text-based "Sjoh." wordmarks so the brand reads consistently everywhere.

## Asset selection

From the four uploads:

- **Untitled_Project-6.png** — black "sjoh!" wordmark, light-periwinkle dot on the i, periwinkle exclamation. → Primary logo (header, footer, emails, OG).
- **Untitled_Project-9.png** — same wordmark in light periwinkle on white. → Reverse / on-dark variant (e.g. anywhere `sjoh-logo-white.png` is used today).
- **Untitled_Project-8.png** — peace-hand + S monogram, two-tone periwinkle. → Favicon, app icon, square avatar, social profile mark.
- **Untitled_Project-7.png** — just the dot + exclamation glyphs. → Skip for now (decorative only; can be reused later as a flourish).
- **Untitled_Project-5.png** is essentially the same as -6 with slightly different proportions; we use -6 as the canonical wordmark.

## File operations

Copy the uploads into the project under stable names so existing imports keep working:

```text
user-uploads://Untitled_Project-6.png  →  src/assets/sjoh-logo.png            (overwrite)
user-uploads://Untitled_Project-9.png  →  src/assets/sjoh-logo-white.png      (overwrite — reverse variant)
user-uploads://Untitled_Project-8.png  →  src/assets/sjoh-icon.png            (new — monogram)
user-uploads://Untitled_Project-8.png  →  public/favicon.png                  (new — browser tab icon)
user-uploads://Untitled_Project-8.png  →  public/apple-touch-icon.png         (new — iOS home screen)
```

Delete `public/favicon.ico` so browsers stop falling back to the old icon.

## Code changes

1. **`index.html`** — swap favicon link from `/favicon.ico` to `/favicon.png`, add `apple-touch-icon` link, and replace the OG/Twitter image URL with the new monogram (uploaded once to a public location via the asset path `/favicon.png` works as a same-origin OG image too — but we'll point OG at a hosted version of the wordmark for richer previews; keeping the existing OG URL is fine if we want to defer that).
2. **`src/components/SiteHeader.tsx`** — no code change needed; it already imports `sjoh-logo.png`. The new file picks up automatically. Verify `h-7 md:h-8` still looks balanced with the new aspect ratio (the wordmark includes the "!" so it's slightly wider than before).
3. **`src/components/SiteFooter.tsx`** — replace the inline `Sjoh<span className="text-primary">.</span>` text with an `<img src={sjohLogo} …>` so the footer matches the header. Use `h-6` for footer scale.
4. **`src/pages/Auth.tsx`** — same swap as the footer: replace the text wordmark with the logo image so the login/signup screen carries the real brand mark.
5. **Mascot / brand mark spots** — anywhere using `sjoh-mascot*.png` stays as-is (the mascot is a separate character, not the logo). Only the wordmark and favicon change.

No CSS / token changes — periwinkle palette already lives in `src/index.css` and matches the new artwork.

## QA after build

- `/` desktop + 729px viewport: header logo crisp, not clipped, "!" visible.
- `/login`: wordmark renders, sized similarly to before.
- Footer: wordmark replaces the old "Sjoh." text, aligned with the tagline.
- Browser tab on `/`: new periwinkle peace-S favicon shows (hard-refresh to bust cache).
- iOS "Add to Home Screen": apple-touch-icon picks up the monogram.
- `rg -n "Sjoh<span"` returns no results after the sweep.

## Files touched

- `public/favicon.png` (new), `public/apple-touch-icon.png` (new), `public/favicon.ico` (delete)
- `src/assets/sjoh-logo.png` (overwrite), `src/assets/sjoh-logo-white.png` (overwrite), `src/assets/sjoh-icon.png` (new)
- `index.html` — favicon + apple-touch-icon links
- `src/components/SiteFooter.tsx` — text wordmark → image
- `src/pages/Auth.tsx` — text wordmark → image

No DB, RLS, or edge function changes. Pure brand asset swap.
