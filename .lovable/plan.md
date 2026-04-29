Two quick fixes plus a bigger feature decision to make.

## 1. Fix the sender name (the "worka-sa-connect" issue)

`supabase/functions/send-transactional-email/index.ts` line 8 still has:
```
const SITE_NAME = "worka-sa-connect"
```

That's what's showing up in the From header (`worka-sa-connect <noreply@notify.sjoh.co.za>`). It was baked in at scaffold time before the rebrand.

**Change:** set `SITE_NAME = "Sjoh"` and redeploy `send-transactional-email`. From line will then read `Sjoh <noreply@notify.sjoh.co.za>`. Display name in inboxes becomes "Sjoh".

## 2. Update the customer email closing copy

In `early-access-customer.tsx`, replace the two paragraphs around lines 49–61 with the exact words you sent:

> Tired of guessing who to hire?
> We built Sjoh to fix that.
> No mamparas. No half-jobs. Just people who actually deliver.

Keep the "What happens next?" heading above it, keep the sign-off and footer below it. Then redeploy.

## 3. Early profile setup for founding members — the bigger question

Right now `early_access_signups` only stores email + role + founding-spot flag. To let founding pros pre-build their profiles before launch, we'd need to do one of these:

**Option A — Magic-link onboarding (recommended)**
After they claim their founding spot, send them a second email with a unique link like `/founding-setup?token=xxx`. That link drops them into a stripped-down version of `ListBusiness.tsx` (basics → profile → photos), saves to a new `pending_businesses` table, and they're ready to be flipped live on launch day. No password required yet.

- Pros: directory has real listings on day one, pros feel invested before launch, you can showcase real businesses in marketing
- Cons: 2-3 days of work (new table, token system, stripped onboarding flow, new email template, admin "promote to live" tool)

**Option B — Just open auth + onboarding now**
Let founding members sign up properly (email + password), build a real business profile, and mark it as `pre_launch` so it doesn't show in the public directory until launch day. Uses your existing `ListBusiness.tsx` flow.

- Pros: reuses existing code, less work (~half a day)
- Cons: requires opening auth on the live site; means juggling two states (coming-soon page + working signup); risk of confusion ("am I live or not?")

**Option C — Manual intake**
Reply to founding signups personally, collect their info over WhatsApp/email, you (or an assistant) populate the directory. Works fine for the first 50–100.

- Pros: zero engineering, highest-touch onboarding, you learn what pros actually struggle with
- Cons: doesn't scale past ~100, your time

**Option D — Skip it for now**
Ship the email fixes, launch the teaser, build the founding-onboarding flow in a fresh chat once signups start coming in.

## Files I'd touch in this loop

If you pick "just the email fixes":
- `supabase/functions/send-transactional-email/index.ts` (one line)
- `supabase/functions/_shared/transactional-email-templates/early-access-customer.tsx` (closing paragraphs)
- Redeploy `send-transactional-email`

The profile pre-setup work would be a separate plan once you pick A/B/C/D.

## What I need from you

1. Confirm the email fixes (sender name + new closing copy) — I'll do these now
2. Pick A, B, C, or D for the founding-member profile setup
