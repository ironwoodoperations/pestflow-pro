# PestFlow Pro — Project Context (Session 35 Ready)
_Maintained by Scott / Ironwood Operations Group_
_Do not let Claude Code overwrite this file — it is generated here and handed to Claude Code_

---

## ⚠️ SESSION RULES
- Stop and output a summary at 50% context window — do not go past this
- Keep responses short and action-focused
- After every Claude Code task: `git add . && git commit -m "description" && git push`
- Working directly on main — no PR needed
- **Follow the session roadmap exactly. Log conflicts in commit messages.**
- Do NOT generate a session 36 context file. End with a plain summary only.

---

## CRITICAL CONSTANTS (never change)

```
Live URL:       https://pestflow-pro.vercel.app
Admin URL:      https://pestflow-pro.vercel.app/admin/login
GitHub:         https://github.com/ironwoodoperations/pestflow-pro
Supabase URL:   https://biezzykcgzkrwdgqpsar.supabase.co
Supabase ID:    biezzykcgzkrwdgqpsar
Tenant ID:      9215b06b-3eb5-49a1-a16e-7ff214bf6783
Admin login:    admin@pestflowpro.com / pf123demo
Dev server:     npm run dev → localhost:8080
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
Hours:       Mon–Fri 7am–6pm | Sat 8am–2pm
Tagline:     Pest Control You Can Count On.
Industry:    Pest Control
```

---

## ⚠️ CRITICAL ISSUES GOING INTO S35

### Issue 1 — Bundle Size Over Limit
Main bundle: 463 kB raw (limit: 450 kB)
Cause: TermsPage.tsx and PrivacyPage.tsx are large static text pages
loaded eagerly in the main bundle.
Fix: Lazy-load both via React.lazy() in App.tsx — same pattern as admin tabs.

### Issue 2 — Shell Heroes Are Identical
All 4 shells currently show the same centered hero layout.
Only the navbar color changes between shells.
This is NOT acceptable for a demo — clients need to see genuinely
different site structures, not just different header colors.

The hero section must be structurally different per shell:
- Modern Pro: keep current centered layout (it works)
- Bold & Local: 2-column split — text left, embedded quote mini-form right
- Local Champion: full-bleed image, giant phone CTA button center, service strips below
- Minimal Edge: split layout — headline left, image in rounded frame right with floating trust badge

---

## SHELL SYSTEM — CURRENT STATE

### Infrastructure
- `src/context/TemplateContext.tsx` — reads branding.template ✅
- `src/components/PublicShell.tsx` — routes Navbar + Footer + HomeSections ✅
- Shell switcher in Settings → Branding ✅

### Shell files per shell
```
src/shells/
  modern-pro/
    ShellNavbar.tsx     ✅ dark navy + emerald
    ShellHero.tsx       ✅ centered — KEEP AS IS
    ShellFooter.tsx     ✅
    ShellHomeSections.tsx ✅
  bold-local/
    ShellNavbar.tsx     ✅ charcoal + amber
    ShellHero.tsx       ⚠️ REBUILD — needs 2-col split with quote form
    ShellFooter.tsx     ✅
    ShellHomeSections.tsx ✅
  clean-friendly/
    ShellNavbar.tsx     ✅ white + sky blue
    ShellHero.tsx       ⚠️ REBUILD — needs phone CTA + service strips
    ShellFooter.tsx     ✅
    ShellHomeSections.tsx ✅
  rustic-rugged/
    ShellNavbar.tsx     ✅ dark brown + rust
    ShellHero.tsx       ⚠️ REBUILD — needs split left/right layout
    ShellFooter.tsx     ✅
    ShellHomeSections.tsx ✅
```

### Hero redesign specs

