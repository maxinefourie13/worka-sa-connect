# Founding-member free proposals

## What we're building

Give founding-member pros (those with `early_access_signups.claimed_founding_spot = true`) **one free proposal per calendar month** — usable even when they're on Basic/trial and even when their business isn't verified. Once their monthly free credit is spent, they need Ready for Work to apply again. The credit auto-resets on the 1st of each month.

This solves the launch chicken-and-egg: every job that gets posted in the early days will have at least a few hundred founding-member pros who *can* respond, instead of an empty inbox killing the marketplace before it warms up.

## How it works for the user

**Eligible pros (founding members on Basic / trial / no plan):**
- Dashboard shows a small badge: *"Founding member · 1 free proposal this month"*
- When they hit "Apply" on a job, it works — no paywall, no upgrade nag.
- After they apply, the badge updates: *"Free proposal used · resets 1 December"*
- If they try to apply again that month, they see: *"You've used your founding-member proposal for this month. Upgrade to Ready for Work to apply to as many jobs as you like — R250/mo."*

**Already-Verified Pros:** unchanged. Unlimited proposals, no counter shown.

**Non-founding pros on Basic / trial:** unchanged. Must upgrade to Ready for Work to apply.

## Technical details

### Schema (one migration)

Add to `provider_balances`:
- `founding_proposals_used_this_month` (int, default 0)
- `founding_proposals_period_start` (timestamptz, default `date_trunc('month', now())`)

Add a helper function:
- `is_founding_member(_user_id uuid) returns boolean` — joins `auth.users.email` to `early_access_signups.email` where `claimed_founding_spot = true` and `role = 'pro'`.
- `can_use_founding_proposal(_user_id uuid) returns boolean` — true if founding member AND (period_start is current month → used < 1) OR (period_start is older month → counts as fresh).

### `submit_proposal` rpc — relax the gate

Current logic: rejects unless `has_verified_pro_access(auth.uid())` AND `is_verified` on the business.

New logic, in order:
1. If `has_verified_pro_access(auth.uid())` → allow (unchanged path, unlimited).
2. Else if `can_use_founding_proposal(auth.uid())` → allow, then atomically:
   - If `founding_proposals_period_start < date_trunc('month', now())`: reset counter to 1, bump period_start to current month.
   - Else: increment `founding_proposals_used_this_month` by 1.
   - Drop the `is_verified` requirement on this path.
3. Else: raise the existing "Only Ready for Work subscribers can apply" error, with copy updated to mention founding-member perk if they're not yet a founding member.

### Frontend

- **`useProviderAccess` hook** — add `foundingProposalAvailable: boolean`, `foundingProposalsResetAt: Date | null`, `isFoundingMember: boolean`.
- **`ApplyButton.tsx`** — if `!hasVerifiedProAccess && foundingProposalAvailable`, show the button enabled with a small label "Founding member · free this month". Confirm dialog warns it'll use their monthly free proposal.
- **Dashboard** — new tile under the subscription panel for founding members showing credit status + reset date.
- **Pricing page** — add a small line under the On the Map card: *"Founding members get 1 free proposal a month — our thank-you for showing up early."*
- **Memory** — update `mem://features/pricing-model` with the new perk.

### Edge cases

- Founding member upgrades to Ready for Work → counter becomes irrelevant (Ready path bypasses it).
- Founding member downgrades / lapses → counter resumes from where it was that month.
- Month rollover happens lazily on next attempt — no cron needed. The check inside `submit_proposal` resets if `period_start < date_trunc('month', now())`.
- Existing Verified Pros who are also founding members: never see the counter, just keep applying freely.

## Out of scope

- Per-month allocation > 1 (we picked 1 deliberately to nudge upgrades).
- Free credits for non-founding pros.
- Refunding a free proposal if a job gets cancelled by the client.
