# PestFlow Pro — Session 21 Context File
_Last updated: 2026-04-03 (end of Session 20)_

---

## CRITICAL CONSTANTS (never change)

```
Live URL:       https://pestflow-pro.vercel.app
GitHub:         https://github.com/ironwoodoperations/pestflow-pro
Supabase URL:   https://biezzykcgzkrwdgqpsar.supabase.co
Supabase ID:    biezzykcgzkrwdgqpsar
Tenant ID:      9215b06b-3eb5-49a1-a16e-7ff214bf6783
Admin login:    admin@pestflowpro.com / pf123demo
Dev server:     npm run dev  →  localhost:8080
Model:          claude-sonnet-4-6 (ALWAYS)
```

---

## SESSION LOG

| Session | Date       | Completions |
|---------|------------|-------------|
| 1       | Mar 2026   | Scaffold, Supabase migrations, auth, admin shell, onboarding wizard |
| 2       | Mar 2026   | Vercel config, template system, Navbar, Footer, Home page, QuotePage, ContactPage, SlugRouter, LocationPage, Settings Business Info + Branding |
| 3       | Mar 2026   | Theme overhaul (orange→dark navy+emerald), all 12 pest pages, About/FAQ/Reviews/ServiceArea/Blog, StructuredData, ContentTab, SocialLinks, Notifications, Navbar dropdown |
| 4       | Mar 2026   | SEO tab + SERP preview, Testimonials CRUD, Leads tab + CSV export, Blog CRUD, Locations CRUD, AI keyword research, Integrations settings, Hero Media settings, StructuredData all pages, HolidayBanner, Reports + Social stubs |
| 5       | Mar 2026   | 4-step quote wizard, lead email notifications, Google Reviews import, Facebook social posting, sitemap.xml, robots.txt, PageSpeed optimizations, Pricing page, multi-tenant docs |
| 6       | Mar 2026   | Domain setup guide, page content seeding script, Maps embed, We Also Serve, AI content writer, hero video player, PWA manifest, 404 page, accessibility fixes |
| 6.1     | Mar 2026   | Merged PR, PESTFLOW-SKILL.md created, TASKS.md updated |
| 7       | Mar 2026   | HeroVideoPlayer (youtube-nocookie), branded 404 page, PWA manifest + icons, bulk keyword sync |
| 8       | Mar 2026   | Remove Pricing page, rustic template, Pexels stock images, Apex About page, polished onboarding, OnboardingLive screen-share mode |
| 9       | Mar 2026   | Ironclad rebrand, demo content seed, font fix, About rewrite, PestFlow Pro footer badge, review_text column fix, Pexels portraits |
| 10–19   | Mar 2026   | (see SKILL.md for full log) |
| 20      | Apr 2026   | Task 1: Fixed review request from address → no-reply@pestflow.ai, redeployed edge function (v2), added email_override + name_override support. Task 2: Onboarding wizard split into sub-components (was 303 lines), added hours field, social links step, fixed navigate to /admin/dashboard. Task 3: Chore note — author_email column missing from testimonials table. |

---

## KNOWN ISSUES

### Blocking S21
- **author_email missing from testimonials** — Need migration to add column before review request button can be built on testimonial cards. Edge function already supports `email_override`/`name_override`.

### Non-blocking / Low priority
- PWA icons are placeholder — need real branded assets before client launch
- OnboardingLive screen-share mode not tested end-to-end
- Google Reviews import requires VITE_GOOGLE_PLACES_API_KEY in Vercel env

---

## EDGE FUNCTIONS

| Function | Status | Notes |
|---|---|---|
| `notify-new-lead` | ACTIVE | Sends email on new lead via Resend |
| `send-review-request` | ACTIVE (v2) | From: `PestFlow Pro <no-reply@pestflow.ai>`. Supports `{ lead_id, tenant_id }` OR `{ tenant_id, email_override, name_override }` |

**To test send-review-request:**
1. Set `google_place_id` in Settings → Integrations (any valid Place ID)
2. Change any lead status to 'won' in CRM tab
3. Should see toast: "✅ Review request sent to {name}"
4. If no google_place_id: shows "Add a Google Place ID" info toast (expected)

---

## ONBOARDING WIZARD (as of S20)

**File:** `src/pages/admin/Onboarding.tsx` (~110 lines, orchestrator only)

