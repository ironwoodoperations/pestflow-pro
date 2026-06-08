# REVIEW — chore: pin verify_jwt + set-tenant-secret 403 SQLSTATE + onboarding domain gate

Branch: `claude/hopeful-ptolemy-UaiKu`
Scope: 3 files (config.toml, set-tenant-secret/index.ts, CUSTOMER_ONBOARDING_PROMPT.md)

## Part A — config.toml verify_jwt pinning

Dashboard-verified deployed `verify_jwt` (via `list_edge_functions`, project biezzykcgzkrwdgqpsar)
BEFORE writing — this is the authoritative state the config is pinned to match:

| Function | Deployed | Intended (task) | Action |
|---|---|---|---|
| process-sms-queue | false | false | added (false) |
| publish-scheduled-posts | false | false | added (false) |
| notify-new-lead | false | false | added (false) |
| provision-tenant | false | false | already present — left |
| set-tenant-secret | true | true | already present — left |
| ga4-analytics | **true** | ~~false~~ | added (**true**) — see mismatch |
| gsc-analytics | **true** | ~~false~~ | added (**true**) — see mismatch |

**MISMATCH caught (task said STOP-and-report):** ga4-analytics and gsc-analytics are deployed
`verify_jwt=true`, not `false`. Their source (`requireTenantUser` gate for interactive "Run Now"
+ reading the `role` claim from an already-signature-verified JWT for the cron path) depends on
the gateway verifying the JWT — they are USER-JWT callers, same class as set-tenant-secret, NOT
internal-secret callers. Pinning them `false` would have been a real auth-posture change (the exact
silent flip this chore prevents). Scott confirmed → pin both to `true` to match deployed reality.

- process-sms-queue / publish-scheduled-posts / notify-new-lead authenticate via the in-source
  `apikey` header compared (timing-safe) against `<FN>_INTERNAL_SECRET` — JWT-less callers, so
  verify_jwt=false is correct; gateway JWT verification would 401 their legitimate callers.
- No other `[functions.*]` block touched.

## Part B — set-tenant-secret 403 via SQLSTATE

Changed the RPC-error branch to key the 403 decision off `rpcErr.code === '42501'`
(insufficient_privilege) instead of the message regex `/unauthorized|forbidden/i`, which did not
match the RPC's "not an admin of tenant" wording (mapped denial → 500). Everything else → 500
(unchanged). The tenant_users PRE-CHECK (the primary 403 path + defense-in-depth) is untouched.
The 401 / null-uid handling earlier in the function is untouched.

**BLOCKED-ON-RPC:** the matching mapping requires the deployed `set_tenant_secret` RPC to RAISE
its ownership-denial with `ERRCODE '42501'` (orchestrator owns that DB change via MCP). Do NOT
`deploy_edge_function` for set-tenant-secret until Scott confirms that RPC change is applied —
otherwise the code branch won't match (denials would still 500). Merging the PR does NOT deploy.

## Part C — onboarding doc

Added item 5 to CUSTOMER_ONBOARDING_PROMPT.md Phase 1 (Pre-flight / pre-provision verification):
exclusively-owned public registrable-domain gate for the AI-Authority registrable-domain collapse,
with the shared-builder-host (`*.wixsite.com`, etc.) → `settings.ai_authority.canonical_apex` pin
fallback. Matched the doc's existing numbered-list formatting (it does not use `- [ ]` checkboxes);
bumped the verification gate to "all 5 checks".

## Verdict
Scoped, no unrelated edits. config.toml mirrors deployed reality for all 7. Edge-fn change is
status-code-correctness only (security unaffected). Doc change is additive.
