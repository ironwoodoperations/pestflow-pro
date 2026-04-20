# Migration s160.6 — resolve.ts stale branding.template read

Executed: 2026-04-20
Fix commit: 5e2672d
ISR purge commit: 20e9a17

## What was broken

`shared/lib/tenant/resolve.ts` line 29:
```ts
template: branding.template ?? 'modern-pro',
```

After T9.2 renamed `branding.template` → `branding.theme` across all 5 `settings.branding` DB rows, `branding.template` was `undefined` for every tenant. The `?? 'modern-pro'` fallback fired for all tenants. Result: every public tenant page rendered the modern-pro shell regardless of the actual saved theme.

The admin save (BrandingSection), the DB write, and the revalidation plumbing were all correct. The bug was entirely in this one read.

## Why T9.3's grep missed it

T9.3's final verification grep scanned `src/`, `app/`, and `lib/`:
```
grep -rn "branding\.template|branding->>'template'" src/ app/ lib/
```

`shared/` was not in the grep path. `resolve.ts` lives at `shared/lib/tenant/resolve.ts` — a separate top-level directory used for code shared between the admin SPA (`src/`) and the Next.js public site (`app/`). Zero hits returned, migration declared clean.

Same class of bug as the `get_tenant_boot` RPC fix in T9.3 — a settings read path that wasn't updated when the DB key was renamed. The RPC was caught because it was queried directly. The resolver was missed because it's in an unscanned directory.

## Fix

One line, right-hand side only:

```ts
// Before
template: branding.template ?? 'modern-pro',

// After
template: branding.theme ?? 'modern-pro',
```

Property name on the left (`template`) unchanged — all consumers (`layout.tsx`, `page.tsx`, and 8 other app pages) read `tenant.template` from the resolver result. Only the DB read on the right changed.

File: `shared/lib/tenant/resolve.ts`

## Sweep results

1a — `branding.template` in `shared/`: exactly 1 hit (the known line 29). No others.
1b — `year_founded` in `shared/`: 0 hits.
1c — broader `branding.` sweep: all other fields (`primary_color`, `accent_color`, `logo_url`, `favicon_url`, `cta_text`) are unchanged canonical keys unaffected by any migration.

## Build

- TypeScript: CLEAN
- Build: GREEN, 87.3 kB first load shared JS (unchanged)

## Live verify

Pending manual browser check after Vercel deploys propagate:
- `pestflow-pro.pestflowpro.com` — DB has `theme: 'bold-local'`; expect bold-local shell
- `cityshield-pest-defense.pestflowpro.com` — DB has `theme: 'rustic-rugged'`; expect rustic-rugged shell

## Retro: additions for future JSONB migrations

Two process failures led to this bug shipping undetected:

**1. Grep paths must include `shared/`**

Any future migration grep that scans for a JSONB key pattern must include:
```
grep -rn "pattern" src/ app/ lib/ shared/
```
`shared/` contains the server-side tenant resolver — the critical path for all public page renders.

**2. End-to-end visual switch test before closing migration**

After any `settings.branding` key rename, the checklist must include:
- Open a public tenant URL in a fresh private window
- Confirm the rendered shell matches the `theme` value in the DB
- Change the theme in admin and save
- Wait for revalidate
- Confirm the shell changes visually on the public URL

This test would have caught the bug immediately at T9.2 verification (before T9.3 was even started) and would have triggered the RPC fix earlier too.
