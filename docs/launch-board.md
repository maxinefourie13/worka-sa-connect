# Sjoh End-Of-Week Launch Board

Target launch window: Friday, 22 May 2026

Status key:
- `[DONE]` Ready enough for launch
- `[CHECKING]` Codex is verifying or fixing this
- `[YOU]` Needs Maxine or an external account
- `[BLOCKED]` Cannot launch this part until the blocker clears
- `[LATER]` Valuable, but not needed for first launch

## Launch Must-Haves

| Status | Area | What Good Looks Like | Owner |
| --- | --- | --- | --- |
| `[DONE]` | GitHub repo | Repo renamed to `sjoh`, latest code pushed to `main` | Codex |
| `[DONE]` | Local app health | Lint, build, and unit tests pass | Codex |
| `[DONE]` | Supabase project | New project is linked, migrations are applied, functions are deployed | Codex |
| `[BLOCKED]` | Supabase secrets | Live Paystack, OpenAI, email/notification keys are added to Supabase | Maxine + Codex |
| `[BLOCKED]` | Paystack | Paystack live account is verified and live keys/plans/webhook are configured | Maxine + Codex |
| `[BLOCKED]` | Production deploy | `sjoh.co.za` is redeployed with the new Supabase env vars | Maxine + Codex/Lovable |
| `[CHECKING]` | Customer journey | Customer can search, post a job, and receive quote/invoice emails | Codex |
| `[CHECKING]` | Business journey | Business can sign up, pay, create profile, verify ID, browse opportunities, quote, and invoice | Codex |
| `[CHECKING]` | Legal/trust copy | Privacy, terms, cancellation, ID-check language are present and clear | Codex |
| `[YOU]` | Support channel | Launch users can reach a real support email or WhatsApp when stuck | Maxine |

## Current Launch Blockers

1. `sjoh.co.za` is still serving the old Supabase project (`zwgjbffesalpiaaycbac`). The repo is updated, but production needs a fresh deploy with the new env vars.
2. The new Supabase project currently only has the built-in Supabase secrets plus `PUBLIC_SITE_URL`.
3. Paystack live secrets, plan codes, and webhook setup are still needed before paid business signup can be tested.
4. `OPENAI_API_KEY` is needed before the Sjoh ID Check can process ID uploads automatically.

## Launch Nice-To-Haves

| Status | Area | Decision |
| --- | --- | --- |
| `[LATER]` | PayFast | Add after launch if Paystack causes real conversion issues |
| `[LATER]` | Full Supabase hardening pass | Do after first launch unless an advisor warning is critical |
| `[LATER]` | Remotion homepage video | Keep out of launch-critical path until the content is final |
| `[LATER]` | Extra landing page variants | Use the current business pages first, then iterate from ad data |

## Step-By-Step Launch Flow

1. Verify the app is technically healthy locally.
2. Confirm Supabase is pointing at the real production project.
3. Confirm every required secret/env var exists in the right place.
4. Confirm Paystack live mode can create subscriptions and receive webhooks.
5. Redeploy `sjoh.co.za`.
6. Smoke-test the customer journey on production.
7. Smoke-test the business journey on production.
8. Fix only launch-blocking issues.
9. Start inviting the first businesses.
