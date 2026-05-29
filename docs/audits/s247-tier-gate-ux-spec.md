# s247 — Tier-Gate UX spec (Wave 2)

**Status: Wave 2 spec — STOP for sign-off before implementing.**
Builds on the approved Wave 1 audit (`s247-tier-gate-ux-audit.md`). Frontend-only.

## Approved decisions (from Scott)
1. **Target = Item 1 only:** `MediaTab` "Tag with AI Vision" (per-image + "Tag untagged" bulk), which 403s at **Pro (tier 3)** on an ungated surface. Borderline surfaces (composer smart-schedule, post-to-social publish) are OUT — build the guard reusable so they're a fast follow-up.
2. **CTA = `notify-upgrade`** edge function (a real sales signal to Scott), **not** mailto.

## `notify-upgrade` real contract (verified against source + proven BillingTab caller)
- **Endpoint:** `POST ${VITE_SUPABASE_URL}/functions/v1/notify-upgrade`
- **Auth:** `requireTenantAdmin(req, tenant_id)` — caller must be admin of that tenant (the /admin dashboard user is). JWT via `Authorization: Bearer <access_token>`. (`--no-verify-jwt` at gateway; validates inline.)
- **Body (proven, from `BillingTab.tsx:160`):**
  `{ tenant_id, old_tier:<number>, new_tier:<number>, plan_name:<string>, monthly_price:<number> }`
  Required: `tenant_id`, `new_tier`. Optional: `old_tier`, `plan_name`, `monthly_price`.
- **Behavior:** emails `sales@homeflowpro.ai` via Resend — *"<tenant> started a plan upgrade to <newName> ($X/mo). They moved from <oldName>."* Returns `{ success: true }`. Internal `TIER_NAMES` = {1 Starter, 2 **Grow**, 3 Pro, 4 Elite}.
- **Feature attribution:** ❌ **NOT supported.** No `feature`/`source` field; the email template is tier-movement only. Passing "AI Vision tagging triggered this" would require **extending the payload + email template = an edge-function contract change → needs Scott's OK** (see Open Questions). **Default for this PR: wire to the existing contract, no extension.**

## Canonical tier naming (single source of truth)
The audit found **"Grow"** (PlanContext `TIER_MAP`, notify-upgrade `TIER_NAMES`, backend) vs **"Growth"** (`UpgradeCards`, `FeatureGate` hardcode). **Canonical for the new prompt = the backend-aligned set:** `1 Starter / 2 Grow / 3 Pro / 4 Elite`, prices `149 / 249 / 349 / 499`. This matches what `notify-upgrade` emails, so the sales signal and the on-screen prompt agree.
- The **Media target names "Pro" (tier 3)** — rendered from the helper, never a literal, never "Elite."
- **Out of scope:** the legacy `FeatureGate` "Upgrade to Growth" hardcode is NOT fixed in this PR (existing behavior).

## Design — one reusable mechanism

### 1. Tier helper — `src/lib/tierInfo.ts` (NEW, the single source of truth)
```ts
export interface TierInfo { tier: number; name: string; price: number }
const TIERS: Record<number, TierInfo> = {
  1: { tier: 1, name: 'Starter', price: 149 },
  2: { tier: 2, name: 'Grow',    price: 249 },
  3: { tier: 3, name: 'Pro',     price: 349 },
  4: { tier: 4, name: 'Elite',   price: 499 },
}
export function tierInfo(tier: number): TierInfo { return TIERS[tier] ?? TIERS[1] }
```
No tier-name/price literals in any component — all read `tierInfo(requiredTier)`.

### 2. Upgrade request helper — `src/lib/requestUpgrade.ts` (NEW)
Wraps the proven `notify-upgrade` contract so no component hand-rolls the fetch:
```ts
export async function requestUpgrade(tenantId: string, currentTier: number, targetTier: number): Promise<void> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const t = tierInfo(targetTier)
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-upgrade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ tenant_id: tenantId, old_tier: currentTier, new_tier: t.tier, plan_name: t.name, monthly_price: t.price }),
  })
  if (!res.ok) throw new Error('notify-upgrade failed')
}
```
(Payload identical to BillingTab's, so we're on the proven contract.)

