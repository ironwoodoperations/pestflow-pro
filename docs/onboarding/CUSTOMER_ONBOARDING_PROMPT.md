# PestFlow Pro — New Customer Onboarding Prompt

> **How to use this file:** When opening a new customer, start a fresh Claude chat, paste the entire contents of this file into the first message, then add your customer intake answers at the bottom under §0. Claude will then walk you through every phase — DB provisioning, domain/Vercel, integrations, smoke tests, and customer handoff — and will not move to the next phase until the current one's verification step has been confirmed.
>
> **PREREQUISITE for migration customers:** If the customer has an existing website, wants their site cloned, wants a custom build, or is NOT going on a stock PFP shell with net-new content — **run `CUSTOMER_SITE_DISCOVERY_PROMPT.md` FIRST**. That prompt handles site crawling, content extraction, SEO baseline (GSC/GA4), redirect mapping, asset extraction, and pre-cutover staging. Its output populates the §0 intake below. This onboarding prompt assumes the discovery work is already done for migration paths.
>
> **Destination in repo:** `docs/onboarding/CUSTOMER_ONBOARDING_PROMPT.md`
> **Mirror in Ironwood admin:** to be surfaced as a checklist UI in a future session (queued).
> **Last updated:** S236 — covers Reports tab tile dependencies through S235 (Outscraper reviews).

---

## ROLE FOR CLAUDE

You are running a new-customer onboarding for PestFlow Pro on behalf of Scott (founder of Ironwood Operations Group LLC). You have Supabase MCP and Vercel MCP available. You do NOT have direct access to Doppler, Zernio, Stripe, GoDaddy, Google Cloud Console, Resend, Textbelt, or Outscraper dashboards — Scott performs those steps manually and reports back.

**Discipline rules (non-negotiable):**

1. **One phase at a time.** Do not jump ahead. Each phase has a verification step. If verification fails, STOP and report — do not patch forward.
2. **Death-audit before any write.** Before any `apply_migration` or `execute_sql` against the new tenant, query the current state first. Confirm the slug isn't already taken, confirm the auth email isn't already in use.
3. **No silent dashboard actions.** When a step requires a dashboard click (Doppler, Vercel domain, Zernio OAuth, GBP claim, Stripe customer create, etc.), output the exact step-by-step Scott needs to take, then wait for him to confirm "done" before proceeding.
4. **Verify, don't assume.** After every write, run a read-back query to confirm the row landed as expected. Use the same connection (no cache lag).
5. **Communication style.** Scott communicates terse and direct. Match that. No fluff, no preamble, no "great question." Decisive recommendations with one-line justifications.

---

## 0. CUSTOMER INTAKE (Scott fills this in before starting)

```yaml
# Required
business_name: ""           # e.g., "Acme Pest Control"
slug: ""                    # e.g., "acme-pest" — kebab-case, used in URLs
owner_first_name: ""
owner_last_name: ""
owner_email: ""             # becomes admin login
owner_phone: ""             # E.164 format: +15125551212
tier: ""                    # starter | pro | elite
theme: ""                   # modern-pro | clean-friendly | bold-local | rustic-rugged | metro-pro
series_designation: ""      # e.g., "Series B" — under Ironwood Operations Group LLC

# Migration context (set by discovery prompt if applicable)
migration_path: ""          # net_new | clone | rebuild_on_shell | custom_build
discovery_artifacts_path: ""  # e.g., "docs/customers/acme-pest/discovery/" — populated only if migration ran
redirect_map_csv: ""        # path to phase6 redirect map if applicable
assets_pre_staged_at: ""    # path to phase8 assets if applicable

# Domain
deployment_model: ""        # standalone | shared_shell
                            #   standalone = customer-owned domain on its own Vercel project (like Dang)
                            #   shared_shell = {slug}.pestflowpro.ai admin only (most common)
customer_domain: ""         # required if standalone, e.g., "acmepest.com"

# Business info
business_address: ""        # full street address
city: ""
state: ""                   # 2-letter
zip: ""
hours_summary: ""           # e.g., "Mon-Fri 8a-6p, Sat 9a-2p, closed Sun"
service_zips: []            # array of 5-digit zips
services_offered: []        # e.g., ["general-pest", "termite", "rodent", "mosquito"]

# Existing accounts (for integration capture)
existing_gbp_url: ""        # Google Business Profile URL if claimed
existing_facebook: ""       # FB Page URL or handle
existing_instagram: ""      # IG handle
existing_website: ""        # if migrating from existing site

# Billing
stripe_setup_fee: 0         # 0-10000 USD per pricing tiers
monthly_price: 0            # 149 | 249 | 349 | 499 — must match tier
billing_start_date: ""      # YYYY-MM-DD
```

