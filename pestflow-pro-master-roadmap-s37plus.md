# PestFlow Pro — Master Roadmap (S37 Forward)
_Maintained by Scott / Ironwood Operations Group_
_Generated after S36 complete_

---

## ⚠️ MANUAL ACTIONS REQUIRED BEFORE S37 STARTS

Do these manually — no code involved:

1. **Vercel** — upgrade to Pro ($20/mo)
2. **Vercel** — add `pestflowpro.com` and `*.pestflowpro.com` as wildcard domains on the project
3. **DNS** — point `pestflowpro.com` nameservers/A/CNAME records to Vercel (Vercel shows exact records after you add the domain)
4. **Doppler** — create PestFlow Pro project, migrate ALL env vars out of Vercel into Doppler, connect Doppler → Vercel sync
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ANTHROPIC_API_KEY`, `VITE_TENANT_ID`
   - Resend keys, Textbelt key, Pexels key, Google Maps key, Ayrshare key
5. **1Password** — vault all credentials: admin logins, API keys, Supabase dashboard password, Vercel login, domain registrar login, Doppler tokens
6. **Supabase** — add `TEXTBELT_API_KEY` to Edge Function secrets (send-sms → Secrets tab) — flagged in S36

---

## CURRENT STATE (end of S36)

- Build: ✅ 0 TS errors
- Bundle: **375 kB** ✅ under 450 kB limit
- All 4 shells: ✅ stable — do not modify in S37
- Pest page system: ✅ stable — do not modify in S37
- Quote form: ✅ TCPA consent, checkbox validation, /terms + /privacy links
- Social tab: ✅ plain-English copy, new post choice modal
- Legal: ✅ /terms + /privacy live, legal_acceptance key on launch
- provision-tenant edge function: ✅ ACTIVE
- Client Setup Wizard: ✅ exists, needs slug field added in S38

---

## PRICING MODEL (established)

| Package | Upfront | Monthly |
|---|---|---|
| Standard Build (template) | $2,000 | $99–$499/mo |
| Custom Migration (Firecrawl rebuild) | $3,500 | $99–$499/mo |
| Premium Migration (Firecrawl + new design) | $5,000 | $99–$499/mo |

Monthly tiers: Tier 1 Starter $99 / Tier 2 Grow $149 / Tier 3 Pro $249 / Tier 4 Elite $499

---

## TEST TENANT (used for S38 subdomain routing test)

| Field | Value |
|---|---|
| Company | Lone Star Pest Defense |
| Slug | `lonestarpest` |
| URL | `lonestarpest.pestflowpro.com` |
| Industry | Pest Control |
| Phone | (512) 555-0187 |
| Email | info@lonestarpestdefense.com |
| Address | 847 W. Oltorf Street, Austin, TX 78704 |
| Hours | Mon–Fri 7am–6pm / Sat 8am–2pm |
| Tagline | Austin's First Line of Defense Against Pests. |
| Founded | 2016 | Technicians | 5 |
| License | TPCL-0023847 |
| Certifications | QualityPro Certified, GreenPro Certified |
| Primary Color | #15803D (green) |
| Accent Color | #CA8A04 (yellow) |
| Template | bold-local |
| CTA Text | Get a Free Inspection |
| Hero Headline | Austin's Most Trusted Pest Control Team |
| Owner | Danny Reeves |
| Owner Email | danny@lonestarpestdefense.com |
| Plan | Tier 2 — Grow — $149/mo |
| Admin Login | admin@lonestarpestdefense.com / lspd123demo |

---

## SESSION 37 — Admin Dashboard + Google Maps
_Scope: UI quality pass before first client demo_

### Focus 1 — Admin Dashboard Redesign

Current dashboard: lead stats + large plan box only.
Goal: show platform value at a glance when client logs in.

**Step 1 — Check line counts before touching anything.**
Find: likely `src/components/admin/tabs/DashboardTab.tsx`
If over 150 lines → split into sub-components first, then build.

**Component split target:**
```
src/components/admin/dashboard/
  DashboardStats.tsx        — existing lead/review/post count cards
  DashboardPlanCard.tsx     — compact plan box, collapsible feature list
  DashboardSeoWidget.tsx    — SEO snapshot (reads Lighthouse localStorage)
  DashboardSocialWidget.tsx — Social snapshot (reads social_posts from Supabase)
