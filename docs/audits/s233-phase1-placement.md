# S233 Phase 1 — Analytics Hub placement death-audit

**Branch audited:** main HEAD `d310f36`
**Audit date:** 2026-05-20
**Auditor:** Claude Code (read-only pass — no src/ changes)

---

## 1. Pre-work artifact existence

| Artifact | Present? | Line count |
|---|---|---|
| `docs/audits/s232-analytics-inventory.txt` | ✅ | 425 |
| `docs/audits/pestflow-pro-kickoff-S233.md` | ✅ | 68 |
| `src/components/admin/analytics/AnalyticsHub.tsx` | ✅ | 84 |
| `src/components/admin/analytics/AnalyticsSection.tsx` | ✅ | 32 |
| `src/components/admin/analytics/sections/SEOSection.tsx` | ✅ | 10 |
| `src/components/admin/analytics/sections/SocialSection.tsx` | ✅ | 10 |
| `src/components/admin/analytics/sections/PerformanceSection.tsx` | ✅ | 10 |
| `src/components/admin/analytics/sections/BlogSection.tsx` | ✅ | 10 |
| `src/components/admin/ReportsTab.tsx` | ✅ | 193 |

All 9 artifacts present. No missing files. Proceeding.

---

## 2. Inventory-vs-reality drift

The S232 inventory (`s232-analytics-inventory.txt`, Part A) was written against the S232
branch state *before* the S232 squash merge to main. The following table compares its
claims against `git show HEAD:src/components/admin/ReportsTab.tsx`.

### Analytics tile mount status

| Tile (component) | Inventory says mounted in ReportsTab? | Actually mounted on main HEAD? | Drift? |
|---|---|---|---|
| `SeoAnalyticsTile` | Yes — L163, minTier=3 gate | ✅ Yes — minTier=3 gate (left col) | None |
| `GscAnalyticsTile` | Yes — L164, minTier=3 gate | ✅ Yes — minTier=3 gate (left col) | None |
| `Ga4AnalyticsTile` | Yes — L165, minTier=3 gate | ❌ **NOT imported, NOT mounted** | **DRIFT — see below** |
| `SitePerformanceTile` | Yes — L168, minTier=2 gate | ✅ Yes — minTier=2 gate (left col) | None |
| `SeoCoverageTile` | Yes — L171, minTier=3 gate | ✅ Yes — minTier=3 gate (left col) | None |
| `SocialPostsTile` | Yes — L177, minTier=3 gate (right col) | ✅ Yes — minTier=3 gate (right col) | None |
| `SocialAnalyticsTile` | Yes — L178, minTier=3 gate (right col) | ✅ Yes — minTier=3 gate (right col) | None |
| `BlogAnalyticsTile` | Yes — L179, minTier=3 gate (right col) | ✅ Yes — minTier=3 gate (right col) | None |
| `ReportsStatCards` | Yes — L96 (lead data) | ✅ Yes — inside loading guard | None |
| Inline "Leads Over Time" chart | Yes — L100-117 area | ✅ Yes — inside loading guard | None |
| Inline "Lead Status" | Yes — L119 area | ✅ Yes — inside loading guard | None |
| Inline "Top Requested Services" | Yes — L135 area | ✅ Yes — inside loading guard | None |
| `LeadFunnel` | Mentioned — "kept per S228 keep-decision" | ❌ NOT mounted | **DRIFT — see below** |
| `AnalyticsHub` | Not in inventory (new S232 work) | ✅ Yes — first child of FeatureGate | New S232 addition, not drift |

### Drift narrative

