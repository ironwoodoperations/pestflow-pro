# S298 — `useSeoFixChain` publishes pest copy to non-pest tenants' live sites

*Investigation only. **No code changed.** Read against `main` @ `8c8ba11`.*

Both defects in the brief are **confirmed as stated**. A third, smaller one is reported below.
The data check says **no cleanup is needed** — and the probe that says so is shown firing, because
an empty result from a probe that cannot match is not evidence.

---

## Defect 1 — the trade is hardcoded in all four branches, and the output is published

`src/components/admin/seo/useSeoFixChain.ts`, `buildPrompt()`:

| line | `fix_field` | system string |
|---|---|---|
| 21 | `intro` | `You write concise, trustworthy website copy for **pest-control companies**.` |
| 23 | `meta_title` | `You are an SEO specialist for **pest-control websites**.` |
| 25 | `meta_description` | `You are an SEO specialist for **pest-control websites**.` |
| 27 | `focus_keyword` | `You are an SEO specialist for **pest-control websites**.` |

**The write path is real, and it ends on the public site.** Traced end to end:

1. `handleGenerateFix` (`:60`) → `callAi('seo_fix', …)` with the hardcoded system string.
2. `:65` → `apply-finding-fix` `mode:'generate'` persists the model's text to
   `report_findings.suggested_fix`.
3. `applyOne` (`:79`) → `mode:'single'` → `apply-finding-fix/index.ts:97`
   `svc.from(target.table).update({ [target.column]: f.suggested_fix })`.
4. `FIX_TARGETS` (`:40-43`) resolves those columns:

   | `fix_field` | table | column |
   |---|---|---|
   | `intro` | `page_content` | `intro` |
   | `meta_title` | `seo_meta` | `meta_title` |
   | `meta_description` | `seo_meta` | `meta_description` |
   | `focus_keyword` | `seo_meta` | `focus_keyword` |

5. `:90` → `triggerRevalidate({ type:'page', … })` — **after** the write returns (SEAM 1), so the
   revalidate is not speculative. The copy is on the live public page.

This is the S283 narration class **with a write path attached**. The narration defect produced a
wrong sentence in a report the owner read; this one produces a wrong sentence *on the owner's
website*, indexed, under their own brand.

### Exposure — the tier gate does not stop it

This is the part that raises the priority. Generate + Apply are **Pro (tier 3)**; Fix-all is Elite.

| tenant | vertical | tier | plan | can click Generate + Apply? |
|---|---|---|---|---|
| `pls` | `irrigation` | 3 | Pro | **yes** |
| `vita-glow` | *NULL* | 3 | Pro | **yes** |
| the seven pest tenants | `pest` | 4 | Elite | yes (and correct for them) |

**Both non-pest tenants sit on exactly the tier that unlocks the defect.** The feature is not gated
away from the tenants it is wrong for — it is gated away from nobody it applies to.

---

## Defect 2 — `biz.city` is always `undefined`, so the prompt gets a street address

`:58-59`:

```ts
const biz = (bizRes.data?.value ?? {}) as { name?: string; address?: string; city?: string }
buildPrompt(finding.fixField, biz.name || 'this company', biz.city || biz.address || 'your area', pageLabel)
```

`:18` then labels it: ``const ctx = `Business: ${business}. City: ${city}. Page: ${pageLabel}.` ``

**There is no `city` key in `settings.business_info` for any tenant.** Verified across all nine:

| tenant | `city` key | `address_locality` | `address` |
|---|---|---|---|
| pls | *absent* | `Big Sandy` | `805 W Broadway St, Big Sandy, TX 75755` |
| dang | *absent* | `Tyler` | `816 Riding Road, Tyler, TX 75703` |
| apex-protect | *absent* | `Austin` | `2110 W 6th St, Austin, TX 78703` |
| … | *absent* for **9 of 9** | | |
| vita-glow | *absent* | *absent* | *empty* |

So the `biz.address` branch is the one that always runs, and pls's prompt reads literally:

