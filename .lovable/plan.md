## What's changing

The current `EarlyAccessLanding` (the new white sign-up page I built earlier) becomes a **charcoal pre-launch + cookie consent page** that matches the look & feel of the old "Coming Soon" — same dog mascot, same charcoal radial gradient, same white Sjoh logo, same typewriter headline pattern. The signup form goes away. Three cookie buttons drive dismissal.

Note: the original `ComingSoon.tsx` file was deleted on Apr 30 when you swapped the real homepage to `/`, so I'm rebuilding the look on the existing gate page rather than restoring a deleted file.

## Page design

```text
┌──────────────────────────────────────────────────────────┐
│  [sjoh logo]                              [PRE-LAUNCH]   │
│                                                           │
│  ┌────────────┐    In the mood for a rusk?               │
│  │            │    ☕                                     │
│  │   🐶       │                                           │
│  │  mascot    │    Sjoh! We use digital cookies to make  │
│  │            │    sure the site doesn't act like a      │
│  │            │    mampara. They help us remember your   │
│  └────────────┘    city and keep your account secure—    │
│                    no crumbs, no mess. We promise we     │
│                    aren't here to sell your info to your │
│                    nosy neighbour. Is it a "go" for      │
│                    the rusks?                            │
│                                                           │
│                    [Shot, dunk away ☕]                  │
│                    [Just the essentials]                 │
│                    [No rusks for me]                     │
│                                                           │
│                    Terms · Privacy                       │
└──────────────────────────────────────────────────────────┘
```

- **Background:** charcoal radial gradient (matching the old Coming Soon) with a faint coral vignette at the top.
- **Mascot:** `src/assets/sjoh-mascot.png` (still in the project), large on desktop, scales down on mobile.
- **Logo:** `src/assets/sjoh-logo-white.png` top-left.
- **Headline:** uses the existing `Typewriter` component cycling through 3–4 short rusk-themed phrases ("In the mood for a rusk?", "Tea's brewing, boet.", "Pull up a chair.", "Just one quick chat."). Reserves wrapped space so layout doesn't jump (same trick the old page used).
- **Body copy:** exactly your text.
- **Buttons:** three options — coral primary "Shot, dunk away ☕" (Accept All), white outline "Just the essentials" (Necessary Only), ghost "No rusks for me" (Decline).

## Behaviour (soft gate — your pick)

- Any non-authed first-time visitor lands here regardless of the URL they tried.
- Picking **any** of the three buttons records the choice in `localStorage.sjoh_cookie_consent` (`all` / `essential` / `decline`) **and** marks the gate as seen, then routes them to the homepage. Subsequent visits skip the gate.
- Signed-in users still bypass the gate entirely.
- Bypass routes already in place stay (auth, terms, privacy, /quote/*, /unsubscribe, /admin) — we keep `/terms` and `/privacy` reachable so the footer links work even from the gate.
- The gating wrapper (`EarlyAccessGate`) and bypass list don't change — only the page itself is reskinned.

## Files

- **Edit** `src/pages/EarlyAccessLanding.tsx` — replace its contents with the cookie-themed page (no sign-up form, three cookie buttons, charcoal gradient, mascot, typewriter, your copy).
- No other files change. The gate wrapper, routing, signup table, and bypass list stay as-is.

## What you don't get with this

- No sign-up form on the gate. If you want capture before they enter the site, that's a different design (the previous one I built had it, and you said no).
- No persistent cookie banner on the rest of the site after dismissal. If you want a small "manage cookies" link in the footer later, easy follow-up.
