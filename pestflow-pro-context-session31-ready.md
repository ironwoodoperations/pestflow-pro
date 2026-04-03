# PestFlow Pro — Project Context (Session 31 Ready)
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
- Do NOT generate a session 32 context file. End with a plain summary only.

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

## SHELL SYSTEM — CURRENT STATE (post S30)

### Infrastructure ✅
- `src/context/TemplateContext.tsx` — reads `branding.template`, exposes `useTemplate()`
- `src/components/PublicShell.tsx` — wraps all 24 public routes, renders HolidayBanner + correct Navbar + Footer
- `src/App.tsx` — TemplateProvider added, all public routes in PublicShell
- Shell switcher UI in Settings → Branding ✅

### Shells built
| Shell | Status | Navbar | Hero | Footer |
|-------|--------|--------|------|--------|
| `modern-pro` | ✅ Complete | ShellNavbar | ShellHero | ShellFooter |
| `bold-local` | ✅ Complete | ShellNavbar | ShellHero | ShellFooter |
| `clean-friendly` | ⚠️ Fallback to base Navbar/Footer | — | — | — |
| `rustic-rugged` | ⚠️ Fallback to base Navbar/Footer | — | — | — |

### Shell directory structure
```
src/shells/
  modern-pro/
    ShellNavbar.tsx   ← dark navy #0a0f1e + emerald
    ShellHero.tsx     ← dark navy hero, emerald CTA
    ShellFooter.tsx   ← dark navy footer
  bold-local/
    ShellNavbar.tsx   ← charcoal #1c1c1c + amber #d97706
    ShellHero.tsx     ← bold hero, amber CTA, "Local. Trusted. Proven." badge
    ShellFooter.tsx   ← charcoal footer, amber accents
  clean-friendly/     ← BUILD IN S31
  rustic-rugged/      ← BUILD IN S31
```

### PublicShell fallback pattern (from src/components/PublicShell.tsx)
```tsx
// Currently:
'clean-friendly': ModernProNavbar, // fallback until S31
'rustic-rugged':  ModernProNavbar, // fallback until S31
// S31 replaces these with real shell components
```

---

## SHELL DESIGN SPECS FOR S31

### Clean & Friendly
```
Personality:   Bright, approachable, residential-focused
Best for:      Suburban markets, families, first-time homeowners

Navbar bg:     white with subtle bottom shadow (box-shadow: 0 1px 3px rgba(0,0,0,0.1))
Navbar text:   slate-700 (#334155)
Accent:        sky blue #0284c7
CTA button:    sky blue, rounded-full, white text
Logo area:     business name in Raleway, sky blue

Hero bg:       soft gradient — sky-50 to white, OR light background image with
               very light overlay (rgba(255,255,255,0.6))
Hero headline: slate-800, Raleway bold, friendly tone
Hero subhead:  slate-600, generous line height
Hero CTA:      "Get Your Free Quote" sky blue rounded-full button +
               "Call Us" white outline rounded-full button
Hero accent:   small green checkmark list: "Licensed & Insured", "Same-Day Service",
               "100% Satisfaction Guaranteed"

Section bg:    alternating white and sky-50
Card style:    white cards, rounded-xl, soft shadow
Section heads: Raleway, slate-800

Footer bg:     sky-900 (#0c4a6e)
Footer text:   sky-100
Footer links:  sky-300 hover white
"Powered by":  badge stays (required)
```

### Rustic & Rugged
```
Personality:   Earthy, trustworthy, small-town and rural feel
Best for:      Rural markets, owner-operators, agricultural areas

Navbar bg:     #3b1f0e (dark warm brown)
Navbar text:   #f5e6d3 (warm cream)
Accent:        #c2410c (rust orange)
CTA button:    rust orange, square corners (rounded-none or rounded-sm)
Logo area:     business name in Oswald, cream color

Hero bg:       dark earthy overlay (rgba(59,31,14,0.82)) over background image
Hero headline: Oswald, font-size 5xl, cream #f5e6d3, all-caps feel
Hero subhead:  cream at 80% opacity, Raleway
Hero CTA:      "Get a Free Estimate" rust orange square button +
               "Call Now" cream outline square button
Hero badge:    small rustic badge shape: "Serving [region] Since [year]"
               reads from business_info.founded_year

Section bg:    warm off-white #fdf8f3 and warm gray #f5ede3 alternating
Card style:    white cards, rounded-md, warm shadow
Section heads: Oswald, #3b1f0e

Footer bg:     #3b1f0e (dark warm brown)
Footer text:   #f5e6d3 (warm cream)
Footer accent: rust orange #c2410c
"Powered by":  badge stays (required)
```

---

## SETTINGS KEYS (JSONB)

```
business_info   → {name, phone, email, address, hours, tagline, industry,
                   founded_year, num_technicians, certifications}
branding        → {logo_url, favicon_url, primary_color, accent_color,
                   template: 'modern-pro'|'bold-local'|'clean-friendly'|'rustic-rugged'}
hero_media      → {youtube_id, thumbnail_url}
social_links    → {facebook, instagram, google, youtube, twitter}
integrations    → {google_place_id, facebook_page_id, facebook_access_token,
                   google_analytics_id, pexels_api_key,
                   textbelt_api_key, owner_sms_number, ayrshare_api_key}
```

---

## RULES (NEVER VIOLATE)

- Model is ALWAYS claude-sonnet-4-6
- Single useState object for forms — never per-field state
- NO `@/` path aliases — relative imports only
- Use maybeSingle() not single() for settings queries
- All files <200 lines — split before editing any file at limit
- Working directly on main — no PR needed
- Footer always has "Powered by PestFlow Pro" badge — ALL shells
- HolidayBanner ABOVE Navbar on all public pages (PublicShell handles this)
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
| 1–29 | Mar–Apr 2026 | Full platform build, tier gating, SMS, Client Setup wizard |
| 30 | Apr 2026 | Shell infrastructure: TemplateContext, PublicShell, shell switcher UI, Modern Pro + Bold & Local shells (24 files) |

---

## ROADMAP

| Session | Focus |
|---------|-------|
| **S31** | Clean & Friendly + Rustic & Rugged shells ← this session |
| **S32** | Customization layer (CTA text, trust badges, service icons) |
| **S33** | Client Setup wizard pre-populates settings on export |

---

## BUILD STATUS (end of S30)

- Build: ✅ 0 errors, 2.11s
- Main bundle: clean (shell chunks lazy-loaded via PublicShell)
- All files under 200 lines ✅
- Shell switching: live on site ✅

---

## SESSION 31 STARTER BLOCK

```
Here is the full project context for PestFlow Pro. Read it completely before doing anything.

[paste full contents of this MD file]

Session 30 is complete. Shell infrastructure is live. Modern Pro and Bold & Local
shells are fully built. Clean & Friendly and Rustic & Rugged currently fall back
to the base Navbar/Footer. Build: 0 errors.

Session 31 goals — follow this order exactly:
1. Build Clean & Friendly shell (ShellNavbar, ShellHero, ShellFooter)
2. Build Rustic & Rugged shell (ShellNavbar, ShellHero, ShellFooter)
3. Wire both into PublicShell — replace the fallback imports

Do NOT generate the session 32 context file. End with a plain summary only.
Follow the session roadmap exactly. Log any conflicts in commit messages.

⚠️ Stop and output a summary at 50% context window.
```
