## Two-part plan

### Part 1 — Early Access landing: typewriter hero + founding-spots framing

File: `src/pages/EarlyAccessLanding.tsx`

**Hero typewriter line** (above the H1, replacing the static "🇿🇦 Now in early access" pill area). Reuses the existing `Typewriter` component, looping through SA-flavoured prompts:

- "Tired of hiring mamparas?"
- "Sick of ghost-quotes?"
- "Got skills to sell?"
- "Need leads, not lurkers?"
- "Done with no-shows?"
- "Ready to get found, boet?"

Rendered in coral, small caps-style label above the H1 — same visual language as the homepage hero typewriter.

**Headline stays**: "Find someone who can do it properly."
**Subheadline updated** to lead with the founding-member offer:

> South Africa's no-commission directory of vetted pros. We're letting in the **first 500 founding members** — claim a permanent **Founder badge** and an **extra month free** on top of the trial. **No card needed now.**

**Founding-spots banner**: drop in the existing `<FoundingSpotsBanner />` right under the subheadline so the live "X spots left" pill reinforces urgency.

**Signup card rewrites**:
- Card heading: change `"Pull in, boet."` → `"Claim your founding spot"`
- Card sub: `"500 founding members only. Founder badge + extra month free. No card now — just your details."`
- Submit button: `"Get early access →"` → `"Claim my founding spot →"`
- Add a tiny reassurance line under the button: `"No card. No commitment. We'll only nudge you when we open the doors."`

**Skip link copy** stays ("Just want to peek? Browse without signing up.").

---

### Part 2 — Make logo / banner / gallery optional in signup, nudge later

#### 2a. Signup wizard — `src/pages/ListBusiness.tsx`

In the Step 1 ("Profile") block:
- Add an `(optional)` tag and a friendly helper line above the Logo + Cover Image upload fields:

  > **Make it look the part — when you're ready.** Logo, cover and gallery are optional. You can add them anytime from your dashboard. **Don't have a logo yet? You can [find a pro](/services/branding-design) for that too. 😉**

- Update the `UploadField` component (or pass an `optional` prop) so each upload tile shows a small `Optional · recommended` chip and tweak the placeholder to: `"Click to upload — or skip for now"`.
- Step 1 already has no required validation on uploads, so no logic changes needed beyond copy + chips.

The Services field gets a similar tweak: helper text noting "You can refine this later from your dashboard."

#### 2b. Dashboard — soften the visibility warning + add a returning reminder

File: `src/components/ProfileVisibilityWarning.tsx`
- Currently this component **only** flags missing photo / short bio. Keep the existing hidden-from-search logic as-is (those two are genuinely required for the public view).
- New: extend the same component to also surface a **softer "incomplete profile" nudge** when the profile *is* visible but is missing nice-to-haves: no logo, no cover image, no gallery photos. Render this as a separate, friendlier card (not the red AlertTriangle one) — uses a `Sparkles` icon, coral accent, and copy:

  > **Want more leads? Polish your profile.**
  > A logo, cover photo and a few gallery shots make people 3× more likely to message you.
  > **No designer? [Find a pro on Sjoh →](/services/branding-design)**
  > Buttons: `[Add now]` → `/dashboard?section=profile`  ·  `[Remind me later]` (dismiss)

- Dismissal stored in `localStorage` as `sjoh_profile_polish_dismissed_at` (timestamp). The nudge re-appears after 7 days, so it acts as a recurring gentle reminder rather than a one-shot.

To check for missing assets it queries `businesses` for `image_url` (cover/logo proxy) and the count of rows in the gallery table the existing `BusinessGalleryCard` writes to (same source of truth).

#### 2c. Profile section CTA copy

In the Dashboard's `ProfileSection` (and `BusinessGalleryCard` heading area), replace any "required" framing on logo/cover/gallery uploads with the same "Optional — but worth it" copy and the "Don't have a logo? Find a pro." link.

---

### Technical notes

- `Typewriter` component already exists and supports the exact pattern needed — just pass `phrases`, `randomize`, and a small className.
- `FoundingSpotsBanner` already hides itself when zero/loading, so safe to drop in unconditionally.
- The "Find a pro" link points at `/services/branding-design` — that route is already handled by the programmatic category pages. If the slug doesn't resolve, we'll fall back to `/directory?category=branding-design`.
- No DB migrations or schema changes. No new tables. Pure UI/copy + a localStorage-backed dismissal timer for the polish nudge.
- No changes to auth, RLS, or storage buckets.

### Files touched

- `src/pages/EarlyAccessLanding.tsx` — hero typewriter, founding-spots framing, card copy.
- `src/pages/ListBusiness.tsx` — mark logo/cover/services as optional, add helper + "find a pro" link.
- `src/components/ProfileVisibilityWarning.tsx` — extend with a soft, recurring "polish your profile" nudge.
- `src/components/dashboard/BusinessGalleryCard.tsx` — minor copy tweak to reinforce optional + "find a pro" link (heading subtitle only).
