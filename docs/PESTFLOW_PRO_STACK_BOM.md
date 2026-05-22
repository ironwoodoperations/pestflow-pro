# PestFlow Pro / HomeFlow Pro — Stack Bill of Materials

> **Purpose:** The single canonical list of every service, subscription, API, secret store, and external dependency used to build and operate PestFlow Pro under the HomeFlow Pro umbrella. Use this as the master reference when:
>
> - Rotating credentials or auditing the secret surface
> - Spinning up a new vertical (PoolFlow Pro, HVACFlow Pro, LawnFlow Pro, RoofFlow Pro, TrailerFlow Pro)
> - Onboarding a new customer (see `CUSTOMER_ONBOARDING_PROMPT.md` for the operational checklist)
> - Building a monthly cost report
> - Renewing or canceling any service
>
> **Destination in repo:** `docs/PESTFLOW_PRO_STACK_BOM.md`
> **Last updated:** S236 (2026-05-21)
> **Maintained by:** Scott (Ironwood Operations Group LLC) — update after every stack change, service add, or service remove.

---

## ENTITY STRUCTURE (legal & financial)

| Item | Detail |
|---|---|
| Master entity | **Ironwood Operations Group LLC** — Texas Series LLC |
| Series structure | One internal series per vertical, each with own EIN, bank account, series designation doc |
| Active series | **Series A** — PestFlow Pro |
| Contract signing format | "Ironwood Operations Group LLC, Series A" |
| Pending series | PoolFlow Pro, HVACFlow Pro, LawnFlow Pro, RoofFlow Pro, TrailerFlow Pro (under HomeFlow Pro umbrella) |
| State of formation | Texas |

---

## 1. HOSTING & INFRASTRUCTURE

| Service | Plan | ~Monthly Cost | What It Does | Credentials Location | Notes |
|---|---|---|---|---|---|
| **Vercel** | Pro | $20/seat | Hosts Next.js shells + Vite SPA admin | Doppler (`pestflow-pro/prd`); team `team_qrUo7nyDaoioD69goEZfvhMu` | Separate project per standalone customer site (e.g., `dangpestcontrol`). Slug: `pestflow-pro`. |
| **Supabase** | Pro | $25 | Postgres DB, Auth, Storage, Edge Functions (Deno), `pg_cron`, `pg_net`, Realtime | Edge Function Secrets (dashboard-only) + `vault.secrets` (SQL-accessible) | Project `biezzykcgzkrwdgqpsar`. Two secret stores — never conflate. |
| **Google Cloud Platform** | Pay-as-you-go | <$5 | PageSpeed Insights API (only API actively in use) | API keys in Supabase Edge Function Secrets (`PAGESPEED_API_KEY`) + GCP console | Project `pestflow-pro-prod` under `homeflowpro.ai` Cloud Organization. Migrated in S223. |

---

## 2. DNS & DOMAIN REGISTRATION

| Service | Plan | ~Annual Cost | What It Does | Credentials Location | Notes |
|---|---|---|---|---|---|
| **GoDaddy** | Standard | ~$20/domain | Domain registrar + DNS for all owned domains | 1Password | DNS records also editable here. |

### Owned domains

| Domain | Purpose | Status |
|---|---|---|
| `pestflowpro.ai` | PFP canonical | LIVE |
| `pestflowpro.com` | 301-redirects to `.ai` | LIVE |
| `homeflowpro.ai` | Umbrella brand (future) | LIVE (parked) |
| `dangpestcontrol.com` | Dang customer site (standalone) | LIVE |
| `poolflowpro.ai` | Future vertical | OWNED (parked) |
| `hvacflowpro.ai` | Future vertical | OWNED (parked) |
| `lawnflowpro.ai` | Future vertical | OWNED (parked) |
| `roofflowpro.ai` | Future vertical | OWNED (parked) |
| `trailerflowpro.ai` | Future vertical | OWNED (parked) — per memory: `trailerflow-pro-domain` on horizon |

---

## 3. SECRETS MANAGEMENT

