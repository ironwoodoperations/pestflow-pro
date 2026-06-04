# Review — S253 / A1: AI Authority Score (3-engine, tier-gated)

**Branch:** `feat/s253-a1-ai-authority`
**Scope:** engine adapters/parsers, two sibling proxies, the worker, the per-engine scorer + scoring RPC artifact, and the gated Reports tile. The provisioned DB layer (tables/view/enum/seeds) was NOT modified.

## Decisions logged in this session (asked, not assumed)
1. **Branch:** new `feat/` branch off `main` (PR #149 was still open on the session branch).
2. **Scorer source:** operator-applied **scoring RPC** — `ai_authority_jobs` is operator-only RLS, so the tenant tile cannot read the denominator. `get_ai_authority_scores` (SECURITY DEFINER, caller-owns-tenant guard) returns per-engine/per-week aggregates; the tile reads it as a local DB call.
3. **claude_web:** **deferred to a dormant stub.** A sibling proxy for Claude would be a NEW direct `api.anthropic.com` caller — violates CLAUDE.md non-negotiable #3 ("do not add new ones") and trips the CI guard. Wired engines: `perplexity_sonar`, `openai_web`. Parser for Claude is implemented for forward-compat but the worker never invokes it.

## Files

### Server (Deno edge)
| File | Role |
|------|------|
| `_shared/aiAuthority/types.ts` | `ParsedCitation`, `TenantContext`, `EngineId` (pure). |
| `_shared/aiAuthority/match.ts` | Deterministic hostname-exact citation match, mention, position, share-of-voice (pure). |
| `_shared/aiAuthority/parsers.ts` | Per-engine parsers → `ParsedCitation`; per-engine failure isolated (never throws). |
| `_shared/aiProxyShared.ts` | Extracted `constantTimeEq` + `insertAiProxyLog` + `checkRateLimit`, shared by `ai-proxy` and the new proxies. |
| `ai-authority-perplexity/index.ts` | Sibling proxy → Perplexity `sonar`. |
| `ai-authority-openai/index.ts` | Sibling proxy → OpenAI Responses API `web_search`. |
| `ai-authority-worker/index.ts` | Processes one job; claims → adapter-gate → proxy → parse → snapshot → done/error. |
| `ai-proxy/index.ts` | **Only** change: imports the extracted shared helpers (behavior identical). |

### Operator-applied
| `docs/migrations/s253-a1-ai-authority-scores-rpc.sql` | `get_ai_authority_scores` RPC. Apply via MCP with the dispatch/drain cron (supabase/migrations/ is protected). |

### Frontend (Vite/React)
| `src/lib/aiAuthority/score.ts` | Pure per-engine scorer + EWMA + calibration (no blended composite). |
| `src/lib/aiAuthority/engines.ts` | Engine display registry (live / coming_soon / hidden). |
| `src/hooks/useAiAuthorityScore.ts` | RPC + tier_engines → per-engine `EngineScore`. |
| `src/components/admin/reports/AIAuthorityTile.tsx` | Per-engine score / calibrating / locked-upgrade / coming-soon cards. |
| `src/components/admin/ReportsTab.tsx` | Renders the tile (per-engine gating handled inside). |

### Tests
`score.test.ts`, `match.test.ts`, `parsers.test.ts` — 22 vitest cases.

## Hard-rule compliance
- ✅ No DB-layer modification; no cron created. Scoring RPC is a checked-in artifact for the operator.
- ✅ Per-engine **sibling** proxies; `ai-proxy` Anthropic path untouched except the sanctioned shared-helper extraction.
- ✅ No browser→engine calls; keys server-side only; no `VITE_`/`NEXT_PUBLIC_` AI keys. CI Anthropic guard passes (no new `api.anthropic.com` caller).
- ✅ **No blended composite** — each engine scored independently.
- ✅ **Denominator = scheduled jobs (done+error)** from `ai_authority_jobs`, never snapshot count (RPC enforces; scorer divides by it).
- ✅ Tile reads `ai_authority_snapshots_tenant`/RPC — never the base table; `raw_response` never exposed.
- ✅ No live-tier re-resolution in the run path (worker reads the job's snapshotted `engine`); display visibility = data-exists OR current-tier, not tier-stripping.
- ✅ `google_aio` dormant; worker refuses any engine not wired or `adapter_enabled=false`.
- ✅ Worker uses the supabase-js REST client (PostgREST → Supavisor), never a direct `postgres://` session connection → no pool exhaustion.

## Risk notes
- `ai-proxy` edits are behavior-preserving but could not be deployed/tested in this environment (no Deno / no Supabase local). Diff is mechanical (two helper swaps). Recommend a smoke test of one existing AI feature after deploy.
- Engine model strings / API shapes verified against current docs (June 2026): Perplexity `sonar`; OpenAI Responses `web_search` on `gpt-4.1` (`max_output_tokens` ceiling 1500); Anthropic `web_search_20250305` (parser only, engine deferred).
