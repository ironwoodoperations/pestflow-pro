# PestFlow Pro — S275 Handoff (dang-pfp teardown & baseline · DECISIONS LOCKED)

**Date:** 2026-06-24 · **Session:** S275 · **Type:** investigate / teardown / decisions-locked (no app code changed; read-only DB; live Vite site untouched)

> This session ran the full Phase 0 teardown of the live Dang site, captured the SEO/content/design/integration baseline, and **locked all eight build decisions** with the owner. The deliverable is `docs/audits/dang-pfp-teardown-baseline.md` (the parity/migration spec). **Next actionable phase is Phase 1 (baseline lock + 301 map).** No build, no provisioning, no DB writes, no cutover this session.

---

## What this session produced

1. **`docs/audits/dang-pfp-teardown-baseline.md`** — the authoritative teardown + migration-start spec. Covers: per-route SEO baseline (raw-HTML vs post-hydration), full 56-URL inventory + 301 skeleton, content inventory per DB table, full custom-shell design spec, integrations carry-forward, sitemap structure, the locked decisions, the phase plan, and the live-SEO defect appendix.
2. **Eight locked build decisions** (see below).
3. This handoff + roadmap update.

---

## The load-bearing finding (correction to prior "all generic" framing)

Prior handoffs said Dang serves generic meta on every route. **Verified this session — more precise:**

- **Raw initial HTML** (AI crawlers — GPTBot/PerplexityBot/ClaudeBot): identical generic shell on **every** route. No per-page title, no canonical, **zero structured data**. Dang is effectively invisible to AI crawlers.
- **Post-hydration** (Google WRS): `react-helmet-async` **does** swap per-page title + canonical + JSON-LD on **most** routes — **but 9 routes silently fail** and keep the generic fallback: `/about`, `/contact`, `/service-area`, `/reviews`, `/bullard-tx`, `/jacksonville-tx`, `/lindale-tx`, `/whitehouse-tx`, `/longview-tx`.
- **Meta description is generic on 100% of routes**, even where title/canonical/schema swap.

**Implication:** the SSR rebuild is a **strict upgrade** — server-rendered SEO becomes visible to AI crawlers (currently zero), the 9 broken routes get fixed by default, and the generic-description defect is eliminated. Parity target = best-of (DB `seo_meta` vs live post-hydration), per route, with a take-better guard so nothing ranking regresses.

---

## Eight LOCKED decisions (owner sign-off 2026-06-24)

1. **Shell:** Full custom comic shell **registered INSIDE `pestflow-pro`'s existing multi-tenant shell system** (`src/shells/`, alongside `bold-local`/`modern-pro`), selected by the same `template`/theme mechanism. **NOT a separate repo.** This is the corrected decision — the whole point of the migration is to fold Dang into the SaaS tenant rendering structure so dashboard edits become real and Dang stops being a maintenance island. Comic shell becomes a reusable third shell.
2. **Read path:** Reuse the existing DANG tables directly as the SSR read source (no re-normalize, no re-doing env/secrets). New shell + tenant routing in `pestflow-pro` only *reads* the shared DB; live Vite repo is never written/deployed.
3. **SEO render source:** Render `seo_meta` server-side with a per-route diff-and-take-better guard vs live post-hydration titles.
4. **Path strategy:** Keep like-for-like slugs (inherited from prior web vendor). Map the full 1:1 301 set FIRST, then expand later. Near-empty diff; preserve `/quote → /contact`.
5. **Geo / address:** Use `816 Riding Road, Tyler, TX 75703` (owner's physical/home address) as **canonical geo + schema address** — ⚠️ **schema/structured-data ONLY, NEVER in customer-facing copy** (home-based SAB; Google-sees / public-doesn't). Reconcile the 3 conflicting coordinate sets to this address at build.
6. **Brand color:** `#F26B0F` (live hardcoded) is canonical. DB `branding.primary_color = #F97316` is shadowed/ignored — do not use. Reproduce live identically; all media already in DB/storage.
7. **Draft `seo_meta`/blog rows (9, no live URL):** Leave the live content set exactly as-is. Out of migration scope — neither publish nor remove. Claire owns blog publish state.
8. **Orphan `wasp-control` `page_content` row:** Defer — record as a build-phase cleanup chore, do NOT delete now (deletion = live-DB write, out of scope this phase).

---

## Key verified facts (don't re-derive)