**Drift 1 — `Ga4AnalyticsTile` not mounted in ReportsTab.**
The S232 inventory (Part A, L26–31) describes `Ga4AnalyticsTile` as mounted at
ReportsTab L165 inside the minTier=3 gate. On main HEAD today, it is neither imported
nor mounted. This is a pre-existing gap first introduced in S231 PR #100: the tile was
built and merged, but the S232 squash (PR #103) did not carry the ReportsTab mount
because the S232 hotfix series (#3) restored only the tiles present in the pre-S231
baseline. The tile exists on disk (`src/components/admin/seo/Ga4AnalyticsTile.tsx`,
7447 bytes) and is mounted in `SeoInsightsTab.tsx`. **Phase 2 must wire it into
SEOSection as the kickoff specifies — sourced from SeoInsightsTab, not from
ReportsTab's current grid.**

**Drift 2 — `LeadFunnel` not mounted in ReportsTab.**
The S232 inventory (Part A, L64–65) noted LeadFunnel as "kept per S228 keep-decision
(Risk #6 in S228 audit)." On main HEAD, LeadFunnel is not imported or mounted.
History: removed in PR #97, briefly re-added in S232 hotfix `0ef45d5`, removed again
in hotfix `7a538b6` before the final squash. This is a resolved decision — the removal
is intentional. No action needed in S233; recording for completeness.

### Tiles mounted in ReportsTab today NOT mentioned in the tile section of the inventory

| Component | Notes |
|---|---|
| `AnalyticsHub` | S232 Phase 2 deliverable — correctly present. Inventory pre-dates its addition. |

---

## 3. FeatureGate locked-but-visible capability

**File:** `src/components/common/FeatureGate.tsx` (38 lines)

### Full interface

```tsx
interface Props {
  minTier: number
  featureName?: string
  children: ReactNode
  fallback?: ReactNode
}
```

### Behavior when `minTier` is unmet

```tsx
if (!canAccess(minTier)) {
  if (fallback) return <>{fallback}</>
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-10 text-center">
      <Lock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
      {featureName
        ? <h3 className="text-lg font-semibold text-gray-700 mb-1">{featureName}</h3>
        : <p className="text-gray-600 font-medium mb-1">This feature requires a higher plan</p>
      }
      <p className="text-sm text-gray-500 mb-4">Available on Growth and above. Contact us to unlock.</p>
      <a href="mailto:support@pestflowpro.ai?subject=Upgrade Request - PestFlow Pro" ...>
        Upgrade to Growth →
      </a>
    </div>
  )
}
return <>{children}</>
```

### Answer to Step 3 questions

**1. Does FeatureGate support locked-but-visible mode today?**

**Yes, via the `fallback` prop.** When a tier-unmet user opens an accordion section,
`AnalyticsSection` renders the `AccordionTrigger` (always visible) and
`AccordionContent` (body, shown when expanded). By placing `FeatureGate` *inside*
`AccordionContent` — not wrapping `AnalyticsSection` — the accordion header is always
visible and the lock CTA renders inside the expanded body:

```tsx
// Structure that satisfies the kickoff requirement:
<AnalyticsSection id="seo" title="SEO Analytics" summaryStat="—">
  <FeatureGate minTier={3} fallback={<SEOUpgradeCTA />}>
    <SeoAnalyticsTile />
    {/* ... */}
  </FeatureGate>
</AnalyticsSection>
```

The `fallback` prop is the correct hook. **No new API required.**

**2. API change needed?**

None required for the accordion use case. The `fallback` prop is already present. The
only caveat: the default built-in fallback (no `fallback` prop) uses a **gray**
`text-gray-400` lock icon, which violates CLAUDE.md rule: *"Amber padlocks on gated
features (not gray)."* Phase 3 must pass an explicit `fallback` with amber styling per
section rather than relying on the default. This is fine as-is; no source change needed
before Phase 3.

**3. Does this satisfy "locked-but-visible in open accordion body"?**

Yes. The accordion section header (`AccordionTrigger`) is rendered by `AnalyticsSection`
unconditionally. `FeatureGate` only controls what renders inside `AccordionContent`. A
tier-1 user can expand any section and sees the upgrade CTA. The accordion section is
never hidden or disabled. ✅

---

## 4. Tile-to-section placement

### Final placement table

| Tile | Target section | minTier | Justification |
|---|---|---|---|
| `SeoAnalyticsTile` | SEO Analytics | 3 | Core SEO rankings / competitors / opportunities — canonical SEO analytics tile |
| `GscAnalyticsTile` | SEO Analytics | 3 | Google Search Console click/impression data — SEO channel metric |
| `Ga4AnalyticsTile` | SEO Analytics | 3 | GA4 users/sessions/engagement — site traffic from SEO channel; **source: SeoInsightsTab.tsx (S231 PR #100 gap), not current ReportsTab grid** |
| `SeoCoverageTile` | SEO Analytics | 3 | meta title/desc/keyword coverage — SEO quality health metric |
| `SocialPostsTile` | Social Analytics | 3 | Post counts by status/platform — social activity baseline |
| `SocialAnalyticsTile` | Social Analytics | 3 | Zernio engagement + reach — core social performance metric |
| `SitePerformanceTile` | Performance & Reports | 2 | PageSpeed/Lighthouse performance score — site performance, available tier-2+ |
| `BlogAnalyticsTile` | Blog Analytics | 3 | Post counts, published/draft, most recent post — blog activity summary |

### Out-of-scope tiles (remain in ReportsTab outside the hub, Phase 2 does NOT move these)

| Component | Why it stays in ReportsTab |
|---|---|
| `ReportsStatCards` | Lead stat summary cards — lead CRM data, not analytics-hub content |
| Inline "Leads Over Time" chart | Lead CRM chart — stays below hub per kickoff |
| Inline "Lead Status" chart | Lead CRM chart — stays below hub per kickoff |
| Inline "Top Requested Services" | Lead CRM chart — stays below hub per kickoff |

### Ga4AnalyticsTile source note (critical for Phase 2)

`Ga4AnalyticsTile` is **not** in the current ReportsTab Analytics grid. Phase 2 must
add it to `SEOSection.tsx` by importing directly from its path:
`src/components/admin/seo/Ga4AnalyticsTile.tsx`. The companion hook
`src/hooks/useGa4Runs.ts` is already wired inside the tile. No new plumbing needed.
`SeoInsightsTab.tsx` is **not touched** this session per kickoff — the duplicate mount
there is a deferred F2 cleanup item.

---

## 5. Locked-state behavior spec

### Scope

Applies to three sections gated minTier=3: **SEO Analytics**, **Social Analytics**,
**Blog Analytics**. One section gated minTier=2: **Performance & Reports**.

### Accordion section header (always visible, all tiers)

- Section title renders normally.
- `summaryStat` slot: show `"—"` (en-dash, same as current placeholder). Do not show
  data-derived values for locked sections. This avoids a data fetch for a locked user.
- Chevron expand/collapse works normally. User can open the section.

### Locked body (inside open `AccordionContent`)

```
┌─────────────────────────────────────────┐
│  🔒  [amber padlock, w-8 h-8]           │
│                                         │
│  [Section name] is a [Plan] feature     │
│  [One-sentence upgrade prompt]          │
│                                         │
│  [ Upgrade to unlock → ]  (CTA button)  │
└─────────────────────────────────────────┘
```

- Lock icon: amber (`text-amber-500`) per CLAUDE.md rule.
- Background: `bg-gray-50 rounded-xl border border-gray-200 p-10 text-center` (matches
  current default gate styling, just with amber icon).
- CTA button: same emerald button as current FeatureGate default — links to billing tab
  or upgrade email. Propose linking to the admin Billing tab (`setActiveTab('billing')`)
  rather than mailto for in-app flow. **Scott to confirm.**

### Proposed upgrade copy (one sentence per locked section)

| Section | Proposed copy | Scott edits? |
|---|---|---|
| SEO Analytics | "SEO keyword rankings, Google Search Console data, and GA4 traffic are available on the Pro plan and above." | Yes |
| Social Analytics | "Social engagement metrics and post performance are available on the Pro plan and above." | Yes |
| Blog Analytics | "Blog post analytics and publishing trends are available on the Pro plan and above." | Yes |
| Performance & Reports | "Site performance scores are available on the Grow plan and above." | Yes |

### CTA link behavior

Proposed: clicking "Upgrade →" sets `activeTab = 'billing'` in the parent Dashboard
state. This keeps the user in-app. Fallback (if billing tab not accessible from this
context): `mailto:support@pestflowpro.ai?subject=Upgrade Request`.
**Decision for Scott before Phase 3.**

### Tier-1 experience walkthrough

1. Opens Reports tab → FeatureGate minTier=2 passes (tier-1 gets locked by the outer
   gate at tier-2, so they never reach the hub at all). **Wait** — see open question Q1.

---

## 6. Open questions for Scott

**Q1 — Tier-1 outer gate behavior (blocker for Phase 3).**
The outer `<FeatureGate minTier={2} featureName="Reports">` in `ReportsTab` currently
locks the ENTIRE tab for tier-1 users. Per the kickoff tier map, `Performance & Reports`
is minTier=2, which implies tier-1 users should see at least a locked CTA for that
section inside the hub. But if the outer gate blocks tier-1 entirely, they never reach
the hub. **Decision needed:** should the outer gate drop to minTier=1 (all tiers can
open the tab, hub sections gate individually), or stay at minTier=2 (tier-1 users see
the tab-level locked card, not the hub)? If the intent is per-section gating, the outer
gate must be relaxed.

**Q2 — CTA link target for locked sections.**
Should the upgrade CTA inside locked accordion sections link to:
  (a) the Billing tab (`setActiveTab('billing')`) — in-app flow, or
  (b) `mailto:support@pestflowpro.ai` — current FeatureGate default?
Scott sells by phone; option (b) may not match the concierge flow. Need direction.

**Q3 — Performance & Reports tier-2 section — what does tier-1 see?**
If Q1 resolves to "outer gate stays at minTier=2," tier-1 never sees the hub. If Q1
resolves to "outer gate drops to minTier=1," then a tier-1 user opening Performance &
Reports sees a locked CTA. The locked copy proposed above says "available on the Grow
plan." Confirm this is correct — Grow = tier 2 = the right floor for
`SitePerformanceTile`.

**Q4 — `summaryStat` slot for live sections (not blocking Phase 2).**
Each `AnalyticsSection` has a `summaryStat` prop currently showing `"—"`. For Phase 2
(tile relocation), this stays as `"—"`. For Phase 3+, the intent may be to show a
live key metric (e.g. "Position: 4.2" for SEO, "Eng: 1.2k" for Social). Confirm
whether Phase 3 should wire live values into `summaryStat`, or leave as `"—"` until
a dedicated polish pass.

**Q5 — `Ga4AnalyticsTile` placement within SEOSection (not blocking).**
The tile currently has its own internal collapsible (localStorage key:
`pfp_ga4_tile_expanded`). Inside an accordion section, this creates nested
expand/collapse UI. Acceptable for Phase 2, but worth flagging: should the internal
collapsible be removed when the tile moves into an accordion? Not a Phase 2 blocker —
note for Phase 3 polish or separate ticket.

---

## 7. Phase 2 readiness gate

- [ ] **Drift items reconciled or ack'd by Scott** — specifically: Ga4AnalyticsTile gap
  (confirmed as expected, Phase 2 will wire it into SEOSection) and LeadFunnel removal
  (confirmed intentional).
- [ ] **FeatureGate locked-but-visible decision made** — confirmed: `fallback` prop is
  sufficient; no API change needed. Amber icon via explicit `fallback` in Phase 3.
- [ ] **Placement table approved** — 8 tiles → 4 sections as specified above.
- [ ] **Locked-state copy approved** — copy is proposed; Scott must sign off before
  Phase 3 strings are hardcoded.
- [ ] **Q1 outer gate decision** — blocking for Phase 3 tier-gating. Not blocking for
  Phase 2 (tile relocation only). Phase 2 can proceed before Q1 is resolved.
- [ ] **Q2 CTA link target** — blocking for Phase 3. Not blocking for Phase 2.

**Phase 2 can start as soon as Scott acknowledges the placement table and drift items.
Q1, Q2, Q3 are Phase 3 blockers only.**

---

*Phase 1 — no code changes. Awaiting Scott review before Phase 2.*
