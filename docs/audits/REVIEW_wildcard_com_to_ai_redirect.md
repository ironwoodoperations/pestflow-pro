# REVIEW — Wildcard `*.pestflowpro.com` → `*.pestflowpro.ai` host-preserving 301/308

**Branch:** `feat/wildcard-com-to-ai-redirect`
**Files:** `middleware.ts`, `vercel.json`

---

## Context correction (the task premise was partly stale)

The task asked to *add* a host-preserving `.com → .ai` redirect. Investigation found **one already exists** in `vercel.json` (since Jun 5), subdomain- and path-preserving, but `permanent: false` (307). It is, however, **not effective in prod** — `.com` subdomains were verified serving live 200 duplicate content on 2026-06-25. The actual source of that 200 is **`middleware.ts`**, which resolves a slug for `.com` subdomains and rewrites to `/tenant/<slug>`. Per owner decision (AskUserQuestion → "Option 1, middleware first-check"), the fix lives in middleware, where the duplicate render originates, with the `vercel.json` rule flipped to `permanent: true` as a consistent belt.

## The change

- **`middleware.ts`** — `.com → .ai` 308 redirect as the **first** statement in `middleware()` (before localhost pass-through and all tenant logic), early-return. Match = `hostname.endsWith('.pestflowpro.com')` AND `extractSubdomain(host)` non-null. Destination `https://<sub>.pestflowpro.ai<pathname><search>` (path + query preserved).
- **`vercel.json`** — `permanent: false → true` on the existing wildcard rule.

---

## VALIDATOR GATE — reconciliation (conservative-wins)

**Note on validators:** the named validators (Perplexity + Gemini) are **not available as MCP tools in this session**. Substituted **two independent web-research passes** — WebSearch (Vercel routing docs) and Tavily (Next.js docs + Stack Overflow) — plus first-principles analysis of the code. Both passes agree on the load-bearing facts below. Flagging the substitution explicitly so Scott can re-run the named validators if he wants a third pass before merge.

### (a) Middleware-first-check ordering vs the shadowed `vercel.json` rule

- **Documented Vercel order:** `Firewall → Headers → Redirects (vercel.json) → Middleware → Rewrites → Route Handler`. So `vercel.json` redirects are documented to run **before** middleware ([Vercel: Project-Level Routing Rules](https://vercel.com/docs/routing/project-routing-rules)).
- **Correction to the "shadowed by middleware" framing:** per that documented order, the `vercel.json` redirect should fire *before* middleware — yet `.com` served 200, which means the `vercel.json` rule **is not matching in prod today** (likely a wildcard-domain-attachment/edge nuance not visible from the repo). Either way the middleware check is correct: if the `vercel.json` rule *does* fire, the request 308s at the CDN and never reaches middleware (the middleware check is a harmless no-op); if it *doesn't* (current prod), the middleware check catches the request before the `/tenant/<slug>` rewrite. **Complementary, not conflicting**, under both orderings.
- **Conservative conclusion:** keep both. The middleware check is the guaranteed fix because it sits at the exact point the duplicate render is produced.

### (b) Loop / collision risk with the existing tenant-subdomain rewrite

- The redirect target is always a `.pestflowpro.ai` host. `.ai` can never satisfy `endsWith('.pestflowpro.com')`, so the redirect is **single-hop by construction** — no loop.
- Apex `pestflowpro.com` and `www.pestflowpro.com` are excluded (`extractSubdomain` → `null`), so this does **not** double-handle the dashboard-managed apex/www 301s.
- The check early-returns **before** `STANDALONE_SLUGS`, the per-tenant `redirectsMap`, the `/admin` rewrite, set-password, and the `/tenant/<slug>` rewrite — so it cannot collide with any of them. On `.ai` hosts the check is skipped entirely and all existing routing runs unchanged.

### (c) 308 vs 301

- Next.js / `NextResponse.redirect` idiom is **307/308** to preserve the HTTP method (a 301/302 can cause browsers to coerce POST→GET). Google's John Mueller has confirmed **308 is treated identically to 301** for indexing/link-equity ([Rob Marshall: permanent redirects in Next.js](https://robertmarshall.dev/blog/how-to-permanently-redirect-301-308-with-next-js), [Next.js redirects docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects)). **308 chosen** — method-preserving and SEO-equivalent to 301. (For a pure GET marketing redirect 301 would also be fine; 308 is strictly safer.)

**Reconciliation verdict:** the middleware-first-check at 308, with apex/www excluded and `.ai` non-matching, is loop-free and collision-free, and is the effective fix given the prod-observed 200. Conservative-wins satisfied.

Sources: [Vercel Project-Level Routing Rules](https://vercel.com/docs/routing/project-routing-rules) · [Next.js redirects config](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects) · [Rob Marshall — 301/308 in Next.js](https://robertmarshall.dev/blog/how-to-permanently-redirect-301-308-with-next-js)

---

## Risk assessment

- **Additive + early-return** → blast radius is limited to `.com` subdomain hosts, which today serve duplicate content and should not exist as indexable 200s anyway.
- **No change** to any existing helper or branch; `.ai` traffic (the live paying tenants' real domain) is entirely untouched.
- **Reversible** in one revert (single early-return block + one `vercel.json` boolean).

## Recommendation

Merge after preview-build green + a prod probe of `urban-strike.pestflowpro.com/ant-control` (expect 308 → `…ai/ant-control`) and `urban-strike.pestflowpro.ai/ant-control` (expect 200, no redirect). Manual-merge; auto-merge not armed.
