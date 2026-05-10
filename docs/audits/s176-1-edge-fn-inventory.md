# S176.1 — Edge Function Inventory

> **S210 Phase 1 update:** `notify-teams` and `zernio-webhook` were retired in PR following the S210 security audit. Their entries below describe historical state; both are no longer deployed and have no callers.

## Summary
- Total deployed functions: **27** (Supabase MCP `list_edge_functions`)
- Total source dirs in `supabase/functions/`: **28** (excluding `_shared/`)
- Deployed-no-source: **1** — `invite-salesperson` (entrypoint → `/tmp/`, no repo dir)
- Source-not-deployed: **1** — `api-quote`
- Stale temp function still deployed: **1** — `run-migration` (source: "Temporary — delete after use")
- Functions with zero `src/` callers (deployed): `api-quote`¹, `pagespeed-proxy`, `provision-tenant`², `publish-scheduled-posts`³, `run-migration`, `send-dunning-email`⁴, `send-onboarding-email`⁴, `send-welcome-email`⁴, `stripe-webhook`⁵, `zernio-webhook`⁶, `invite-salesperson`

¹ Source exists but never deployed  
² Called by `ironwood-provision` edge fn  
³ Called by pg_cron + possibly admin "Publish Now" — grep found 0 direct src/ hits  
⁴ Called by `stripe-webhook` edge fn  
⁵ Called by Stripe directly  
⁶ Called by Zernio directly

---

## Inventory table

| Name | Status | JWT (MCP) | Source in repo | src/ callers | Purpose |
|---|---|---|---|---|---|
| `api-quote` | — not deployed — | — | ✓ | 0 | Public headless quote form POST endpoint, CORS-open |
| `create-checkout-session` | ACTIVE | N | ✓ | 2 | Creates Stripe subscription checkout session |
| `invite-salesperson` | ACTIVE | Y | ✗ (/tmp) | 1 | Sends Supabase auth invite email to salesperson |
| `ironwood-provision` | ACTIVE | N† | ✓ | 1 | JWT-verified wrapper; calls provision-tenant, updates prospect |
| `ironwood-stripe-report` | ACTIVE | N† | ✓ | 1 | Returns Stripe MRR summary for Ironwood Reports tab |
| `notify-new-lead` | ACTIVE | N | ✓ | 2‡ | DB-webhook triggered; emails customer + owner on lead INSERT |
| `notify-support-ticket` | ACTIVE | N | ✓ | 1 | Emails itsupport@ on new support ticket |
| `notify-teams` | ACTIVE | N | ✓ | 2 | Posts message to Microsoft Teams webhook |
| `notify-upgrade` | ACTIVE | N | ✓ | 1 | Notifies Scott via Teams when client initiates upgrade |
| `package-claude-context` | ACTIVE | N | ✓ | 1 | Claude-powered prospect data packager; returns CLIENT_BRIEF.md |
| `pagespeed-proxy` | ACTIVE | N | ✓ | 0 | Proxies Google PageSpeed API (desktop+mobile) |
| `post-to-social` | ACTIVE | N | ✓ | 1 | Posts social content via Zernio API |
| `provision-tenant` | ACTIVE | N | ✓ | 0² | Creates tenant, auth user, profiles, all settings rows |
| `publish-scheduled-posts` | ACTIVE | N | ✓ | 0³ | pg_cron every 5 min; publishes scheduled social posts via Zernio |
| `run-migration` | ACTIVE | N | ✓ | 0 | Temp DDL runner — **should be deleted** |
| `scrape-prospect` | ACTIVE | N | ✓ | 1 | Firecrawl + Claude site scraper; saves to prospect.scraped_content |
| `send-credentials-email` | ACTIVE | N | ✓ | 1 | Sends admin login creds to client after reveal call |
| `send-dunning-email` | ACTIVE | N | ✓ | 0⁴ | Escalating dunning emails on Stripe invoice.payment_failed |
| `send-intake-confirmation` | ACTIVE | N | ✓ | 1 | Confirms intake form submission to prospect |
| `send-intake-email` | ACTIVE | N⚠ | ✓ | 1 | Sends intake form invite link to prospect |
| `send-marketing-lead` | ACTIVE | N | ✓ | 1 | SMS + email on pestflowpro.com marketing contact form |
| `send-onboarding-email` | ACTIVE | Y⚠ | ✓ | 0⁴ | Client welcome or Scott setup-notification email (two modes) |
| `send-reveal-ready` | ACTIVE | N | ✓ | 1 | Emails client when Scott marks site reveal-ready |
| `send-review-request` | ACTIVE | N | ✓ | 2 | Review request email when lead won or from testimonials |
| `send-sms` | ACTIVE | N | ✓ | 2 | Textbelt SMS proxy (key never exposed to browser) |
| `send-welcome-email` | ACTIVE | N | ✓ | 0⁴ | Post-payment welcome email ("site is being built") |
| `stripe-webhook` | ACTIVE | N | ✓ | 0⁵ | Handles checkout.session.completed, payment_succeeded, sub.deleted |
| `zernio-connect` | ACTIVE | N | ✓ | 1 | Zernio OAuth connect URL + account sync |
| `zernio-webhook` | ACTIVE | N | ✓ | 0⁶ | Handles Zernio post.published/failed, account.connected events |

