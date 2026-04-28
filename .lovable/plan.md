## What's changing

### 1. Honest consent copy (replace "one email when we launch")
Replace the small print under the form with copy that:
- Tells the user they're opting in to occasional promotional / launch updates from Sjoh
- Mentions they may get extra perks (e.g. more free Klaps / extra free days) for being on the list
- Keeps the SA voice ("no spam, just the goods")
- Stays one short line so the layout doesn't shift

Proposed copy (in Sjoh voice):
> "By signing up you're opting in to launch news and the occasional promo from Sjoh — and you'll get bonus perks (extra free days, more Klaps) for being on the list. Unsubscribe anytime."

Also update the success state ("You're on the list") to match the same expectation.

### 2. Email storage — what already exists (no code change)
Signups are already saved to the `early_access_signups` table in your backend with these fields:
- `email`
- `role` — either `pro` or `customer` (this is how Pros and Clients are kept separate)
- `source` — currently `coming-soon`
- `created_at`

You can view and export them at any time from **Cloud → Database → early_access_signups → Export**. Filter by `role` to get the two lists separately.

I'll also add a tiny tweak so the same email signing up as both a Pro and a Customer is allowed (right now the unique constraint is on email alone, so the second role gets silently swallowed). I'll change the uniqueness to `(email, role)` so each list is clean.

### 3. Email marketing integration — decision needed
Nothing is connected yet. Pick one of these and I'll wire it up in the next step (this plan does NOT include the integration yet — I want your call first):

| Option | What you get | Effort |
|---|---|---|
| **A. Database only (default)** | Export CSV from Cloud whenever you want to send a blast. Free. | None |
| **B. Mailchimp / Brevo / ConvertKit via webhook** | Each signup auto-syncs to a list/audience there, tagged `pro` or `customer`. You compose campaigns in their UI. | Small edge function + your API key |
| **C. Send emails directly from Sjoh** | Use Lovable's built-in email infra to send launch announcements from `notify@sjoh.co.za`. Needs a sender domain set up. | Medium |

I'll ask you to pick one in chat after you approve this plan. My recommendation: **B with Brevo** (free tier, generous limits, SA-friendly).

### 4. How to deploy to sjoh.co.za
Your custom domain is already connected to this project. To make this Coming Soon page live:
1. Click **Publish** in the top-right of the editor (desktop) or the **…** menu → Publish (mobile).
2. First time → click **Publish**. After that, every change needs **Update** in the same dialog to push live.
3. Within a minute, https://sjoh.co.za and https://www.sjoh.co.za will serve this page.

The route is already set up: `/` renders `ComingSoonPage`, and the old marketing home is moved to `/preview-home` so you can still preview it.

No code change needed for deployment — it's a one-click action you do yourself.

## Technical changes summary

- **`src/pages/ComingSoon.tsx`**: rewrite the consent line under the form + the success-state subline.
- **Database migration**: drop the unique constraint on `early_access_signups.email`, add unique constraint on `(email, role)`. Update the duplicate-handling in `onSubmit` accordingly (already handles `23505`, no logic change needed).

## Out of scope for this plan
- Wiring up Mailchimp/Brevo/etc. — waiting on your choice.
- Actually clicking Publish — that's on you.
