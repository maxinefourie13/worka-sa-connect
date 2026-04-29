## Goal

Wire up the early-access welcome email so every signup gets an instant, branded, on-voice confirmation in their inbox — different copy for Pros vs Clients. Then sanity-check the landing page is ready to go public.

## What gets built

### 1. Two React Email templates

**`early-access-pro.tsx`** — sent when `role = 'pro'`
- Subject: "You're on the list, ous — your free month is locked in"
- Preview text: "First dibs when Sjoh opens its doors"
- Body covers:
  - Welkom — you're officially on the Founding Pros list
  - The three perks they get (extra free month, Founding Pro badge, first-in-line for vetting)
  - What happens next ("we'll holla when the doors open, no spam in between")
  - Soft sign-off from the Sjoh team

**`early-access-customer.tsx`** — sent when `role = 'customer'`
- Subject: "You're on the Sjoh list — first dibs incoming"
- Preview text: "No more WhatsApp mampara hunts"
- Body covers:
  - You're in — first to know when we launch
  - What Sjoh actually does for them (post a job with your budget, get vetted pros, no commission games)
  - What happens next
  - Soft sign-off

Both templates:
- White background, coral (#e8665a) accents and CTA, Plus Jakarta Sans → Arial fallback
- Sjoh wordmark at the top
- Sjoh SA copy voice (per `mem://design/sjoh-copy-voice`)
- System auto-appends the unsubscribe footer (don't add one manually)

### 2. Wire the trigger

In `src/pages/ComingSoon.tsx`, after the successful insert into `early_access_signups`:
- Call `supabase.functions.invoke('send-transactional-email', ...)` 
- Pick the template based on the `role` field
- Use `idempotencyKey: early-access-{signup-id}` so retries are safe

### 3. Build the unsubscribe page

Create `/email-unsubscribe` page (path may already exist as a placeholder — wire it up properly):
- Reads `token` from URL
- Validates against `handle-email-unsubscribe` edge function
- Shows branded "Confirm unsubscribe" button
- Confirmation state after they click

### 4. Register templates + deploy

- Add both templates to `registry.ts`
- Deploy edge functions (auto)

### 5. Landing-page launch checks

- Check publish visibility is set to `public` (not workspace-only)
- Verify the signup form shows a clear success state after submit
- Quick once-over of the landing page on mobile viewport

## What's NOT in this plan (deliberately)

- Branded auth email templates — no one's logging in yet
- Job-posted / bid-received / trial-lifecycle emails — post-launch features
- Marketing blasts / drip sequences — you'll handle those manually via CSV exports
- Admin signups page — Cloud export is fine until volume justifies it

## Files that will change

**New:**
- `supabase/functions/_shared/transactional-email-templates/early-access-pro.tsx`
- `supabase/functions/_shared/transactional-email-templates/early-access-customer.tsx`
- `supabase/functions/_shared/transactional-email-templates/registry.ts` (if not yet scaffolded)
- `supabase/functions/send-transactional-email/index.ts` + siblings (scaffolded automatically)

**Edited:**
- `src/pages/ComingSoon.tsx` — add the `functions.invoke` after successful insert
- `src/pages/EmailUnsubscribe.tsx` — wire up to the unsubscribe edge function
- `src/App.tsx` — confirm `/email-unsubscribe` route exists

## After this, you're clear to publish

Once the welcome emails are live and tested with one real signup (your own email), we hit publish, point sjoh.co.za at the landing page, and start teasing.

## One thing to confirm before I build

Voice check on the Pro subject line — I went with **"You're on the list, ous — your free month is locked in"**. Two alternatives if you want a different vibe:
- More chilled: **"Lekker, you're in — your free month is sorted"**
- More urgent: **"Founding Pro spot locked in — here's what you get"**

If you don't pick, I'll go with the first one.
