# Session log — branch `investigate/s321-custom-domain-resolution`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-09-02 21:45 UTC
- Branch: `investigate/s321-custom-domain-resolution`
- Commit: `86d211e` — S321 gate submission: custom-domain resolution — investigation, no implementation
- Author: Claude
- Files changed:
  - REVIEW_S321_CUSTOM_DOMAIN_RESOLUTION.md
- Next recommended action: **BLOCKED ON THE VALIDATOR GATE — do not start implementation.**
  Run `REVIEW_S321_CUSTOM_DOMAIN_RESOLUTION.md` past Perplexity and Gemini, record both
  verdicts byte-exact into Appendices A and B (attribution asserted programmatically first —
  the fill aborts if A carries a citation or B carries none).

  **Gate question (a) is the one that blocks code.** Neither candidate source of truth yields
  the right public host for both live tenants: `tenants.custom_domain` is
  `admin.dangpestcontrol.com` for dang (the ADMIN host — the repo calls this "the A1 bug"),
  and dang's two `tenant_domains` rows are both `verified=false`, so a verified-only query
  returns nothing and dang falls back to `dang.pestflowpro.ai`. Either way the brief's own
  verification requirement 3 fails. Options are (i) strip a leading `admin.` per the
  `seo-analytics` precedent, (ii) `tenant_domains WHERE verified=true` preferring the apex
  and accept dang regressing, or (iii) treat the unverified dang rows as the real defect and
  fix the data. **A code-only change cannot satisfy requirement 3.**

  When implementation is unblocked, the order is: (1) widen the existing `cache()`-wrapped
  `SELECT` in `resolveTenantBySlug` to carry the host column — no new DB call enters the
  metadata path; (2) widen `resolveSiteUrl`'s signature and delete the hardcoded
  `CUSTOM_DOMAINS` map; (3) `api-quote` origin allowlist — **must carry `pestflowpro\.(com|ai)`
  or every `.ai` tenant 403s**, the repo file is behind the deployed v36; (4) `app/robots.ts`
  and `app/sitemap.ts`, gated on `settings.seo.noindex`.

  Deploy of `api-quote` is Scott's from Codespace (`verify_jwt` false, passed explicitly and
  confirmed on read-back). Do NOT touch `settings.seo.noindex` — still `true`, deliberately.

---
## Session — 2026-09-02 22:09 UTC
- Branch: `investigate/s321-custom-domain-resolution`
- Commit: `20cd5a0` — S321 gate resubmission: scope narrowed by owner, question (a) closed
- Author: Claude
- Files changed:
  - REVIEW_S321_CUSTOM_DOMAIN_RESOLUTION.md
- Next recommended action: **Run `REVIEW_S321_CUSTOM_DOMAIN_RESOLUTION.md` past Perplexity
  and Gemini.** Question (a) is closed by owner decision (dang out of scope, `CUSTOM_DOMAINS`
  map retained and checked first, change is purely additive). Four questions remain live:
  (b) adding `custom_domain` to the existing `cache()`-wrapped SELECT, (c) where a
  `tenant_domains` lookup sits relative to `api-quote`'s rate limiter, (d) what the origin
  allowlist buys given the empty-`Origin` bypass, (e) per-tenant robots/sitemap on the same
  resolved host as the canonical. **No implementation until both verdicts land** — the gate
  blocks code, not just merge. When implementing: the deployed `api-quote` v36 allows
  `pestflowpro\.(com|ai)` and the repo file allows only `\.com`; shipping the repo version
  would 403 every `.ai` tenant and kill lead capture platform-wide.
