# S321 — resolving a tenant's custom domain. Validator gate submission.

**Status: SUBMITTED. Awaiting both verdicts. NO IMPLEMENTATION HAS BEEN WRITTEN.**

⚠️ **The verdict TEXTS are not yet supplied.** Appendices A and B stay placeholders rather
than be reconstructed from a summary — the S309/S313/S320 precedent. A reconstruction is
indistinguishable from a transcript to a later reader, which is the entire value of a slot
labelled VERBATIM.

---

## What is being changed

`precisionlawnsystems.com` went live on Vercel on 2026-09-02 and is the **first tenant on a
custom domain**. Three code paths resolve a tenant's public host, and none of them reads one.
The change makes all three resolve a custom domain from the database.

1. **`shared/lib/resolveSiteUrl.ts`** — supplies the canonical link, OG/Twitter URL and
   JSON-LD `@id` for every SSR tenant page. Its signature is
   `resolveSiteUrl(tenant: { slug: string; subdomain?: string | null })`, so it is
   structurally incapable of seeing a custom domain; it holds a two-entry hardcoded map and a
   `TODO: read from tenant_domains WHERE verified=true once that table is wired.`
2. **`supabase/functions/api-quote/index.ts`** — a public unauthenticated endpoint whose
   origin allowlist is a regex of literal hostnames. A request from a custom domain is
   rejected 403 before the insert.
3. **No `app/robots.ts` and no `app/sitemap.ts` exist.** `robots.txt` is a single static file
   at `public/robots.txt`, served identically for every tenant and every domain.

No migration. No writes to `tenants` or `tenant_domains`. `settings.seo.noindex` is not
touched.

---

## Facts established before any design, and how

**Read directly this session** (repo at `8e60cef`, live DB via MCP, deployed bundles via
`get_edge_function`):

| fact | source | value |
|---|---|---|
| `resolveSiteUrl` signature | `shared/lib/resolveSiteUrl.ts:14` | takes `{slug, subdomain}` only |
| its callers | grep | 6 SSR sites: `layout.tsx`, `page.tsx`, `about`, `blog/[post]`, `DefaultPestPage`, plus `buildPageMetadata` / `tenantSeoMetadata` |
| what the SSR read path SELECTs | `shared/lib/tenant/resolve.ts` | **`.select('id, slug, subdomain, name')`** |
| `app/robots.ts`, `app/sitemap.ts` | directory listing | **neither exists** |
| `robots.txt` origin | `public/robots.txt` | static, 5 lines, names no sitemap, knows no tenant |
| repo `api-quote` allowlist | `supabase/functions/api-quote/index.ts:45` | `pestflowpro\.com` \| `homeflowpro\.ai` \| `dangpestcontrol\.com` |
| **deployed** `api-quote` v36 allowlist | `get_edge_function` | `pestflowpro\.(com\|ai)` \| `homeflowpro\.ai` \| `dangpestcontrol\.com` |
| origin gates platform-wide | grep | only `api-quote` (403 gate); `outscraper-reviews` + `_shared/cors.ts` reflect ACAO |

**Taken from the brief, NOT independently verified.** This environment's egress proxy denies
`CONNECT` to arbitrary hosts (`gateway answered 403`, confirmed against
`$HTTPS_PROXY/__agentproxy/status`), so the live rendered HTML, the live `403` from
`api-quote`, and the live `/sitemap.xml` 404 could not be re-observed here. The mechanism for
each is confirmed by reading the source; the live observations are the brief's.

---

## FINDING THAT CONTRADICTS THE BRIEF — read before choosing a source of truth

The brief states: *"`tenants.custom_domain` = the ONE canonical host. This is what a
canonical/OG URL wants. It is ALREADY on the tenant row the SSR read path loads."*

**Both halves are false, and each is load-bearing.**

### (a) It is not on the loaded row

`resolveTenantBySlug` selects `id, slug, subdomain, name`. `custom_domain` is not among them.
No caller has it in hand.

*This is good news.* It means the column can be added to a `SELECT` that **already runs and is
already `cache()`-wrapped** — one more column on an existing query, not a new DB call in the
metadata path. The caching concern the brief raises does not arise for that route.

### (b) `tenants.custom_domain` is not reliably the public host

Read from the live database, 2026-09-02:

