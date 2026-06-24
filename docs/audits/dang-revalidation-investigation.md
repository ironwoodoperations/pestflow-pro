# Dang Re-Validation Investigation — why dashboard saves don't reach dangpestcontrol.com

**Date:** 2026-06-24
**Mode:** INVESTIGATE ONLY — no code changed, nothing deployed, no fix PR.
**Repos in scope:** `ironwoodoperations/pestflow-pro` (sections A, B, D — fully read) and
`ironwoodoperations/dang-pest-control` (section C — **NOT accessible from this session**, see below).

---

## TL;DR (the one-paragraph answer)

When content is saved in the PFP dashboard for Dang, the write to the shared PFP Supabase
(`biezzykcgzkrwdgqpsar`) succeeds, and the save handler **does** fire on-demand revalidation.
But that revalidation is a **same-origin POST to `/api/revalidate`**, which only ever mutates the
**Next.js cache of the PestFlow Pro Vercel deployment**. Dang's public site is a **separate repo on
a separate Vercel project** (`dang-pest-control` → `dangpestcontrol.com`). Nothing in the PFP codebase
addresses, calls, deploy-hooks, or otherwise reaches Dang's deployment. So Dang's cached/static `/contact`
is never purged and keeps serving stale copy until Dang's own ISR/build refreshes it. The content-editor
path and the SEO apply-fix path are **the same root cause** — both route through the identical
`triggerRevalidate → /api/revalidate` on the PFP deployment. This gap is **Dang-specific**; normal
`*.pestflowpro.ai` tenants are served *by the PFP deployment itself*, so the same call purges the right
cache and they update live.

---

## Architecture recap (the fact that makes everything click)

PFP is a hybrid: a **Vite SPA** (the `/admin` + `/ironwood` dashboards) and a **Next.js App Router** public
site (`app/tenant/[slug]/…`). One Vercel project ("pestflow-pro") serves both, plus the `/api/revalidate`
route handler.

`middleware.ts:22-33,172-182` is explicit that Dang is a **standalone-repo tenant**:

```ts
// Standalone-repo tenants: public site lives in a SEPARATE Vercel project
// (e.g. Dang -> dangpestcontrol.com). On <slug>.pestflowpro.ai these tenants are
// admin-only; every non-admin path 404s to prevent a duplicate public render ...
const STANDALONE_SLUGS = new Set( (process.env.STANDALONE_TENANT_SLUGS ?? '')... )
...
if (STANDALONE_SLUGS.has(slug)) {
  return new NextResponse(null, { status: 404,
    headers: { 'x-pfp-routing-decision': 'standalone-admin-only-404' } });
}
```

So on the PFP deployment, `dang.pestflowpro.ai/admin` → the Vite admin shell (works), but
`dang.pestflowpro.ai/<public-path>` → **404 by design**. The real public site is `dangpestcontrol.com`,
a different Vercel project from a different repo. Dang's PFP tenant_id is
`1611b16f-381b-4d4f-ba3a-fbde56ad425b` (per `scripts/migrate-dang.ts:14`, `scripts/restore-dang-content.mjs:10`).

Dang content was **migrated into** the PFP Supabase as a one-time job
(`scripts/migrate-dang.ts`: reads `DANG_SUPABASE_URL` → writes PFP `SUPABASE_SERVICE_ROLE_KEY`), and the
dashboard edits it there. That confirms the premise that the dashboard writes Dang's `page_content` into
`biezzykcgzkrwdgqpsar`.

---

## A) Content-editor save path (PFP repo)

### A1 — where the save writes, and what revalidation it fires

File: `src/components/admin/ContentTab.tsx`, `handleSave()` (lines **154–197**).

- Write: `supabase.from('page_content').upsert(pageRow, { onConflict: 'tenant_id,page_slug' })`
  — **line 173**. `supabase` is the browser client pointed at the PFP project (`biezzykcgzkrwdgqpsar`).
- After a successful write (lines **182–196**):
  1. `invalidatePageContent(tenantId, selectedSlug)` — **line 183** (client-side React Query/local cache only).
  2. Fetches the access token, then:
     ```ts
     const ok = await triggerRevalidate({ type: 'page', tenantId, slug: selectedSlug }, accessToken) // line 187
     ```
  3. On `ok === false` it shows the "site refresh may take up to 60 min" toast (lines 190–191).

