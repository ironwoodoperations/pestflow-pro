# PestFlow Pro — Handoff S281 (fabrication sweep: COMPLETE for the public site)

*Session S281 · four PRs merged and production-verified, one DB sweep, one seed, one
constraint. S280 finished the code sweep and declared Phase 1 complete. That claim was
true of the code and false of the system: this session found the same defect class in
the DATABASE, which no guard had ever scanned.*

**If you have no context on this arc:** PestFlow Pro renders every client's public site
from one codebase that until recently assumed every client was a pest control company.
S278 onboarded the first non-pest client (Precision Lawn Systems, `pls`, irrigation).
S279 built the vertical registry. S280 removed invented content from components. S281
removed it from the data, and proved the DB-driven contract end to end.

---

## What shipped

| PR | What |
|----|------|
| #269 (PR E) | Repo-wide claim guard + 26 fixes. Merged `4a362ff`, production-verified. |
| #271 | Hook session-manifest log for the S280 merges. |
| #272 (PR F) | The last four shells wired to `settings.about`; guard gap closed. |
| #273 | The S281 migration file + rollback, and the migration-drift audit. |

**DB claim sweep** — `seo_meta`, `service_areas`, `settings.seo` across the six platform
pest tenants. Capacity claims: 0 remaining. `(903) 555-0142`: 0 remaining. Dang
deliberately untouched and verified untouched.

**`pls` `settings.about` seeded** — `auto:years_operating` → `9+` (from `founded_year`
2017) and `LI23001 / Texas Irrigator License`. First live proof the preset → DB
override → render contract works end to end. Verified in served HTML.

**`settings_business_info_vertical_valid` CHECK constraint** applied, validated, and
tested: a `vertical: 'pool'` write is rejected with `23514`.

---

## THE TWO RULES (carried forward verbatim — state them to anyone extending this)

**(a) A vertical preset holds ONLY what is true of the whole TRADE.** Tenant facts —
warranty terms, licence numbers, region, scheduling promises — belong in the DB.

**(b) NEVER fabricate — rendering nothing is correct, inventing is not.** No fallback
tile, no fallback post, no fallback stat, no default claim.

### The addition this session earned

**Rule (b) applies to the DATABASE, and rule (a) is why it cannot be applied bluntly
there.** The DB is where tenant facts are SUPPOSED to live. Dang's `seo_meta` says
"same-day service" and that STAYS — it is Kirk's own claim about his own business. The
demo tenants' identical string was machine-seeded on behalf of businesses that never
made it, and went. The dividing line that worked was `user_edited`: false = seed,
true = the tenant's words. **Do not extend the code guard over the DB wholesale — it
would delete exactly the content the architecture wants there.**

---

## THE DURABLE LESSON, extended for the fifth time

Every guard in this arc has been scoped to code. Every defect this session was
somewhere a code guard structurally cannot see:

- `seo_meta` / `service_areas` / `settings.seo` — data, not source
- Vita Glow's pest metadata — `generateMetadata` and schema generators, not body copy
- `BoldLocalAboutPage`'s `4,200+ Customers` — source, but split across two object
  fields so #269's regex could not match it

> **When a guard finds nothing, check whether it is looking where the defect lives.**
> A green guard with the wrong scope reads as proof and is not.

**The new guard has this same flaw already.** `HARDCODED_STAT_PAIR` in
`shared/lib/noUnverifiedClaims.test.ts` is tested per-line, so the multi-line form of
the exact shape it was built for still passes: {
num: '4,200+',
label: 'Customers',
}, 
`\s` matches newlines — it is the per-line loop that defeats it, not the pattern. One
Prettier reflow and it goes quiet. It also requires the next key to be literally
`label`: `title`, `name`, or reversed order all sail through. **Fix before relying on
it.**

---

## CORRECTIONS — supersede prior docs

- **`main` is protected.** Required `Validate` check, no bypass. The
  `git commit --allow-empty` ISR purge in earlier notes CANNOT WORK here (`GH006`).
  **The purge is a Vercel dashboard redeploy** of the current production deployment,
  build cache unchecked — or an admin save firing `revalidateTag`.
- **`execute_sql` runs a multi-statement batch as ONE transaction.** An `UPDATE`
  followed by a verification `SELECT` with a typo silently rolls the UPDATE back. It
  looks like the update did nothing. Verify in a SEPARATE call, always.
- **`service_areas` has `created_at` but no `updated_at`** — no timestamp audit trail.
- **`tenants` has no `template` or `founded_year` column.** Theme is
  `settings.branding.theme`; `founded_year` is `settings.seo.founded_year`, composed
  onto the tenant object by the query layer.