```
Business: Precision Lawn Systems LLC. City: 805 W Broadway St, Big Sandy, TX 75755. Page: …
```

`meta_title` (`:23`) then instructs *"Include the city"* — so the model is told to include a
"city" that is a street address. For vita-glow, whose `address` is empty, it degrades to the
literal `your area`, which is a fabricated locality under a `City:` label.

**This is the same defect S293 PR B already fixed elsewhere** — `businessCity.ts:6-9` documents this
exact string, `805 W Broadway St, Big Sandy, TX 75755`, as the reason that module exists.

---

## Root cause of the MISS — why S293 PR B did not catch this file

Not an oversight to be more careful about next time; a structural blind spot.

PR B (`e4d4b5e`) de-pested five prompt sites and built the machinery for them — `seoPrompts.ts`,
`businessCity.ts`, `useBusinessFacts.ts`, and a 358-line assembled-string test. It touched
`useSeoAiGenerate.ts`, the **sibling hook in the same directory**. It did not touch
`useSeoFixChain.ts`.

Two properties made this file invisible to both the sweep and the test suite:

1. **The prompt is built inline, in a module-private function.** `buildPrompt` is not exported, so
   no assembled-string test could reach it even if someone had written one. Every prompt PR B fixed
   lived in a file whose *job* was building prompts.
2. **The filename says what the hook does, not what it contains.** `useSeoFixChain` reads as
   apply/concurrency plumbing — which is most of what it is. The prompt is 11 lines inside it.

`git log` on the file confirms no de-pesting commit ever touched it; the last change was S267.

**The generalisation worth keeping:** an unexported prompt builder inside a behaviour file is
invisible to a filename sweep *and* untestable as an assembled string. That is the same reason
`narrationPrompt.ts` (S283), `contentPrompt.ts` (S285), `captionPrompt.ts` (S287) and
`seoPrompts.ts` (S293) were all extracted. This file is the one that was left.

---

## Has any non-pest tenant ALREADY published this? — No. No cleanup needed.

Checked two independent ways, because the audit trail and the outcome can disagree: a finding row
can be deleted after its copy was applied, and the copy would still be live.

**1. The audit trail** — every tenant that has ever generated a fix:

| tenant | vertical | findings | generated | generated **and applied** |
|---|---|---|---|---|
| `dang` | pest | 8 | 3 | 1 |
| *every other tenant* | — | **0 rows** | — | — |

Only `dang` — a pest tenant, correctly served by a pest prompt — has ever used the feature.
`pls` and `vita-glow` have **no `report_findings` rows at all**, so there has never been a Generate
button for them to click.

**2. The outcome** — scanning live `seo_meta` and `page_content.intro` on the non-pest tenants for
trade vocabulary: **0 rows**.

### The control, because an empty result proves nothing on its own

The same regex, same columns, run against the **pest** tenants:

| probe | matching rows |
|---|---|
| CONTROL — `seo_meta` (pest tenants) | **234** |
| CONTROL — `page_content.intro` (pest tenants) | **109** |
| `page_content.intro` (non-pest tenants) | **0** |
| `seo_meta` (non-pest tenants) | **0** |

The probe fires 343 times where the vocabulary genuinely exists, so the two zeroes are a finding
rather than a broken query. Word-boundary anchored (`\m…`) deliberately: an unanchored `pest`
matches "PestFlow Pro", which is how this exact check has produced a false positive twice before.

**Conclusion: the defect is latent, not realised. Nothing to clean up.** It is reachable the moment
a report generates findings for either non-pest tenant, and both are on the tier that permits it.

---

## Third finding — REPORT ONLY, not part of the fix

`cityFromBusinessInfo` (`src/lib/businessCity.ts:15-23`) reads `biz.city`, then falls back to
**regex-parsing the free-text `address`** for a locality. It never reads `address_locality`, which
is the structured field the settings form actually writes (`BusinessInfoSection.tsx:133`, labelled
"City") and which is populated and correct for 8 of 9 tenants.

