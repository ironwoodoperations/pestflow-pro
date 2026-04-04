# PestFlow Pro — Project Context (Session 45 Ready)
_Maintained by Scott / Ironwood Operations Group_
_Do not let Claude Code overwrite this file — it is generated here and handed to Claude Code_

---

## ⚠️ SESSION RULES
- Stop and output a summary at 50% context window — do not go past this
- Keep responses short and action-focused
- After every task: `git add . && git commit -m "description" && git push`
- Working directly on main — no PR needed
- Follow the session roadmap exactly. Log conflicts in commit messages.
- Do NOT generate a session 46 context file. End with a plain summary only.

---

## CRITICAL CONSTANTS (never change)

```
Live URL:       https://pestflowpro.com
Admin URL:      https://pestflowpro.com/admin/login
GitHub:         https://github.com/ironwoodoperations/pestflow-pro
Supabase URL:   https://biezzykcgzkrwdgqpsar.supabase.co
Supabase ID:    biezzykcgzkrwdgqpsar
Demo Tenant ID: 9215b06b-3eb5-49a1-a16e-7ff214bf6783
Demo Admin:     admin@pestflowpro.com / pf123demo
Dev server:     doppler run -- npm run dev -> localhost:8080
Model:          claude-sonnet-4-6 (ALWAYS — no exceptions)
Stack:          React 18 + TypeScript + Vite + Tailwind + Supabase + Vercel
```

---

## DEMO COMPANY

```
Name:        Ironclad Pest Solutions
Phone:       (903) 555-0142
Email:       info@ironclad-pest.com
Address:     1204 S. Main Street, Tyler, TX 75701
Slug:        ironclad
Hours:       Mon-Fri 7am-6pm | Sat 8am-2pm
Tagline:     Pest Control You Can Count On.
Founded:     2009
Industry:    Pest Control
```

---

## TEST TENANTS

```
Lone Star Pest Defense
  Tenant ID:   7e8acdd5-b258-4a8c-9124-22b24383e3c3
  Slug:        lonestarpest
  URL:         https://lonestarpest.pestflowpro.com
  Admin:       admin@lonestarpestdefense.com / lspd123demo
  Plan:        Tier 2 — Grow — $149/mo

Peakview Pest Control
  Slug:        peakviewpestcontrol
  URL:         https://peakviewpestcontrol.pestflowpro.com
  Admin:       info@peakviewpest.com / PeakviewpestcontrolPest26!
  Plan:        Tier 2 — Grow — $149/mo
  Shell:       clean-friendly
  Payment:     paid (test mode)
```

---

## BUILD STATUS (end of S44)

- Build: 0 TS errors
- Bundle: 387.82 kB — under 450 kB limit ✅
- Setup fee: fixed — uses `subscription_data.add_invoice_items` in checkout session
- BillingTab: lazy-loaded, 160 lines, PageHelpBanner, plan + payment history, upgrade mailto
- Onboarding email v2: fires after provision-tenant succeeds (client welcome, no credentials)
- PaymentSuccess: polls tenants table for ready state
- Modern Pro hero: restored to original centered layout (hotfix, separate session)

---

## STRIPE SETUP

```
Webhook endpoint: https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/stripe-webhook
Events:           checkout.session.completed, invoice.payment_succeeded,
                  customer.subscription.deleted
JWT verification: disabled (--no-verify-jwt) — Stripe signature verified in code
```

Price IDs in Doppler + Supabase secrets:
```
STRIPE_PRICE_STANDARD_SETUP      = price_1TIZ0uCZBM0TUusSbUjj6yTX  ($2,000)
STRIPE_PRICE_CUSTOM_MIGRATION    = price_1TIZ1rCZBM0TUusSm3PEXfLu  ($3,500)
STRIPE_PRICE_PREMIUM_MIGRATION   = price_1TIZ3XCZBM0TUusSZmWrD0VW  ($5,000)
STRIPE_PRICE_STARTER             = price_1TIZ6DCZBM0TUusSaC2UdcYG  ($99/mo)
STRIPE_PRICE_GROW                = price_1TIZA1CZBM0TUusSJfld1aNT  ($149/mo)
STRIPE_PRICE_PRO                 = price_1TIZE2CZBM0TUusSPFZZVDQk  ($249/mo)
STRIPE_PRICE_ELITE               = price_1TIZF1CZBM0TUusSuoAbLJZT  ($499/mo)
```

---

## EDGE FUNCTIONS

