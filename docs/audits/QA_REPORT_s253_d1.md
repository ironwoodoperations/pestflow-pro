# QA Report — S253 / D1: Per-Tenant Redirect Mechanism

**Date:** 2026-06-04
**Branch:** `claude/peaceful-sagan-xbCiL`
**Verdict:** ✅ PASS — all four verification gates met. Test data inserted and removed; no seed data left in the table.

## Gates walked

| # | Check | Expected | Actual | Result |
|---|-------|----------|--------|--------|
| 1 | `npx tsc --noEmit` (CI gate) | clean | exit 0 | ✅ |
| 2 | `npm run lint` (CI gate) | 0 errors | 0 errors, 212 pre-existing warnings (none in new files) | ✅ |
| 3 | Build with empty table → `redirects-map.json` | `{}`, build does not fail | `{}`, exit 0, warning logged | ✅ |
| 4 | `npm run build:next` middleware bundle | within ~1 MB compressed | **27.1 kB** (uncompressed) | ✅ |
| 5 | Insert 3 rows for `coastal-pest`, project, confirm normalization | lowercased, trailing-slash stripped, slash-collapsed, decoded | see below | ✅ |
| 6 | Runtime lookup parity (already-decoded path) | key matches | matches | ✅ |
| 7 | Remove test rows | 0 remaining | `remaining_coastal_rows = 0` | ✅ |
| 8 | `slug === 'dang'` / standalone / apex routing | unchanged | redirect block is additive, early-returns only on positive match | ✅ |

## Gate 5/6 detail — normalization + parity

Inserted for `coastal-pest` (via MCP service role), then ran the projector's exact
transform (importing the real shared `canonicalizePath`):

| DB `from_path` | Projected key | Why |
|----------------|---------------|-----|
| `/Pest-Control/` | `/pest-control` | lowercase + non-root trailing slash stripped |
| `/old//ant-control` | `/old/ant-control` | duplicate slash collapsed |
| `/servicios/contrataci%C3%B3n` | `/servicios/contratación` | decoded ONCE at build, lowercased |

`to_path` stored decoded-but-as-authored (e.g. `/services/general-pest`), `status`
honored per row (one `301`, two `308`).

Runtime parity: middleware lookup with the already-decoded incoming path
`/servicios/contratación` → `canonicalizePath` → matches the projected key and
returns `{ to: '/contact', status: 308 }`. Confirms build-key ↔ runtime-key parity
(the failure mode the task flagged — storing encoded keys that never match).

Test rows deleted afterward; table back to 0 rows for `coastal-pest`.

## Notes for deploy

- `SUPABASE_SERVICE_ROLE_KEY` (+ `SUPABASE_URL` or `VITE_SUPABASE_URL`) must be set
  in the Vercel project (production scope) for the cutover deploy to populate the
  map. If absent, the build emits `{}` and logs a warning — safe, but redirects
  will be empty. Surfaced for Scott.
- Redirects are **not live until a deploy runs** (build-time projection) — by
  design, since shell cutover is deploy-gated.