† `verify_jwt = false` in Supabase but function performs manual JWT check in source code  
‡ Both callers are `src/shells/dang/` — legacy Vite SPA Dang shell only  
⚠ JWT mismatch — see Anomalies

---

## Caller details (non-zero, key ones)

### `create-checkout-session`
- Callers: `src/components/admin/BillingTab.tsx`, `src/components/admin/client-setup/ClientSetupPayment.tsx`

### `ironwood-provision`
- Caller: `src/components/ironwood/ProspectDetail.Provisioning.tsx`

### `notify-new-lead`
- Callers: `src/shells/dang/pages/ContactPage.tsx`, `src/shells/dang/pages/QuotePage.tsx`
- Note: both callers are in the Dang-specific shell — this function is only invoked from Dang's legacy pages, not the main public shell

### `send-sms`
- Callers: `src/pages/ContactPage.tsx`, `src/pages/QuotePage.tsx`

### `send-review-request`
- Callers: `src/components/admin/TestimonialsTab.tsx`, `src/components/admin/CRMTab.tsx`

---

## Anomalies / flags

1. **`invite-salesperson` — deployed with no source dir.** Entrypoint is `/tmp/user_fn_...`. Source was never committed to the repo. If re-deployment is ever needed, the source must be reconstructed from scratch. Caller: `src/components/ironwood/TeamTab.tsx`.

2. **`run-migration` — stale temp function, still ACTIVE.** Source header says "Temporary migration runner — delete after use" (`supabase/functions/run-migration/index.ts:1`). It is deployed, has no callers, and the migration body inside is a no-op (`await sql.end()` immediately). Should be deleted from Supabase.

3. **`send-intake-email` JWT mismatch.** Source comment: "JWT-protected — caller must be an authenticated Ironwood user" (`supabase/functions/send-intake-email/index.ts:3`). MCP shows `verify_jwt: false`. The function does manual JWT verification in source (`index.ts:~26`), same pattern as ironwood-provision. Deliberate or oversight — needs Scott's confirmation.

4. **`send-onboarding-email` JWT mismatch (opposite direction).** MCP shows `verify_jwt: true`. Source is triggered by `stripe-webhook` (another edge fn), which would need to call it without a user JWT. May cause silent failures if stripe-webhook does not pass a service-role token. Needs testing.

5. **`api-quote` — source exists, never deployed.** Intended as a public CORS-open quote form endpoint for embedding on external sites. If clients ask for embeddable forms this is already written. No callers anywhere in `src/`.

6. **Five functions with `/tmp/` entrypoints** (not in current workspace path): `send-review-request`, `ironwood-provision`, `send-intake-email`, `scrape-prospect`, `package-claude-context`. These were deployed from a different context and are running older versions than what's in the repo. Re-deploy each to sync.

7. **`pagespeed-proxy` — zero callers.** May have been used in an admin SEO tab that was removed. Confirm before deleting.

---

## Open questions for Scott

1. **`invite-salesperson`** — is the source recoverable? If you ever re-deploy it (e.g. to fix a bug), there is no source file to work from.
2. **`run-migration`** — safe to delete from Supabase? Source says it should have been cleaned up after use.
3. **`send-onboarding-email` verify_jwt: true** — does the stripe-webhook flow currently pass a JWT when calling this? If not, post-payment welcome emails may be silently failing.
4. **`pagespeed-proxy`** — still used anywhere? No src/ callers found.
5. **`api-quote`** — should this be deployed? It's built and ready but never deployed.