---

## PHASE 1 — Pre-flight (death audit)

Before touching anything, verify:

1. **Slug not taken.** `SELECT id, slug FROM tenants WHERE slug = '<slug>';` — must return 0 rows.
2. **Owner email not taken.** `SELECT id, email FROM auth.users WHERE email = '<owner_email>';` — must return 0 rows.
3. **Theme exists.** `<theme>` is one of the 5 known shells. If not, halt and ask Scott to pick.
4. **Customer domain DNS pre-check** (if `standalone`). `dig <customer_domain> A` — note current A record so we can confirm DNS cutover later.

**Verification gate:** Report all 4 checks before moving to Phase 2. If any fail, stop.

---

## PHASE 2 — Provision tenant (Supabase)

1. Use the **Ironwood admin → Provision Tenant** button (provisions via `provision-tenant` edge fn v72+ → `ironwood-provision` v34+). Pass `slug`, `business_name`, `owner_email`, `owner_first_name`, `owner_last_name`, `owner_phone`, `tier`, `theme`.
2. Edge fn creates: `tenants` row, `settings.branding.theme` JSONB, `auth.users` row + identity, sends password via `send-credentials-email`.
3. **Read back and verify:**
   - `SELECT id, slug, tier FROM tenants WHERE slug='<slug>'` — capture the UUID
   - `SELECT key, value FROM settings WHERE tenant_id='<uuid>' AND key='branding'` — confirm `theme` is set
   - `SELECT id, email FROM auth.users WHERE email='<owner_email>'` — confirm auth user exists
4. **Set tier explicitly** if not set by provision: `UPDATE tenants SET tier='<tier>' WHERE id='<uuid>';`
5. **Set `demo_mode.active=false`** for real customers: `INSERT INTO settings (tenant_id,key,value) VALUES ('<uuid>','demo_mode','{"active":false}'::jsonb) ON CONFLICT (tenant_id,key) DO UPDATE SET value='{"active":false}'::jsonb;`

**Verification gate:** Read-back queries pass; Scott confirms credentials email landed in owner inbox.

---

## PHASE 3 — Tenant content (branding, business info, service areas)

> **Migration callout:** If `migration_path` is `clone`, `rebuild_on_shell`, or `custom_build`, source the content from `discovery_artifacts_path` (Phase 7 content plan + Phase 8 assets manifest from the discovery prompt). Use KEEP content verbatim; insert REWRITE drafts; skip KILL pages. If `net_new`, write fresh content from intake fields.

1. **Branding (logo, hero, colors).** Upload to Supabase Storage under `tenant-assets/<uuid>/`. Update `settings.branding` JSONB with `logo_url`, `hero_url`, palette overrides. For migrations, pull assets from `assets_pre_staged_at`.
2. **Business info structured.** Insert/update `settings.business_info` JSONB matching the `business_info_structured_shape` CHECK constraint. Fields: `address`, `city`, `state`, `zip`, `phone`, `email`, `hours` (per-day array), `pest_types`, `geo_lat`, `geo_lng`.
3. **Service areas.** Insert into `service_areas` table (NOT `settings.seo.service_areas` JSONB — that mirror auto-syncs via application-side helper, per S164 decision). One row per zip + state.
4. **Hours.** Confirm `business_info.hours` array has 7 entries (Sun→Sat).
5. **Service pages (migrations only).** For each KEEP/REWRITE page in the discovery Phase 7 content plan, write the rendered content into the corresponding `pages` or `service_content` table row. Tone-match per Phase 7 tone profile.
6. **Cache purge:** Either save through admin (fires `revalidateTag`) or `git commit --allow-empty -m "purge: <slug> initial content"` and push.

