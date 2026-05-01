## Part 1 — Fix the 3 security findings

### A. Gallery storage policies reference the wrong `name` column
The `Owners can upload gallery files` and `Owners can delete gallery files` policies use unqualified `(storage.foldername(name))[1]` *inside* an `EXISTS (SELECT 1 FROM public.businesses b ...)` subquery. Postgres resolves `name` to `businesses.name` (the business's display name), not the storage object's path. So the check almost never matches correctly.

**Fix (migration):** Drop and recreate both policies, qualifying as `storage.objects.name`. We'll move the path check out of the EXISTS so it reads the outer row unambiguously:

```sql
drop policy if exists "Owners can upload gallery files" on storage.objects;
create policy "Owners can upload gallery files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'business-gallery'
    and exists (
      select 1 from public.businesses b
      where b.owner_id = auth.uid()
        and (storage.foldername(storage.objects.name))[1] = b.id::text
    )
  );
-- same shape for the delete policy
```

### B. Public exposure of `client_phone` / `client_email` on `opportunities`
The table is readable by anon (`Opportunities are viewable by everyone`). Earlier migrations already `REVOKE`d column-level SELECT on `client_phone, client_email, contact_preference` from anon/authenticated — but the scanner is right that this is fragile (the columns are still on a publicly-selectable table, and anything doing `select *` will fail).

**Fix (migration):**
1. Drop the public SELECT policy on `opportunities`.
2. Replace with: anon + authenticated can SELECT, but only via a public view `opportunities_public` that omits `client_phone`, `client_email`, `contact_preference`, `external_contact_url`. Owners and admins keep full row access via a separate policy.
3. Update the frontend (`useDirectory`, `Opportunities`, `LeadDetail`, etc.) to read from `opportunities_public` for list views; keep direct table reads only where the viewer is the owner / accepted pro (already gated through `get_revealed_contact` RPC).

This neutralises the finding and keeps the existing reveal RPC flow.

### C. Realtime subscription on `provider_balances` exposes other users' data
`provider_balances` is published to `supabase_realtime` (added in `20260430085320`). Anyone authenticated can `subscribe` to its topic and receive change events for any user's tier / billing / verification.

**Fix (migration):**
- Remove the table from the realtime publication: `ALTER PUBLICATION supabase_realtime DROP TABLE public.provider_balances;`
- The dashboard already polls / refetches via the regular query hook, so realtime isn't required here. If the user later wants realtime tier updates, we add `realtime.messages` RLS scoped to `auth.uid()`.

After applying the migration we'll mark all three findings as fixed.

---

## Part 2 — Reframe `/requests` as a two-tab "Get Quotes" page

Today `/requests` shows a list of customer requests (jobs other people posted). That's confusing for a customer who clicked "Get Quotes" expecting to find pros.

### New structure for `/requests` (customer-facing)

Two tabs at the top:

**Tab 1 — "Get an instant quote" (default)**
A how-it-works walkthrough + big CTA, no listings. Sections:
1. Hero: *"Tell us what you need. Pros come to you."*  CTA → `/requests/new`.
2. 3-step explainer card (icons + short copy):
   - **1. Tell us the job** — category, location, budget, photos.
   - **2. Vetted pros quote you** — usually within hours.
   - **3. Pick your pro** — chat direct, no commission, no middleman.
3. "What you'll need to send" mini-checklist (job title, description, suburb, when you need it, budget guide, optional photos) — sets expectations before they hit the form.
4. "What you get back" panel — *quotes from verified pros, free, no obligation*.
5. Pricing strip: *"Posting is free. Want it pushed to the top? Mark it Urgent — R50."*
6. Big primary CTA → "Post your request" (`/requests/new`).
7. Below: small "Recent requests on Sjoh" strip (3 cards) for social proof, with link to Tab 2.

**Tab 2 — "View our pros"**
Embeds the existing Directory listing (cards, filters: category, province, search, verified-only). Reuses the components used on `/directory` — no new fetching logic.

### Header / nav changes (`SiteHeader.tsx`)
- Rename nav item `"Get Quotes"` → keep label `"Get Quotes"` but it now lands on the new tabbed page.
- The pro-side `/leads` route stays as-is ("Send Quotes").

### Routing (`App.tsx`)
- `/requests` renders the new `RequestsHub` page (with tabs).
- `/leads` still renders the existing `Opportunities` component (pro view of customer requests — unchanged).
- Old direct deep-links to a single request (`/requests/:id`) keep working.

### Files to add / change
- **Add** `src/pages/RequestsHub.tsx` — the new tabbed page (uses shadcn `Tabs`).
- **Add** `src/components/requests/HowItWorksPanel.tsx` — the 3-step + checklist + CTA blocks, kept separate so we can reuse on the homepage if we want.
- **Edit** `src/App.tsx` — point `/requests` at `RequestsHub`; keep `/leads` → `Opportunities`.
- **Edit** `src/components/SiteHeader.tsx` — no label change needed; just confirm route.
- **Edit** `src/pages/Opportunities.tsx` — strip out the `!isProView` branch (no longer reached from `/requests`); becomes pro-only.
- **Edit** the data hook to read from the new `opportunities_public` view for the directory-style listings.

### Copy (Sjoh SA voice)
- Tab labels: **"Get an instant quote"** · **"View our pros"**
- Hero (Tab 1): *"Need someone who can do it properly? Tell us the job — vetted SA pros come back to you with quotes. No commission. No middleman."*
- Urgent strip: *"In a hurry? Mark it Urgent for R50 — your post jumps to the top of every pro's feed."*
- Free / vetted reassurance: *"It's free for you. Always."*

---

## Order of execution
1. Migration: gallery storage policies → opportunities public view → drop provider_balances from realtime publication.
2. Update the frontend hook to use `opportunities_public`.
3. Build `RequestsHub` + `HowItWorksPanel`, wire into routing.
4. Trim `Opportunities.tsx` to pro-only.
5. Mark the 3 security findings as fixed.