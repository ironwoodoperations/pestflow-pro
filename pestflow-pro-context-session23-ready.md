# PestFlow Pro — Session 23 Context File
_Last updated: 2026-04-03 (end of Session 22)_

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
| 1–19    | Mar 2026   | (see SKILL.md for full log) |
| 20      | Apr 2026   | Fix review from address → no-reply@pestflow.ai (edge fn v2), email_override support, onboarding wizard split + social links step + hours field + /admin/dashboard fix |
| 21      | Apr 2026   | author_email migration + testimonial review request button, PageHelpBanner audit (ContentTab split, BlogTab/LocationsTab inline banners replaced), footer social icons wired to DB |
| 22      | Apr 2026   | Split Dashboard.tsx → DashboardHome.tsx + NotificationBell.tsx + onboarding CTA banner. Split CRMTab.tsx → crm/LeadTable + crm/LeadDetailModal + crm/types. Footer social text labels → inline SVG icons with aria-labels. |

---

## KNOWN ISSUES

### Non-blocking / Low priority
- SEOTab.tsx is 335 lines — needs splitting before next edit
- PWA icons are placeholder — need real branded assets before client launch
- OnboardingLive screen-share mode not tested end-to-end
- Google Reviews import requires VITE_GOOGLE_PLACES_API_KEY in Vercel env

---

## FILE STRUCTURE (key additions S22)

```
src/components/admin/dashboard/
  DashboardHome.tsx          ← NEW S22 (extracted from Dashboard.tsx)
src/components/admin/
  NotificationBell.tsx       ← NEW S22 (extracted from Dashboard.tsx)
src/components/admin/crm/
  types.ts                   ← NEW S22 (Lead, STATUSES, STATUS_BADGE, PER_PAGE)
  LeadTable.tsx              ← NEW S22 (table + notes rows + pagination)
  LeadDetailModal.tsx        ← NEW S22 (lead detail modal)
src/pages/admin/
  Dashboard.tsx              ← Refactored S22 (159 lines, thin orchestrator)
src/components/
  Footer.tsx                 ← Updated S22 (inline SVG social icons)
```

## FILE LINE COUNTS (all must stay under 200 before editing)

| File | Lines | Status |
|---|---|---|
| Dashboard.tsx | 159 | ✅ |
| DashboardHome.tsx | 152 | ✅ |
| NotificationBell.tsx | 71 | ✅ |
| CRMTab.tsx | 143 | ✅ |
| crm/LeadTable.tsx | 118 | ✅ |
| crm/LeadDetailModal.tsx | 54 | ✅ |
| ContentTab.tsx | 138 | ✅ |
| ContentPageForm.tsx | 57 | ✅ |
| BlogTab.tsx | 184 | ✅ |
| LocationsTab.tsx | 177 | ✅ |
| TestimonialsTab.tsx | 159 | ✅ |
| TestimonialCard.tsx | 65 | ✅ |
| TestimonialModal.tsx | 64 | ✅ |
| SEOTab.tsx | 335 | ⚠️ MUST SPLIT before next edit |
| SocialTab.tsx | 109 | ✅ |
| ReportsTab.tsx | 198 | ✅ |
| Footer.tsx | ~130 | ✅ |

---

## ONBOARDING CTA BANNER (DashboardHome.tsx)

Shows amber banner "Complete your setup → Finish Setup" when:
- `onboarding_complete` settings key is missing, OR
- `onboarding_complete.value.complete !== true`

Fetched in Dashboard.tsx via `Promise.all` alongside `business_info`.
Passed as `onboardingComplete: boolean` prop to DashboardHome.

---

## EDGE FUNCTIONS

| Function | Status | Notes |
|---|---|---|
| `notify-new-lead` | ACTIVE | Sends email on new lead via Resend |
| `send-review-request` | ACTIVE (v2) | From: `PestFlow Pro <no-reply@pestflow.ai>`. Supports `{ lead_id, tenant_id }` OR `{ tenant_id, email_override, name_override }` |

---

## SESSION 23 PLAN — TIER GATING INFRASTRUCTURE

### Context
The admin sidebar already has a `usePlan` hook with `canAccess(tier)` and a `TierToggle` for demos. S23 should build out the tier gating UX properly, including a proper upgrade prompt.

### Priority 1 — Upgrade Prompt Modal
When a locked tab is clicked (blog, seo, social, reports) show a modal or banner:
- "Upgrade to unlock [Tab Name]"
- Brief 1-line description of what the tab does
- CTA button: "Contact us to upgrade" (mailto: or link to pricing page if it exists)
- Do NOT block the tab from loading — just show the prompt prominently

### Priority 2 — Split SEOTab.tsx (335 lines — MUST split before editing)
File: `src/components/admin/SEOTab.tsx`
Expected sub-components:
- `src/components/admin/seo/SEOPageList.tsx` — left sidebar page selector
- `src/components/admin/seo/SEOForm.tsx` — right panel form
- `src/components/admin/seo/SEOKeywords.tsx` — keyword tracker section
SEOTab.tsx becomes orchestrator.

### Priority 3 — Settings page audit
Confirm Settings tabs all have PageHelpBanner.
File path: `src/components/admin/settings/` — check all files in this folder.

---

## SESSION 23 STARTER BLOCK

```
PESTFLOW PRO — SESSION 23 CLAUDE CODE PROMPT
============================================================
Read CLAUDE.md and SKILL.md in full before touching any file.
Commit after every task.

TASK 1 — SPLIT SEOTab.tsx (335 lines)
============================================================
File: src/components/admin/SEOTab.tsx (335 lines — must split before ANY edits)

Read the file in full. Identify logical sub-sections and extract them:
- src/components/admin/seo/SEOKeywords.tsx — keyword tracker UI
- src/components/admin/seo/SEOForm.tsx — the page-level meta form
SEOTab.tsx becomes orchestrator with PageHelpBanner at top.
All resulting files must be under 200 lines.

Commit: "refactor: split SEOTab.tsx into SEOForm + SEOKeywords sub-components"

TASK 2 — UPGRADE PROMPT ON LOCKED TABS
============================================================
File: src/pages/admin/Dashboard.tsx

When a user clicks a tab with a lock icon (blog, seo, social, reports),
instead of silently ignoring, show an upgrade prompt.

Add a modal/dialog state in Dashboard.tsx:
- When a locked tab is clicked, set state: { open: true, tabLabel: 'Blog' }
- Render a simple modal:
  "🔒 [Tab Name] is available on the Pro plan"
  + brief description of the feature
  + "Contact us to upgrade" button (mailto:scott@ironwoodoperations.com)
  + Close button
- If user is already on the right tier, the tab opens normally

Commit: "feat: upgrade prompt modal for locked admin tabs"

TASK 3 — SETTINGS TAB PAGEHELP BANNER AUDIT
============================================================
Find all files in src/components/admin/settings/
Read each one. Add PageHelpBanner if missing.

Commit: "fix: PageHelpBanner on settings sub-tabs"

FINAL STEPS (every session)
============================================================
1. npm run build — must be 0 errors, ≤450KB main bundle
2. git add . && git commit -m "session 23 complete" && git push
3. Create pestflow-pro-context-session24-ready.md
```

---

## BUILD STATUS (end of S22)

- Build: ✅ 0 errors
- Main bundle: 407.68 kB (limit: 450 kB) — OK
- All admin tab files under 200 lines (except SEOTab at 335)
- PageHelpBanner: present on all admin tabs ✅
- Onboarding CTA banner: live in DashboardHome ✅
- Footer social icons: inline SVG (FB/IG/YT) + Globe for Google ✅
