# Review — S253 / D1: Per-Tenant Redirect Mechanism (build-time JSON map)

**Branch:** `claude/peaceful-sagan-xbCiL`
**Scope:** build-time projection script, middleware lookup, rollback artifact, runbook reconciliation. The `public.tenant_redirects` table was already applied in prod via MCP — not touched here.

## Files

| File | Change |
|------|--------|
| `scripts/generate-redirects-map.mjs` | NEW — build-time projection: queries `tenant_redirects` JOIN `tenants` with the SERVICE ROLE key, emits `redirects-map.json`. Resilient: missing creds / empty table / query error → `{}` + exit 0. |
| `redirects-normalize.mjs` | NEW — shared, zero-dep `canonicalizePath()` imported by BOTH the build script and middleware (single source of truth for key/lookup parity). |
| `redirects-map.json` | NEW — committed empty `{}` default (generate-and-commit; build overwrites). |
| `middleware.ts` | Additive redirect check after slug resolution, before `/admin` + tenant rewrite. Imports only the JSON + normalizer. |
| `package.json` | `prebuild` hook runs the projector before `build`. |
| `docs/migrations/s253-d1-tenant-redirects-rollback.sql` | NEW — documented reversal (DROP TABLE … CASCADE + `NOTIFY pgrst`). Checked-in artifact, not executed. |
| `docs/onboarding/faithful-rebuild-runbook.md` | NEW — canonical runbook for the rebuild-on-shell redirect step. |
| `docs/onboarding/CUSTOMER_SITE_DISCOVERY_PROMPT.md`, `CUSTOMER_ONBOARDING_PROMPT.md` | Stale "open question / paste into vercel.json" references corrected to the new flow. |

## Decisions

- **Build hook:** npm `prebuild` (runs automatically before `build`; Vercel `buildCommand` is `npm run build`). No existing codegen hook existed to match.
- **Script language:** `.mjs` not `.ts` — the repo has no TS runner installed (the `.ts` scripts reference an uninstalled `npx ts-node`); the actually-runnable build/seed scripts are all `.mjs` run with plain `node`. A build-time step that must run on every Vercel deploy needs zero-friction execution. The `.ts` in the task brief was prefixed "e.g." (example).
- **Generate-vs-commit:** generate-and-commit with a committed empty `{}` default. CI runs `npx tsc --noEmit` (not the build), and `middleware.ts` statically imports the JSON, so the file MUST exist for typecheck to resolve — a gitignored-only artifact would break CI. The build overwrites it with real data.
- **Normalizer sharing:** one `canonicalizePath()` in `redirects-normalize.mjs`, imported by both sides. Decode happens ONCE at build time (DB value) — middleware does not re-decode (`nextUrl.pathname` is already decoded).
- **Placement:** redirect check sits immediately after the apex `if (!slug)` block (slug guaranteed non-null) and before `/admin`/standalone/tenant rewrites. Only a positive match early-returns; misses fall through to all existing routing unchanged.

## Risk / guardrails checked

- ✅ No DB import, schema/validation lib, or server-side helper pulled into the middleware import graph (only the JSON + 22-line normalizer). Middleware bundle = 27.1 kB.
- ✅ No per-request DB call added; Edge path stays data-free.
- ✅ Existing slug parsing, `STANDALONE_SLUGS` handling, apex gating untouched. (There is no `slug === 'dang'` hardcode in the current middleware; STANDALONE_SLUGS is the live equivalent and is left alone.)
- ✅ Service role key read from a non-`VITE_`/`NEXT_PUBLIC_` env var.
- ✅ Rollback SQL co-located in the same commit as the code.