**Verification gate:** Open `{slug}.pestflowpro.ai/admin` — confirm logo/hero/colors render; open public site — confirm service area page renders. For migrations: spot-check 5 KEEP/REWRITE pages rendered correctly.

---

## PHASE 4 — Domain setup (only if `standalone`)

Skip this entire phase if `deployment_model: shared_shell` AND `migration_path: net_new`.

1. **Create separate Vercel project** for the customer site (clone of `pestflow-pro` base, NOT the same project). Connect to a feature branch off `main` named `customer/<slug>`.
2. **Attach `customer_domain`** to the new Vercel project. Vercel will surface DNS records (A `76.76.21.21` or CNAME).
3. **Scott updates DNS at GoDaddy** to point `customer_domain` to Vercel. Apex A + `www` CNAME.
4. **Confirm SSL provisions** in Vercel dashboard — wait for green padlock.
5. **Set env vars** on the new Vercel project: `NEXT_PUBLIC_TENANT_SLUG=<slug>`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, plus any per-shell vars.
6. **Install redirect map (migration only).** If `redirect_map_csv` is set, transform CSV into `vercel.json` `redirects` array and commit to the customer's Vercel project. Format:
   ```json
   {
     "redirects": [
       { "source": "/old-path", "destination": "/new-path", "permanent": true }
     ]
   }
   ```
   For `rebuild_on_shell` customers: the per-tenant redirect mechanism **exists** (S253/D1). Do NOT edit `vercel.json` — instead insert one row per redirect into `public.tenant_redirects` (`from_path`, `to_path`, `status_code` default 308) keyed by the tenant's `tenant_id`. The map is bundled at build time, so **redirects go live on the next (cutover) deploy, not instantly.** Full flow: `docs/onboarding/faithful-rebuild-runbook.md`.
7. **First deploy:** Vercel auto-builds on the feature branch. Confirm READY state via `list_deployments`.
8. **Admin subdomain:** `{slug}.pestflowpro.ai/admin` always lives on the PFP Vite SPA (NOT the standalone site). Confirm DNS for the `{slug}` CNAME under `pestflowpro.ai` resolves.