| Function | Status | Notes |
|---|---|---|
| notify-new-lead | ACTIVE | FROM: no-reply@pestflow.ai |
| send-review-request | ACTIVE v2 | From: no-reply@pestflow.ai |
| publish-scheduled-posts | ACTIVE | FB Graph API v19.0 + pg_cron |
| send-sms | ACTIVE | TEXTBELT_API_KEY set |
| send-onboarding-email | ACTIVE v2 | Client welcome — no credentials in email |
| provision-tenant | ACTIVE v5 | tenants.name NOT NULL safe |
| create-checkout-session | ACTIVE v7 | subscription_data.add_invoice_items for setup fee |
| stripe-webhook | ACTIVE | --no-verify-jwt, fires onboarding email post-provision |

---

## SHELL SYSTEM (stable — do not modify shells in S45)

```
src/shells/
  modern-pro/     navy+emerald, centered hero
  bold-local/     charcoal+amber, 2-col split hero
  clean-friendly/ white+sky, giant phone CTA hero
  rustic-rugged/  brown+rust, split left/right hero
  youpest/        dark charcoal+green, migration demo
```

---

## COLOR PALETTES (12 total — new in S45)

These are the curated palette options shown in the wizard Step 2 when client picks $2k Standard.
Each palette sets `primary_color` and `accent_color` in branding settings.
Palette is only shown when shell is selected AND package = Standard ($2k).

### Modern Pro (shell: modern-pro)
| ID | Name | primary_color | accent_color |
|----|------|--------------|-------------|
| mp-1 | Classic Emerald | #10b981 | #0a0f1e |
| mp-2 | Pacific Blue | #0ea5e9 | #0f172a |
| mp-3 | Royal Violet | #7c3aed | #0f172a |

### Bold & Local (shell: bold-local)
| ID | Name | primary_color | accent_color |
|----|------|--------------|-------------|
| bl-1 | Amber Gold | #d97706 | #1c1c1c |
| bl-2 | Cardinal Red | #dc2626 | #1c1c1c |
| bl-3 | Forest Green | #15803d | #1c1c1c |

### Clean & Friendly (shell: clean-friendly)
| ID | Name | primary_color | accent_color |
|----|------|--------------|-------------|
| cf-1 | Sky Blue | #0ea5e9 | #0284c7 |
| cf-2 | Sage Green | #16a34a | #15803d |
| cf-3 | Coral Warm | #f97316 | #ea580c |

### Rustic & Rugged (shell: rustic-rugged)
| ID | Name | primary_color | accent_color |
|----|------|--------------|-------------|
| rr-1 | Rust & Brown | #b5451b | #2c1a0e |
| rr-2 | Pine Forest | #166534 | #2c1a0e |
| rr-3 | Harvest Gold | #b45309 | #2c1a0e |

---

## SETTINGS KEYS (JSONB) — ALL 11 REQUIRED

```
business_info        -> {name, phone, email, address, hours, tagline, industry,
                         license, certifications, founded_year, num_technicians}
branding             -> {logo_url, primary_color, accent_color, template, cta_text, favicon_url}
customization        -> {hero_headline, show_license, show_years,
                         show_technicians, show_certifications}
social_links         -> {facebook, instagram, google, youtube}
integrations         -> {google_place_id, facebook_page_id, facebook_access_token,
                         google_analytics_id, pexels_api_key, textbelt_api_key,
                         owner_sms_number, ayrshare_api_key, google_maps_api_key}
onboarding_complete  -> {"complete": true}
hero_media           -> {"youtube_id": "", "thumbnail_url": ""}
holiday_mode         -> {"enabled": false, "holiday": "", "message": "", "auto_schedule": ""}
notifications        -> {"cc_email": "", "lead_email": "", "monthly_report_email": ""}
demo_mode            -> {"active": false, "seeded_at": ""}
subscription         -> {"tier": 1, "plan_name": "Starter", "monthly_price": 99}
```

---

## RLS STATUS

| Table | anon SELECT | authenticated SELECT |
|---|---|---|
| tenants | ✅ USING (true) | ✅ |
| settings | ✅ USING (true) | ✅ |
| tenant_users | ❌ anon blocked | ✅ own rows only |
| stripe_payments | ❌ anon blocked | ✅ own tenant only |

---

## RULES (NEVER VIOLATE)

