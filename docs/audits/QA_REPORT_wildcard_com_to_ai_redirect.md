# QA Report — Wildcard `*.pestflowpro.com` → `*.pestflowpro.ai` host-preserving 301/308

**Branch:** `feat/wildcard-com-to-ai-redirect`
**Files changed:** `middleware.ts` (new first-check), `vercel.json` (`permanent: false → true`).
**Risk surface:** request routing on the live paying-tenant domain. **Validator gate:** see `REVIEW_wildcard_com_to_ai_redirect.md` (reconciliation).

## What shipped

1. **`middleware.ts` — `.com → .ai` redirect as the VERY FIRST check** in the `middleware()` function, before the localhost pass-through and before any tenant resolution/rewrite. Early-returns a `NextResponse.redirect(…, { status: 308 })`, so it cannot interact with downstream routing.
2. **`vercel.json` — flipped the pre-existing wildcard redirect `permanent: false → true`** (307 → 308) for consistency. Note: this rule was already present (since Jun 5) but evidently not firing in prod (`.com` served 200); middleware is the effective fix.

## Match condition (precise — per the two hard constraints)

```ts
if (hostname.endsWith('.pestflowpro.com')) {
  const comSub = extractSubdomain(host);   // null for apex + 'www'
  if (comSub) {
    const target = new URL(`https://${comSub}.pestflowpro.ai${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(target, { status: 308 });
  }
}
```

- Fires only when host ends with `.pestflowpro.com` **AND** `extractSubdomain()` returns a non-empty subdomain.
- `extractSubdomain` returns `null` for apex `pestflowpro.com` and for `www.pestflowpro.com` (both in `APEX_HOSTS`; `sub === 'www'` → `null` at line 51). Apex also fails `endsWith('.pestflowpro.com')` (no leading-dot label) → doubly excluded.
- Reuses the file's existing `extractSubdomain` helper — no new host-parsing logic, no behavior change to it.

## Behavioral verification (expected prod behavior — preview build validates the compile)

| Case | Expected | Why |
|---|---|---|
| `urban-strike.pestflowpro.com/ant-control?utm=x` | **308** → `https://urban-strike.pestflowpro.ai/ant-control?utm=x` | `endsWith('.pestflowpro.com')` ✓; `extractSubdomain` → `urban-strike`; `pathname` + `req.nextUrl.search` preserved |
| `dang.pestflowpro.com/` | **308** → `https://dang.pestflowpro.ai/` | subdomain preserved; root path preserved |
| `pestflowpro.com` (apex) | **no new redirect** (dashboard 301 still applies) | fails `endsWith('.pestflowpro.com')`; `extractSubdomain` → `null` |
| `www.pestflowpro.com` | **no new redirect** (dashboard-handled) | `APEX_HOSTS` → `extractSubdomain` → `null` |
| `urban-strike.pestflowpro.ai/ant-control` | **no redirect** (serves normally) | `.ai` host never matches `.pestflowpro.com` → **no loop** |
| `localhost` (dev) | unchanged pass-through | doesn't match `.pestflowpro.com`; new check is skipped, dev branch runs as before |

**Loop analysis:** the only redirect target is a `.pestflowpro.ai` host; that host can never satisfy `endsWith('.pestflowpro.com')`, so the check is single-hop by construction. No loop under any ordering relative to the `vercel.json` rule (the `vercel.json` rule is also `.com`-gated).

## Build / typecheck

| Check | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit -p tsconfig.next.json` | ⚠️ Not runnable in this sandbox — `node_modules` absent, so **every** file fails `Cannot find module 'next/server'` uniformly (environmental, not code). The change reuses the file's existing imports (`NextResponse`, `extractSubdomain`) and standard `URL`. |
| Build | Vercel preview deploy | Validates the real compile (reported on the PR). |

## Untouched (explicit)

- `extractSubdomain`, `APEX_HOSTS`, `PFP_SUFFIXES`, `STANDALONE_SLUGS`, the per-tenant `redirectsMap` lookup, the set-password branch, the `/admin` rewrite, the apex 404 gating, and the `/tenant/<slug>` rewrite — all unchanged. The new check is purely additive and early-returns before any of them.
