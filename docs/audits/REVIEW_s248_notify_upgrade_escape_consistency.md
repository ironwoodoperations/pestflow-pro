# s248 — notify-upgrade full-escape consistency pass

Edge function only. No frontend/runtime/schema change. Behavior change scope = escape every interpolated string that lands in the outgoing Resend payload using the same shared `escapeHtml` helper already in the file. Validator gate **WAIVED** per kickoff (OWASP-canonical escaping, settled non-contested question; same rationale ratified in S247).

## What changed

| File | Change |
|---|---|
| `supabase/functions/notify-upgrade/index.ts` | EDIT — apply existing `escapeHtml` to every remaining raw interpolation in subject + body. Header bumped v13 → v14 (source-track; deployed-track v26 → v27 after Scott's MCP redeploy). `featureLine` unchanged (already-built HTML fragment with internal escaping). |
| `docs/audits/REVIEW_s248_notify_upgrade_escape_consistency.md` | NEW — this file. |
| `docs/audits/QA_REPORT_s248_notify_upgrade_escape_consistency.md` | NEW — verification report. |

## Wave 1 — inventory of interpolations

Every interpolation that lands in the Resend `subject` or `html` field, with origin + escape status:

| # | Value | Origin | Pre-S248 | Post-S248 |
|---|---|---|---|---|
| 1 | `tenantName` (subject) | DB `tenants.name`, fallback `tenant_id`. Tenant name is user-set at provisioning. | RAW | `escapeHtml(tenantName)` |
| 2 | `newName` (subject) | `plan_name` from JSON body (free-text from caller), fallback `TIER_NAMES[new_tier]`, fallback `Tier ${new_tier}`. | RAW | `escapeHtml(newName)` |
| 3 | `tenantName` (body) | same as #1 | RAW | `escapeHtml(tenantName)` |
| 4 | `newName` (body) | same as #2 | RAW | `escapeHtml(newName)` |
| 5 | `price` (body) | `monthly_price ? \`$${monthly_price}/mo\` : ''`. `monthly_price` is caller-supplied JSON. | RAW | `escapeHtml(price)` |
| 6 | `oldName` (body) | `TIER_NAMES[old_tier]` OR `Tier ${old_tier}`. `old_tier` is caller-supplied JSON. | RAW | `escapeHtml(oldName)` |
| 7 | `featureLine` (body) | Pre-built HTML fragment: `<p>Triggered by: <strong>${escapeHtml(feature.trim().slice(0,120))}</strong></p>` — its dynamic content is **already escaped** at construction (S247). | Escaped at construction | **Unchanged — re-escaping the wrapper HTML would double-encode the `<p>`/`<strong>` tags and render literal `&lt;p&gt;` in the email.** |
| 8 | `tenantSlug` (body) | DB `tenants.slug`, fallback `''`. Slug is user-set at provisioning. | RAW | `escapeHtml(tenantSlug)` |

### `escapeHtml` helper review

```ts
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')   // ← &-first, no double-encode
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
```

Covers the OWASP HTML-context entity set (`& < > " '`), `&` first so subsequent entities don't get re-encoded. Reused as-is — no second escaper introduced.

## Wave 2 — choices documented

- **All string interpolations escaped uniformly.** None of the "leave-if-provably-safe" candidates are worth the asymmetry. `oldName`/`newName` fall through to `Tier ${old_tier}` / `Tier ${new_tier}` where the integer is caller-supplied JSON (could be a string), and `price` interpolates caller-supplied `monthly_price`. Cheaper and safer to escape every string.
- **`featureLine` deliberately not wrapped in `escapeHtml`.** It is a pre-built HTML fragment whose only dynamic input (the `feature` field) was already escaped at construction in S247. Wrapping the fragment a second time would convert the literal `<p>`/`<strong>` markup into `&lt;p&gt;`/`&lt;strong&gt;` and the email would render visible tags. Correct policy is "escape at the leaf, not at the branch."
- **Subject line escaped per kickoff instruction.** Note: email `Subject:` is an RFC 5322 header, not HTML, so most clients render entities literally — an `&` in a tenant name will now appear as `&amp;` in the subject preview. Cosmetic, not a regression on the hardening goal. Flagged so Scott can decide whether to revert subject-only escaping after the redeploy; the body remains the higher-value target either way.

## Contract / behavior

- Auth gate: unchanged (`requireTenantAdmin(req, tenant_id)`).
- Required-field check: unchanged (`tenant_id`, `new_tier`).
- Optional `feature` contract: unchanged (typed-string + non-empty after trim → escaped + 120-char cap → wrapped in `<p>…</p>` fragment).
- Outgoing JSON shape to Resend (`from`/`to`/`subject`/`html`/`reply_to`): unchanged.
- Existing BillingTab caller (no `feature`): byte-equivalent except where input contains `& < > " '` — those are now entity-encoded.

## Risk

Low. Email goes to Scott's own sales inbox. No tenant-facing surface. All changes are output-only encoding. Worst plausible regression: a tenant name containing `&` displays as `&amp;` in the email subject preview (body renders correctly because HTML entities decode in `text/html`).

## Deploy

Per kickoff: CC Web does not deploy. Scott merges this PR, then redeploys notify-upgrade via Supabase MCP. Deployed version should advance v26 → v27. Post-redeploy QA = a single test send confirming the body decodes back to the original characters and the subject is unchanged in shape.

## Open before merge

- Self-review (this file) — every interpolation accounted for above; `featureLine` exception justified.
- Scott's merged-source review at merge.
- Post-merge MCP redeploy + test send (a tenant whose name contains `&` is the highest-signal smoke test if available; otherwise any tenant suffices).
