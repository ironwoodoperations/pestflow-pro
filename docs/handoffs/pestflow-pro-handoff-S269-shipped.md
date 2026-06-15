# PestFlow Pro — S269 Handoff (SHIPPED)

**Date:** 2026-06-15 · **Session:** S269 · **Orchestrator:** Claude.ai (MCP-first) + Claude Code
**Shipped via:** PR #199 (squash-merged, `11278a8`).
**Theme:** Concierge plan-card rebuild — replace the stale, self-contradicting demo pricing cards on both the Dashboard and Billing surfaces with an accurate, single-sourced tier menu + a "contact us" handoff. No self-serve checkout, by design.

## The model decision that anchored the work
PestFlow Pro is a **concierge** product: Scott personally onboards every customer, sets entitlement, and sends a manual payment link. Customers never self-serve checkout or auto-provision. The plan cards are therefore an **accurate menu + contact handoff only** — not a billing action surface. This makes the abandoned (S217) self-serve checkout path dead weight, and it was removed from the Billing block this session.

## What shipped (PR #199)
- **Single source of truth:** new `src/lib/planCardContent.ts` holds all four tiers' prices, taglines, cumulative "Everything in X, plus:" lines, and feature bullets — built from the locked `PFP_Pricing_Tiers.docx` matrix (customer-facing Section 2 content; internal ★/packaging strategy deliberately excluded).
- **Both surfaces rebuilt and made consistent** from that module — previously two hardcoded copies that didn't even agree with each other:
  - Dashboard: `src/components/admin/dashboard/DashboardPlanSection.tsx` + `DashboardPlanCard.tsx`
  - Billing: inline Plans block in `src/components/admin/BillingTab.tsx` (net deletion — the dead self-serve checkout block came out)
- **Button treatment (both surfaces):** every non-current tier → single "Contact us to switch" mailto to `sales@pestflowpro.ai` with URL-encoded per-tier subject, plus plain-text "or call (430) 367-5601" beneath. Current tier keeps its non-clickable Current Plan badge. All prior Upgrade / Upgrade to Elite / Downgrade / Contact-us-to-downgrade variants removed.
- **Pro flagged "Most popular."**
- **Remi add-on strip:** new `src/components/admin/RemiAddonStrip.tsx`, full-width below the four cards on both surfaces, styled distinctly so it reads as an add-on not a fifth plan. Copy: what Remi does + "100 minutes included, then $0.50/min. Add-on price by plan: Starter $99/mo · Growth $75/mo · Pro $50/mo · Elite included." No button (plan changes route through the same sales contact).
- **Removed** the demo Billing block's self-serve `create-checkout-session` call site and its dead state.

## Constraints honored
- Frontend-only. No entitlement resolution, tier gating, ai-proxy, or edge-function code touched.
- Current tier still read from the existing `usePlan()` hook — no new data source.
- `create-checkout-session` removal was the frontend call site only; the edge function itself is untouched (still available to the operator-side provisioning flow).
- CI green (tsc / eslint / vite build); squash-merged; remote branch deleted.

## Prod verification (live)
Verified on `coastal-pest.pestflowpro.ai/admin` (Pro tenant) in a fresh window:
- Dashboard + Billing both render the four cards identically, Pro marked Current Plan + highlighted, the other three showing "Contact us to switch" + call line.
- Elite shows the full list (incl. auto-fix scheduling, weekly reporting, quarterly strategy review — Scott confirmed these exist).
- Remi strip renders below cards on both surfaces, reads as an add-on.
- "Contact us to switch" opens a draft email to sales@pestflowpro.ai with the correct tier in the subject.

## Live-state facts (carry forward)
- Concierge model is now reflected in the UI: no self-serve checkout anywhere on the customer admin. Plan changes are a sales conversation → manual payment link → operator sets entitlement.
- Tier feature copy now lives in ONE file (`planCardContent.ts`). Any future pricing/feature change edits that file and both surfaces move together — the demo-drift class of bug is closed.
- `PFP_Pricing_Tiers.docx` is NOT in the repo; it lives in Scott's project knowledge / local files. The card content is now the in-repo reflection of it.

## Open / pending (carried to next)
- Onboarding path remains operator-driven (provision-tenant v97 + manual payment link). Self-serve checkout intentionally not wired.
- Next Up unchanged: Tops onboarding shell decision (prospect, time-boxed), Remi warm transfer (VAPI-dashboard config), Claire two-identity setup.
- Open Follow-ups unchanged (two bold-local cosmetic nits, provision-tenant v97 .com→.ai drift, role-store SSOT, export-tenant-data, Remi ring-delay, PROJECT_MANIFEST log churn).
