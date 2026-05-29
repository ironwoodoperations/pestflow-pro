# s247 — Tier-Gate UX Review (Wave 3 impl)

Implements the approved Wave-2 spec. Branch `investigate/tier-gate-ux`. Links: `s247-tier-gate-ux-audit.md` (Wave 1), `s247-tier-gate-ux-spec.md` (Wave 2).

## What shipped
Pre-emptive upgrade prompt for the one unprotected raw-403 surface (MediaTab AI Vision tagging, Pro/3), via a reusable mechanism so the borderline surfaces are a fast follow-up.

| File | Change |
|---|---|
| `src/lib/tierInfo.ts` | NEW — single source of truth tier→{name,price}; backend-aligned "Grow" |
| `src/lib/requestUpgrade.ts` | NEW — `notify-upgrade` wrapper (proven BillingTab payload + optional `feature`) |
| `src/components/common/useTierGate.ts` | NEW — `canAccess`-backed gate hook |
| `src/components/common/UpgradePrompt.tsx` | NEW — modal; names target tier from `tierInfo` (Media → "Pro", never "Elite"/literal) |
| `src/components/admin/MediaTab.tsx` | EDIT — `tagImages` guards on `useTierGate(3)`; amber-lock affordance on tag buttons; renders prompt |
| `supabase/functions/notify-upgrade/index.ts` | EDIT (gated) — optional `feature` field + escaped email line |

## Decisions honored
- Target = Media tagging only; borderline surfaces left out (mechanism is reusable for them later).
- CTA = `notify-upgrade` (real sales signal), not mailto.
- Canonical tier-2 name = **"Grow"** in `tierInfo.ts`; UpgradeCards' "Growth" untouched (out of scope); legacy `FeatureGate` "Upgrade to Growth" hardcode untouched (out of scope).
- Correct tier named: prompt renders **Pro** from `tierInfo`, never Elite/literal.
- Defense in depth: backend 403 (`tag-image-vision`/`ai-proxy`) untouched; MediaTab's existing 403 toast/badge retained as fallback. The guard only prevents reaching it under normal navigation.

## Validator gate — RATIFIED (orchestrator sign-off)
The gated change is the `notify-upgrade` payload + email-template extension. **The Perplexity and Gemini MCP tools are NOT available in this CC Web environment** (only `WebSearch`). I ran `WebSearch` as the external-research substitute on both required pressure-test questions and applied the mitigations.

**Status: RATIFIED.** The orchestrator accepted the WebSearch substitution for these two questions specifically — both have settled, non-contested correct answers (optional additive field = non-breaking by construction; user-adjacent text in HTML email = HTML-encode at embedding, OWASP-canonical), i.e. not the kind of contested architectural decisions the two-model gate exists for. Findings + mitigations (HTML-escape covering `& < > " '`, length cap 120, subject/gate unchanged, additive/optional field) are approved. Gate documentation + sources retained below.

**Backend confirmed intact independently (orchestrator):** ai-proxy `FEATURE_TIER` image_tagging = Pro/3, and the tenant tier check fails **closed** on missing/malformed subscription. The frontend guard is a UX layer over an already-correct backend.

**(a) Extending a `requireTenantAdmin`-gated contract + template without breaking the existing caller** — Sources: [Zuplo — API backwards-compat](https://zuplo.com/learning-center/api-versioning-backward-compatibility-best-practices), [InfoWorld](https://www.infoworld.com/article/2261134/how-to-make-your-rest-apis-backward-compatible.html). Finding: additive **optional** fields are non-breaking; old clients ignore extras; **must maintain defaults** so old behavior is unchanged. → Applied: `feature` is optional; the existing BillingTab caller (no `feature`) renders **no** extra line — byte-identical email + unchanged subject/gate. No regression.

**(b) Does the new field need sanitization/escaping before landing in an email body?** — Sources: [Twilio — email HTML injection](https://www.twilio.com/en-us/blog/developers/tutorials/building-blocks/dont-get-pwned-via-email-html-injection), [PortSwigger — preventing XSS](https://portswigger.net/web-security/cross-site-scripting/preventing), [papra HTML-injection advisory (GHSA-6f8x-2rc9-vgh4)](https://github.com/papra-hq/papra/security/advisories/GHSA-6f8x-2rc9-vgh4). Finding: **yes** — HTML-encode user-adjacent input before embedding; no detection/sanitization is bulletproof, always encode. → Applied: `feature` is a `requireTenantAdmin`-supplied (i.e. untrusted) field, so it is **HTML-escaped** (`& < > " '`) and **length-capped to 120** before insertion, and only goes in the body (subject unchanged → no header-injection vector).

**Residual note (pre-existing, not fixed here):** `tenantName`/`tenantSlug`/`newName` are embedded in the same email **unescaped** (existing behavior). They originate from Scott-controlled provisioning, lower risk, and fixing them is out of this PR's scope — flagged for a follow-up.

## Scope / safety
- Frontend (tierInfo/requestUpgrade/useTierGate/UpgradePrompt/MediaTab) is **not gated** — built independently.
- The gated edge-fn change is additive + escaped per the research above.
- No RLS/auth/cache/payments behavior change; backend tier gate remains source of truth.

## Open before merge (two human-only gates — PR stays DRAFT until both clear)
1. ~~Validator-gate tool substitution~~ — **RATIFIED** by orchestrator (above).
2. **Browser QA (Scott, local):** Pro/tier-3 → "Tag with AI Vision" opens the upgrade modal naming **"Pro"**, **no** network request, no raw 403; Elite/tier-4 → tagging works, no regression. (Steps in QA report.)
3. **Merged-source review (Scott→orchestrator, at merge):** confirm on the final merged `notify-upgrade/index.ts` that (a) the HTML escape is applied at interpolation and covers the full set, (b) `feature` is genuinely optional with a clean default — then MCP deployed-parity check after merge.

Self-verification for gate 3 (for reference): (a) `escapeHtml` covers `& < > " '` and is applied at the interpolation point `${escapeHtml(feature.trim().slice(0,120))}` inside `featureLine`; (b) `feature` is destructured (undefined when absent) and `featureLine` defaults to `''` unless `typeof feature === 'string' && feature.trim()`.

Per kickoff: PR ends **open, not merged**; auto-merge NOT enabled.