- Model is ALWAYS claude-sonnet-4-6
- Relative imports only — NO @/ aliases
- Single useState object for forms — never per-field state
- maybeSingle() not single() for settings queries
- All files under 200 lines — check with wc -l before editing, split first
- Admin tabs lazy-loaded with React.lazy()
- PageHelpBanner on every admin tab
- Footer "Powered by PestFlow Pro" badge on ALL shells
- HolidayBanner ABOVE Navbar — PublicShell handles this
- Working directly on main — no PR needed
- Stop and output a summary at 50% context window — no exceptions
- Do NOT generate a context file — plain summary only at end
- Dev server: always doppler run -- npm run dev — never npm run dev directly

---

## PERMANENTLY OUT OF SCOPE

- Invoice generator / Customer portal / Technician calendar
- PDF reports / PDF export / Self-serve pricing page

---

## SESSION LOG

| Session | Date | Key Completions |
|---------|------|----------------|
| 1-29 | Mar-Apr 2026 | Full platform build |
| 30 | Apr 2026 | Shell infrastructure + Modern Pro + Bold & Local |
| 31 | Apr 2026 | Clean & Friendly + Rustic & Rugged shells |
| 32 | Apr 2026 | Customization layer, Ayrshare posting, Facebook UX |
| 33 | Apr 2026 | 4 ShellHomeSections built |
| 34 | Apr 2026 | Legal checkboxes, /terms + /privacy, provision-tenant, Client Setup wizard |
| 35 | Apr 2026 | Bundle 463→370 kB. Rebuilt 3 shell heroes |
| 36 | Apr 2026 | Pest images, shell CTA colors, TCPA consent, Lighthouse caching. Bundle: 375 kB |
| 37 | Apr 2026 | Dashboard redesign (SEO/Social widgets, plan card, amber padlocks). GoogleMapEmbed |
| 38 | Apr 2026 | Subdomain routing live. lonestarpest.pestflowpro.com resolves. Doppler wired |
| 39 | Apr 2026 | Tenant auth isolation. has_role fixed. lonestarpest login working |
| 40 | Apr 2026 | provision-tenant v3. Firecrawl tool. youpest shell. Bundle: 384 kB |
| 41 | Apr 2026 | provision-tenant v4. Wizard delivery-ready. Prices fixed. Template picker. Success screen |
| 42 | Apr 2026 | Stripe checkout + webhook. 7-step wizard. Bundle: 384 kB |
| 43 | Apr 2026 | Webhook 401 fix. RLS anon fix. provision-tenant v5. Pest image picker. Bundle: 387 kB |
| 44 | Apr 2026 | Setup fee fix (add_invoice_items). BillingTab. Onboarding email v2. Bundle: 387.82 kB |
| 44b | Apr 2026 | Modern Pro hero restored to original centered layout (hotfix) |

---

## ROADMAP

| Session | Focus |
|---------|-------|
| S45 | Wizard restructure — this session |
| S46 | First real paying client delivery |

---

## SESSION 45 SCOPE — Wizard Restructure

The existing Client Setup Wizard (7 steps) is being replaced with a cleaner
6-step flow. The integrations step is removed from wizard entirely — that data
is filled in by Scott on the backend after onboarding.

A `logos` Supabase storage bucket must be created (public) to support logo uploads.

---

### WIZARD FILE LOCATIONS

Find the existing wizard before touching anything:
```bash
find src -name "*Wizard*" -o -name "*wizard*" | head -20
find src -name "*Setup*" | head -20
```

Check line counts on all wizard step files before editing. Split anything over 200 lines first.

---

### NEW WIZARD STRUCTURE — 6 STEPS

#### Step 1 — Business Info
Fields: Company Name, Phone, Email, Address (single field), Business Hours, Tagline
Auto-generate slug from company name: lowercase, spaces→hyphens, strip special chars.
Slug field: show it, make it editable, note "This becomes your web address: [slug].pestflowpro.com"
Same data as before — no changes to what gets stored.

---

#### Step 2 — Package + Branding
This is the most changed step. Package selection drives what branding options appear.

**Package cards (pick one):**
- Standard Build — $2,000 — "Template-based site, ready in 1–2 business days"
- Custom Migration — $3,500 — "We rebuild your existing site structure"
- Premium Migration — $5,000 — "Full rebuild with new custom design"

**If Standard ($2,000) selected → show:**

