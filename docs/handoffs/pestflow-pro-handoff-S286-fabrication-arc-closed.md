# PestFlow Pro — Handoff S286 (the fabrication arc closes; guards learn to check their own scope)

*Session S286 · five PRs merged (#277, #279, #280, #281, plus S285's follow-up commit) · the
vertical architecture is now end-to-end · rule (b) is closed in all three code locations · and
for the first time a guard verifies that its declared scope matches what it actually inspects.*

---

## What shipped

| PR | |
|---|---|
| #277 | **S283** — vertical vocabulary in GENERATED copy. `generate-monthly-report` + `ContentTab`. |
| #279 | **S284** — `npx vitest run` added to CI. The suite had never gated a single PR. |
| #280 | **S285** — the admin label preset. Five live defects, plus a sidebar race in the follow-up. |
| #281 | **S286** — owner-supplied offers in social templates; the DB claim guard extended to two content tables. |

`main` is green after each. Lint baseline moved **224 → 223** in S285 and held there.

---

## Verified live state

**The vertical is backfilled and load-bearing.** `settings.business_info.vertical` = `'pest'` on the
seven pest tenants, `'irrigation'` on `pls`, and deliberately **NULL on vita-glow** — a medical-aesthetics
business that is not pest. Verified by count query. No rendered content changed; no ISR purge needed.

That NULL is the point. The neutral fallback is not defensive decoration — it has a real, current
consumer, which is why "unknown resolves to neutral, never to pest" had to be a hard rule rather than
a nicety.

**`generate-monthly-report` is DEPLOYED** — v11, ACTIVE, `verify_jwt:false`, confirmed via
`get_edge_function`, with `narrationPrompt.ts` and `_shared/verticalCopy.ts` present in the live source.
**The 10 September cron deadline is CLEARED.** (Earlier session reports in the transcript claimed
merged-but-not-deployed. They were wrong; the manifest is corrected. Do not re-propagate that claim.)

**The four fabricated-phone rows are CLEANED** — 3 `blog_posts` + 1 `social_posts` caption, all on
`pestflow-pro`, now carrying `(430) 367-5601`. Verified 0 remaining. `claims_content_sweep.sql` returns
clean. ISR purge done.

**The CHECK constraint is applied** — `settings_business_info_vertical_valid` (S281). A JSONB edit
setting a copyless vertical now fails at the database with 23514 instead of 500-ing a whole tenant site.

---

## Rule (b) — closed in all three code locations

| location | session | what it was |
|---|---|---|
| public-site components | S280 | invented stats, capacity promises, "4,200+ Customers" |
| `ContentTab` AI prompt | S283 | **requested** fabrication: EPA-approved, free inspection, satisfaction guarantee, `businessCity \|\| 'Tyler'` |
| social composer templates | S286 | eleven prompts announcing discounts, free inspections, and a storm |

The shape repeated exactly. In every case the code did not merely *permit* invented claims — it
**instructed** them. That is worth naming, because it changes where to look: not at output filtering,
but at the prompts and constants that ask for the output.

### The S286 fix is the one worth copying

Deletion was the wrong answer. Owners run real promotions; a tool that cannot help them say so is one
they stop using. So the offer comes **from the owner**: a required free-text field, `fillTemplate()`
returning `null` while it is empty, the button disabled on null, no default, and a placeholder that
reads as an instruction rather than an example offer.

**The null is the safety property.** Every softer shape — a default offer, a placeholder that doubles
as a value, an empty string silently producing "the promotion X is running right now:" — ends with the
model inventing the offer again.

`rf7`/`rf8` lost the storm entirely. A seasonal roof check is a trade truth; "recent storms" asserts a
past event the model cannot know occurred. Conditional seasonal copy ("cold weather can freeze pipes")
is a trade truth and stays — the guard targets `recent storms?`, not the word *storm*.

**Recorded because it settled a design question:** the irrigation set added in S285 contains **no offer
template at all**. Nine templates, none an offer. That is the proof the category is optional rather
than load-bearing.

---

## THE DURABLE LESSON, extended for the SIXTH time — and answered

Every guard in this arc was scoped to code. Every defect was somewhere its guard structurally could not
see. S286 adds the sharpest instance yet, because the guard that failed was **S281's own DB sweep**:

> It reported **"(903) 555-0142: 0 remaining"** and was *correct* — about `seo_meta`, `service_areas`
> and `settings.seo`, the three tables it scanned. Four rows carrying that number sat in `blog_posts`
> and `social_posts`, which it never looked at.

The running tally:

1. `seo_meta` / `service_areas` / `settings.seo` — data, not source
2. Vita Glow's pest metadata — `generateMetadata`, not body copy
3. `BoldLocalAboutPage`'s `4,200+ Customers` — source, but split across two object fields
4. The vitest suite itself (S284) — 535 tests that had never gated a PR
5. S285's slug lists — scoping to `src/app/shared` would have dropped the four suites under `supabase/functions/`
6. **S281's DB sweep** — right answer, wrong three tables

> **The pattern is not "a guard was missing". It is "a guard's scope quietly stopped matching its
> claim."** A green guard with the wrong scope reads as proof and is not.

### S286's structural answer

`shared/lib/dbClaimSweep.test.ts` asserts that **the tables the sweep SAYS it covers equal the tables it
actually queries**. Adding a table to the query without declaring it fails; declaring one the query never
touches fails. It also pins the sweep read-only, and pins its capacity pattern byte-identical to
`CAPACITY_OR_TERMS` in the code guard so the two cannot drift into disagreeing about what a claim is.

This is the first guard in the arc that cannot silently misrepresent itself. **Every new guard should
carry one.**

### Why the DB check is NOT a unit test

Deliberate, and worth not re-litigating. CI has no production data — the auth-isolation job spins a
**local, empty** stack. It would need service-role credentials in CI. It would make the suite
network-dependent. And a test that can reach the database invites one that writes to it, which rule (a)
forbids: the DB is where tenant facts are *supposed* to live.

S281 hit that precisely. Dang's `seo_meta` says "same-day service" and it **stays** — Kirk's own claim
about his own business — while the demo tenants' identical seeded string went. `user_edited` drew the line.

**Neither `blog_posts` nor `social_posts` has such a column.** `blog_posts` has no authorship flag at
all; `social_posts` has `ai_generated`, and **the one fabricated caption found is marked
`ai_generated: false`**. The single column that looked like it could separate seeded content from tenant
content gets it wrong on the very row we know is bad. So the script classifies nothing — it hands a
human the rows and the evidence.

---

## The second lesson: substring over-match

Three false positives this arc, every one against **this codebase's own vocabulary**:

| pattern | matched | where |
|---|---|---|
| `/pest/i` | **Pest**Flow Pro | S283 narration guard |
| `/pest/i` | **Pest**Flow Pro | S282 admin classifier (shipped with it) |
| `/free/i` | **free**ze | S286 first-pass offer guard |

All three were caught by the assertion running, not by review. The `freeze` one would have flagged two
legitimate prompts (`'before a freeze'`, `'cold weather can freeze pipes'`) as fabricated offers — a
guard that cries wolf is a guard that gets allowlisted into uselessness.

> **Assume word boundaries from the start.** `\bfree\b`, not `/free/`. And mask the product name before
> scanning for trade vocabulary.

---

## Also worth carrying

**The vertical is keyed on `vertical`, NEVER on `industry`** — a correctness constraint, not a style
preference. `industry` is free text from an onboarding input: `pls`'s stored value is a 154-character
service description, vita-glow's is "Medical Aesthetics". Neither matches any lookup key, which is why
`ComposerTemplates` fell through to `generic` for both — the right answer by the wrong mechanism, and
only by luck.

**`page_content` and `seo_meta` are SEPARATE namespaces.** The grounded slug data came from live
`page_content`, which is what the ContentTab sidebar reads. `seo_meta` carries city/location pages and
`blog_posts` carries posts; conflating them produces a false picture of what the sidebar shows. City
pages are **tenant facts** from `service_areas` and are not preset entries.

**eslint was already reporting the S285 race.** The sidebar double-render came with
`React Hook useEffect has a missing dependency: 'standardSlugs'` sitting inside the 224-warning baseline.
The fix removed it, which is the entire 224 → 223 delta. A large warning baseline is a place for real
bugs to hide.

**Three tsconfigs, three targets.** CI's bare `npx tsc --noEmit` uses the ROOT config, which sets no
`target` — so `shared/**` compiles as **ES5** (no Set-spread, no `matchAll`), while `src/**` is excluded
from it entirely. Caught S286's guard test at the CI gate.

---

## Open / pending (carried to next)

**Product gap, logged not fixed:**
- **AI Authority produces nothing for any tenant but Dang.** `ai-authority-worker` (v9) authors no
  prompts; it reads `ai_authority_prompts` from the DB. **No seeding path exists** in `src/` or the edge
  layer, and prompts/jobs/snapshots are Dang-only. The feature runs, finds nothing, returns nothing.
  Not broken — the data does not exist. Needs a seeding path or per-vertical default prompts before it
  can be sold to a second customer.

**Unswept surfaces:**
- `page_content.*`, `faqs.question/.answer`, `reviews` / `team_members` / `campaigns` — covered by **no**
  guard. Named in `claims_content_sweep.sql`'s DOES NOT COVER block on purpose.

**Reported, not fixed (rule (b), same shape, outside S286's scope):**
- `useComposer.ts:180` hardcodes "in East Texas" into every caption prompt.
- Review Spotlight (`pc2`/`hv2`/`pl2`/`rf2`/`gn2`/`ir2`) assumes a 5-star review exists and asks the
  model to write its text.

**Carried from S281, still unaddressed:**
- `HARDCODED_STAT_PAIR` is tested per line, so the multi-line form of the exact shape it targets passes.
  It also requires the next key to be literally `label`. **Fix before relying on it.**

**A decision only Scott can make:**
- **Which provider does the live Remi number ring?** Re-verified S286: `voice-intake` still v10
  (2026-06-02), `voice-intake-retell` still v1 (2026-08-10), both ACTIVE, nothing moved in seven
  sessions. This is provider-dashboard state; no repo or MCP inspection will settle it. Downstream work
  is blocked: warm transfer targets VAPI, and `voice-intake-retell` has **no transfer branch at all**.
  Two ACTIVE handlers for one number is its own ambiguity — whichever is dead should be removed.

**Process friction:**
- The PROJECT_MANIFEST Stop hook writes after each commit, so every substantive commit needs a second
  commit to capture its own entry. Produced two standalone chore PRs (#271, #274) when it fired on `main`.
