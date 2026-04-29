## What you're asking for

1. **Two CSV exports** — one for Pros, one for Clients — pulled from the `early_access_signups` table, so you can do bulk launch/marketing blasts manually from your own tool (Gmail, Mailchimp free, whatever).
2. **One transactional email per signup** — sent automatically via Lovable Emails the moment someone joins the list. No follow-ups, no drip, no marketing — just one "you're on the list" confirmation.

That keeps you fully on the right side of the transactional/marketing line: Lovable handles the 1:1 confirmation, you handle the bulk blasts yourself.

## Part 1 — CSV exports (Pro + Client)

You actually have two options here. I'll ask you which after the plan is approved, but here's both:

**Option A — Self-serve from Cloud (zero code, easy)**
You go to Cloud → Database → `early_access_signups`, filter by `role = 'pro'`, hit Export CSV. Repeat with `role = 'customer'`. Done. Takes 30 seconds whenever you want fresh data.

**Option B — In-app admin page at `/admin/signups`**
A protected page (only your admin user can see it) with two big "Download Pros CSV" / "Download Clients CSV" buttons. Click → CSV downloads to your machine. Nicer if you'll be doing this often or from your phone.

Both pull from the same table — no data difference, just convenience. My recommendation: **start with A** since it's free and you already have it. We add B later if you find yourself doing it weekly.

## Part 2 — Single transactional email after signup

One email, sent immediately when someone submits the Coming Soon form. Different copy depending on whether they signed up as a Pro or a Client.

```text
User submits form
       │
       ▼
Insert row into early_access_signups
       │
       ▼
Call send-transactional-email
       │
       ▼
Recipient gets ONE email, in Sjoh voice, branded
       │
       ▼
Done. No further automated emails until you blast manually.
```

**Pro email** (subject: "You're on the list, ous — your free month is locked in")
- Lekker, you're in.
- Quick reminder of perks: extra free month, Founding Pro badge, first-in-line for vetting.
- "We'll holla when the doors open. In the meantime, no spam."

**Client email** (subject: "You're on the Sjoh list — first dibs incoming")
- You're on.
- Reminder: first dibs on vetted pros, post a job with your own budget, skip the WhatsApp mampara hunt.
- "We'll let you know the moment we go live."

Both emails:
- White background, Sjoh coral accents, Plus Jakarta Sans fallback to Arial
- Sjoh mascot/wordmark at the top
- SA voice ("lekker", "ous", "no mamparas")
- System auto-appends the unsubscribe footer (legally required, can't skip)

## What I need to set up

### Email infrastructure (one-time)
1. Set up an email sending domain (`notify.sjoh.co.za` or similar — you'll add a few DNS records at your domain registrar). The setup dialog walks you through it.
2. Set up the email infra (queues, suppression list, unsubscribe handling) — automated.
3. Scaffold the transactional email system — automated.

### Templates
4. Create two React Email templates in `supabase/functions/_shared/transactional-email-templates/`:
   - `early-access-pro.tsx`
   - `early-access-customer.tsx`
5. Register both in `registry.ts`.

### Wiring + unsubscribe page
6. In `ComingSoon.tsx`, after the successful insert, call `send-transactional-email` with the right template name based on `role`.
7. Create the `/email-unsubscribe` page so the unsubscribe link in emails lands on a branded Sjoh page.

### Deploy
8. Deploy the edge functions. DNS verification can finish in the background.

## What's NOT in this plan (deliberately)
- **No marketing/blast emails from Lovable** — you do those manually with the CSV.
- **No drip sequences, no "we miss you" emails** — those would be marketing and we wouldn't build them anyway.
- **No Brevo/Mailchimp integration** — you're handling the bulk side yourself.
- **No job-alert emails yet** — separate feature, post-launch.

## One thing to confirm before I build

**Sender domain choice.** I'll need to set up an email-sending subdomain. Recommended: `notify.sjoh.co.za` (the "From" address will display as `hey@sjoh.co.za` though, so it still looks clean to the recipient). You'll need to add ~4 DNS records at wherever your domain is registered. Setup takes ~5 minutes of your time + a few hours for DNS to propagate.

If you want a different subdomain (e.g. `mail.sjoh.co.za`), let me know when you approve.

## Files that will change

- **New**: `supabase/functions/_shared/transactional-email-templates/early-access-pro.tsx`
- **New**: `supabase/functions/_shared/transactional-email-templates/early-access-customer.tsx`
- **New**: `supabase/functions/_shared/transactional-email-templates/registry.ts`
- **New**: `supabase/functions/send-transactional-email/index.ts` (+ siblings) — scaffolded
- **New**: `src/pages/EmailUnsubscribe.tsx` — wait, this already exists. I'll wire it up properly to the new unsubscribe handler.
- **Edit**: `src/pages/ComingSoon.tsx` — add the `functions.invoke` call after successful insert
- **Edit**: `src/App.tsx` — confirm `/email-unsubscribe` route exists (it does)
