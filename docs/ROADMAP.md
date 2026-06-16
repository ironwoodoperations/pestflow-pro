# PestFlow Pro — Roadmap

*State as of S271 (2026-06-16). Update at end of each session; retire the versioned pestflow-pro-todo-vNNN.html snapshots.*

---

## In Progress

*(nothing active — clear to start next session)*

---

## Recently Shipped

- **Prospect Teardown Engine — built, validated, hardened (S270 PR #201 + S271 PR #202, both merged).** New standalone CLI tooling under `tools/teardown/` (opportunity scorer + mobile walkthrough recorder + orchestrator). Sandbox only — does NOT touch provision-tenant, RLS, or any tenant-isolation path; scrapes only public marketing pages, one pass per domain. v0.2 ran end-to-end against Tops (topspest.com); compared against the human Tops assessment, which exposed three scorer gaps. v0.3 fixed all three: (1) hosted-builder detection (Wix/Squarespace/GoDaddy/Duda) → new signals.platform +20 — Wix was previously "Other/Unknown" scoring 0, the biggest miss; (2) platform-boilerplate denylist killing the bogus "Website Builder" vendor credit; (3) placeholder/template-leftover scan (placeholder phone +15). Recorder dwell bumped 1200→2500ms so the clip clears ~15s and all 4 frames land. Re-run on Tops verified live: platform=Wix, placeholder phone "(222) 222-222" caught, bogus credit gone, tier moved D→B (12→52) — now matching the human "strong upgrade target" read. Engine validated on the Wix path.

- **Concierge plan-card rebuild — Dashboard + Billing (S269, shipped PR #199).** Both four-card surfaces rebuilt from the locked tier matrix via a shared single-source-of-truth module (`src/lib/planCardContent.ts`) — Dashboard (`DashboardPlanSection.tsx` + `DashboardPlanCard.tsx`) and Billing (`BillingTab.tsx`) now render identical content, ending the demo-copy drift. All upgrade/downgrade button variants replaced with a single "Contact us to switch" mailto (`sales@pestflowpro.ai`, per-tier subject) + "or call (430) 367-5601"; current tier keeps non-clickable Current Plan state. Pro flagged "Most popular." New full-width Remi add-on strip (`RemiAddonStrip.tsx`) below the cards on both surfaces (100 min included + $0.50/min overage; block price Starter $99 / Growth $75 / Pro $50 / Elite included), styled as an add-on not a fifth plan. Removed the dead self-serve `create-checkout-session` call site from Billing (frontend only; edge fn untouched). Current tier still read from `usePlan()` — no entitlement/gating/edge-function code touched. Verified live on coastal-pest /admin (both tabs, mailto opens correctly). Concierge model confirmed: no self-serve checkout, by design.

- **S268 — custom-color palette fallback (PR #197).** `computeShellCssVars` now derives a full coherent surface set for any custom (non-preset) primary, keyed off the base shell's hero luminance (light/dark) instead of half-applying. Two guards: G1 `contrastRatio` keeps buttons >=3:1 vs hero; G2 `ensureContrast` lifts surfaces to >=4.5:1 text contrast. 16-entry `PALETTE_HERO` preset path byte-identical; bold-local early return and accent handling untouched. Validator-gated (Perplexity+Gemini, conservative-wins). Prod-verified on coastal-pest (#2E6F95/#7AB87A): all routes blue/green, zero purple, half-apply split gone. Full handoff: `docs/handoffs/pestflow-pro-handoff-S268-shipped.md`.

- **Theming Phase 1.5 — bold-local public inner-page dark conversion (S267, shipped PR #194).** `--color-*` block synced to BL_TOKENS charcoal + new `--color-body-text: #C9CDD2` / `--color-text-muted: #9AA3AD` tokens + `computeShellCssVars`/`applyTheme` bold-local guard (palette = accent only). Per-component edits gated behind `template === 'bold-local'` across the **9 verified render sites** (service-area branch, `faq`, `blog`, `blog/[post]`, `LegalPageLayout`, `CityFaqAccordion`, `WhyChooseUs` + the unchanged `Process`/`CtaBanner`) — Dang/modern-pro byte-identical. Validator gate: all 13 charcoal pairings PASS AA (worst 6.47:1); WhyChooseUs white-on-amber fixed 2.03→16.55:1. Verified charcoal live on prod (urban-strike). Full handoff: `docs/handoffs/pestflow-pro-handoff-S267-shipped.md`.

---

## Next Up

- Tops onboarding shell decision — prospect meeting this week; onboarding mechanism verified via provision-tenant v97 read; standard render_model=standard path is clear for a customer who accepts an existing shell+palette
- Remi warm transfer — configure VAPI assistant with transfer tool and transferPlan; voice-intake transfer branch already built; pure VAPI-dashboard work
- Claire two-identity setup — murphygurl92→Dang admin profile repoint + claire@homeflowpro.ai operator login; sequence both together

---

## Open Follow-ups

- bold-local FAQ category label ("General") renders red on charcoal (prod, urban-strike) — a category-tag color outside the S267 `--color-*` conversion scope; harmonize with the bold-local palette (amber). Cosmetic, low priority, non-blocking.
- bold-local service-page "OUR HIT PLAN" section-label renders dim against charcoal (prod, urban-strike) — check legibility / intended contrast (likely a muted eyebrow that needs a brighter token on the dark surface). Cosmetic, low priority, non-blocking.
- provision-tenant v97 hardcodes pestflowpro.com in legal pages and liveUrl — should be .ai; low priority
- Role-store single-source-of-truth — legacy profiles.role vs tenant_users.role disagreements only; no new tenants affected; low priority
- No-credential provision-path hardening — provision-tenant skips profile write when no admin email/password resolved; never triggered in practice; optional defensive note
- export-tenant-data capability — portable tenant-scoped export for churn portability; P2 backlog
- Remi ring-delay / no-answer forwarding — what happens on unanswered calls; parked; message-capture mode is viable now
- PROJECT_MANIFEST per-session log churn — accumulated session entries create noise; harmless; clean up when convenient
- Scorer v0.4 — three known non-blocking issues: (a) bracket-placeholder regex false-positives on Wix component names like "[AddressInput]" — require visible body copy / exclude CamelCase code identifiers; (b) hasGA false positive off Wix internal CSS classes (g-calculated etc.) — tighten GA fingerprint; (c) h1Count source-vs-rendered discrepancy (scorer 3, human 2). Low priority.
- Optional: validate scorer v0.3 against one real WordPress pest-control site to confirm a genuine Blue Duck still tiers A/B correctly — fully closes the engine-proving exercise.
