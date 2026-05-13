## Goal

Bring the auth pages (Login, Register, Forgot Password, Reset Password) in line with the rest of Sjoh — bold Plus Jakarta extrabold headings, periwinkle accents, proper Sjoh voice, and an inviting layout instead of the current plain centered form.

## What changes

**Layout (`AuthShell`)**
- Replace the narrow centered single-column with a two-column split on desktop (form left, brand panel right). On mobile it stacks, form first.
- Right panel: periwinkle gradient background with the Sjoh wordmark, a punchy SA-flavoured tagline, and 3 trust bullets ("No commission", "Vetted SA pros", "Direct contact — no middleman") with Lucide icons. Adds the same warmth the home page has.
- Soft background: subtle periwinkle radial wash behind the form card so the page doesn't feel sterile.

**Typography**
- Headings switch from `font-medium` to `font-extrabold tracking-tight` (matches the Core rule for `font-display`).
- Bigger H1 (text-4xl) so it carries the page like the rest of the site.

**Form card**
- Keep the rounded card but lift it: stronger shadow, slightly larger padding, periwinkle focus ring on inputs (already partially there).
- Replace the inline `<style>` block + raw `<input className="input">` with shadcn `Input` and `Label` components for consistency with the rest of the app.
- Social buttons: keep Google + Apple, but use the proper brand glyphs (inline SVG for Google "G" colour mark, Lucide `Apple` icon) instead of a plain bold "G" letter and an empty Apple button.

**Voice & copy**
- Login subtitle: "Welcome back, boet. Let's get you back to the graft."
- Register already has good voice — keep "Pull in, boet." but tighten the subtitle.
- Forgot/Reset: keep functional but add Sjoh warmth ("No stress — we'll sort it.").
- Per memory: no emojis. The current `🎁` on the referral pill becomes a Lucide `Gift` icon.

**Misc**
- Logo at the top: keep but slightly smaller (h-16) since the right brand panel carries the brand on desktop.
- Replace the empty Apple span with the actual Apple icon import.

## Out of scope

- No auth logic changes (signIn/signUp/OAuth flows untouched).
- No new routes, no new dependencies.
- Email templates and post-auth pages unchanged.

## Files touched

- `src/pages/Auth.tsx` — only file edited.