**Sub-components** (all in `src/components/admin/onboarding/`):
- `types.ts` — FormData interface + INITIAL_FORM + INPUT_CLASS
- `StepWelcome.tsx`
- `StepBusinessInfo.tsx` — name, phone, email, address, **hours**, tagline, license, industry
- `StepSocialLinks.tsx` — facebook, instagram, google, youtube (NEW in S20)
- `StepBranding.tsx` — logo, primaryColor, accentColor, template
- `StepLocations.tsx` — city/slug pairs (up to 6)
- `StepReview.tsx` — summary + launch

**Steps:** 1=Welcome, 2=Business Info, 3=Social Links, 4=Branding, 5=Locations, 6=Launch (total: 6)

**handleLaunch saves:** business_info (with hours), branding, social_links, onboarding_complete  
**On finish:** navigates to `/admin/dashboard`  
**Double-submit guard:** `saving` state, button disabled while saving

---

## KEY FILE PATHS (additions/changes since S15)

```
src/components/admin/onboarding/          ← NEW in S20 (split from Onboarding.tsx)
supabase/functions/send-review-request/   ← Updated S20 (from address + email_override support)
src/components/admin/CRMTab.tsx           ← Lead won → review request trigger
src/components/admin/ReportsTab.tsx       ← Blog analytics section (S19)
```

---

## SESSION 21 PLAN

### Priority 1 — Testimonials: author_email column + Review Request button
1. Run migration: `ALTER TABLE testimonials ADD COLUMN author_email text;`
2. Update TestimonialsTab.tsx to show/edit author_email field on each testimonial
3. Add "Request Review" button (Mail icon) on each row:
   - Only visible if author_email is set
   - POST to send-review-request: `{ tenant_id, email_override, name_override }`
   - Show "✅ Sent" inline after click (local state only, no DB persistence)
   - Grey out / hide button after sent (session-only)

### Priority 2 — Admin UX Polish
- Verify PageHelpBanner appears on every admin tab (audit all tabs)
- Check all admin tabs load correctly (lazy-loaded with React.lazy)
- Confirm Settings tabs save correctly after onboarding wizard changes

### Priority 3 — Public Site Polish
- Confirm "hours" field from business_info renders correctly in footer/contact page
- Confirm social_links from onboarding wizard feeds through to Footer social icons
- Test the full onboarding flow end-to-end on a fresh tenant

---

## SESSION 21 STARTER BLOCK

```
PESTFLOW PRO — SESSION 21 CLAUDE CODE PROMPT
============================================================
Read CLAUDE.md and SKILL.md in full before touching any file.
Commit after every task.

TASK 1 — ADD author_email TO TESTIMONIALS + REVIEW REQUEST BUTTON
============================================================
Step 1: Run migration via Supabase MCP:
  ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS author_email text;

Step 2: Read src/components/admin/TestimonialsTab.tsx in full.
Add author_email field to the add/edit testimonial form.
Save is already handled by existing upsert — just add the field to the
upsert payload.

Step 3: Add a "Request Review" button (Mail icon from lucide-react) to each
testimonial row/card. Requirements:
- Only show if testimonial.author_email is truthy
- On click: POST to Supabase edge function send-review-request:
  { tenant_id, email_override: testimonial.author_email, name_override: testimonial.author_name }
- Use fetch to the function URL (get from supabase client config)
- Show inline "✅ Sent" feedback after success, error state on failure
- Local state only — use a Set<string> of testimonial IDs that were sent this session
- Do not show button again after sent (replace with sent badge)

Commit: "feat: author_email on testimonials + review request button"

TASK 2 — AUDIT PageHelpBanner ON ALL ADMIN TABS
============================================================
Check that every admin tab has a <PageHelpBanner /> at the top.
Look in src/components/admin/ for all *Tab.tsx files.
Add it to any that are missing.

Commit: "fix: add PageHelpBanner to admin tabs missing it"

FINAL STEPS (every session)
============================================================
1. npm run build — must be 0 errors, ≤450KB main bundle
2. git add . && git commit -m "session 21 complete" && git push
3. Create pestflow-pro-context-session22-ready.md
```

---

## BUILD STATUS (end of S20)

- Build: ✅ 0 errors
- Main bundle: 405.48 kB (limit: 450 kB) — OK
- Onboarding bundle: 19.72 kB (sub-components lazy-loaded together)
- All admin tabs: lazy-loaded with React.lazy ✅
