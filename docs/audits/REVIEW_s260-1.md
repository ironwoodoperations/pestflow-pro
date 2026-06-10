# REVIEW — S260-1: In-app monthly report viewer (v1, sandboxed iframe)

**Branch:** `claude/practical-einstein-2jpoae`
**Scope:** v1 only — render the stored monthly SEO report in-app inside a bare-sandbox iframe. No PDF/download (that is v1.1).

---

## Problem

The monthly SEO report HTML lives in the private `reports` Supabase Storage bucket.
Supabase serves stored objects as `text/plain` by design, so the previous "View"
action (`window.open(signedUrl)`) showed **raw HTML source** in a new tab instead of
a rendered page. This is a documented Supabase constraint, not a fixable header.

## Fix

Render the report in-app inside a sandboxed iframe via `srcDoc`, fed by the HTML
string fetched from the signed URL.

## Files changed

| File | Change |
|------|--------|
| `src/components/admin/reports/MonthlyReportViewer.tsx` | **New** (≈90 lines). Modal viewer. Fetches a fresh short-lived signed URL on open, reads `.text()` once, holds the HTML in state, renders it in a bare-sandbox iframe. Loading spinner + error states. |
| `src/components/admin/reports/MonthlyReportsCard.tsx` | "View" no longer opens the signed URL in a tab. It now opens `MonthlyReportViewer` in a modal. Removed `window.open` / `opening` state; added `selected` state and the viewer render. Icon swapped `ExternalLink` → `Eye`. |

## Behavior (as specified)

1. **On View click** → `MonthlyReportViewer` mounts and:
   - calls `supabase.storage.from('reports').createSignedUrl(path, 60)` for a **fresh** URL,
   - `fetch()`es it and reads `await res.text()` **exactly once**,
   - stores the HTML string in React state.
   - It never re-fetches after that — all rendering uses the in-memory string. The
     ~60s signed-URL expiry therefore doesn't matter post-load.
2. **Render** — bare-sandbox iframe via `srcDoc`:
   ```tsx
   <iframe
     // SECURITY: never add allow-scripts
     sandbox=""
     srcDoc={html ?? ''}
     title="Monthly SEO Report"
     style={{ width: '100%', height: '100%', border: 0 }}
   />
   ```
3. **Loading / error** — spinner while fetching; clear error message if the sign,
   fetch, or `.text()` step fails.
4. **Close** — returns to the report list. Re-opening mounts a fresh viewer (keyed on
   report id) which re-fetches a fresh signed URL.

## Security review (cardinal STOP constraints)

- ✅ **Bare `sandbox=""`** — no flags. No `allow-scripts`, no `allow-same-origin`.
  Empty sandbox = most restrictive: scripts blocked, opaque/null origin so the parent
  app CSP cannot cascade in and strip the report's inline `<style>`.
- ✅ The exact comment `// SECURITY: never add allow-scripts` sits on the sandbox attr.
- ✅ HTML is held in state; no re-fetch on render or future print.
- ✅ Never combines `allow-same-origin` + `allow-scripts` (the combination that lets a
  frame remove its own sandbox).

## Repo-rule compliance

- ✅ Files < 200 lines (viewer ≈90, card ≈115).
- ✅ Vite build green; main `index` chunk 270 kB < 450 kB cap.
- ✅ Branch + PR (draft); no push to `main`.
- ✅ Storage query uses the SDK builder; no `.single()` introduced. The `tenant_reports`
  list query is unchanged (returns an array, not a single row).