```

**Dashboard layout (top to bottom):**
1. Stats row — compact lead/review/post count cards
2. Two-column widget row: LEFT = SEO Snapshot, RIGHT = Social Snapshot
3. Plan card — smaller, below the widgets

**DashboardSeoWidget.tsx:**
- Read Lighthouse score from localStorage key: `lighthouse_score_[tenantId]`
- Display: colored circle badge (green ≥90, yellow 70–89, red <70) + "Performance Score" label + "Last checked: [date]"
- If no cached score: "No audit run yet" + "Run SEO Audit →" link to SEO tab
- "View Full Report →" link to SEO tab
- Card style: white bg, rounded-xl, shadow-sm, p-6

**DashboardSocialWidget.tsx:**
- Query `social_posts` for tenant: count posts this month (status='scheduled' or 'published')
- Show: "X posts scheduled this month" + last post date if available
- If no posts: "No posts scheduled yet" + "Go to Social →" link
- "Manage Social →" link to Social tab
- Same card style as SEO widget

**DashboardPlanCard.tsx:**
- One line: plan name badge (color-coded) + monthly price
- "What's included ▼" toggle — collapsed by default
- Expanded: bullet list of features per tier
  - Tier 1 Starter: Website, CRM, Basic SEO, up to 3 locations, Team access
  - Tier 2 Grow: All Starter + Full SEO suite, Blog, Social scheduling
  - Tier 3 Pro: All Grow + AI tools, Advanced reports, Campaigns
  - Tier 4 Elite: All Pro + Social analytics, Ayrshare autopilot, Live reviews
- Badge colors: Starter=gray, Grow=blue, Pro=purple, Elite=amber

**Amber padlocks on locked sidebar items:**
- Find where admin sidebar renders locked/gated items
- Change padlock icon color from gray → amber-500
- Add tooltip: "Upgrade to [Plan Name] to unlock"
- Do NOT change padlock logic — color only

---

### Focus 2 — Google Maps on Location & Service Area Pages

**Step 1 — Build reusable GoogleMapEmbed component:**
File: `src/components/common/GoogleMapEmbed.tsx`

```typescript
interface GoogleMapEmbedProps {
  address: string;
  apiKey?: string;
  zoom?: number;
  height?: string; // default "400px"
}
```

- If apiKey provided: render Google Maps Embed API iframe
  URL: `https://www.google.com/maps/embed/v1/place?key=[apiKey]&q=[encodeURIComponent(address)]&zoom=[zoom||11]`
- If no apiKey: render fallback link to `https://maps.google.com/?q=[address]`
  in styled placeholder box (bg-gray-100, rounded-xl, centered text)
- Read apiKey from `integrations.google_maps_api_key` OR env var `VITE_GOOGLE_MAPS_API_KEY`
- Add `google_maps_api_key` to integrations settings key (already listed in context)

**Step 2 — Add to service area page** (check App.tsx for route — likely /services-area or /service-area)
Add `<GoogleMapEmbed />` near the bottom, passing business_info.address.

**Step 3 — Add to location pages** (likely `src/pages/LocationPage.tsx` or dynamic slug route)
Add `<GoogleMapEmbed />` at bottom of each location page.

If `VITE_GOOGLE_MAPS_API_KEY` not set → component renders fallback. Note in summary.

### S37 Task Order
1. Check dashboard file line counts — split first if needed
2. Build DashboardSeoWidget
3. Build DashboardSocialWidget
4. Build DashboardPlanCard (collapsible, color-coded)
5. Wire sub-components into dashboard layout
6. Amber padlocks on locked sidebar items
7. Build GoogleMapEmbed with graceful fallback
8. Add GoogleMapEmbed to service area page
9. Add GoogleMapEmbed to location pages
10. Final build — 0 TS errors, bundle under 450 kB

---

## SESSION 38 — Subdomain Routing + Doppler
_This is the client delivery session — after this, you can deliver a live site in 10 minutes_

### Focus 1 — Subdomain Routing

**Goal:** `lonestarpest.pestflowpro.com` → reads slug → looks up tenant in Supabase → loads their data.

**Pre-session confirm:** Vercel Pro active + `*.pestflowpro.com` wildcard domain live.

**Supabase migration:**
```sql
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
```

**Tasks:**
- Add slug field to Client Setup Wizard Step 1 — auto-generate from company name (lowercase, hyphens, no spaces), editable
- Build subdomain router (`src/lib/subdomainRouter.ts`):
  - On app load: read `window.location.hostname`
  - Extract subdomain (e.g. `lonestarpest` from `lonestarpest.pestflowpro.com`)
  - If subdomain exists and isn't `www`: query `tenants` table for matching slug → set tenant ID in context
  - If no subdomain or `www`: fall back to `VITE_TENANT_ID` env var (keeps demo tenant working)