`triggerRevalidate` lives in `src/lib/revalidate.ts:23-46`:

```ts
const body = { ...payload, tenantSlug: getTenantSlug() };          // line 27
const res = await fetch('/api/revalidate', {                       // line 29  ← RELATIVE, same-origin
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
  body: JSON.stringify(body),
});
```

`getTenantSlug()` (lines 10-16) = `window.location.hostname.split('.')[0]` → `"dang"` when editing on
`dang.pestflowpro.ai`. So the payload is correct; the call returns 200 (membership check passes — see below);
the dashboard shows "Content saved!". Nothing about that success means the *public Dang site* was purged.

The route handler `app/api/revalidate/route.ts` (lines **54–60**) for `type:'page'`:

```ts
revalidateTag(cacheTags.page(body.tenantId, body.slug)); // line 58
revalidateTag(cacheTags.allPages(body.tenantId));        // line 59
revalidatePath('/tenant/[slug]', 'layout');              // line 60
```

### A2 — which deployment the revalidation targets (the crux)

**It targets the PestFlow Pro Next deployment only — the same origin that served the dashboard.** The fetch is
**relative** (`/api/revalidate`), so it resolves to whatever Vercel project is serving the admin page, and the
`revalidateTag`/`revalidatePath` calls mutate only **that project's** in-process Next cache.

Exact call that "targets" the deployment: `fetch('/api/revalidate', { method: 'POST', … })` (`revalidate.ts:29`),
whose handler runs `revalidatePath('/tenant/[slug]', 'layout')` (`route.ts:60`).

**It does NOT call anything on Dang's deployment.** Grep across the whole repo for `dangpestcontrol`,
`deploy hook`, cross-origin revalidate URLs, etc. finds **only** content-restore scripts and docs — there is
no fetch to `dangpestcontrol.com`, no Vercel deploy-hook URL, no second revalidate target anywhere in the
save path. `revalidatePath`/`revalidateTag` are *in-process Next primitives*; they cannot reach another
Vercel project even in principle.

Where is the Dang dashboard actually served from? Per `docs/audits/s176-6-standalone-dang.md:99-100`,
`dang.pestflowpro.com` serves the **PFP admin shell** (`x-matched-path: /_admin/index.html`). So Scott edits
Dang on the PFP deployment → `/api/revalidate` purges the **PFP** cache for `/tenant/dang/*` (which 404s on
that deployment anyway) → `dangpestcontrol.com` (separate project) is untouched.

### A3 — `'layout'` qualifier vs bare path

**Compliant with the standing ISR rule.** It uses the **pattern + `'layout'` form**:
`revalidatePath('/tenant/[slug]', 'layout')` (`route.ts:60,63,66,69,72,75,78`), not a bare concrete path like
`/tenant/dang/contact`. This is the correct shape for a dynamic route segment.

> **Side note (not the Dang cause, but a latent drift worth flagging):** `app/_lib/cacheTags.ts:1-7` claims the
> tags are consumed by the read path "(unstable_cache options.tags)". But the actual read path
> (`app/tenant/[slug]/_lib/queries.ts`) wraps every fetcher in React `cache()` (request-scoped memoization) and
> relies on **segment-level `export const revalidate = 300`** for ISR — there is **no `unstable_cache(... {tags})`**
> anywhere under `app/` (grep: `unstable_cache` appears only in docs). So the `revalidateTag(...)` calls in
> `/api/revalidate` are effectively **no-ops against the read path**; the line that actually busts the served
> HTML for PFP tenants is `revalidatePath('/tenant/[slug]', 'layout')`. This works fine for PFP-served tenants
> but means the "tag" half of the design is dead. Irrelevant to Dang (whose cache lives in another project), but
> it should be reconciled separately.

---

## B) SEO apply-finding-fix path (PFP repo)

### B1 — does `triggerRevalidate` fire after the edge fn's 200, and what does it target?