| Service | Plan | ~Monthly Cost | What It Stores | Access Method | Notes |
|---|---|---|---|---|---|
| **Doppler** | Team | ~$10/seat | Vercel env vars (`VITE_*`, `NEXT_PUBLIC_*`, build-time secrets) | Doppler dashboard + Vercel integration | Per-environment configs: `pestflow-pro/dev`, `pestflow-pro/stg`, `pestflow-pro/prd`. |
| **Supabase Edge Function Secrets** | Included w/ Supabase | $0 | Server-side secrets read via `Deno.env.get()` | Dashboard → Project Settings → Edge Functions → Secrets (NOT settable via MCP) | Separate store from `vault.secrets`. |
| **Supabase Vault** (`vault.secrets`) | Included w/ Supabase | $0 | SQL-accessible secrets (e.g., `supabase_service_role_key`, `provision_tenant_internal_secret`) | `SELECT name FROM vault.secrets` or `vault.decrypted_secrets` | For DB-triggered logic. Always verify via SQL before drafting rotation plans. |
| **1Password** | Business | ~$8/seat | Master credential vault for all human-accessible credentials (logins, API keys, recovery codes) | 1Password desktop/mobile | Final source of truth for Scott's personal-access logins. |

---

## 4. PAYMENTS

| Service | Plan | ~Monthly Cost | What It Does | Credentials Location | Notes |
|---|---|---|---|---|---|
| **Stripe** | Standard (per-transaction) | 2.9% + 30¢ | Customer invoicing, setup fee + monthly subscription | Doppler + Stripe dashboard | Manual invoice flow via `PaymentLinkPanel.tsx`. Webhook auto-provision **abandoned per S217**. |

---

## 5. EMAIL

| Service | Plan | ~Monthly Cost | What It Does | Credentials Location | Notes |
|---|---|---|---|---|---|
| **Resend** | Pro | ~$20 | Transactional email sending | Supabase Edge Function Secrets (`RESEND_API_KEY`) | Sending domain `pestflow.ai`. DKIM/SPF verified. Used by `send-credentials-email`, `send-intake-email`, `notify-new-lead`, monthly reports. |

---

## 6. SMS

| Service | Plan | ~Monthly Cost | What It Does | Credentials Location | Notes |
|---|---|---|---|---|---|
| **Textbelt** | Pay-as-you-go | ~$0.05/SMS | Outbound SMS notifications | Supabase Edge Function Secrets (`TEXTBELT_API_KEY`) | Quiet-hours gate live (S199) via `send-sms@v31+` and `process-sms-queue@v1` cron. 10DLC/Twilio migration on horizon (memory: `textbelt-10dlc-twilio`). |

---

## 7. SOCIAL MEDIA

| Service | Plan | ~Monthly Cost | What It Does | Credentials Location | Notes |
|---|---|---|---|---|---|
| **Zernio** | Team | ~$50 | OAuth aggregator for Facebook Pages, Instagram Business, Google Business Profile posting | Per-tenant OAuth tokens stored by Zernio; Zernio account in 1Password | **Only social aggregator in stack.** Replaced Buffer, Ayrshare, bundle.social. Wired into admin Social tab. Used by `post-to-social` v38+, `publish-scheduled-posts` v42+. |

---

## 8. SEO & ANALYTICS

| Service | Plan | ~Monthly Cost | What It Does | Credentials Location | Notes |
|---|---|---|---|---|---|
| **Google PageSpeed Insights API** | Free (rate-limited) | $0 | Desktop + Mobile performance scores | Supabase Edge Function Secrets (`PAGESPEED_API_KEY`) under GCP project `pestflow-pro-prod` | Used by `pagespeed-proxy` edge fn → Reports tab tile. Rotated S224. |
| **Google Business Profile** | Free | $0 | Customer business listings (claimed by each customer) | Per-tenant via Zernio OAuth | Used for GBP posting + insights. |
| **Outscraper** | Pay-as-you-go | ~$10-50 depending on volume | Automated Google review scraping/sync | Supabase Edge Function Secrets (`OUTSCRAPER_API_KEY`) | Wired in S235. Per-tenant config: `settings.integrations.google_business_id`. |
| **Google Analytics 4** | Free | $0 | Site traffic analytics | Tenant-scoped tracking IDs (planned) | Currently on backlog (memory: `ga4-shell-tracking`). Not yet wired. |

---

## 9. AI SERVICES

| Service | Plan | ~Monthly Cost | What It Does | Credentials Location | Notes |
|---|---|---|---|---|---|
| **Anthropic API** | Pay-as-you-go | ~$50-200 depending on usage | In-app AI (keyword research, SEO meta gen, social captions, monthly reports) | Supabase Edge Function Secrets (`ANTHROPIC_API_KEY`) | Model: `claude-sonnet-4-6` (per locked convention). Used across multiple edge fns. |
| **Firecrawl** | Standard | ~$20 | Web scraping for prospect pipeline (internal Scott-facing only) | Supabase Edge Function Secrets (`FIRECRAWL_API_KEY`) | Used by `scrape-prospect` edge fn. Not customer-facing. |