| slug | `tenants.custom_domain` | `tenant_domains` rows |
|---|---|---|
| `dang` | **`admin.dangpestcontrol.com`** | `dangpestcontrol.com` **verified=false**, `www.…` **verified=false** |
| `pls` | `precisionlawnsystems.com` | `precisionlawnsystems.com` **verified=true**, `www.…` **verified=true** |
| all 7 others | `NULL` | none |

For dang the column holds the **admin host**. The repo already knows this in three places and
works around it:

- `src/lib/subdomainRouter.ts:29` — *"custom_domain match (e.g. admin.dangpestcontrol.com)"*
- `supabase/functions/seo-analytics/index.ts:26-29` — *"custom_domain is the ADMIN host; strip
  the leading `admin.`"*, implemented as `t.custom_domain.replace(/^admin\./i, '')`
- `supabase/functions/_shared/aiAuthority/match.ts:50` — records this as **"the A1 bug"**

**Consequence: neither candidate source satisfies the brief's own verification requirement 3**
("dang still resolves to dangpestcontrol.com after the hardcoded map is removed").

| source | dang resolves to | verdict |
|---|---|---|
| `tenants.custom_domain` | `https://admin.dangpestcontrol.com` | **wrong** — points the public canonical at an admin login host |
| `tenant_domains WHERE verified=true` | *no rows* → `https://dang.pestflowpro.ai` | **wrong** — regresses to the platform subdomain |
| `tenants.custom_domain` with `admin.` stripped | `https://dangpestcontrol.com` | correct, **by heuristic** |

The same two `verified=false` rows are why the S318 build-time projection emitted **2
hostnames from 4 `tenant_domains` rows** — dang is already excluded from the domain map.

**This is arguably a data defect, not a code one.** If dang's two `tenant_domains` rows were
verified, `tenant_domains` would be a correct single source and no heuristic would be needed.
The brief forbids writing to either table, so a code-only change cannot meet requirement 3
without either the `admin.`-strip heuristic or retaining a dang special-case. **Put to the
gate as question (a); not decided unilaterally.**

---

## SECOND FINDING — the origin allowlist does not do what its name implies

`api-quote`, both repo and deployed:

```ts
const origin = req.headers.get('origin') ?? req.headers.get('referer') ?? ''
if (origin && !allowedOriginPattern.test(origin)) { return 403 }
```

**The check is skipped entirely when `Origin` and `Referer` are both absent.** `curl -X POST`
with no `Origin` header passes it. `Origin` is set by browsers and is not attacker-controlled
*in a browser*, but this endpoint is reachable by anything that speaks HTTP.

So the allowlist stops **cross-origin browser form posts from unlisted sites**. It does not
stop scripted abuse, which is the rate limiter's job. Whatever it is worth, it is worth that —
and any redesign should be explicit about which of the two it is buying. **Question (c).**

---

## DEPLOY HAZARD — the repo would regress production if deployed as-is

The repo's `api-quote` is **behind** the deployed function by one change: deployed v36 accepts
`pestflowpro\.(com|ai)`; the repo accepts `pestflowpro\.com` only. The deployed bundle carries
a comment naming S213a.1 (the `.com` → `.ai` migration) that does not exist in the repo file —
so the 2026-08-23 bulk repo import wrote a pre-S213a.1 copy over it.

**Deploying the repo file unmodified would 403 every `.ai` tenant and stop lead capture
platform-wide, silently, with the function still reading ACTIVE.** Any change to this file
must carry `.ai`.

---

## Drift audit (deliverable a)

**Two structural drifts, both certain:**

| | |
|---|---|
| `invite-salesperson` | **DEPLOYED v52 ACTIVE, no repo source directory at all.** An live function nobody can review or reproduce. |
| `voice-intake` | **Repo directory exists, function is not deployed** (absent from `list_edge_functions`). Consistent with the S290 decommission; the directory is a leftover. |

**One content drift, confirmed by byte comparison:** `api-quote` (above).

