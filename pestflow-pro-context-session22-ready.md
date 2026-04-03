# PestFlow Pro — Session 22 Context File
_Last updated: 2026-04-03 (end of Session 21)_

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
| 1–9     | Mar 2026   | (see SKILL.md for full log) |
| 10–19   | Mar 2026   | (see SKILL.md for full log) |
| 20      | Apr 2026   | Fix review request from address → no-reply@pestflow.ai (v2 deployed), email_override support in edge fn, onboarding wizard split + social links step + hours field + /admin/dashboard fix |
| 21      | Apr 2026   | Task 1: author_email on testimonials (migration + form field + review request button with sent-state tracking). Task 2: PageHelpBanner on all admin tabs — ContentTab split into ContentPageForm.tsx, BlogTab/LocationsTab inline banners replaced, TestimonialsTab inline banner replaced. Task 3: Footer social icons now wired to social_links settings key. Hours confirms rendering in Footer contact column. |

---

## KNOWN ISSUES

### Blocking S22
- **Dashboard onboarding CTA not gated by flag** — `onboarding_complete` is saved on wizard finish but Dashboard never reads it. A "Complete your setup" prompt should appear until the flag is set. Blocked by Dashboard.tsx being 399 lines — needs splitting before editing. Split DashboardHome into `src/components/admin/DashboardHome.tsx` first, then add the onboarding CTA banner there.

### Non-blocking / Low priority
- PWA icons are placeholder — need real branded assets before client launch
- OnboardingLive screen-share mode not tested end-to-end
- Google Reviews import requires VITE_GOOGLE_PLACES_API_KEY in Vercel env
- Footer social icons render as plain text (FB, IG, G, YT) — could upgrade to SVG icons if desired

---

## EDGE FUNCTIONS

| Function | Status | Notes |
|---|---|---|
| `notify-new-lead` | ACTIVE | Sends email on new lead via Resend |
| `send-review-request` | ACTIVE (v2) | From: `PestFlow Pro <no-reply@pestflow.ai>`. Supports `{ lead_id, tenant_id }` OR `{ tenant_id, email_override, name_override }` |

---

## TESTIMONIALS (as of S21)

**Table columns:** id, tenant_id, author_name, author_email (NEW), review_text, rating, featured, source, google_review_id, created_at

**Files:**
- `src/components/admin/TestimonialsTab.tsx` (159 lines) — main orchestrator
- `src/components/admin/TestimonialCard.tsx` (NEW) — card with Request Review button
- `src/components/admin/TestimonialModal.tsx` (NEW) — add/edit modal with author_email field

**Review Request button behavior:**
- Only shows if `testimonial.author_email` is truthy
- Tracks `sentIds` in local `Set<string>` state — replaced with "✅ Sent" badge after send
- POSTs to `send-review-request` edge function with `email_override` + `name_override`

---

## ADMIN TAB STATUS (PageHelpBanner audit S21)

| Tab | Has PageHelpBanner | Line count | Notes |
|---|---|---|---|
| CRMTab | ✅ | 325 | Needs splitting before next edit |
| ContentTab | ✅ | 138 | Split — ContentPageForm.tsx extracted |
| SocialTab | ✅ | 109 | OK |
| SEOTab | ✅ | 335 | Needs splitting before next edit |
| ReportsTab | ✅ | 198 | OK |
| BlogTab | ✅ | 184 | Replaced inline banner |
| LocationsTab | ✅ | 177 | Replaced inline banner |
| TestimonialsTab | ✅ | 159 | Replaced inline banner |
| SettingsTab | ✅ (check) | — | In settings/ subfolder |
| Dashboard home | N/A (not a tab) | 399 | Needs splitting before editing |

---

## KEY FILE PATHS (additions/changes since S20)

