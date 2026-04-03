# PestFlow Pro — Project Context (Session 30 Ready)
_Maintained by Scott / Ironwood Operations Group_
_Do not let Claude Code overwrite this file — it is generated here and handed to Claude Code_

---

## ⚠️ SESSION RULES
- Stop and output a summary at 50% context window — do not go past this
- Keep responses short and action-focused
- After every Claude Code task: `git add . && git commit -m "description" && git push`
- Working directly on main — no PR needed
- **Follow the session roadmap exactly. Do not add unrequested features or refactors.
  Log conflicts in commit messages rather than deviating silently.**
- Do NOT generate a session 31 context file. End with a plain summary only.

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
Tenant ID:   9215b06b-3eb5-49a1-a16e-7ff214bf6783
```

⚠️ NO "Dang Pest Control" anywhere. Demo is IRONCLAD PEST SOLUTIONS only.

---

## ENV VARS

```
VITE_SUPABASE_URL=https://biezzykcgzkrwdgqpsar.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpZXp6eWtjZ3prcndkZ3Fwc2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTQ4MjMsImV4cCI6MjA5MDM3MDgyM30.NLuAr1IhZIVixqOnB0BzeTHOlHrjhD5eDDYNGzZ4_dc
VITE_ANTHROPIC_API_KEY=[set in Vercel]
VITE_TENANT_ID=9215b06b-3eb5-49a1-a16e-7ff214bf6783
```

⚠️ NO `@/` path aliases — relative imports only
⚠️ Use maybeSingle() not single() for settings queries

---

## SETTINGS KEYS (JSONB)

```
business_info   → {name, phone, email, address, hours, tagline, industry, ...}
branding        → {logo_url, favicon_url, primary_color, accent_color, template}
                   template values: 'modern-pro' | 'bold-local' | 'clean-friendly' | 'rustic-rugged'
social_links    → {facebook, instagram, google, youtube, twitter}
integrations    → {google_place_id, facebook_page_id, facebook_access_token,
                   google_analytics_id, pexels_api_key,
                   textbelt_api_key, owner_sms_number, ayrshare_api_key}
onboarding_complete → true | false
subscription    → {tier: 1|2|3|4, plan_name, monthly_price}
demo_mode       → {active: boolean, seeded_at: string}
```

---

## SHELL SYSTEM ARCHITECTURE (S30)

### The Concept
Every client gets the same platform, same admin, same content DB.
The `branding.template` setting controls which visual shell the
public-facing site renders. Switching shells requires zero backend
work — it's a single settings value change.

### Template values + personalities
| Value | Shell Name | Vibe |
|-------|-----------|------|
| `modern-pro` | Modern Pro | Dark navy + emerald, sharp, tech-forward (current default) |
| `bold-local` | Bold & Local | Deep charcoal + amber gold, heavy type, established |
| `clean-friendly` | Clean & Friendly | White + sky blue, rounded, approachable (S31) |
| `rustic-rugged` | Rustic & Rugged | Warm browns + rust orange, earthy (S31) |

### Architecture
```
src/context/
  TemplateContext.tsx     ← reads branding.template, provides useTemplate()

src/shells/
  modern-pro/
    ShellNavbar.tsx       ← current Navbar styles formalized
    ShellHero.tsx         ← current Hero styles formalized
    ShellFooter.tsx       ← current Footer styles formalized
  bold-local/
    ShellNavbar.tsx       ← new S30
    ShellHero.tsx         ← new S30
    ShellFooter.tsx       ← new S30
  clean-friendly/         ← S31
  rustic-rugged/          ← S31

src/components/
  PublicShell.tsx         ← reads useTemplate(), renders correct shell Navbar + Footer
                             wraps all public pages
