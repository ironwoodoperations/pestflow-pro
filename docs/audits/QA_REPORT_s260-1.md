# QA REPORT — S260-1: In-app monthly report viewer (v1)

**Branch:** `claude/practical-einstein-2jpoae`
**Date:** 2026-06-10
**Component under test:** `MonthlyReportViewer` + `MonthlyReportsCard` (Reports tab)

---

## Build / static checks

| Check | Result |
|-------|--------|
| `npm run build:vite` | ✅ Pass — built in ~2s |
| Largest entry chunk (`index`) | 270 kB (gzip 84.8 kB) — under 450 kB cap ✅ |
| `ReportsTab` chunk (carries the viewer) | 86.5 kB ✅ |
| New file line count | `MonthlyReportViewer.tsx` ≈90, `MonthlyReportsCard.tsx` ≈115 — both < 200 ✅ |

> Note: full repo `tsc --noEmit` reports pre-existing errors in the Next.js `app/`
> tree (unrelated to this change); the Vite admin build — which is what ships and is
> bundle-capped — compiles clean.

## Sandbox / security assertions (cardinal STOP)

| Assertion | Result |
|-----------|--------|
| `sandbox` attribute present and **bare** (`sandbox=""`, no flags) | ✅ |
| No `allow-scripts` anywhere in the iframe | ✅ |
| No `allow-same-origin` anywhere in the iframe | ✅ |
| Exact comment `// SECURITY: never add allow-scripts` on the sandbox attr | ✅ |
| Report HTML held in state; no re-fetch on render | ✅ |

## Behavioral test matrix (manual reasoning over the code paths)

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 1 | Click "View" on a report with a `storage_path` | Modal opens, spinner shows, report renders styled in iframe | ✅ code path: sign → fetch → `.text()` once → `srcDoc` |
| 2 | Report HTML renders with inline `<style>` | Styles apply (bare sandbox keeps opaque origin; parent CSP doesn't cascade) | ✅ |
| 3 | Signed-URL creation fails | Error message "We couldn't load this report…", no iframe | ✅ caught → `setError` |
| 4 | `fetch` returns non-OK / network error | Same error state | ✅ `res.ok` guard + try/catch |
| 5 | Click Close (X) or backdrop | Modal closes, returns to list | ✅ `onClose` on backdrop + button, `stopPropagation` on panel |
| 6 | Re-open the same report | Fresh viewer mounts, **fresh** signed URL fetched | ✅ conditional render keyed on `selected`; effect deps `[report.id, report.storage_path]` |
| 7 | Report row missing `storage_path` | "View" button disabled | ✅ `disabled={!r.storage_path}` |
| 8 | Signed URL expires (~60s) while viewing | Still renders — uses in-memory string, never re-fetches | ✅ no post-load fetch |
| 9 | Unmount mid-fetch | No state update after unmount | ✅ `active` flag in effect |

## Not in scope (v1.1)

- PDF export / download button — intentionally omitted per spec.

## Verdict

✅ Ready for review. All hard constraints met; build green; bundle within cap.