**Bold & Local ShellHero (2-column split):**
- Left col (60%): Large Oswald headline, subtext, trust line, amber CTA button
- Right col (40%): Floating dark card — "Get a Free Estimate" mini-form
  Fields: Name (text), Phone (tel), Service (select dropdown), Submit button
  Card: rounded-xl, charcoal bg (#1c1c1c), amber border top, white inputs
  On submit: POST to leads table via Supabase (same as QuotePage)
  OR: link to /quote with tel pre-filled — either approach acceptable
  Card overlaps hero bottom slightly (negative margin or absolute)

**Clean & Friendly ShellHero (Local Champion style):**
- Full-bleed background image with light overlay
- CENTER of hero: business phone number in giant text (tel: link)
  Style: text-6xl font-bold text-white with amber/sky glow
  Below phone: "Call for Same-Day Service" subtext
  Below that: standard "Get a Quote" button
- Below hero (dark strip, not inside hero):
  3 full-width service category strips (Residential / Commercial / Termites)
  These are part of ShellHero output, not ShellHomeSections

**Rustic & Rugged ShellHero (Minimal Edge split):**
- Left half: dark brown bg, large Oswald headline, subtext, rust CTA button
  "Est. [founded_year]" badge in rust border
- Right half: hero image in rounded-xl frame
  Floating card overlapping left/right boundary:
    "Free Estimate" in rust, phone number, small "Call Now" button
- Desktop: flex row. Mobile: stacked (image above, text below)

---

## SETTINGS KEYS (JSONB)

```
business_info   → {name, phone, email, address, hours, tagline, industry,
                   license, certifications, founded_year, num_technicians}
branding        → {logo_url, primary_color, accent_color, template, cta_text}
customization   → {hero_headline, show_license, show_years,
                   show_technicians, show_certifications}
social_links    → {facebook, instagram, google, youtube}
integrations    → {google_place_id, facebook_page_id, facebook_access_token,
                   google_analytics_id, pexels_api_key,
                   textbelt_api_key, owner_sms_number, ayrshare_api_key}
onboarding_complete → true | false
legal_acceptance → {accepted: bool, timestamp: string, plan: string, terms_version: string}
subscription    → {tier: 1|2|3|4, plan_name, monthly_price}
demo_mode       → {active: boolean, seeded_at: string}
```

**Demo tenant subscription:** tier 4, plan_name "Elite", monthly_price 499 ✅

---

## TIER GATING

Single canonical component: `src/components/common/FeatureGate.tsx`
Props: `minTier` (required), `featureName?`, `fallback?`

---

## EDGE FUNCTIONS

| Function | Status | Notes |
|---|---|---|
| `notify-new-lead` | ACTIVE | Resend email on new lead |
| `send-review-request` | ACTIVE (v2) | From: no-reply@pestflow.ai |
| `publish-scheduled-posts` | ACTIVE | FB Graph API v19.0 + pg_cron |
| `send-sms` | ACTIVE | Textbelt — TEXTBELT_API_KEY in secrets |
| `send-onboarding-email` | ACTIVE | From: onboarding@pestflow.ai |
| `provision-tenant` | ACTIVE | Pre-populates new tenant settings |

**Verified Resend domain:** pestflow.ai ✅

---

## LEGAL DOCUMENTS (completed S34)

| Document | Status |
|----------|--------|
| Customer License Agreement (updated 4 tiers) | ✅ |
| Terms of Service / EULA | ✅ |
| Privacy Policy | ✅ |
| Sales Rep Agreement (updated) | ✅ |
| NDA (updated) | ✅ |
| /terms public page | ✅ live |
| /privacy public page | ✅ live |
| Legal checkboxes in onboarding StepReview | ✅ live |
| legal_acceptance settings key on launch | ✅ live |

---

## ONBOARDING WIZARD (post S34)

Files in `src/components/admin/onboarding/`:
- `types.ts` — FormData with acceptedTerms, acceptedPrivacy, acceptedDataUse
- `StepReview.tsx` — amber checkbox box, Launch disabled until all 3 checked
- `Onboarding.tsx` — saves legal_acceptance on launch

---

## CLIENT SETUP WIZARD (post S34)

Files in `src/components/admin/client-setup/`:
- `types.ts` — ClientSetupForm with tenant_id field
- `ClientSetupStep5.tsx` — Tenant ID field with help text
- `ClientSetupWizard.tsx` — calls provision-tenant after export if tenant_id set

---

## FILE LINE COUNTS (must stay under 200 before editing)

| File | Status |
|------|--------|
| All shell files | ✅ under 200 |
| TermsPage.tsx | ⚠️ large — lazy-load in S35 |
| PrivacyPage.tsx | ⚠️ large — lazy-load in S35 |
| All admin tabs | ✅ |

---

## RULES (NEVER VIOLATE)

- Model is ALWAYS claude-sonnet-4-6
- Relative imports only — NO @/ aliases
- Single useState object for forms — never per-field state
- maybeSingle() not single() for settings queries
- All files <200 lines — split before editing
- Admin tabs lazy-loaded with React.lazy()
- PageHelpBanner on every admin tab
- Footer "Powered by PestFlow Pro" badge on ALL shells
- HolidayBanner ABOVE Navbar — PublicShell handles this
- Working directly on main — no PR needed
- Follow the session roadmap exactly
- Do NOT generate a context file — plain summary only at end

---

## PERMANENTLY OUT OF SCOPE

- Invoice generator / Customer portal / Technician calendar
- PDF reports / PDF export / Self-serve pricing page

---

## SESSION LOG

| Session | Date | Key Completions |
|---------|------|----------------|
| 1–29 | Mar–Apr 2026 | Full platform build |
| 30 | Apr 2026 | Shell infrastructure + Modern Pro + Bold & Local shells |
| 31 | Apr 2026 | Clean & Friendly + Rustic & Rugged shells, all 4 wired |
| 32 | Apr 2026 | Customization layer, Ayrshare posting, Facebook UX |
| 33 | Apr 2026 | 4 ShellHomeSections built (different layouts below hero) |
| 34 | Apr 2026 | Legal checkboxes in onboarding, /terms + /privacy pages, provision-tenant edge function, Client Setup wizard pre-populates settings. Bundle: 463 kB (over limit) |

---

## ROADMAP

| Session | Focus |
|---------|-------|
| **S35** | Fix bundle size + rebuild 3 shell heroes to be structurally different ← this session |
| **S36** | End-to-end demo QA — full walkthrough, fix rough edges before first client |

---

## BUILD STATUS (end of S34)

- Build: ✅ 0 TS errors
- Main bundle: 463 kB raw / 125 kB gzip ⚠️ OVER 450 kB LIMIT
- Fix in S35: lazy-load TermsPage + PrivacyPage

---

## SESSION 35 STARTER BLOCK

```
Here is the full project context for PestFlow Pro. Read it completely before doing anything.

[paste full contents of this MD file]

Session 34 is complete. Legal checkboxes live in onboarding. /terms and /privacy
pages are live. provision-tenant edge function deployed. Client Setup wizard
pre-populates settings on export.

TWO CRITICAL PROBLEMS to fix this session:
1. Bundle is 463 kB — 13 kB over the 450 kB hard limit
2. All 4 shell heroes look identical — only navbar color changes

Session 35 goals — follow this order exactly:
1. Fix bundle: lazy-load TermsPage + PrivacyPage in App.tsx
2. Rebuild Bold & Local ShellHero — 2-column split with mini quote form
3. Rebuild Clean & Friendly ShellHero — giant phone CTA + service strips
4. Rebuild Rustic & Rugged ShellHero — split left/right with floating card
5. Verify all 4 shells look structurally different when toggled

Do NOT generate the session 36 context file. End with a plain summary only.
Follow the session roadmap exactly. Log any conflicts in commit messages.

⚠️ Stop and output a summary at 50% context window.
⚠️ Report exact bundle size after every build.
```
