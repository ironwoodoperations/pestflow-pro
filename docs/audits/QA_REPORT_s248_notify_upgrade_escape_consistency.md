# s248 — QA Report (notify-upgrade full-escape consistency pass)

Edge-function only change. No frontend/runtime/schema change. No prod-preview QA possible (hostname-routed SPA). Verification is static + post-merge MCP redeploy + test send (Scott).

## Static checks

| Check | Result |
|---|---|
| Source diff = `supabase/functions/notify-upgrade/index.ts` only (plus the two docs) | ✅ |
| Every raw `${tenantName}`, `${newName}`, `${oldName}`, `${price}`, `${tenantSlug}` is now wrapped in `escapeHtml(...)` — in both subject and body | ✅ (6 sites) |
| `featureLine` interpolation deliberately **not** wrapped (already-built HTML fragment with internal escaping) | ✅ |
| Only one escape helper in the file (`escapeHtml` from S247) — no second escaper introduced | ✅ |
| `escapeHtml` covers `& < > " '`, with `&` replaced first (no double-encode) | ✅ |
| Auth gate unchanged: `requireTenantAdmin(req, tenant_id)` retained, AuthError forwarded | ✅ |
| Required-field check unchanged: `tenant_id && new_tier` | ✅ |
| Optional `feature` contract unchanged: same `typeof === 'string' && trim()` guard, same 120 cap, same wrapper markup | ✅ |
| Resend payload shape unchanged: `from`, `to`, `subject`, `html`, `reply_to` keys identical | ✅ |
| Header version bumped v13 → v14 in comment (source-track; deployed bump v26 → v27 is Scott's MCP step) | ✅ |
| `protect-files.sh` patterns — notify-upgrade NOT in protected list | ✅ |

## Worked example — encoding sanity

Input: tenant name `Bob's Bees & Pests`, plan upgrade `Starter → Pro` ($349/mo), slug `bobs-bees`, no `feature` field.

Subject (RFC 5322 header — entities render literally in most clients):
```
⬆️ Plan Upgrade: Bob&#39;s Bees &amp; Pests → Pro
```

HTML body (entities decode in `text/html` rendering):
```html
<p><strong>Bob&#39;s Bees &amp; Pests</strong> started a plan upgrade to <strong>Pro</strong> ($349/mo).</p><p>They moved from Starter. Call to confirm and check in.</p><p>Slug: bobs-bees</p>
```

Body renders to user as: **Bob's Bees & Pests** started a plan upgrade to **Pro** ($349/mo). Subject preview shows the literal entities — cosmetic, called out in the review.

## Worked example — featureLine intact

Input: same as above + `feature: "AI Vision tagging"`.

Body adds (unchanged from S247):
```html
<p>Triggered by: <strong>AI Vision tagging</strong></p>
```

Rendered: **Triggered by: AI Vision tagging** — confirms the deliberate decision not to wrap `featureLine` in another `escapeHtml` call (which would have produced `&lt;p&gt;Triggered by: &lt;strong&gt;…`).

## Worked example — injection attempt neutralized

Input: malicious tenant name `<script>alert(1)</script>` (hypothetical — tenant names are Scott-provisioned, but the point of escaping is to remove the footgun).

Body output:
```html
<p><strong>&lt;script&gt;alert(1)&lt;/script&gt;</strong> started a plan upgrade …
```

Rendered as literal text in the email client; no script tag in the DOM. Pre-S248 this would have been a live `<script>` tag in the rendered email body (most clients sandbox it; some don't).

## What was NOT touched

- The `escapeHtml` helper body — identical to S247, reused.
- The auth gate, AuthError forwarding, JSON helpers, CORS map.
- The `feature` optional contract (length cap, trim, type guard, conditional render).
- The Resend endpoint, headers, or `from`/`to`/`reply_to` addresses.
- Any other edge function or frontend file.

## Post-merge verification (Scott, via MCP)

1. Redeploy: `mcp__supabase__deploy_edge_function` notify-upgrade (`--no-verify-jwt`, project `biezzykcgzkrwdgqpsar`). Expect new version v27.
2. `get_edge_function` notify-upgrade → confirm `version: 27`, `ACTIVE`, and source matches the merged file byte-for-byte.
3. Test send from BillingTab or the S247 tier-gate UpgradePrompt → confirm the sales@homeflowpro.ai inbox receives the email and the body renders the tenant name correctly (entities decoded by the client's HTML renderer).

## Verdict

Edge-fn change is byte-stable in shape, encoding-only in content. Auth, gate, required-fields, and `feature` contract preserved. Safe to merge; ready for Scott's MCP redeploy.