The edge fn `supabase/functions/apply-finding-fix/index.ts` writes `page_content.intro` / `seo_meta.*`
server-side and explicitly defers cache purge to the client (SEAM 1, lines **15-17**):

```
// SEAMS (s263 spec §7): 1 the FRONTEND awaits this 200 then calls triggerRevalidate
// (this fn never purges ISR — Deno can't call Next revalidateTag). ...
```

The frontend caller is `src/components/admin/seo/useSeoFixChain.ts`. **Yes, `triggerRevalidate` fires**, in all
three sub-paths:

- **Single apply** — `applyOne()` (lines 78-92): awaits the edge 200, then
  `await triggerRevalidate({ type: 'page', tenantId, slug: appliedSlug }, t)` — **line 90**.
- **Elite Fix-all** — `handleFixAll()` (lines 108-128): after the batch returns, loops the written slugs:
  `for (const slug of results.slugs ?? []) await triggerRevalidate({ type: 'page', tenantId, slug }, t)` — **line 121**.
- **Manual SEO meta editor** — `useSeoTab.ts handleSaveMeta()` (lines 171-193): after upserting `seo_meta`,
  `await triggerRevalidate({ type: 'page', tenantId, slug }, …)` — **line 184** (S263 Step 4 closed the gap
  where manual meta saves previously didn't purge at all).

All three target `type:'page'` via the **same** `triggerRevalidate` → **same** relative `/api/revalidate`.

### B2 — does it reach Dang's separate deployment?

**No — identical to A2.** Same `src/lib/revalidate.ts` function, same same-origin `/api/revalidate`, same
`revalidatePath('/tenant/[slug]','layout')` on the **PFP** deployment. The SEO path has no Dang-aware branch
and no second revalidate target. So an "Apply fix" on a Dang page updates the PFP Supabase row and purges the
PFP cache, while `dangpestcontrol.com` keeps serving stale copy.

**Conclusion for A vs B:** **same root cause.** Both paths correctly fire on-demand revalidation against the
PFP deployment; neither can purge the separate Dang deployment. They differ only in *which DB column* they write
and *which UI* triggers them — the revalidation seam is shared and has the identical blind spot.

---

## C) Dang public repo — **REQUIRES DANG-REPO ACCESS (could not complete this pass)**

**Access status from this session:**
- GitHub MCP is scoped to `ironwoodoperations/pestflow-pro` only. A direct read of
  `ironwoodoperations/dang-pest-control` returns:
  `Access denied: repository "ironwoodoperations/dang-pest-control" is not configured for this session.`
  No `list_repos`/`add_repo` tool is available in this session to widen scope.
- A live-site probe is **also blocked** by the environment network policy: outbound `CONNECT` to
  `dangpestcontrol.com:443` is rejected `403` (proxy `recentRelayFailures`:
  `"gateway answered 403 to CONNECT (policy denial)"`). So I could not even read response headers
  (`x-vercel-cache`, `cache-control`, `age`) to infer static-vs-dynamic.

**Therefore C1/C2/C3 must be run in a session with the Dang repo (and/or unblocked network).** Below is what
the PFP-side evidence lets us say, plus the exact checklist to run there.

**Repo coordinates (from `docs/audits/s176-6-standalone-dang.md`):**
- Remote: `https://github.com/ironwoodoperations/dang-pest-control.git`, single `main` branch.
- As of the April S176.6 audit: **React 18 + Vite SPA** (react-router, `react-helmet-async` for per-page
  `<title>`/meta), Supabase client at `src/integrations/supabase/client.ts`, build
  `node scripts/generate-sitemap.mjs && vite build`, deployed on Vercel project `dang-pest-control`
  (`dang-pest-control.vercel.app` → `dangpestcontrol.com`).

> ⚠️ **Material contradiction to resolve in the Dang repo.** The S176.6 audit recorded Dang's client pointing
> at its **own** Supabase project `bqavwwqebcsshsdrvczz` — *not* the shared PFP project `biezzykcgzkrwdgqpsar`.
> The current problem statement says Dang reads `page_content` from the shared PFP Supabase. **Both cannot be
> true unless the Dang repo was re-pointed since April.** This fork decides the root cause:
>
> - **If Dang still reads `bqavwwqebcsshsdrvczz`:** the dashboard writes land in a *different database than Dang
>   reads*, so the page would never update **regardless of any cache** — this would be a **wrong-DB problem, not a
>   revalidation problem**, and no amount of cache purging fixes it.
> - **If Dang was re-pointed to `biezzykcgzkrwdgqpsar`:** then it's purely the **cross-deployment cache** problem
>   described in A/B.
>
> The very first thing to check in the Dang repo is the Supabase URL/anon key it builds against.

**C1 — how `/contact` sources content (verify in Dang repo):** Confirm the framework as-of-now. If still a
Vite SPA with a *client-side* Supabase fetch, content would normally appear on reload (no server cache) — which
would *contradict* "stale after hard refresh", pointing back to the wrong-DB fork or a CDN/`index.html` cache.
If it was rebuilt to Next/`getStaticProps`/`force-static`/`fetch(..., {next:{revalidate:N}})`, capture the exact
caching directive. **Quote the actual source** for the contact route.

**C2 — on-demand revalidate endpoint in Dang repo:** Search for `app/api/revalidate`, `pages/api/revalidate`,
`res.revalidate(`, `revalidateTag`/`revalidatePath`, or any webhook receiver. Determine if one exists, whether
it's secret-protected, and — critically — **whether anything in PFP calls it** (grep already done on the PFP side:
**nothing does**). If no endpoint exists, there is no inbound channel for PFP to purge Dang at all.

