# PestFlow Pro — Session 24 Context File
_Last updated: 2026-04-03 (end of Session 23)_

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
| 23      | Apr 2026   | Tier gating infrastructure: PlanContext (single provider, context-based), common/FeatureGate (tier prop + upgrade CTA), usePlan.ts → re-exports from PlanContext, App.tsx wrapped with PlanProvider, BlogTab gated at tier 2, subscription row seeded (tier 4 Elite). |

---

## KNOWN ISSUES

### Must fix before editing
- SEOTab.tsx is 335 lines — MUST SPLIT before next edit
- SettingsTab.tsx is 729 lines — MUST SPLIT before any edit (zero PageHelpBanner yet)

### Non-blocking / Low priority
- PWA icons are placeholder — need real branded assets before client launch
- OnboardingLive screen-share mode not tested end-to-end
- Google Reviews import requires VITE_GOOGLE_PLACES_API_KEY in Vercel env

---

## FILE STRUCTURE (key additions S23)

```
src/context/
  PlanContext.tsx             ← NEW S23 (PlanProvider + usePlan from context)
src/components/common/
  FeatureGate.tsx             ← NEW S23 (tier prop, fallback prop, upgrade CTA)
src/components/admin/
  usePlan.ts                  ← Updated S23 (re-exports usePlan from PlanContext)
  BlogTab.tsx                 ← Updated S23 (FeatureGate tier={2} below PageHelpBanner)
src/App.tsx                   ← Updated S23 (PlanProvider wraps BrowserRouter content)
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
| BlogTab.tsx | 186 | ✅ |
| LocationsTab.tsx | 177 | ✅ |
| TestimonialsTab.tsx | 159 | ✅ |
| TestimonialCard.tsx | 65 | ✅ |
| TestimonialModal.tsx | 64 | ✅ |
| SEOTab.tsx | 335 | ⚠️ MUST SPLIT before next edit |
| SocialTab.tsx | 109 | ✅ |
| ReportsTab.tsx | 198 | ✅ |
| Footer.tsx | ~130 | ✅ |
| SettingsTab.tsx | 729 | ⚠️ MUST SPLIT — add PageHelpBanner after split |
| context/PlanContext.tsx | ~68 | ✅ |
| common/FeatureGate.tsx | ~35 | ✅ |

---

## TIER GATING ARCHITECTURE (S23)

### PlanContext (`src/context/PlanContext.tsx`)
- Exports: `PlanProvider`, `usePlan`
- Reads `subscription` settings key → `{ tier, plan_name, monthly_price }`
- Default tier = 1 (Starter) until DB resolves
- `canAccess(minTier)` → `tier >= minTier`
- `setTier(n)` → upserts to DB + refreshes
- Wrapped in App.tsx inside BrowserRouter

### usePlan (`src/components/admin/usePlan.ts`)
- Re-exports `usePlan` from `../../context/PlanContext`
- TierToggle and existing admin FeatureGate still import from this path and work correctly

### FeatureGate — two versions
| File | Props | Used by |
|---|---|---|
| `src/components/admin/FeatureGate.tsx` | `minTier, featureName` | SEOTab (existing, do not break) |
| `src/components/common/FeatureGate.tsx` | `tier, fallback?` | BlogTab (new, preferred for new usage) |

### Subscription settings row (seeded S23)
```json
{ "tier": 4, "plan_name": "Elite", "monthly_price": 499 }
```
Demo tenant is on Elite — all features unlocked for demos.

### Tier map
| Tier | Plan | Price |
|---|---|---|
| 1 | Starter | $149/mo |
| 2 | Grow | $249/mo |
| 3 | Pro | $349/mo |
| 4 | Elite | $499/mo |

### Gated tabs (require tier ≥ 2)
- Blog (`<FeatureGate tier={2}>` in BlogTab.tsx below PageHelpBanner)
- SEO (`<FeatureGate minTier={2}>` in SEOTab.tsx)
- Social — sidebar lock icon only (no FeatureGate inside tab yet)
- Reports — sidebar lock icon only (no FeatureGate inside tab yet)

---

## EDGE FUNCTIONS

| Function | Status | Notes |
|---|---|---|
| `notify-new-lead` | ACTIVE | Sends email on new lead via Resend |
| `send-review-request` | ACTIVE (v2) | From: `PestFlow Pro <no-reply@pestflow.ai>`. Supports `{ lead_id, tenant_id }` OR `{ tenant_id, email_override, name_override }` |

---

## SESSION 24 PLAN

### Priority 1 — Split SEOTab.tsx (335 lines — MUST split before editing)
File: `src/components/admin/SEOTab.tsx`
Already has sub-components in `src/components/admin/seo/`. Orchestrator is still 335 lines.
Read it in full first to see what is NOT yet extracted. Split so orchestrator is under 200 lines.

### Priority 2 — Split + audit SettingsTab.tsx (729 lines)
File: `src/components/admin/settings/SettingsTab.tsx`
Has NO PageHelpBanner. Must split into sub-components first.
Expected tabs inside: Business Info, Branding, Hours/Contact, Integrations, etc.
After split, add `<PageHelpBanner tab="settings" ... />` to each sub-tab.
All resulting files must be under 200 lines.

### Priority 3 — Gate SocialTab and ReportsTab
Add `<FeatureGate tier={2}>` inside SocialTab.tsx and ReportsTab.tsx (below PageHelpBanner).
Read each file first — both are under 200 lines.

### Priority 4 — Upgrade prompt modal in Dashboard
When a locked tab is clicked in sidebar, show a modal before opening the tab:
- "🔒 [Tab Name] is available on the Grow plan and above"
- Brief 1-line feature description
- "Contact us to upgrade" button (mailto:scott@ironwoodoperations.com)
- Close button / dismiss on backdrop click
This is UX polish on top of the FeatureGate already inside tabs.

---

## BUILD STATUS (end of S23)

- Build: ✅ 0 errors
- Main bundle: 408.61 kB (limit: 450 kB) — OK
- All tier gating wired through PlanContext ✅
- BlogTab and SEOTab gated at tier 2 ✅
- Subscription row seeded: Elite tier 4 ✅
- Social + Reports: sidebar lock only, no in-tab gate yet
