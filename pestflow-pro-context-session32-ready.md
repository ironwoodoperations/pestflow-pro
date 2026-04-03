# PestFlow Pro — Project Context (Session 32 Ready)
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
- Do NOT generate a session 33 context file. End with a plain summary only.

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

## ⚠️ BUNDLE SIZE WARNING
Main bundle is at 439.94 KB — only 10 KB under the 450 KB hard limit.
- All new UI components must be small and lean
- Do NOT import any new heavy libraries into the main bundle
- Edge function changes have zero bundle impact (server-side)
- If build exceeds 450 KB, find and remove unused imports before finishing

---

## SHELL SYSTEM — CURRENT STATE (all 4 complete ✅)

```
src/shells/
  modern-pro/     ShellNavbar, ShellHero, ShellFooter  ✅
  bold-local/     ShellNavbar, ShellHero, ShellFooter  ✅
  clean-friendly/ ShellNavbar, ShellHero, ShellFooter  ✅
  rustic-rugged/  ShellNavbar, ShellHero, ShellFooter  ✅

src/components/PublicShell.tsx  — all 4 wired, no fallbacks ✅
src/context/TemplateContext.tsx — reads branding.template ✅
```

Shell switcher in Settings → Branding: all 4 cards selectable ✅

---

## SETTINGS KEYS (JSONB)

```
business_info   → {name, phone, email, address, hours, tagline, industry,
                   license, certifications, founded_year, num_technicians}
branding        → {logo_url, favicon_url, primary_color, accent_color,
                   template, cta_text}              ← cta_text NEW S32
customization   → {show_license: bool,              ← NEW S32
                   show_years: bool,
                   show_technicians: bool,
                   show_certifications: bool,
                   hero_headline: string}
hero_media      → {youtube_id, thumbnail_url}
social_links    → {facebook, instagram, google, youtube, twitter}
integrations    → {google_place_id, facebook_page_id, facebook_access_token,
                   google_analytics_id, pexels_api_key,
                   textbelt_api_key, owner_sms_number, ayrshare_api_key}
```

---

## FACEBOOK + AYRSHARE — CURRENT STATE

### Facebook (direct posting)
- Page ID + Access Token stored in `integrations` settings ✅
- `publish-scheduled-posts` edge function posts to FB Graph API v19.0 ✅
- Gap: no UX guidance for how to get credentials — confusing for clients

### Ayrshare (stub only)
- API key field in Integrations settings (Tier 4 gated) ✅
- Connection status badge in Social Connections modal ✅
- Gap: no actual posting through Ayrshare yet

### S32 posting logic
When a post is published (manual or scheduled):
1. Check if `ayrshare_api_key` is set in integrations
2. If YES → post via Ayrshare API (supports FB, IG, Twitter/X, LinkedIn, TikTok, etc.)
3. If NO → fall back to direct FB Graph API (existing behavior)

Ayrshare API endpoint: `https://app.ayrshare.com/api/post`
Headers: `{ Authorization: 'Bearer {ayrshare_api_key}', 'Content-Type': 'application/json' }`
Body: `{ post: caption, platforms: ['facebook', 'instagram'], mediaUrls: [image_url] }`
Response: `{ status: 'success', postIds: {...} }`

---

## EDGE FUNCTIONS

| Function | Status | Notes |
|---|---|---|
| `notify-new-lead` | ACTIVE | Resend email on new lead |
| `send-review-request` | ACTIVE (v2) | From: no-reply@pestflow.ai |
| `publish-scheduled-posts` | ACTIVE | UPDATE in S32 — add Ayrshare routing |
| `send-sms` | ACTIVE | Textbelt |
| `send-onboarding-email` | ACTIVE | From: onboarding@pestflow.ai |

---

## RULES (NEVER VIOLATE)

- Model is ALWAYS claude-sonnet-4-6
- Single useState object for forms — never per-field state
- NO `@/` path aliases — relative imports only
- Use maybeSingle() not single() for settings queries
- All files <200 lines — split before editing any file at limit
- Working directly on main — no PR needed
- Footer "Powered by PestFlow Pro" badge on ALL shells
- Follow the session roadmap exactly
- Do NOT generate a context file — plain summary only at end
- Watch bundle size — currently 439.94 KB, limit 450 KB

---

## SESSION LOG

| Session | Date | Key Completions |
|---------|------|----------------|
| 1–29 | Mar–Apr 2026 | Full platform, tier gating, SMS, Client Setup wizard |
| 30 | Apr 2026 | Shell infrastructure + Modern Pro + Bold & Local (24 files) |
| 31 | Apr 2026 | Clean & Friendly + Rustic & Rugged shells, all 4 wired in PublicShell |

---

## ROADMAP

| Session | Focus |
|---------|-------|
| **S32** | Customization layer + Ayrshare posting + Facebook UX ← this session |
| **S33** | Client Setup wizard pre-populates settings on export |

---

## BUILD STATUS (end of S31)

- Build: ✅ 0 errors
- Main bundle: 439.94 kB (limit: 450 kB) ⚠️ close
- All 4 shells: live and selectable ✅

---

## SESSION 32 STARTER BLOCK

```
Here is the full project context for PestFlow Pro. Read it completely before doing anything.

[paste full contents of this MD file]

Session 31 is complete. All 4 shells live — Modern Pro, Bold & Local,
Clean & Friendly, Rustic & Rugged. No fallbacks remaining in PublicShell.
Build: 439.94 kB (10 kB under limit — be careful about bundle size this session).

Session 32 goals — follow this order exactly:
1. Customization layer — CTA text, trust badges, hero headline (settings-driven)
2. Ayrshare actual posting — update publish-scheduled-posts edge function
3. Facebook connection UX — better guidance in Integrations settings

Do NOT generate the session 33 context file. End with a plain summary only.
Follow the session roadmap exactly. Log any conflicts in commit messages.

⚠️ Stop and output a summary at 50% context window.
⚠️ Watch bundle size — currently 439.94 kB, hard limit 450 kB.
```