```
src/components/admin/TestimonialCard.tsx      ← NEW S21
src/components/admin/TestimonialModal.tsx     ← NEW S21
src/components/admin/ContentPageForm.tsx      ← NEW S21 (split from ContentTab)
src/components/Footer.tsx                    ← Updated S21 (social_links wired)
supabase/functions/send-review-request/      ← Updated S20 (email_override support)
src/components/admin/onboarding/             ← S20 (sub-components)
```

---

## SESSION 22 PLAN

### Priority 1 — Dashboard: Onboarding CTA + Split
1. Split `src/pages/admin/Dashboard.tsx` (399 lines) — extract `DashboardHome` inner function to `src/components/admin/DashboardHome.tsx`
2. In `DashboardHome.tsx`, fetch `onboarding_complete` settings key
3. Show a dismissible "Complete your setup" banner when `complete !== true`
   - Banner links to `/admin/onboarding`
   - Should be prominent but not blocking
   - Disappear immediately after user dismisses (local state) or after onboarding is complete

### Priority 2 — CRMTab Split (325 lines)
- CRMTab must be split before it can be safely edited
- Extract lead card component and/or modal to sub-components
- File: `src/components/admin/CRMTab.tsx`

### Priority 3 — SEOTab Split (335 lines)
- Same — needs splitting before any future edits
- Extract SERP preview panel or keyword section as sub-component

### Priority 4 — Footer Social Icons Polish
- Replace text labels (FB, IG, G, YT) with proper SVG icons
- Consider importing from lucide-react or inline SVG

---

## SESSION 22 STARTER BLOCK

```
PESTFLOW PRO — SESSION 22 CLAUDE CODE PROMPT
============================================================
Read CLAUDE.md and SKILL.md in full before touching any file.
Commit after every task.

TASK 1 — SPLIT DASHBOARD + ONBOARDING CTA BANNER
============================================================
File: src/pages/admin/Dashboard.tsx (399 lines — must split before editing)

Step 1: Extract the DashboardHome inner function (starting at line ~175)
into its own file: src/components/admin/DashboardHome.tsx
Keep the same logic. Import it back into Dashboard.tsx.
After extraction, Dashboard.tsx should be under 200 lines.

Step 2: In DashboardHome.tsx, add onboarding_complete check:
- Fetch settings key 'onboarding_complete' for the tenant
- If value.complete is not true, show a banner at the top:
  "⚡ Finish setting up your site — a few more steps to go live."
  with a link button: "Continue Setup →" pointing to /admin/onboarding
- Banner should be dismissible (local state) — once dismissed, hide for the session
- Style: yellow/amber background, consistent with dashboard UI

Commit: "feat: split DashboardHome + onboarding setup CTA banner"

TASK 2 — SPLIT CRMTab (325 lines)
============================================================
File: src/components/admin/CRMTab.tsx (325 lines — must split before editing)

Extract the lead detail modal/panel into a sub-component:
  src/components/admin/CRMLeadModal.tsx (or similar)
Keep the lead list in CRMTab.tsx.
After split, both files should be under 200 lines.

Commit: "refactor: split CRMTab — extract CRMLeadModal sub-component"

TASK 3 — FOOTER SOCIAL ICONS POLISH (optional)
============================================================
File: src/components/Footer.tsx
Replace the text labels (FB, IG, G, YT) with proper icon links.
Use lucide-react icons: Facebook, Instagram, Youtube — or inline SVG for Google.
Keep the same conditional render logic (only show if value is truthy).

Commit: "polish: footer social icons — replace text labels with icons"

FINAL STEPS (every session)
============================================================
1. npm run build — must be 0 errors, ≤450KB main bundle
2. git add . && git commit -m "session 22 complete" && git push
3. Create pestflow-pro-context-session23-ready.md
```

---

## BUILD STATUS (end of S21)

- Build: ✅ 0 errors
- Main bundle: 406.45 kB (limit: 450 kB) — OK
- All admin tabs: lazy-loaded with React.lazy ✅
- All admin tabs: PageHelpBanner present ✅
