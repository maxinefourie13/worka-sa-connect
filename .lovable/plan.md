## What's changing

Add **transactional notifications** so users actually hear about activity on the platform — the missing piece that makes a two-sided marketplace work. Two channels:

1. **Email** via Lovable Emails (built-in, no third-party API key needed) — for new-job and new-bid alerts.
2. **Web Push** via OneSignal — for instant "fresh graft" alerts to providers.

Plus one prerequisite fix: the bid flow currently only updates a local mock store (`klapStore`). Before we can email clients about new bids, we need to actually persist proposals to the `proposals` table in the database. That wiring is included.

---

## Recommendation: use Lovable Emails (built in) — not Resend

You mentioned "Resend/Mailtrap" — Lovable already has built-in email infrastructure that does the same job with no API keys, no third-party signup, no Mailgun/Resend account, and proper SA deliverability. You just need a sender domain configured (which we'll set up using your `sjoh.co.za` once it's live, or a Lovable-issued subdomain in the meantime). It includes:

- React Email templates (so we keep the Sjoh! voice consistent)
- Built-in suppression list (bounces auto-blocked)
- One-click unsubscribe + tracking
- Retry queue (a transient failure won't lose an email)

If you have a strong reason to use Resend specifically (e.g. you already pay for it), say so and I'll wire that instead. Otherwise the plan below uses Lovable Emails.

---

## Part 1 — Persist proposals to the database (prerequisite)

Currently `ProposalModal.handleSubmit()` only calls `klapJob()` (mock store). To send a notification email to the client, the bid needs to live in the `proposals` table so an edge function can read it and look up the client's email.

**Edits to `src/components/ProposalModal.tsx`:**
- After `klapJob()` succeeds, insert a row into `public.proposals` with `opportunity_id`, `business_id`, `provider_id` (= `auth.uid()`), `message` (= scope), `quote_amount` (= priceNum or null for "quote on inspection"), `klaps_spent` (= boost cost).
- Then invoke the new `notify-new-bid` edge function with the inserted proposal's id.
- Show the existing success state.

**Edits to `src/components/JobCard.tsx` / wherever `KlapButton` lives:**
- The KlapButton needs the actual `business_id` of the logged-in provider. Right now it uses the mock provider. We'll source it from a small new helper hook `useMyBusiness()` that fetches the first row from `businesses where owner_id = auth.uid()`.

---

## Part 2 — Email notifications

### Setup (once)

- Configure email sender domain (Lovable Emails infrastructure setup). If `sjoh.co.za` DNS isn't ready yet, we'll provision a Lovable subdomain so emails work immediately.
- Scaffold the `send-transactional-email` edge function + email queue + unsubscribe handling.

### Two new email templates (React Email .tsx, in Sjoh! voice)

1. **`new-job-in-area.tsx`** — sent to providers when a job in their category + city is posted.
   - Subject: `🔧 Fresh Graft! New {{categoryName}} job in {{city}}`
   - Body: job title, short description, budget, link to "Klap this job" (deep-link to `/opportunities/{id}` with auto-open proposal modal)
   - CTA button: "Go Klap it"
2. **`new-bid-on-job.tsx`** — sent to client when any provider bids on their job.
   - Subject: `Sharp! {{businessName}} just klapped your job`
   - Body: business name (+ verified badge if applicable), quote amount or "Quote on inspection", short pitch preview (first 120 chars), CTA "View the bid"
   - Link: `/opportunities/{id}` (where the client will see all bids — we'll need to add a basic bid-list view to that page; flagged below as a small follow-up)

Both templates pull brand colors from `src/index.css` so they look like the app.

### Two new edge functions

#### `notify-new-job` (triggered by client posting a job)
- Called from `PostOpportunity.tsx` immediately after the `opportunities` insert succeeds.
- Body: `{ opportunity_id }`.
- Logic:
  1. Verify caller JWT.
  2. Look up the opportunity (RLS allows owner read).
  3. Use service role to query `businesses` table: `where category_slug = opp.category_slug and lower(city) = lower(opp.city) and is_verified = true` (cap at 200 recipients per send to avoid abuse).
  4. For each business owner, look up their auth email (via `auth.admin.getUserById`).
  5. Check `provider_balances.email_alerts_optin` (new column, default true) before sending.
  6. Invoke `send-transactional-email` once per recipient with `templateName: 'new-job-in-area'`, `idempotencyKey: 'new-job-{opp_id}-{user_id}'`.
- Throttle: skip recipients who already received a "new-job" email in the last 60 seconds for the same opportunity (idempotency key handles that for free).

#### `notify-new-bid` (triggered by provider sending a proposal)
- Called from `ProposalModal.tsx` immediately after the `proposals` insert succeeds.
- Body: `{ proposal_id }`.
- Logic:
  1. Verify caller JWT.
  2. Service-role load proposal → opportunity → client_id.
  3. Look up client's auth email.
  4. Invoke `send-transactional-email` with `templateName: 'new-bid-on-job'`, `idempotencyKey: 'new-bid-{proposal_id}'`.

### Schema additions

Add nullable columns (one migration):
- `provider_balances.email_alerts_optin boolean default true`
- `provider_balances.push_alerts_optin boolean default false` (set true when user grants push permission)
- `provider_balances.onesignal_player_id text` (nullable; stores the OneSignal subscription ID per provider)

### Unsubscribe page
Required by Lovable's email system. New route `/email-preferences/unsubscribe` that posts the token to `handle-email-unsubscribe`. Branded in Sjoh! voice ("Aikona, you're unsubscribed. We'll respect that.").

### Provider settings UI
Small "Notifications" card in `Dashboard → Klaps & Verification` section with two toggles:
- "Email me when new jobs land in my area" → updates `email_alerts_optin`
- "Push notifications" → triggers OneSignal subscribe flow (see Part 3)

---

## Part 3 — Web Push via OneSignal

OneSignal is correct for SA — free up to 10k subscribers, works on Chrome/Edge/Firefox/Safari iOS 16.4+, no Apple Developer fee for the web SDK.

### Setup

You'll need to:
1. Sign up at `onesignal.com` (free).
2. Create a new app → choose **"Web Push"**.
3. Choose **"Typical Site"** and enter your published URL (e.g. `https://sjoh.co.za` or the Lovable preview URL for testing).
4. Skip the "Welcome notification" step (we'll handle our own copy).
5. From the OneSignal dashboard → Settings → Keys & IDs, copy:
   - **App ID** (UUID, public — safe in frontend)
   - **REST API Key** (secret — server-side only)
6. I'll save the App ID as `VITE_ONESIGNAL_APP_ID` (publishable) and the REST API Key as `ONESIGNAL_REST_API_KEY` secret.

### Frontend

- Add OneSignal Web SDK script to `index.html`:
  ```html
  <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
  ```
- New file `src/lib/push.ts` — tiny wrapper exposing:
  - `initOneSignal()` — called once on app mount with the `VITE_ONESIGNAL_APP_ID`.
  - `requestPushPermission()` — asks the browser, then on success captures the OneSignal `playerId` and saves it to `provider_balances.onesignal_player_id` via a new RPC `set_push_subscription(_player_id text)`.
  - `unsubscribePush()` — clears the player ID server-side.
- New button in **Dashboard** (Klaps & Verification section, replacing/augmenting the deleted "Urgent alerts" card from the previous task):
  - **"🔔 Enable Job Alerts"** — when off, opens the browser permission prompt.
  - When on, shows "✓ Job Alerts on — push to enable/disable".
- Initialise OneSignal in `App.tsx` so the SDK loads before the dashboard renders.

### Backend

- Update `notify-new-job` edge function to ALSO send push notifications:
  - For each matched provider with a `onesignal_player_id` AND `push_alerts_optin = true`, POST to OneSignal API:
    ```
    POST https://api.onesignal.com/notifications
    headers: Authorization: Key {ONESIGNAL_REST_API_KEY}
    body: {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: [playerId, ...],
      headings: { en: "🔥 Fresh Graft!" },
      contents: { en: "A {category} job was just posted in {city}. Klap it now!" },
      url: "https://sjoh.co.za/opportunities/{id}",
    }
    ```
  - Batch up to 2000 player IDs per request (OneSignal's limit).

### New RPC (migration)

```sql
create function set_push_subscription(_player_id text, _enabled boolean) ...
-- updates provider_balances.onesignal_player_id and push_alerts_optin
-- security definer, asserts auth.uid()
```

---

## Open questions

1. **Email frequency cap** — should a provider get an email for every single new job in their area, or batched (e.g. max 1 email/hour summarising all new jobs)? Per-job is simpler and matches your spec ("when a new job is posted") but could spam during busy hours. **My recommendation:** start per-job, add a simple "max 5 emails/day" hard cap per recipient, revisit after launch.
2. **City matching** — exact string match, or fuzzy? Right now jobs and businesses both store free-text `city` ("Sandton" vs "Sandton, JHB"). I'll do a `lower(trim())` exact match and document the limitation; we can add a city-normalization pass later.
3. **Bid email to client** — should it include the actual quote amount, or hide it until they click through ("see the bid")? **My recommendation:** show the amount inline — it's the most useful piece of info and gets opened more.
4. **Push notification icon** — OneSignal needs a 192x192 PNG. I'll use the Sjoh! logo from `public/` if there is one; otherwise use the placeholder.svg, and you can swap later.
5. **The bid-list view on `/opportunities/{id}`** — currently the client clicks the email link and lands on the opportunity detail page, but there's no UI yet to show incoming bids. Want me to add a basic "Bids received" section as part of this task, or scope that to a follow-up?

---

## Technical summary — files touched

**New files**
- `supabase/functions/notify-new-job/index.ts`
- `supabase/functions/notify-new-bid/index.ts`
- `supabase/functions/_shared/transactional-email-templates/new-job-in-area.tsx`
- `supabase/functions/_shared/transactional-email-templates/new-bid-on-job.tsx`
- `src/lib/push.ts`
- `src/hooks/useMyBusiness.tsx`
- `src/pages/EmailUnsubscribe.tsx` (route `/email-preferences/unsubscribe`)
- `supabase/migrations/<ts>_notification_prefs_and_push.sql`

**Edited**
- `src/App.tsx` — init OneSignal, register unsubscribe route
- `index.html` — OneSignal SDK script tag
- `src/components/ProposalModal.tsx` — persist proposal to DB + invoke `notify-new-bid`
- `src/components/KlapButton.tsx` — pass real business_id
- `src/pages/PostOpportunity.tsx` — invoke `notify-new-job` after insert
- `src/pages/Dashboard.tsx` — Notifications card with email + push toggles
- `.env` — `VITE_ONESIGNAL_APP_ID`

**Secrets needed (I'll request after plan approval)**
- `ONESIGNAL_REST_API_KEY` (server-side)
- `ONESIGNAL_APP_ID` (also stored as publishable `VITE_ONESIGNAL_APP_ID`)

**Auto-set up (no action from you)**
- Lovable email sender domain
- `send-transactional-email`, `handle-email-unsubscribe`, `handle-email-suppression`, `process-email-queue` edge functions
- pgmq queues, suppression table, unsubscribe tokens table

---

## What you'll need to do after I approve and build

1. Sign up at OneSignal, create the Web Push app, send me the App ID + REST API Key.
2. If `sjoh.co.za` DNS is ready, I'll trigger the email domain setup dialog so you can plug in the records. If not, I'll use a Lovable subdomain and we swap to your domain later.
3. Test by posting a fresh job from one account and watching another account receive both an email AND a push notification.
