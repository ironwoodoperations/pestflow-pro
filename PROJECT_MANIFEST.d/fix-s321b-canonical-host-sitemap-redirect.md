# Session log — branch `fix/s321b-canonical-host-sitemap-redirect`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-09-02 22:44 UTC
- Branch: `fix/s321b-canonical-host-sitemap-redirect`
- Commits: `9d64943` — S321 PR B (1/2): canonical host from tenants.custom_domain, and the
  old-subdomain 301; `443607d` — S321 PR B (2/2): per-tenant sitemap; robots.txt deliberately
  unchanged. The hook logs only the last commit of a session; both are recorded here because
  the branch is one PR.
- Author: Claude
- PR: #328 (draft). Sibling: #327 (PR A, api-quote origin admission) — independent, ships first.
- Files changed across both commits:
  - shared/lib/canonicalHost.ts (new), shared/lib/resolveSiteUrl.ts
  - shared/lib/tenant/resolve.ts, shared/lib/tenant/types.ts
  - shared/lib/buildPageMetadata.test.ts
  - middleware.ts, middleware.test.ts
  - app/sitemap.ts (new), app/sitemap.test.ts (new)
- Next recommended action: NOT more code. Both PRs are green and awaiting Scott's manual
  merge. The order is fixed and each step gates the next:
    1. Merge #327, then deploy api-quote from Codespace with verify_jwt EXPLICITLY false
       (it defaults to true in the MCP tool and flipping it would 401 the endpoint).
       Verify the DEPLOYED BUNDLE with get_edge_function — a version bump and a green
       deploy are not evidence. Then a live 201 from precisionlawnsystems.com.
    2. Merge #328. Vercel builds; domain-map.json is a build-time projection, so the
       old-subdomain 301 is inert until that build runs.
    3. ONLY THEN flip settings.seo.noindex to false, after Vercel reports READY, and re-run
       the full battery over HTTPS. Do not validate against the 300s ISR window — the merge
       triggers the build, which is the purge.
  Neither the live 201 nor the rendered canonical could be verified from CC Web: this
  environment's egress proxy denies CONNECT to arbitrary hosts. Both are labelled post-deploy
  in the PR bodies rather than claimed.