---

## 10. DEVELOPMENT & OPERATIONS

| Service | Plan | ~Monthly Cost | What It Does | Credentials Location | Notes |
|---|---|---|---|---|---|
| **GitHub** | Team | ~$4/seat | Repository hosting, PR workflow, CI/CD | 1Password | Primary repo: `pestflow-pro`. Standalone: `dang-pest-control`. |
| **GitHub Codespaces** | Pay-as-you-go | ~$0.18/hr | Cloud dev environment | GitHub auth | Used by Scott + CC Web for editor sessions. Known to die mid-session — restart or MCP-bypass. |
| **Claude.ai** | Pro/Max (Scott's account) | $20-100 | Orchestration, planning, audits, MCP operations | claude.ai login (1Password) | Manages Supabase MCP + Vercel MCP. |
| **Claude Code (CC Web)** | Included w/ Claude.ai | $0 | Implementation execution via web | claude.ai login | Runs `/office-hours`, `/investigate`, `/qa`, `/review`, `/ship`. Writes per-PR REVIEW + QA_REPORT files. |
| **Microsoft Power Automate** | Pay-as-you-go | minimal | Teams webhook for notifications | Power Automate dashboard | Replaced Zapier (memory). |

---

## 10a. CUSTOMER MIGRATION TOOLING

For customer-site discovery, SEO migration, and content extraction. See `CUSTOMER_SITE_DISCOVERY_PROMPT.md` for the full operational workflow.

| Service | Plan | ~Cost | What It Does | Credentials Location | Notes |
|---|---|---|---|---|---|
| **Screaming Frog SEO Spider** | Pro (recommended) or Free | £259/yr (~$330) or free up to 500 URLs | SEO crawl of customer's existing site — URLs, titles, metas, H1s, alt text, status codes, redirect chains, sitemap diff | License key in 1Password | Desktop app. Required for any migration customer with >500 pages or JS-rendered site. |
| **Google Search Console** | Free | $0 | Pull historical query/page performance from customer's site (last 16 months) to identify ranking pages to protect | Per-customer OAuth grant | Customer must grant access; needed for Phase 3 SEO baseline. |
| **Google Analytics 4** | Free | $0 | Pull historical landing-page + conversion data from customer's site | Per-customer OAuth grant | Customer must grant access; needed for Phase 3 SEO baseline. |
| **Lighthouse** | Free (Chrome) | $0 | Performance, SEO, a11y audit of staging + post-cutover sites | Built into Chrome | Used in discovery Phase 9 + Phase 11 monitoring. |
| **Google Rich Results Test** | Free | $0 | Schema markup validation | Public web tool | Used in discovery Phase 9 staging verification. |
| **Ahrefs (free tier)** | Free | $0 | Backlink check for high-value inbound links | Free account | Used in discovery Phase 11 for ranking + backlink monitoring. |
| **BrightLocal** | Optional Solo plan | ~$30/mo | Citation audit + rank tracking | 1Password if subscribed | Optional — only if running multiple concurrent migrations. NAP consistency checks can also be done manually. |

**Total active migration tooling cost:** ~$330/yr Screaming Frog license amortized + optional ~$360/yr BrightLocal. Everything else is free.

---

## 11. RUNTIME / FRAMEWORK STACK (no separate billing)

These are libraries, frameworks, or runtimes used in the codebase. They aren't independent vendors, but they're listed for completeness.

| Item | Use |
|---|---|
| **Next.js 14 (App Router)** | Public tenant shells |
| **Vite + React (SPA)** | Admin UI + marketing site |
| **Deno** | Supabase Edge Functions runtime |
| **PostgreSQL 15** | Via Supabase |
| **pgTAP** | Test suite (backlog — not yet implemented) |

---

## 12. REMOVED / LEGACY (do NOT reference as current stack)

Historical record only. None of these are in active use as of S236.

| Service | Removed | Replacement |
|---|---|---|
| **Zapier** | Pre-S198 | Supabase Edge Functions + Power Automate Teams webhook |
| **Buffer** | Pre-S150 | Zernio |
| **Ayrshare** | Pre-S150 | Zernio |
| **bundle.social** | Pre-S150 | Zernio |
| **Pexels** | Pre-S150 | Firecrawl (for prospect imagery) |

If a handoff doc, kickoff prompt, or context file references any of the above as current — that file is stale.

---

## 13. PER-TENANT INTEGRATION FIELDS (where each external ID lives)

For every new customer, these `settings.integrations` JSONB fields drive Reports tab tiles and admin features.

| Field | Required For | Captured From | Used By |
|---|---|---|---|
| `google_place_id` | S234 Reviews Import | GBP listing or Places API resolve | `places-reviews` edge fn |
| `google_fid` | Place ID resolution | GBP URL | `places-reviews` edge fn |
| `google_cid` | (Legacy) | GBP URL | Pre-S234 path — superseded |
| `google_business_id` | S235 Outscraper Sync | GBP listing numeric ID | `outscraper-reviews` edge fn |
| `zernio_account_id` | Social posting | Zernio OAuth flow | `post-to-social` v38+, `publish-scheduled-posts` v42+ |
| `stripe_customer_id` | Billing | Stripe customer create | `PaymentLinkPanel.tsx`, monthly invoice flow |
| `ga4_property_id` | Site analytics | (planned) | (planned) |

---

## 14. ROUGH MONTHLY OPERATING COST

| Category | ~Monthly | Notes |
|---|---|---|
| Vercel | $20 | 1 seat |
| Supabase | $25 | Pro plan |
| Doppler | $10 | Team |
| 1Password | $8 | Business |
| GitHub | $4 | Team |
| Resend | $20 | Pro |
| Zernio | $50 | Team |
| Outscraper | $20-50 | Variable on volume |
| Anthropic API | $50-200 | Variable on usage |
| Firecrawl | $20 | Standard |
| Codespaces | $20-40 | Variable on hours |
| Textbelt | <$10 | Variable on volume |
| GCP (PageSpeed) | <$5 | Free-tier mostly |
| Stripe | ~3% revenue | Pass-through |
| GoDaddy domains | ~$15/mo amortized | 9 domains × ~$20/yr |
| Screaming Frog (optional) | ~$28/mo amortized | $330/yr — only if doing migrations |
| BrightLocal (optional) | ~$30/mo | Only if doing many concurrent migrations |
| **Subtotal** | **~$280-530/mo** | Excludes Claude.ai Pro/Max; high end assumes migrations active |

Adjust as billing changes. Update this table when adding/removing services.

---

## 15. KEYS TO ROTATE (security hygiene reference)

Track rotation cadence here. Mark with rotation date.

| Secret | Store | Last Rotated | Cadence |
|---|---|---|---|
| `PAGESPEED_API_KEY` | Supabase Edge Fn Secrets | S224 (2026-05) | Annual |
| `provision_tenant_internal_secret` | Supabase Vault | S220 | Annual |
| `supabase_service_role_key` | Supabase Vault | S221 | On compromise only |
| `ANTHROPIC_API_KEY` | Supabase Edge Fn Secrets | — | Annual |
| `RESEND_API_KEY` | Supabase Edge Fn Secrets | — | Annual |
| `OUTSCRAPER_API_KEY` | Supabase Edge Fn Secrets | S235 (2026-05) | Annual |
| `TEXTBELT_API_KEY` | Supabase Edge Fn Secrets | — | Annual |
| `FIRECRAWL_API_KEY` | Supabase Edge Fn Secrets | — | Annual |
| Stripe live keys | Doppler `pestflow-pro/prd` | — | On compromise only |
| Zernio OAuth refresh tokens | Per-tenant via Zernio | — | Auto-refresh |

---

## 16. ACCESS RECOVERY (if Scott is unavailable)

In case of incapacity, the following access is needed to keep PFP running:

1. 1Password vault — master credentials
2. GoDaddy login — DNS control for all owned domains
3. Vercel team owner — `team_qrUo7nyDaoioD69goEZfvhMu`
4. Supabase project owner — `biezzykcgzkrwdgqpsar`
5. Stripe account owner
6. Resend, Zernio, Outscraper, Anthropic, Firecrawl, Textbelt, Doppler, GitHub, Power Automate — individual logins
7. GCP organization owner — `homeflowpro.ai`
8. Bank account access — per series (Series A for PFP)

Designate a backup owner per series before scaling further verticals.