A) Shell picker — 4 options with name + short description:
   - Modern Pro: "Clean and professional. Dark navy with bold accents."
   - Bold & Local: "Strong and confident. Built for local market leaders."
   - Clean & Friendly: "Approachable and bright. Great for residential focus."
   - Rustic & Rugged: "Warm and established. Perfect for trusted local brands."
   Each card: name, description, small colored swatch showing primary palette color.
   No screenshot images needed — keep it lightweight.

B) Palette picker — appears after shell is selected. Show 3 palette cards for the chosen shell.
   Each palette card: palette name + two color swatches (primary + accent) side by side.
   Selected palette highlighted with a ring. Stores primary_color + accent_color in branding.

C) Logo upload:
   - File input (accept: image/*) — label "Upload your logo (PNG or SVG preferred)"
   - On file select: upload to Supabase `logos` bucket at path `wizard/{uuid}/{filename}`
     where uuid = crypto.randomUUID() generated once per wizard session
   - Show upload progress + preview after success
   - Store returned public URL in branding.logo_url
   - "Skip for now" option — logo can be added later in admin Settings

**If Custom ($3,500) or Premium ($5,000) selected → show:**
   - Logo upload only (same as above)
   - Message: "We'll use Firecrawl to rebuild your existing site — no template selection needed."
   - Text field: "Your current website URL" (stored in provision_data for Scott's use)
   - Shell picker and palette picker are hidden entirely

---

#### Step 3 — Domain Info
Purpose: collect domain details so Scott can point DNS during onboarding.
No credentials collected — Scott will call the client for registrar login.

Fields:
- Current domain (e.g. ironclad-pest.com) — text input
- Domain registrar — dropdown:
  GoDaddy, Namecheap, Google Domains, Cloudflare, Network Solutions,
  Squarespace, Wix, Bluehost, HostGator, Other
- "Don't have a domain yet?" checkbox — if checked, hide registrar dropdown,
  show message "We can help you register one — we'll discuss during onboarding."

Store both fields in provision_data (passed to stripe_payments) — not in settings.
This is reference data for Scott, not tenant config.

---

#### Step 4 — Social Links (all optional)
Fields: Facebook Page URL, Google Business URL, Instagram URL, YouTube URL
Label above: "Fill in what you know — we can find the rest during setup."
All fields optional. No validation required.
Stores in social_links settings key (same as before).

---

#### Step 5 — Plan Selection
Monthly subscription tier:
- Starter — $99/mo
- Grow — $149/mo
- Pro — $249/mo
- Elite — $499/mo

Show feature highlights per tier (same as DashboardPlanCard):
- Starter: Website, CRM, Basic SEO, up to 3 locations, Team access
- Grow: All Starter + Full SEO suite, Blog, Social scheduling
- Pro: All Grow + AI tools, Advanced reports, Campaigns
- Elite: All Pro + Social analytics, Ayrshare autopilot, Live reviews

---

#### Step 6 — Review + Payment
Summary of all selections:
- Business name + slug preview URL
- Package: [name] — $[amount] setup
- Shell + palette (if Standard) OR "Custom build from [current_url]" (if Custom/Premium)
- Domain: [domain] via [registrar]
- Social links: list any filled in
- Plan: [name] — $[price]/mo
- Logo: uploaded ✅ or "Will add later"

"Continue to Payment →" button → creates Stripe checkout session
  Passes: email, slug, setup price ID, subscription price ID, provision_data
  provision_data must include:
    email, business_info (all fields), slug, template, primary_color, accent_color,
    logo_url, social_links, subscription tier, current_website_url (if Custom/Premium),
    domain, registrar

---

### PAYMENT SUCCESS SCREEN (update existing)

Remove: any display of login credentials
Remove: any "your site is live" messaging

Add:
- Checkmark icon + "Payment confirmed — you're all set!"
- "Our team is setting up your site. This typically takes 1–2 business days."
- "We'll email your login info to [email] when everything is ready."
- Link: href="https://pestflowpro.com" target="_blank"
  Text: "Explore PestFlow Pro while you wait →"
  Style: emerald button or prominent text link

---

### ONBOARDING EMAIL (send-onboarding-email v2 — already deployed)
The auto-fired email after payment should NOT include login credentials.
Verify current v2 email body does not contain admin_password or admin login URL.
If it does, update to remove them. Email should say:
  "Thanks for choosing PestFlow Pro! We've received your payment and our team
   is getting your site ready. You'll receive your login details within 1–2
   business days once setup is complete."

---

### SUPABASE — LOGOS BUCKET

Create a new public storage bucket named `logos`:
```sql
-- Run via Supabase MCP execute_sql or dashboard Storage tab
-- Actually create via Storage API or dashboard — SQL alone won't create a bucket
```

Use Supabase dashboard → Storage → New bucket → name: `logos`, public: true.
OR use the Supabase JS client in an edge function or the admin panel.

After creating, verify uploads work from the wizard logo upload component.
RLS policy needed: allow public INSERT (anon can upload during wizard before auth).

Storage path pattern: `logos/wizard/{uuid}/{filename}`

---

### NEW/MODIFIED FILES

```
src/components/wizard/
  ClientSetupWizard.tsx        — restructured orchestrator (6 steps)
  steps/
    Step1BusinessInfo.tsx       — same fields, add slug preview
    Step2PackageBranding.tsx    — NEW: package + conditional branding
    Step3Domain.tsx             — NEW: domain + registrar
    Step4SocialLinks.tsx        — simplified (was Step 4 integrations)
    Step5PlanSelection.tsx      — same as before, renumbered
    Step6Review.tsx             — updated summary fields
  components/
    LogoUpload.tsx              — NEW: file upload → Supabase logos bucket
    PaletteSelector.tsx         — NEW: 3 palette cards per shell
    ShellSelector.tsx           — NEW: 4 shell cards (extracted from wizard)

src/pages/PaymentSuccess.tsx    — remove credentials, add explore link

supabase/functions/send-onboarding-email/index.ts
  — verify no credentials in auto-fired email body
```

---

### PALETTE DATA (hardcode in PaletteSelector.tsx)

```typescript
export const SHELL_PALETTES = {
  'modern-pro': [
    { id: 'mp-1', name: 'Classic Emerald', primary: '#10b981', accent: '#0a0f1e' },
    { id: 'mp-2', name: 'Pacific Blue',    primary: '#0ea5e9', accent: '#0f172a' },
    { id: 'mp-3', name: 'Royal Violet',    primary: '#7c3aed', accent: '#0f172a' },
  ],
  'bold-local': [
    { id: 'bl-1', name: 'Amber Gold',    primary: '#d97706', accent: '#1c1c1c' },
    { id: 'bl-2', name: 'Cardinal Red',  primary: '#dc2626', accent: '#1c1c1c' },
    { id: 'bl-3', name: 'Forest Green',  primary: '#15803d', accent: '#1c1c1c' },
  ],
  'clean-friendly': [
    { id: 'cf-1', name: 'Sky Blue',    primary: '#0ea5e9', accent: '#0284c7' },
    { id: 'cf-2', name: 'Sage Green',  primary: '#16a34a', accent: '#15803d' },
    { id: 'cf-3', name: 'Coral Warm',  primary: '#f97316', accent: '#ea580c' },
  ],
  'rustic-rugged': [
    { id: 'rr-1', name: 'Rust & Brown',   primary: '#b5451b', accent: '#2c1a0e' },
    { id: 'rr-2', name: 'Pine Forest',    primary: '#166534', accent: '#2c1a0e' },
    { id: 'rr-3', name: 'Harvest Gold',   primary: '#b45309', accent: '#2c1a0e' },
  ],
}
```

---

## SESSION 45 TASK ORDER

1. Read all existing wizard files — check line counts on each
2. Create `logos` Supabase storage bucket (public) via dashboard or MCP
3. Build `LogoUpload.tsx` — file input → upload to logos bucket → return public URL
4. Build `PaletteSelector.tsx` — 3 palette cards, hardcoded SHELL_PALETTES data
5. Build `ShellSelector.tsx` — 4 shell cards (name + description + color swatch)
6. Rebuild `Step2PackageBranding.tsx` — package cards → conditional shell/palette/logo
7. Rebuild `Step1BusinessInfo.tsx` — add slug preview, keep all existing fields
8. Build `Step3Domain.tsx` — domain + registrar dropdown + "no domain" checkbox
9. Rebuild `Step4SocialLinks.tsx` — all optional, remove integrations fields
10. Renumber/update `Step5PlanSelection.tsx` and `Step6Review.tsx`
11. Update `ClientSetupWizard.tsx` orchestrator — 6 steps, correct provision_data shape
12. Update `PaymentSuccess.tsx` — remove credentials, add explore link
13. Verify `send-onboarding-email` auto-email has no credentials
14. Final build — `npm run build` — 0 TS errors, report exact bundle size
15. Commit each task separately. Plain summary at end — no context file.