The regex produces the right answer for all current data (`Big Sandy`, `Tyler`, `Austin`,
`Galveston`, `Springfield`, `Houston`, `Dallas`), so this is **not** a live defect and I am not
widening the fix to cover it. But it parses a string to recover a value that is already stored
structurally one key away, and it will silently return `''` for any tenant whose address is not
formatted `…, City, ST …`. Worth its own small change later; noted so it is not rediscovered.

---

## Proposed fix — specific and scoped

**Follow `seoPrompts.ts`, do not reinvent.** It is in the same directory, already tested as an
assembled string, and already solves both halves of this.

1. **Move the prompt out of the hook.** Add `buildFixFieldPrompt(args)` to
   `src/components/admin/seo/seoPrompts.ts` and export it. `useSeoFixChain` imports it. This is what
   makes the assembled string testable at all — the reason every prior prompt was extracted.
2. **Trade from the vertical, via the existing helper.** Use `tradeClause(vertical, …)` /
   `tradeNounFor`, exactly as `buildSeoMetadataPrompt:80` does. **Where the vertical is NULL the
   clause is OMITTED, not genericised** — no "local service business" stand-in, per rule (b) and per
   `NO_TRADE_RULE`'s reasoning in `narrationPrompt.ts`.
3. **Vertical from `useAdminPreset()`**, the same source `SeoKeywordsTab`, `SeoAioTab` and
   `BlogPostEditor` already use.
4. **City from `cityFromBusinessInfo(bizRes.data?.value)`** — drop `biz.city || biz.address`. `''`
   means **omit the `City:` clause**, and the `meta_title` rule must correspondingly drop
   *"Include the city"* when there is none, mirroring `buildSeoMetadataPrompt:83`. Instructing a
   model to include a city it has not been given is an instruction to invent one.
5. **Add `NO_INVENT`** to these four system strings. They currently have no ban list at all, and
   they write to the live site — the one place it matters most.

**No fifth vocabulary module.** The trade nouns come from `provisioningSeed`'s `tradeNounFor`,
which is what `seoPrompts.ts` already uses.

---

## The guard — and how it is made able to fail

**Assert the ASSEMBLED system string**, per fix_field × vertical. A helper-only test passes while
the string reaching the model still says pest-control; settled practice since S283.

Coverage: **4 fix_fields × 3 verticals (`pest`, `irrigation`, `null`) = 12 assembled strings.**

- pest → names the pest trade
- irrigation → names the irrigation trade, and **contains no pest vocabulary**
- null → **names no trade at all** (not "business", not a stand-in)

**Required mutations, both must go red:**

| mutation | expected |
|---|---|
| revert one branch's system string to its pest literal | **RED** |
| empty the fix_field list the test iterates | **RED — via an explicit `expect(FIX_FIELDS).toHaveLength(4)`** |

The second is not optional. An emptied list generates zero test cases and a zero-case suite passes
green — this project has hit that exact vacuity three times (S293 C, S294 twice). The length
assertion is what converts "iterated nothing" from a pass into a failure.

Plus a city case: `business_info` with **no `city` key** (the real shape) must not put the street
address after `City:`, and must omit the clause entirely rather than emit `your area`.

---

## Risk / rollback / test plan

**Risk of the fix:** low and one-directional. Pest tenants — the only ones who have ever used the
feature — keep a prompt that names their trade; the string changes only if `NO_INVENT` is added,
which constrains rather than redirects. Non-pest tenants stop receiving a trade they are not in.

**No data migration.** Nothing to backfill: no non-pest tenant has published through this path.

**Rollback:** revert the commit. No schema, no RLS, no edge-function deploy — `apply-finding-fix` is
untouched, since the defect is entirely in what the client sends it.

**Verification before merge:** `npx vitest run` (new assembled-string cases), `npm run lint`
(baseline 223), `npx tsc --noEmit`, `npm run build`.

**Not in scope:** `apply-finding-fix`, the tier gates, the concurrency baseline, `report_findings`
schema, and the `address_locality` finding above.