- Tenant id `1611b16f-381b-4d4f-ba3a-fbde56ad425b`; shared Supabase `biezzykcgzkrwdgqpsar`.
- 56 live URLs (7 core + 12 service + 18 location + 4 legal + 15 blog). `location_data` (18) ↔ sitemap (18) ↔ `service_areas` (18) aligned. Sitemap built from `location_data` + published blog.
- Content: `page_content` 22, `seo_meta` 66, `blog_posts` 23 total / 15 live, `faqs` 55, `testimonials` 55 (3 featured, 49 from Outscraper), `team_members` 2, `image_library` 13, `leads` 26 (lead capture proven working).
- Design tokens: Bangers (display) + Open Sans (body); palette `#F26B0F` orange / yellow CTA `48 100% 50%` / cyan accent `185 100% 45%` / brown-dark; `.text-comic` signature class. Superhero framing ("SUPER POWERED", "SUPER HERO RESPONSE TEAM", "SUPER POWERED GUARANTEE").
- DB-vs-live slug mismatches (read-path keys, NOT routes): `/`→`home`, `/privacy-policy`→`privacy`, `/terms-of-service`→`terms`, `/sms-policy`→`sms-terms`, `/contact`→`contact`(+`quote`), `/wasp-hornet-control`→`wasp-hornet-control` (+orphan `wasp-control`).
- Integrations to carry: api-quote lead path → `leads` → `trigger_notify_new_lead`; GA4 `G-5NZFW0ZLMZ`; GSC `sc-domain:dangpestcontrol.com`; Remi/VAPI (assistant `e409a0d9-…`); Zernio (profile `69dd26ea…`); Outscraper; social links. Drop dead bundle.social/ayrshare.
- Live-SEO quirks to fix (free wins): doubled title suffix on legal pages + `/flint-tx`; `/arp-tx` missing "in"; generic description everywhere; `branding.theme`/`primary_color` shadowed.

---

## Phase plan

- **Phase 0 — teardown + baseline (DONE this session).** Read-only; live site untouched; decisions locked.
- **Phase 1 — baseline lock + 301 map (NEXT, safe).** Freeze the per-route SEO matrix as the immutable parity target; generate the full 1:1 301 map (56 URLs → identical slugs + `/quote→/contact`) as a committed artifact. Still no build, no live-site contact.
- **Phase 2 — build the custom comic shell INSIDE `pestflow-pro`.** Register `src/shells/dang/` (working name) alongside the two stock shells; wire to existing DANG tables via the standard tenant-scoped read path; reuse storage assets; reproduce design identically; carry integrations; render SEO server-side with the take-better guard; address in schema only; generate sitemap/robots server-side. ⚠️ Touches shared rendering code in a manual-merge prod repo — validator gate + merge discipline apply.
- **Phase 3 — prove parity-or-better (GATED).** Per-route raw-HTML SEO diff vs the Phase-1 baseline; match-or-beat on every route before any DNS discussion.
- **Phase 4 — cutover (separate go/no-go, later).** DNS/301 flip with rankings monitoring + rollback; Vite site stays deployable throughout.

---

## Build-phase cleanup chores (deferred — NOT this phase)

- Set `branding.theme` to the new comic shell key once registered (current `modern-pro` is wrong for target).
- Delete orphan `wasp-control` `page_content` row.
- Reconcile logo path (`logos/dang/` vs `logos/{tenant}/`).
- Standardize geo coordinates to the 816 Riding Road geocode (3 conflicting sets).
- Confirm GSC verification carries to the new deploy.

---

## Governance

- All repo writes via CC Web propose-and-wait. `pestflow-pro` is **manual-merge (paying customer in production)** — owner reviews/merges every PR.
- Any caching/SEO/auth/shell-rendering change → validator gate (Perplexity + Gemini, conservative-wins).
- Because the comic shell touches shared rendering code, merge discipline matters more than in an isolated repo — a process cost, not a reason to split it out.

---

## Open / pending (carried)

- **This session's repo-landing PR** (docs-only): add `docs/audits/dang-pfp-teardown-baseline.md` + this handoff; update `docs/ROADMAP.md` (entry below).
- **Phase 1** (baseline lock + 301 map) — ready to start; can run during idle capacity.
- Pre-existing carry-forwards remain open: production health monitoring (S272), the S274 cleanup chores (check_tenant_access collapse-migration repo trail, Dang `config.toml` relink, optional dashboard SEO/content UX honesty fix), demo-deauth wave, Remi warm transfer. See `docs/ROADMAP.md`.
