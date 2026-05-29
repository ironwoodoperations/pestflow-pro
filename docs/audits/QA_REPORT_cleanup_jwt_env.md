# QA Report — cleanup: pin verify_jwt + drop VITE_ANTHROPIC_API_KEY

**Branch:** `cleanup/jwt-config-and-env` · config + docs only.

## Verification
| Check | Result |
|---|---|
| `config.toml` `[functions.ai-proxy]` → `verify_jwt = false` | ✅ flipped (was true) |
| `process-campaign-job` / `tag-image-vision` = false | ✅ already false (unchanged) |
| `generate-social-batch` = true | ✅ unchanged |
| Only the ai-proxy block touched; rest of `config.toml` intact | ✅ |
| `.env.example` edit | ⛔ blocked by protect-files.sh `\.env` pattern → item 6 deferred (not attempted) |
| `git diff` scope | ✅ `supabase/config.toml` + the two `docs/audits/*` files only — no source/tests/migrations/frontend |
| Redeploy from CC Web | ✅ none — orchestrator redeploys via MCP post-merge |

## Live-effect note (orchestrator, post-merge)
The pinned `verify_jwt=false` only takes effect on the live `ai-proxy` after redeploy. **Orchestrator redeploys `ai-proxy`, `process-campaign-job`, and `tag-image-vision` via MCP** so the pinned config applies. Smoke after redeploy:
- `ai-proxy` public route still rejects a missing/invalid user JWT (in-handler `requireAiCaller`) → 401.
- `ai-proxy/internal` accepts a valid delegation envelope with **no** Authorization header (previously a `true` gateway would 401 before the handler) → 200.

## Verdict
PASS for item 3. Item 6 correctly halted (protected) and deferred with the exact diff captured. Item 5 deferred to bundle with item 4.