- Root domain `pestflowpro.com` → redirect to `/admin/login` (for now)
- Admin login at `[slug].pestflowpro.com/admin`
- Update `provision-tenant` edge function to accept and store the slug
- Seed Lone Star Pest Defense test tenant with slug `lonestarpest`
- Test end-to-end: `lonestarpest.pestflowpro.com` loads their data

### Focus 2 — Doppler Wiring

**Tasks:**
- Install Doppler CLI in Codespaces setup
- Add `.doppler` config file to repo root pointing to PestFlow Pro project
- Update `CLAUDE.md`: dev server must run via `doppler run -- npm run dev`
- Verify all env vars are resolving correctly via Doppler

### S38 Task Order
1. Confirm Vercel Pro + wildcard DNS resolving before writing any code
2. Supabase migration — add slug column
3. Add slug field to Client Setup Wizard
4. Update provision-tenant edge function to accept slug
5. Build subdomainRouter
6. Wire subdomainRouter into app entry point (main.tsx or App.tsx)
7. Seed Lone Star Pest Defense test tenant
8. Test `lonestarpest.pestflowpro.com` end-to-end
9. Wire Doppler CLI + update CLAUDE.md
10. Final build — 0 TS errors, bundle under 450 kB

---

## SESSION 39 — Firecrawl Migration Tool
_Unlocks the $3,500–$5,000 migration package_

### Goal
Scrape a client's existing pest control site → extract copy, colors, structure → Claude Code rebuilds it as a custom shell inside PestFlow Pro.

### Tasks
- Add `FIRECRAWL_API_KEY` to Doppler + 1Password
- Build migration utility script `scripts/migrate-site.ts`:
  - Input: client website URL + target slug
  - Firecrawl crawls the site → returns full content as markdown
  - Script outputs structured content file: `scripts/output/[slug]-content.md`
  - Claude Code reads that file as source material to build a new shell
- New shell output path: `src/shells/[client-slug]/` matching existing shell structure
  - ShellNavbar.tsx, ShellHero.tsx, ShellFooter.tsx, ShellHomeSections.tsx, ServicesData.ts
- Document the workflow in `CLAUDE.md` under "Migration Workflow" section
- This is a Claude Code dev tool — no admin UI needed

### Caveat
Heavy CSS animations or complex layouts lose fidelity. Standard pest control sites (most clients) come out near pixel-perfect.

### Sales Pitch (for reference)
> "We rebuild your existing site exactly as it looks today — same design, same copy — and plug in a full CRM, review automation, and AI tools behind it. Your customers won't notice anything changed except it gets faster."

### S39 Task Order
1. Add Firecrawl to Doppler
2. Build migrate-site.ts script
3. Test against a real public pest control site URL
4. Review output quality — adjust prompting if needed
5. Document workflow in CLAUDE.md
6. Commit

---

## SESSION 40 — First Real Client Onboarding
_Lone Star Pest Defense or first paying client_

### Goal
Run the full client delivery flow live for the first time:
1. Client Setup Wizard → sets slug, provisions tenant
2. Confirm `[slug].pestflowpro.com` goes live immediately
3. Onboarding email fires to client
4. Client completes onboarding wizard
5. Public site live and correct

### Pre-session checklist
- [ ] S38 subdomain routing confirmed working
- [ ] `pestflowpro.com` DNS live and resolving via Vercel
- [ ] Textbelt API key in Supabase secrets (flagged S36)
- [ ] 1Password vault fully populated
- [ ] Doppler synced and Vercel pulling from it

---

## RULES (NEVER VIOLATE)

- Model: `claude-sonnet-4-6` always — no exceptions
- Relative imports only — NO @/ aliases
- Single useState object for forms — never per-field state
- maybeSingle() for settings queries
- All files under 200 lines — check with `wc -l` before editing, split first
- Admin tabs lazy-loaded with React.lazy()
- PageHelpBanner on every admin tab
- Footer "Powered by PestFlow Pro" badge on ALL shells
- HolidayBanner ABOVE Navbar — PublicShell handles this
- Working directly on main — no PR needed
- Stop and summarize at 50% context window — no exceptions

## PERMANENTLY OUT OF SCOPE
- Invoice generator / Customer portal / Technician calendar
- PDF reports / PDF export / Self-serve pricing page