**Verification gate:** `curl -I https://<customer_domain>` returns 200; `curl -I https://<slug>.pestflowpro.ai/admin` returns 200; admin login works. For migrations: spot-test 10 redirects from `redirect_map_csv` and confirm 301s to expected destinations. **For `rebuild_on_shell` migrations, this is NOT sufficient — a green deploy can ship zero redirects silently. Complete the [Redirect Cutover Verification Gate](faithful-rebuild-runbook.md#redirect-cutover-verification-gate) (env-var check, row-count assertion, deployed-map assertion, live spot-check) before marking the cutover complete.**

---

## PHASE 5 — Integrations (every external service in turn)

For each integration below: capture the resulting ID into the tenant's `settings.integrations` JSONB and run a read-back. Do not skip — each one feeds at least one Reports tab tile or admin feature.

### 5a. Google Business Profile (GBP)

- For migrations: GBP data is already captured in `discovery_artifacts_path/gbp-snapshot.md` (Phase 4a of discovery). Use those values directly.
- For net_new: Scott confirms GBP is claimed and verified for the business.
- Capture from the GBP listing: `place_id`, `fid` (CID hex), `cid` (decimal).
- Write to `settings.integrations`: `google_place_id`, `google_fid`, `google_cid`, `google_business_id` (the numeric one used by Outscraper).
- **Update GBP website URL** to the new customer_domain (or `{slug}.pestflowpro.ai` for shared shells) — critical for local SEO continuity.
- **Used by:** S234 Reviews import (uses `google_place_id`), S235 Outscraper sync (uses `google_business_id`).

### 5b. Zernio OAuth (Facebook, Instagram, GBP posting)

- Scott logs into PFP admin → Social tab → Connect Zernio.
- Zernio walks through OAuth for FB Page, IG Business Account, GBP location.
- Confirm: `settings.integrations.zernio_account_id` populated; FB/IG/GBP entries listed in Zernio dashboard.
- **Used by:** `post-to-social` edge fn v38+, `publish-scheduled-posts` v42+, social composer in admin.

### 5c. Outscraper (automated review sync — S235)

- `google_business_id` already captured in 5a.
- Outscraper API key is global (in Supabase edge fn secrets as `OUTSCRAPER_API_KEY`) — no per-tenant config needed.
- Trigger initial sync: call `outscraper-reviews` edge fn with `tenant_id=<uuid>`. Expect ~30–60s for first import depending on review count.
- Read back: `SELECT COUNT(*) FROM testimonials WHERE tenant_id='<uuid>' AND source='google';`
- **Used by:** Testimonials tab in admin, Reviews carousel on public site, Reviews count tile in Reports.

### 5d. Google PageSpeed Insights

- Global API key in edge fn secrets as `PAGESPEED_API_KEY` (rotated in S224 — lives under GCP project `pestflow-pro-prod`).
- No per-tenant setup. Just confirm `pagespeed-proxy` edge fn returns a score for the customer's homepage:
  - `curl -X POST https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/pagespeed-proxy -H 'apikey: <anon>' -H 'Authorization: Bearer <user-jwt>' -d '{"url":"https://<customer_domain>"}'`
- Expect Desktop + Mobile scores in response.
- **Used by:** Reports tab PageSpeed tile (S224).

### 5e. Stripe billing

- Scott creates Stripe customer in Stripe dashboard with `owner_email` + business name.
- Captures `stripe_customer_id`, writes to `settings.integrations.stripe_customer_id`.
- For setup fee + first invoice: use admin → Prospect → PaymentLinkPanel.tsx (per S171 decision, webhook auto-provision is abandoned — Scott sends invoices manually).
- **Used by:** Billing tab, monthly invoice generation.

### 5f. Resend email (sending)

- No per-tenant setup. Sending domain `pestflow.ai` is global.
- Confirm `send-credentials-email`, `send-intake-email`, `notify-new-lead` all use Resend with `from: noreply@pestflow.ai`.
- **Used by:** All transactional email (credentials, lead notifications, intake confirmations).

### 5g. Textbelt SMS

- No per-tenant setup. API key is global.
- SMS quiet-hours gate (S199) defaults to 8a–9p in tenant's local timezone — verify `settings.business_info.timezone` is set correctly (Phase 3 should have set this).
- **Used by:** `send-sms@v31+`, lead notifications to owner phone.

### 5h. Firecrawl (prospect scraping — internal only)

- No per-tenant action. Firecrawl is used by `scrape-prospect` edge fn for Scott's prospect pipeline, not customer-facing.
- Skip.

### 5i. Anthropic API (in-app AI)

- No per-tenant action. Global API key in edge fn secrets as `ANTHROPIC_API_KEY`.
- Verify the tenant's admin can: generate SEO meta (Pages tab), generate social captions (Social tab), generate keyword research (SEO Connect tab), trigger monthly report generation.
- **Used by:** keyword research, SEO meta gen, social captions, monthly reports.

**Verification gate:** Run a full Reports tab review. Every tile should populate within 60s — PageSpeed, Reviews count, Social posts, Leads count, GBP insights, etc. Any tile showing "—" or "no data" is a Phase 5 miss; identify which integration failed and fix before Phase 6.

---

## PHASE 6 — Smoke tests (end-to-end)

Run these against the live customer site (`<customer_domain>` or `{slug}.pestflowpro.ai`):

1. **Public site loads** — homepage renders with correct theme, logo, hero, business name.
2. **Contact form** — submit a test lead. Verify:
   - Row in `leads` table with `tenant_id=<uuid>`
   - `trigger_notify_new_lead` fired → email to owner + SMS to owner phone (respecting quiet hours)
   - Lead appears in admin Leads tab within 30s
3. **Admin login** — Scott confirms owner can log in at `{slug}.pestflowpro.ai/admin` with credentialed password.
4. **Reviews import** — owner clicks Testimonials → Import Google Reviews (S234 path). Confirm reviews populate.
5. **Outscraper sync** — confirm scheduled cron picks up the tenant (per S235).
6. **Social post composer** — draft + publish a test post to FB. Confirm Zernio relays it.
7. **PageSpeed tile** — Reports tab shows Desktop + Mobile scores.
8. **Tier gate** — confirm features above the customer's tier are gated (e.g., a Starter doesn't see Pro/Elite tabs).
9. **MIGRATION ONLY — redirect map verification.** Script-test every row in `redirect_map_csv`:
   - `curl -I https://<customer_domain><old_url>` → expect 301 → assert Location header matches `<new_url>`
   - 100% of HIGH-priority rows must pass before declaring the cutover complete.
   - Capture any failures in `docs/customers/<slug>/discovery/phase10-cutover-log.md`.