**C3 — how Dang is deployed/rebuilt:** Vercel project name (`dang-pest-control` per audit), any deploy hook URL,
and the build trigger (git push to `main` vs cron vs manual). A deploy hook is one candidate fix vector (see menu).

---

## D) Scope check — Dang-only, or is revalidation broken for everyone?

**Dang-specific. Revalidation is NOT broken for normal tenants.**

Mechanism: normal `*.pestflowpro.ai` tenants are served **by the PFP Next deployment itself** —
`middleware.ts:184-188` rewrites `<slug>.pestflowpro.ai/<path>` → `/tenant/<slug>/<path>` on the same project.
So when their content is saved, `triggerRevalidate → /api/revalidate → revalidatePath('/tenant/[slug]','layout')`
purges **the exact deployment that renders them** → they update live (immediate purge; ISR `revalidate = 300`
is only the fallback TTL). The `route.ts` membership gate (lines 42-51, `tenant_users` admin/owner check)
passes for any tenant admin including Scott-on-Dang, so the 200/“saved” signal is identical — it just doesn't
*mean* anything for Dang.

Dang is the **only** tenant whose public render is excluded from the PFP deployment (`STANDALONE_SLUGS` 404)
and relocated to a separate Vercel project the revalidate call can't reach. The problem statement also states
Dang is the only standalone tenant. **Blast radius = Dang only** (plus any *future* standalone-repo tenant added
to `STANDALONE_TENANT_SLUGS`, which would inherit the identical gap).

---

## Fix options menu (NOT implemented — for Scott to choose)

All of these are about getting a purge/rebuild signal from "save in PFP" across the deployment boundary to Dang.
**Precondition:** first resolve the C-fork above — if Dang reads a *different DB*, none of these help and the real
fix is re-pointing Dang's Supabase client to `biezzykcgzkrwdgqpsar`.

