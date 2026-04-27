# S177 Shipped — Path D Session 1: Standalone Repo Repointed at PFP Supabase

**Date:** 2026-04-27  
**Author:** Claude Code (claude-sonnet-4-6)  
**Session:** S177

---

## What Was Done

Repointed the `ironwoodoperations/dang-pest-control` standalone repo from its own Supabase project (`bqavwwqebcsshsdrvczz`) to PFP's shared Supabase (`biezzykcgzkrwdgqpsar`), scoped to the Dang tenant.

---

## Git State

| Marker | SHA |
|--------|-----|
| Pre-flight tag `s177-preflight` | `ff2527b16cc7d8e48dc625447106bd590d97fdc4` |
| S177 commit (standalone repo) | `32d0db177c0dacf2fe8ae936edb206108a5626c9` |

Commit stats: **22 files changed, 46 insertions, 21 deletions**

---

## Files Modified (standalone repo)

| File | Change |
|------|--------|
| `src/integrations/supabase/client.ts` | Replaced hardcoded Supabase URL + anon key with `import.meta.env.VITE_SUPABASE_URL` / `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY` |
| `src/lib/tenant.ts` | NEW — exports `DANG_TENANT_ID = '1611b16f-381b-4d4f-ba3a-fbde56ad425b'` |
| `.env` | Updated to PFP Supabase project (`biezzykcgzkrwdgqpsar`) values |
| `src/hooks/useHolidayMode.ts` | Added tenant_id filter; changed `.single()` → `.maybeSingle()` |
| `src/hooks/useSiteConfig.ts` | Added tenant_id filter |
| `src/pages/ServiceArea.tsx` | Added tenant_id filter on `location_data` query |
| `src/pages/ServiceAreaPage.tsx` | Added tenant_id filter on `location_data` query |
| `src/pages/LocationPage.tsx` | Added tenant_id filter on both `location_data` queries |
| `src/pages/SlugRouter.tsx` | Added tenant_id filter on `location_data` query |
| `src/pages/ServicePage.tsx` | Added tenant_id filter on `page_content` query |
| 12 service page components | Each: added `import { DANG_TENANT_ID }` + replaced hardcoded old UUID with constant |

Old wrong tenant_id (standalone Supabase): `1282b822-825b-4713-9dc9-6d14a2094d06`  
Correct PFP tenant_id: `1611b16f-381b-4d4f-ba3a-fbde56ad425b`

---

## Deployment

| Field | Value |
|-------|-------|
| Vercel project ID | `prj_Vh7FOLfuCUmB7m9TAKeOKyghNpkX` |
| Deployment ID | `dpl_5gtmByyaEHWfqbGpq9ufgRF72Dii` |
| Preview URL | `dang-pest-control-gq91f6ffr-csdevore2s-projects.vercel.app` |
| Production alias | `dang-pest-control.vercel.app` |
| Deployment state | READY |

Env vars were set via committed `.env` file (no Vercel CLI token was available in the Codespace). Anon/publishable keys are safe to commit.

---

## G5 Smoke Test Results

| URL | Status |
|-----|--------|
| `dang-pest-control.vercel.app` (root) | **200 OK** |
| `dang-pest-control.vercel.app/termite-control` | **200 OK** |
| Preview subpaths | 401 — SSO-gated (expected on preview deployments) |

SPA shell serves correctly. Client-side Supabase queries now hit PFP Supabase and are tenant-scoped. Dynamic content (holiday mode, SEO overrides, location data, page_content overrides) will resolve from PFP DB if rows exist.

---

## Known Gaps / S178 Scope

| Gap | Notes |
|-----|-------|
| `VITE_ANTHROPIC_API_KEY` not set | FAQ AI Chat FAB calls direct browser Anthropic API. Scott must add this manually via Vercel dashboard → standalone project → Environment Variables. |
| Form submission (leads insert) | Quote form and contact form use Supabase insert. They will need `tenant_id` added to every insert row. S178 scope. |
| FAQ UX port | Standalone has flat numbered list; PFP has search + categories + accordion + AI chat. S178 scope. |

---

## Pre-existing Issues (not introduced in S177)

- `SIMPLETEXTING_API_KEY` is committed in the standalone `.env` file. This predates S177. Scott should rotate this key and move it to a Vercel environment variable (not in `.env`).

---

## Rollback Plan

The pre-flight tag `s177-preflight` on the standalone repo pins the last working commit against the old Supabase. The old Supabase project `bqavwwqebcsshsdrvczz` is still alive. To roll back:

```bash
git checkout s177-preflight
git push origin main --force-with-lease
```

Then restore old env vars in Vercel dashboard.
