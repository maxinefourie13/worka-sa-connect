# Two fixes for the landing + example profile

## 1. Landing page — let people pick their lane (Pro vs Customer)

Right now `EarlyAccessLanding.tsx` is one big "Claim your founding spot" form aimed at Pros. There's no signal for someone who's just looking for a service.

**What changes**

Above the signup card, add a short two-tile chooser:

```text
┌──────────────────────────┐  ┌──────────────────────────┐
│  I'm a Pro               │  │  I need a Pro            │
│  Get leads, no commission│  │  Find someone vetted     │
│  → Claim founding spot   │  │  → Browse the directory  │
└──────────────────────────┘  └──────────────────────────┘
```

- **"I'm a Pro"** (default selected, coral): keeps the existing signup card visible — this is the founding-member flow.
- **"I need a Pro"** (charcoal/outline): swaps the signup card for a customer card with copy like *"No signup needed. Browse vetted SA pros and contact them direct — no commission, no middleman."* and one big button → marks early access seen and routes to `/directory`. A small secondary line: *"Want pros to quote you? Post a request."* → `/requests/new`.

State is local to the page (`mode: "pro" | "customer"`), no DB or routing changes needed. Mascot, perks list, typewriter, footer all stay.

Mobile: tiles stack; chooser sits above the mascot+card block.

## 2. Example profile — "Send Quote" / contact buttons do nothing

`src/pages/ExampleProfile.tsx` currently renders `Reveal phone`, `WhatsApp`, `Email`, and `Follow` as `<Button disabled>`. There's no Send Quote button on this page specifically — but the disabled state is what reads as "nothing happens" when you click. Two-part fix:

- Replace the disabled buttons with **active CTAs** that route somewhere useful, since this page is a sales tool:
  - `Reveal phone` / `WhatsApp` / `Email` → all become a single primary button **"This is a sample — list your business to get real contacts"** linking to `/list`.
  - `Follow · 0` → becomes **"See real profiles →"** linking to `/directory`.
- Add a small caption under the contact block: *"On a real profile, customers tap Reveal to see your phone, email and WhatsApp — no middleman."* (keeps the educational tone, removes the dead-click frustration).

If the user actually meant the **Send Quote button on a real job card** (Opportunities / Directory) — that one already works for signed-in users (opens the proposal modal or a paywall dialog). If you've seen it silently fail there, tell me which page + whether you were signed in and I'll dig deeper before touching it.

## Files to edit

- `src/pages/EarlyAccessLanding.tsx` — add Pro/Customer mode chooser + customer card variant.
- `src/pages/ExampleProfile.tsx` — swap disabled buttons for active CTAs to `/list` and `/directory`, add caption.

No DB, edge function, or routing changes. No new dependencies.
