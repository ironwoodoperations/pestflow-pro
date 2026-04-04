# PestFlow Pro — Project Context (Session 36 Ready)
_Maintained by Scott / Ironwood Operations Group_
_Do not let Claude Code overwrite this file — it is generated here and handed to Claude Code_

---

## ⚠️ SESSION RULES
- Stop and output a summary at 50% context window — do not go past this
- Keep responses short and action-focused
- After every Claude Code task: `git add . && git commit -m "description" && git push`
- Working directly on main — no PR needed
- Follow the session roadmap exactly. Log conflicts in commit messages.
- Do NOT generate a session 37 context file. End with a plain summary only.

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
Founded:     2009
Industry:    Pest Control
```

---

## BUILD STATUS (end of S35)

- Build: ✅ 0 TS errors
- Main bundle: **370.14 kB raw / 100.95 kB gzip** ✅ well under 450 kB limit
- All 4 shell heroes: ✅ structurally distinct
- Lazy-loaded in S35: About, FAQ, Reviews, ServiceArea, Blog, BlogPost, Pricing,
  Terms, Privacy, all 12 pest service pages (share PestPageTemplate chunk)

---

## KNOWN ISSUE GOING INTO S36

**Clean & Friendly service strips link to `/services` — this route does not exist.**
The strips (Residential / Commercial / Termites) currently 404 via SlugRouter.
Fix in S36: change strip hrefs to `/pest-control` or add a `/services` redirect.
Check what routes currently exist in App.tsx before deciding.

---

## SHELL SYSTEM — CURRENT STATE

### Infrastructure
- `src/context/TemplateContext.tsx` — reads branding.template ✅
- `src/components/PublicShell.tsx` — routes Navbar + Footer + HomeSections ✅
- Shell switcher in Settings → Branding ✅

### Shell files
```
src/shells/
  modern-pro/
    ShellNavbar.tsx       ✅ dark navy + emerald
    ShellHero.tsx         ✅ centered layout — KEEP AS IS
    ShellFooter.tsx       ✅
    ShellHomeSections.tsx ✅
  bold-local/
    ShellNavbar.tsx       ✅ charcoal + amber
    ShellHero.tsx         ✅ 2-col split, floating estimate form (S35)
    ShellFooter.tsx       ✅
    ShellHomeSections.tsx ✅
  clean-friendly/
    ShellNavbar.tsx       ✅ white + sky blue
    ShellHero.tsx         ✅ full-bleed image, giant phone CTA, service strips (S35)
    ShellFooter.tsx       ✅
    ShellHomeSections.tsx ✅
  rustic-rugged/
    ShellNavbar.tsx       ✅ dark brown + rust
    ShellHero.tsx         ✅ split left/right, floating card (S35)
    ShellFooter.tsx       ✅
    ShellHomeSections.tsx ✅
```

### Pexels images hardcoded in S35 (Scott should visually confirm)
- Clean & Friendly: `pexels-photo-5025639.jpeg` (pest tech indoor)
- Rustic & Rugged: `pexels-photo-4386466.jpeg` (outdoor pest tech)

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
| Customer License Agreement (4 tiers) | ✅ |
| Terms of Service / EULA | ✅ |
| Privacy Policy | ✅ |
| Sales Rep Agreement | ✅ |
| NDA | ✅ |
| /terms public page | ✅ live |
| /privacy public page | ✅ live |
| Legal checkboxes in onboarding StepReview | ✅ live |
| legal_acceptance settings key on launch | ✅ live |

---

## ONBOARDING WIZARD

Files in `src/components/admin/onboarding/`:
- `types.ts` — FormData with acceptedTerms, acceptedPrivacy, acceptedDataUse
- `StepReview.tsx` — amber checkbox box, Launch disabled until all 3 checked
- `Onboarding.tsx` — saves legal_acceptance on launch

---

## CLIENT SETUP WIZARD

Files in `src/components/admin/client-setup/`:
- `types.ts` — ClientSetupForm with tenant_id field
- `ClientSetupStep5.tsx` — Tenant ID field with help text
- `ClientSetupWizard.tsx` — calls provision-tenant after export if tenant_id set

---

## FILE LINE COUNT RULES

- All files must stay under 200 lines
- Split before editing if a file is at or near 200 lines
- Check with `wc -l <file>` before editing

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
| 34 | Apr 2026 | Legal checkboxes, /terms + /privacy pages, provision-tenant, Client Setup wizard |
| 35 | Apr 2026 | Bundle 463→370 kB (lazy-load 20+ pages/chunks). Rebuilt 3 shell heroes: Bold & Local 2-col split, Clean & Friendly giant phone CTA + service strips, Rustic & Rugged split left/right floating card |

---

## ROADMAP

| Session | Focus |
|---------|-------|
| **S36** | End-to-end demo QA — full walkthrough, fix rough edges before first client ← this session |
| **S37** | First client onboarding (if S36 QA passes cleanly) |

---

## SESSION 36 SCOPE — DEMO QA

S36 is a **quality pass before the first real client demo**. The goal is to walk
the platform end to end as a prospective client would see it, catch rough edges,
and fix them in the same session.

### Known fix (must do first)
- Clean & Friendly service strips link to `/services` (404). Fix before QA starts.

### QA Checklist — Public Site
Walk each of the 4 shells. For each shell check:
- [ ] Hero renders correctly, no layout breaks at 375px and 1280px
- [ ] Navbar links work (Home, Services, About, Reviews, Blog, Contact)
- [ ] CTA buttons route to /quote correctly
- [ ] /quote page loads and form submits (check Supabase leads table)
- [ ] /about, /faq, /reviews, /blog, /services-area pages load (no 404)
- [ ] /terms and /privacy load correctly (lazy-loaded)
- [ ] Footer shows "Powered by PestFlow Pro" badge
- [ ] HolidayBanner appears above navbar (if active)

### QA Checklist — Admin
- [ ] Login works: admin@pestflowpro.com / pf123demo
- [ ] Dashboard loads, stats visible
- [ ] Leads tab: leads table populated, status dropdown works
- [ ] Settings → Branding: shell switcher changes site immediately
- [ ] Settings → Business Info: save works, public site reflects changes
- [ ] Onboarding wizard: steps advance, legal checkboxes gate Launch button
- [ ] Reviews tab: review request flow works
- [ ] Social tab: Campaigns, Content Queue, Analytics tabs load

### Fix-as-you-go
For any issue found during QA:
- Fix immediately in the same session
- Commit after each fix with a descriptive message
- Note in the end summary

### Out of scope for S36
- New features
- New shell designs
- Database schema changes

---

## SESSION 36 STARTER BLOCK

```
Here is the full project context for PestFlow Pro. Read it completely before doing anything.

[paste full contents of this MD file]

Session 35 is complete. Bundle is 370 kB (well under limit). All 4 shell heroes
are now structurally distinct. One known issue: Clean & Friendly service strips
link to /services which 404s — fix this first before starting QA.

Session 36 goal: end-to-end demo QA across all 4 shells and the full admin
panel. Fix every rough edge found. This platform needs to be client-ready.

Task order:
1. Fix /services 404 in Clean & Friendly ShellHero strips
2. QA all 4 shells — public site
3. QA admin panel — all tabs
4. Fix any issues found during QA
5. Final build — confirm 0 TS errors, bundle still under 450 kB

Do NOT generate a session 37 context file. End with a plain summary only.
Follow the session roadmap exactly. Log any conflicts in commit messages.

⚠️ Stop and output a summary at 50% context window.
⚠️ Report exact bundle size after final build.
```