**Coverage limit, stated rather than glossed.** A date screen (deployed `updated_at` vs the
file's last repo commit) is weak here: **34 of 46** deployed functions were last deployed
*before* the 2026-08-23 bulk import commit, so their repo mtime says nothing about content.
Only a per-function byte diff is sound, and each `get_edge_function` returns a full bundle.
`api-quote` was diffed because it is the defect under investigation. **A complete 46-function
diff is a separate, deliberately-scoped exercise and is NOT claimed here.** `github:search_code`
was not used to assert absence.

## Sibling instances (deliverable b)

Places that resolve an allowed or canonical host and would not know a custom domain:

| site | shape | effect on a custom domain |
|---|---|---|
| `supabase/functions/api-quote` | 403 origin allowlist | **lead capture refused** — defect 2 |
| `supabase/functions/_shared/cors.ts` | ACAO reflected from `APP_BASE_DOMAIN` | ACAO falls back to `https://pestflowpro.ai`; a browser fetch from the custom domain is **blocked by CORS** |
| `supabase/functions/outscraper-reviews` | same shape, inlined | same |
| `shared/lib/seoSchema.ts`, `signStaticMapUrl.ts`, `src/lib/subdomainRouter.ts` | literal platform host | to be read in implementation |

`notify-new-lead` and `send-intake-email` were checked and **do not gate on origin** — they are
invoked server-side. Lead *notification* is unaffected; only *capture* is.

---

## Questions for the validators

**(a) Source of truth for a canonical host.** `tenants.custom_domain` holds the ADMIN host for
one of the two tenants that have one (`admin.dangpestcontrol.com`); `tenant_domains` holds two
rows per tenant (apex + `www`, a canonical needs one) and dang's are both `verified=false`.
Neither alone yields the correct public host for both live tenants. Options: (i) strip a
leading `admin.` from `tenants.custom_domain`, following the existing `seo-analytics`
precedent; (ii) use `tenant_domains WHERE verified=true`, prefer the non-`www` row, and accept
that dang regresses until its rows are verified; (iii) treat the unverified dang rows as the
actual defect and fix the data. Which, and what does each fail at?

**(b) Reading the host in `generateMetadata`.** The column can be added to an existing
`cache()`-wrapped `SELECT` in `resolveTenantBySlug` rather than issuing a new query. Does that
fully address the caching concern for Next.js metadata, or does per-host content in a
statically-rendered route introduce a cache-key problem that a wider `SELECT` does not solve?

**(c) A DB lookup in an unauthenticated endpoint's origin check, in front of its rate
limiter.** The current ordering — origin gate, then rate limit, then insert — is deliberate.
Adding a `tenant_domains` lookup to the gate puts an unbounded DB call ahead of the limiter.
Options: cache the verified-host set in module scope with a TTL; test the platform regex first
and hit the DB only on a miss; move the origin check behind the limiter; or drop the check.
Which, and is the check worth keeping at all given the empty-`Origin` bypass documented above?

**(d) What the allowlist actually protects.** Given `if (origin && ...)`, a request with no
`Origin` is not checked. State plainly what threat the allowlist removes and what it does not,
and whether a control with that bypass should be extended or replaced.

**(e) Per-tenant robots and sitemap.** Adding `app/robots.ts` / `app/sitemap.ts` to a
multi-tenant Next.js app where the tenant is determined by Host. How should the tenant be
resolved in those two route handlers, what are the caching implications, and how must
`settings.seo.noindex` gate the sitemap so a noindexed tenant does not get a crawlable one?

**(f) Anything else** in this plan that would fail, or that changes behaviour for the seven
tenants with no custom domain. Their canonical must be byte-identical to today.

### Falsification question, asked as written

What would have to be true for this change to be **wrong**? Name the specific condition, and
how it would be observed.

---

# Appendix A — Gemini verdict (VERBATIM)

> ⚠️ **NOT YET SUPPLIED.**
>
> **HOW TO CONFIRM THIS SLOT IS GEMINI** — asserted programmatically BEFORE filling, never
> corrected after, because S309 round 1 was filed with the two models reversed and the
> arbitration cites appendix letters:
>
> | | Appendix A — **GEMINI** | Appendix B — **PERPLEXITY** |
> |---|---|---|
> | citations | **none** | **inline**, to external sources |
>
> The fill script raises before writing either slot if A has any `](http` match or B has none.

<!-- BEGIN APPENDIX A VERDICT — BYTE-EXACT, DO NOT EDIT -->
[PASTE GEMINI VERDICT VERBATIM — NOT YET SUPPLIED]
<!-- END APPENDIX A VERDICT -->

# Appendix B — Perplexity verdict (VERBATIM)

> ⚠️ **NOT YET SUPPLIED.** Same convention as Appendix A, whose table gives the test for
> confirming this slot is really Perplexity: **inline citations present**.

<!-- BEGIN APPENDIX B VERDICT — BYTE-EXACT, DO NOT EDIT -->
[PASTE PERPLEXITY VERDICT VERBATIM — NOT YET SUPPLIED]
<!-- END APPENDIX B VERDICT -->