- **`vertical` is NULL on eight of nine tenants** and defaults to `pest`. Correct by
  accident for the seven pest tenants, wrong for everything else.

---

## LOGGED, UNFIXED

- **Vita Glow publishes itself as a pest control company.** `<meta name="description">`
  = "Vita Glow Wellness — professional pest control services" on every route, plus
  JSON-LD `knowsAbout: ["Pest Control","Termite Treatment",…]`. **No robots meta — it
  is indexable.** Body copy is clean; this is entirely metadata and schema. Root cause
  is the null `vertical`. Project is PARKED at Scott's direction, possibly moving to
  Base44 as a one-off. **It cannot be fixed by setting its real vertical** — there is
  no `medical_aesthetics` preset and `getVerticalCopy` throws from `layout.tsx`, so
  that edit 503s the tenant. Its only two states today are pest vocabulary or down.
  Cheapest mitigation if it stays live: `noindex` sitewide, as `pls` already is.
- **143 stamped migrations have no file** (see backlog below).
- Six `/contact` `seo_meta` rows still say "Ironclad Pest Solutions" — verified to
  render on no route.
- `key={label}` on stat tiles is now in FOUR components; two tiles sharing a label
  collide in React's key space.
- Stat icons (`Star`/`Home`/`Heart`) were removed from `DefaultAboutPage` and
  `CleanFriendlyAboutPage` — `ResolvedStat` is `{value,label}` with no icon field.
  Permanent visual change, not flagged at the time.
- Carried from S279: `layout.tsx` calls `getAllBlogPosts` with `.select('*')` to
  compute a boolean. `reviews/page.tsx` `'☆'.repeat(5 - r.rating)` throws for a rating
  above 5.

---

## BACKLOG — migration drift (P1, its own session)

Reconciled against the live DB this session:

| | |
|---|---|
| Stamped in `schema_migrations` | 181 |
| Matched by exact version filename | 15 |
| Matched by NAME under a different timestamp | 38 |
| **Stamped with NO file** | **143** |
| Files matching no stamp | 17 |

Production schema is CORRECT. The exposure is reproducibility: `supabase db reset` or a
fresh branch database built from `supabase/migrations/` produces a schema missing 143
migrations' worth of changes. CI is unaffected — the Auth isolation job swaps in its own
fixture.

**Recommendation: baseline, not replay.** One `pg_dump --schema-only` squashed into a
single baseline migration, history declared to start there, the 143 orphan stamps left
as historical record. Reconstructing 143 files from current object definitions produces
a history that is partly fiction wherever a later migration altered the same object.

`apply_migration` stamps `schema_migrations` and writes NO file. Every MCP-applied
migration needs a companion chore PR, or the drift grows.

---

## NEXT — Phase 2: admin SPA, discovery only, NO CODE

Inventory every string as **VERTICAL / TENANT / PLATFORM**. Admin gets its OWN preset
file — admin labels and public-site copy are different vocabularies for different
readers with different change cadences. Do NOT share the public-site registry.

**Three layers, because no single one is sufficient — that is the whole lesson of this
arc:**

1. **Source inventory (CC)** — tab structure, component tree, every hardcoded literal
   with `file:line`, and whether each is a literal, a prop, or a DB fetch.
2. **Rendered-output dump (CC)** — every statically renderable admin component
   `renderToStaticMarkup`ed to a file. `retiredClaims.test.tsx` and
   `aboutStatsShells.test.tsx` already do exactly this for the public shells. Catches
   strings assembled at render time that the literal inventory cannot show.
3. **DB sweep (Claude.ai via MCP)** — admin-surface strings in the database. Neither
   CC output can see these, and this session proved that is where defects hide.

Screenshots only for what cannot be statically rendered: modals, wizards, anything
behind component state.

---

## PROCESS NOTES from this session, recorded because they cost real time

- **A `RETURNING` clause is not verification if it truncates.** A 126-row before/after
  print at 95 chars showed identical strings on every row because every change was in
  the tail. It read as proof. Verify with `count(*)` against the pattern, separately.
- **Scope a DB write by the narrowest predicate that does the job.** A `WHERE` matching
  on `meta_description || og_description` plus a phone pattern hit 120 rows when the
  intent was ~12, stamping `updated_at` on rows that did not change.
- **Filter in the container, not in context.** `curl` piped through `grep` costs a few
  hundred tokens; the same information via a wide MCP call costs ten thousand.
- **CC caught its own vacuous test this session** — a 700-char slice assertion that was
  passing without reaching the element it claimed to test. That check is the standard.