### 3. Reusable prompt — `src/components/common/UpgradePrompt.tsx` (NEW)
Self-contained modal driven by a required tier:
- Props: `{ open, requiredTier, featureName, onClose }`.
- Reads `usePlan()` (current `tier`) + `useTenant()` (tenant id, business name).
- Renders target from `tierInfo(requiredTier)`: heading *"Upgrade to **Pro**"*, *"$349/mo"*, body *"AI Vision tagging is available on the Pro plan and above."* (featureName injected).
- CTA **"Request upgrade"** → `requestUpgrade(tenantId, tier, requiredTier)` → on success `toast.success("Thanks — we'll reach out to get you on Pro.")` + close; on failure `toast.error(...)`. Disable button while in flight; guard against double-submit.
- **Never calls the gated feature.** Pure UI + the notify-upgrade ping.

### 4. Tiny gate hook — `src/components/common/useTierGate.ts` (NEW)
```ts
export function useTierGate(requiredTier: number) {
  const { canAccess } = usePlan()
  const [open, setOpen] = useState(false)
  const allowed = canAccess(requiredTier)
  return { allowed, open, openPrompt: () => setOpen(true), closePrompt: () => setOpen(false) }
}
```
Call-site pattern: `if (!allowed) { openPrompt(); return }` before any network call; render `<UpgradePrompt open={open} requiredTier={requiredTier} featureName=… onClose={closePrompt}/>`.

### 5. Wire into MediaTab (the only target this PR)
`src/components/admin/MediaTab.tsx`:
- `const { allowed, open, openPrompt, closePrompt } = useTierGate(3)`.
- In `tagImages(ids)` (per-image + bulk both route through it): **first line** `if (!allowed) { openPrompt(); return }` — fires the prompt, **no network call**.
- Pre-emptive affordance: for `!allowed`, render the Sparkles tag buttons with an **amber lock** indicator (matching the nav-lock convention) so the upgrade state is visible *before* clicking; the "Tag untagged" bulk button likewise routes to the prompt. (The buttons stay visible — locked, not hidden — per the "never blank pages" rule.)
- Render `<UpgradePrompt open={open} requiredTier={3} featureName="AI Vision tagging" onClose={closePrompt} />`.
- **Defense in depth (unchanged):** the existing `tagImages` 403 handling (toast + red "Tag failed" badge) stays as the fallback for an entitled user who 403s anyway (e.g., mid-session sub lapse). Backend gate untouched = source of truth.

## Files
| File | Change |
|---|---|
| `src/lib/tierInfo.ts` | NEW — tier→{name,price} single source |
| `src/lib/requestUpgrade.ts` | NEW — notify-upgrade wrapper (proven contract) |
| `src/components/common/UpgradePrompt.tsx` | NEW — reusable prompt modal |
| `src/components/common/useTierGate.ts` | NEW — gate hook |
| `src/components/admin/MediaTab.tsx` | EDIT — guard `tagImages`, lock affordance, render prompt |
| **No backend / edge-fn / config / RLS files** | — |

## Validator gate — WAIVED (with one trip-wire)
Frontend-only. No caching/auth/payments/RLS/edge-function-behavior change. `notify-upgrade` is **called on its existing contract**, `tag-image-vision`/`ai-proxy` are **untouched**, backend 403 remains source of truth. ⇒ Perplexity+Gemini gate **not required**.
**Trip-wire:** if Scott approves the feature-attribution extension (Open Q1), that modifies `notify-upgrade`'s payload + email = an edge-function contract change → STOP and invoke the gate before implementing that part.

## Wave 4 QA plan (for reference; executed after impl sign-off)
- Tier-3 (Pro): tag buttons work normally, no prompt, no regression.
- Tier-1/2: clicking any tag action opens the prompt naming **"Pro / $349"**, **no `tag-image-vision` request fires** (verify Network tab), no raw toast/badge 403. "Request upgrade" → `notify-upgrade` 200 + confirmation toast.
- Tier-4 (Elite): tagging works (guard `canAccess(3)` true) — no over-block.
- Forced 403 for an entitled user still degrades via the retained toast/badge fallback.
- Prompt tier name cross-checked against `tierInfo(3).name === 'Pro'`.

## Open questions for Scott (sign-off)
1. **Feature attribution:** extend `notify-upgrade` with a `feature`/`source` field (+email line) so sales sees *"wanted AI Vision tagging"*? This is an edge-fn contract change (needs your OK + trips the validator gate). **Default if no: wire as-is** (email reads "started a plan upgrade to Pro", no feature line).
2. **Prompt form factor:** modal (spec'd) vs inline panel replacing the tag controls. Recommend **modal** (least disruptive, reusable for the future borderline surfaces).
3. **Confirm canonical tier-2 name = "Grow"** (backend-aligned) for the new helper. (UpgradeCards' "Growth" stays as-is, out of scope.)

## STOP
Not implementing until Scott signs off on this spec + the three open questions.