```

### How public pages use it
Each public page (Home, About, Contact, etc.) is wrapped in PublicShell.
PublicShell renders the correct Navbar and Footer based on template.
Hero section is rendered inside the page but reads template via useTemplate().

### Shell switcher in admin
Settings → Branding tab gets 4 visual preview cards.
Clicking a card saves `branding.template` and public site updates immediately.

---

## TIER GATING

Single canonical component: `src/components/common/FeatureGate.tsx`
Props: `minTier` (required), `featureName?`, `fallback?`
Import: `import { FeatureGate } from '../../components/common/FeatureGate'`

Shell selection is Tier 1 — available to all clients.

---

## EDGE FUNCTIONS

| Function | Status |
|---|---|
| `notify-new-lead` | ACTIVE |
| `send-review-request` | ACTIVE (v2) |
| `publish-scheduled-posts` | ACTIVE |
| `send-sms` | ACTIVE (Textbelt) |
| `send-onboarding-email` | ACTIVE (S29) |

---

## DESIGN SYSTEM — PER SHELL

### Modern Pro (current / default)
```
Navbar bg:     #0a0f1e (dark navy)
Accent:        #10b981 (emerald)
CTA:           emerald filled button
Hero bg:       dark navy with video/image overlay
Font:          Space Grotesk + Oswald
```

### Bold & Local (new S30)
```
Navbar bg:     #1c1c1c (deep charcoal)
Accent:        #d97706 (amber gold)
CTA:           amber filled button, slightly rounded
Hero bg:       full-bleed dark image, large Oswald headline, amber underline
Font:          Oswald heavy for headings, Raleway for body
Section style: dark/light alternating, strong dividers
Footer:        dark charcoal, amber link hover
```

### Clean & Friendly (S31)
```
Navbar bg:     white with subtle shadow
Accent:        #0284c7 (sky blue)
CTA:           sky blue rounded-full button
Hero bg:       light gradient or soft image
Font:          Raleway throughout, generous line height
```

### Rustic & Rugged (S31)
```
Navbar bg:     #3b1f0e (dark brown)
Accent:        #c2410c (rust orange)
CTA:           rust orange, square corners
Hero bg:       earthy textured overlay
Font:          Oswald + serif mix
```

---

## RULES (NEVER VIOLATE)

- Model is ALWAYS claude-sonnet-4-6
- Single useState object for forms — never per-field state
- NO `@/` path aliases — relative imports only
- Use maybeSingle() not single() for settings queries
- All files <200 lines — split before editing any file at limit
- Admin tabs lazy-loaded with React.lazy()
- PageHelpBanner on every admin tab
- Working directly on main — no PR needed
- Pest pages: YELLOW diagonal CTA | Location pages: DARK NAVY CTA
  (this applies to Modern Pro shell — other shells use their own CTA colors)
- Footer always has "Powered by PestFlow Pro" badge
- HolidayBanner ABOVE Navbar on all public pages
- Follow the session roadmap exactly
- Do NOT generate a context file — plain summary only at end

---

## PERMANENTLY OUT OF SCOPE

- Invoice generator / Customer portal / Technician calendar
- PDF reports / PDF export
- Self-serve pricing/signup page

---

## SESSION LOG

| Session | Date | Key Completions |
|---------|------|----------------|
| 1–24 | Mar–Apr 2026 | Full platform build, tier gating, file splits |
| 25 | Apr 2026 | Demo Mode, Team management tab |
| 26 | Apr 2026 | LeadSourceChart + SocialVolumeChart (Tier 3) |
| 27 | Apr 2026 | SMS via Textbelt, TCPA consent on forms |
| 28 | Apr 2026 | FeatureGate consolidated, Social Analytics (Tier 4), Ayrshare stub |
| 29 | Apr 2026 | Social Connections tab renames, Client Setup wizard (8 files), send-onboarding-email edge function |

---

## ROADMAP

| Session | Focus |
|---------|-------|
| **S30** | Shell infrastructure + Modern Pro + Bold & Local ← this session |
| **S31** | Clean & Friendly + Rustic & Rugged shells |
| **S32** | Customization layer (CTA text, trust badges, service icons) |
| **S33** | Client Setup wizard pre-populates settings on export |

---

## BUILD STATUS (end of S29)

- Build: ✅ 0 errors
- Main bundle: 408.49 kB (limit: 450 kB)
- All files under 200 lines ✅

---

## SESSION 30 STARTER BLOCK

```
Here is the full project context for PestFlow Pro. Read it completely before doing anything.

[paste full contents of this MD file]

Session 29 is complete. Social Connections tabs renamed. Client Setup wizard
live with 8 files. send-onboarding-email edge function deployed.
Build: 408.49 kB, 0 errors.

Session 30 goals — follow this order exactly:
1. TemplateContext + useTemplate() hook
2. Shell switcher UI in Settings → Branding (4 preview cards)
3. PublicShell wrapper component
4. Formalize Modern Pro shell components
5. Build Bold & Local shell

Do NOT generate the session 31 context file. End with a plain summary only.
Follow the session roadmap exactly. Log any conflicts in commit messages.

⚠️ Stop and output a summary at 50% context window.
```