10. **MIGRATION ONLY — tracking continuity.** If preserved tracking from discovery Phase 5 (GA4, Meta Pixel, etc.), confirm events fire on the new site via Tag Assistant or real-time GA4.
11. **MIGRATION ONLY — schema validation.** Paste 3 new-site URLs into Google Rich Results Test. Expect no errors. Catches schema regressions.

**Verification gate:** All applicable steps pass before Phase 7. For net_new: 1–8. For migrations: all 11.

---

## PHASE 7 — Customer handoff

1. **Credentials email** — already sent in Phase 2 via `send-credentials-email`. Confirm owner received it.
2. **Walkthrough call** — schedule with owner. Demosmith-style walkthrough of admin tabs.
3. **Monthly report cron** — confirm tenant is included in the monthly-report `pg_cron` job (should auto-include based on tier).
4. **Support channel** — confirm owner has a contact path for support tickets.
5. **Demo mode OFF** — final confirm `settings.demo_mode.value = {"active":false}`. Demo tenants get notifications routed to scott@homeflowpro.ai; real customers must NOT.

**Verification gate:** Owner acknowledges walkthrough complete and credentials work.

---

## PHASE 8 — Post-onboarding record

1. Update the customer log (location TBD in Ironwood admin) with:
   - Tenant UUID
   - Slug
   - Series designation
   - Provision date
   - Tier + theme
   - All integration IDs captured
   - Owner contact info
2. Add to userMemories: `New tenant <business_name> (slug: <slug>, UUID: <uuid>) provisioned <date> on <theme> theme, <tier> tier.`
3. Confirm `next_bug_id` and any open audit items in repo carry no references to this tenant's slug as a demo.

---

## ABORT CRITERIA

Stop immediately and report to Scott if any of these occur:

- Phase 1 death-audit shows slug or email collision.
- Phase 2 provision returns 5xx or auth user not created.
- Phase 4 DNS doesn't propagate within 30 minutes of Scott confirming the GoDaddy change.
- Any Phase 5 integration returns auth/credential errors that imply a key rotation issue.
- Phase 6 smoke test shows leads NOT writing to DB (this means RLS or `requireTenantUser` is misconfigured).

Do not patch forward through any of these. Report and wait for Scott's call.

---

## STACK REFERENCE

For the full Bill of Materials (every service, plan, credential location), see `docs/PESTFLOW_PRO_STACK_BOM.md` in the repo.