| # | Option | How it works | Pros | Cons / tradeoffs |
|---|--------|--------------|------|------------------|
| 1 | **On-demand revalidate endpoint in the Dang repo + PFP calls it** | Add `app/api/revalidate` (or `res.revalidate`) to Dang, secret-protected. In PFP, extend `triggerRevalidate` (or the route handler) to *also* POST to `https://dangpestcontrol.com/api/revalidate` for standalone tenants. | Closest parity to how PFP tenants already work; near-instant; surgical per-path. | Requires Dang to actually be an ISR/Next app with a purgeable cache (verify C1); cross-repo change + a shared secret to manage; PFP must special-case standalone tenants (map slug→deploy URL). If Dang is a pure Vite SPA, there's no server cache to revalidate — this option doesn't apply as-is. |
| 2 | **Cache-tag / CDN purge** | Purge Dang's CDN cache for the affected path(s) on save — e.g. Vercel cache-tag invalidation or a path purge API call from PFP. | No app-level endpoint needed if done at the CDN layer; can be path-scoped. | Depends on Dang's hosting exposing a purge API + token; still requires PFP to special-case Dang and hold a credential; Vercel tag-purge needs the responses to be tagged at build/runtime (verify Dang emits cache tags). |
| 3 | **Dang deploy hook on save** | Store a Vercel deploy-hook URL for Dang; PFP pings it after a Dang content save, triggering a full rebuild. | Simplest to wire; works even if Dang is fully static (`vite build` / `force-static`) — a rebuild always picks up new DB content; no Dang code change beyond having a hook. | Slow (full rebuild, ~tens of seconds to minutes — matches "not after 60s"); coarse (rebuilds the whole site for one field); burns build minutes; risk of rebuild storms on rapid edits (needs debounce). Good stopgap, poor for high edit volume. |
| 4 | **Reduce/abandon caching on Dang's dynamic pages** | Make Dang's content routes dynamic (`cache: 'no-store'` / `revalidate = 0` / client fetch) so they always read fresh from the DB. | No cross-repo signaling at all; always current. | Loses ISR/static perf + SEO/TTFB benefits; more DB load; only sensible for the handful of editable pages. Verify against C1's current caching. |

**Recommendation (pending C verification):** if Dang is/returns to an ISR-capable app, **Option 1** is the
right long-term parity fix (it mirrors the PFP-tenant flow exactly); **Option 3 (deploy hook)** is the fastest
low-risk stopgap that works even for a static Vite build. But **do not build any of them until the C-fork is
settled** — if Dang is reading `bqavwwqebcsshsdrvczz`, the fix is a one-line Supabase re-point, not a cache mechanism.

---

## Evidence index (file:line)

- `src/components/admin/ContentTab.tsx:154-197` — Save Content handler; upsert L173; `triggerRevalidate` L187.
- `src/lib/revalidate.ts:10-16,23-46` — relative same-origin `POST /api/revalidate`; slug from hostname.
- `app/api/revalidate/route.ts:42-51,54-60` — admin membership gate; `revalidateTag` + `revalidatePath('/tenant/[slug]','layout')`.
- `app/_lib/cacheTags.ts:1-7` — claims `unstable_cache` consumption (not actually wired in read path).
- `app/tenant/[slug]/_lib/queries.ts:5-21` — `getPageContent` uses React `cache()` only.
- `app/tenant/[slug]/contact/page.tsx:4` — `export const revalidate = 300` (PFP ISR TTL; **PFP project only**).
- `app/tenant/[slug]/layout.tsx:1` — `export const revalidate = 300`.
- `shared/lib/supabase/server.ts:31-36` — `getServerSupabaseForISR` (no `no-store`; lets ISR cache).
- `middleware.ts:22-33,172-188` — standalone-tenant 404 gating; PFP-tenant rewrite to `/tenant/<slug>`.
- `supabase/functions/apply-finding-fix/index.ts:15-17` — SEAM 1: frontend must revalidate after 200.
- `src/components/admin/seo/useSeoFixChain.ts:78-92,108-128` — `triggerRevalidate` on apply / fix-all.
- `src/components/admin/seo/useSeoTab.ts:171-193` — manual meta save also revalidates (L184).
- `scripts/migrate-dang.ts:3-14` — one-time migration Dang-own-DB → PFP DB; Dang PFP tenant_id `1611b16f-…`.
- `docs/audits/s176-6-standalone-dang.md:22,94-100,122` — Dang repo = separate Vercel/repo; own Supabase
  `bqavwwqebcsshsdrvczz`; `dang.pestflowpro.com` serves PFP admin shell.

**Not verifiable this pass (need Dang repo / unblocked network):** Dang's current framework & contact-route
caching (C1), presence/secret-state of a Dang revalidate endpoint (C2), Dang deploy/build trigger (C3), and —
decisive — **which Supabase project the Dang public client currently reads from.**
</content>
</invoke>
