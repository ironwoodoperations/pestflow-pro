# s248 — Review: tier-gate wiring on the two borderline surfaces

Reuses the #134 mechanism (`useTierGate`, `UpgradePrompt`, `requestUpgrade`, `tierInfo`). Pure wiring; no new architecture.

## Wave 1 — locate + confirm

| # | Surface (component:handler) | Backend | Required tier | Current sub-tier behavior | Pre-existing UI gate? |
|---|---|---|---|---|---|
| 1 | `useComposer.ts:getSmartSchedule` → `callAi('composer_schedule')` | ai-proxy → `FEATURE_TIER.composer_schedule = 2` | **2 (Grow)** | 403 swallowed by the `catch` block; silently sets `scheduleMode='later'` — **silent no-op**, no user feedback. | The 'smart' radio is hidden for Starter in `ComposerScheduler` (`isStarter ?` branch), so the handler is unreachable from the UI for Starter today. The silent catch is a defense-in-depth path. |
| 2 | `usePublishPost.ts:publishNow` → `fetch(post-to-social)` | server-side `post-to-social` rejects `tier === 1` with 403 *"Scheduling not available on Starter plan."* | **2 (Grow)** | Client pre-guards: `if (tier < 2)` short-circuits to the **Starter manual copy-paste flow** (insert `status='sent'` + `toast.info("Copy this post and paste…")`). | `ComposerScheduler` shows a **gray Lock card** "Scheduling available on Growth plan and above" for Starter — already a section-style gate. Publish button label switches to "Copy & Post Manually". |

Tier verified against `FEATURE_TIER.composer_schedule = 2` (`_shared/aiAuth.ts`) and `post-to-social/index.ts:87` (`tier === 1` 403). `tierInfo(2).name === 'Grow'`. Sibling features `composer_captions:1`, `seo_metadata:2`, `blog_draft:2` are gated identically — Grow is the right tier.

**Pre-existing section gates exist** for both surfaces (smart radio hidden for Starter; Starter sees the lock card). The kickoff specifically says "don't double the gate" — so this PR upgrades the **existing** gates rather than adding a parallel guard:
- (1) Replace the silent catch with an UpgradePrompt call.
- (2) Convert the gray Lock card → amber-lock card + an **"Upgrade to Grow"** CTA that fires the UpgradePrompt. The legitimate Starter copy-paste publish path is **intentionally preserved** (it's a real Starter feature, not a no-op).

## Wave 2 — implementation

Three files, all frontend:

**`src/components/admin/social/useComposer.ts`**
- New 3rd param `onUpgradeRequired?: () => void`.
- In `getSmartSchedule`, **before** `setSmartLoading`: `if (tier < 2) { onUpgradeRequired?.(); return }` — defensive guard, fires no request.

**`src/components/admin/social/ComposerScheduler.tsx`**
- New optional prop `onUpgradeRequired?: () => void`.
- `isStarter` branch reworked: gray Lock → **amber-lock card + "Upgrade to Grow" button** that calls `onUpgradeRequired`. No layout change beyond colors + the CTA. Starter Publish flow (`"Copy & Post Manually"` + manual copy-paste) is preserved.

**`src/components/admin/social/LegacyComposer.tsx`**
- Imports `useTierGate` + `UpgradePrompt`. `SCHEDULE_MIN_TIER = 2`.
- `const scheduleGate = useTierGate(SCHEDULE_MIN_TIER)`.
- Passes `scheduleGate.openPrompt` to `useComposer` (3rd arg) and to `ComposerScheduler` as `onUpgradeRequired`.
- Renders `<UpgradePrompt open={scheduleGate.open} requiredTier={2} featureName="Post scheduling" onClose={scheduleGate.closePrompt} />`.

## What this matches from #134 (and where I deviate, with reason)

- ✅ `useTierGate(<tier>)` at the parent; **prompt fires no network request**.
- ✅ Lock affordance — amber, on the existing locked-card surface.
- ✅ Tier name read from `tierInfo` via `UpgradePrompt`; the modal will name **"Grow"** (`tierInfo(2).name`) — never a literal.
- ✅ Backend gates untouched (`ai-proxy`, `post-to-social`); existing 403 handling stays as defense-in-depth.
- ⚠️ **Deviation from a literal "guard the publishNow handler":** I did **not** intercept `publishNow` in `useComposer`. Rationale: the Starter manual copy-paste flow is a real product feature (not a no-op), and intercepting `publishNow` would remove it. Instead I gate the *scheduling sub-feature* (the surface that reaches `post-to-social` differently from "now") by upgrading the existing Starter section-gate card to an UpgradePrompt CTA. A Starter clicking the locked card → modal; a Starter clicking "Copy & Post Manually" → existing legitimate manual flow. If you want the manual flow removed entirely in favor of the prompt, that's a one-line follow-up.

## Validator gate
Waived (kickoff): reuses the #134-reviewed mechanism, no new architecture.

## Verification
- `tsc` 0 errors · eslint 0 errors (2 warnings on pre-existing patterns) · `vite build` ✅ · anthropic guard ✅.
- Per kickoff: hostname-routed multi-tenant SPA → Vercel previews 404 → **merge-then-verify-on-prod** with master temporarily downgraded to tier 2 (Scott runs the MCP downgrade/restore). Steps in the QA report.
