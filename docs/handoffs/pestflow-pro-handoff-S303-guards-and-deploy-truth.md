# S303 handoff — what this arc learned, not what it did

Sessions S294 → S303. **Twelve PRs merged, #292 through #303 contiguously** — the
S294 platform rename, the S295 hero investigation and fix, the S296 mail-sender
investigation and stage-0 design, S297's admin sweep, the S298 investigation and fix,
S300's turf swap, S301 and S302's hero contrast, and S303's ROADMAP items.

**Durable lessons only.** The narrative is in `PROJECT_MANIFEST.d/`; the perishable
state is in `docs/ROADMAP.md`. Neither is repeated here.

---

## 0. The deploy-state error, and why it survived three corrections

**`generate-monthly-report` is DEPLOYED — v15, ACTIVE, `verify_jwt:false`, verified
2026-08-26 by reading the deployed bundle.** `platformBrand.ts` is in it, all eight
sites resolve through `PLATFORM_NAME`, zero occurrences of the retired name. **The
1 September cron is HANDLED** and will fire under the current name.

It was reported as merged-but-undeployed **twice in one session**, and this is the
third correction overall. The mechanism matters more than the fact:

> **ROADMAP is perishable state and gets corrected. `PROJECT_MANIFEST.d/` entries are
> dated records and never do.** The ROADMAP has said DEPLOYED since S286, and even
> carried the words *"do not re-propagate that claim"*. It was re-propagated anyway,
> because three session logs still assert the false version — and a session log is
> what gets read first, being recent and specific. **A false claim in an append-only
> log is immortal, and recency reads as authority.**

Those three files are now corrected **in place, without deleting what they said** —
the original line stands with a dated correction beneath it. Erasing them would hide
that the error propagated, which is the only interesting part.

### The correction proved the rule by breaking it

`docs/ROADMAP.md` did not merely say DEPLOYED — it said **"Do not re-propagate that
claim."** So did the S290 handoff. So did the S286 handoff. **Three documents told the
next session not to make the claim, and it got made anyway.**

Not because they were ignored. Because every one of them was specific and **stale**:

| document | said | actual |
|---|---|---|
| `docs/ROADMAP.md` | v11 | **v15** |
| S290 handoff | v11 | **v15** |
| S286 handoff | v11 | **v15** |

The function went **v11 → v13 → v14 → v15** while all three corrections kept saying
v11. And a correction whose specifics have rotted **reads as history rather than
instruction** — it looks like a record of an old state, not a live claim about the
present. Set against a session log from *yesterday* asserting the opposite, the stale
correction loses.

> **The rule is therefore stronger than "assert deploy state with a version and a
> date". It applies to CORRECTIONS TOO: an undated correction expires silently and
> stops being believed.** A warning that carries a rotted version number is a warning
> that will be overruled by something newer and wrong.

**Same drift, second instance:** the S286 handoff calls the cron deadline
**10 September**; the S293 kickoff calls it **1 September**. Both are moot now that the
function is deployed — but two documents disagreeing by nine days, with neither
flagged, is direct evidence that **dates in these documents drift unchecked** and
nothing in the process reconciles them.

**The rule:** *any deploy-state claim in a doc needs the version and the date it was
verified at, or it is a guess with a timestamp — and so does any correction of one.*
Claude cannot see Supabase, so "merged" is the last observable state and the gap gets
filled wrongly. Verify with `get_edge_function`, or do not assert.

---

## 1. Two distinct classes, not one — they were nearly recorded as one

The first draft of this handoff claimed **one** class hit three times: S295, S297 and
S298, all "saves correctly, renders nowhere". **That was wrong, and the way it was
wrong is the point.** S298 rendered perfectly — its defect was that it *wrote pest copy
to a live irrigation site*, the opposite failure. S297 was placeholders naming the
wrong trade, which render and get saved. Two of the three rows had to be strained to
fit; one was written as "rendered, but the surface was never read", which is not a
description of the defect but of the claim it was serving.

**Two real classes teach more than one false one. Do not merge them back for tidiness.**

### (a) Saves correctly, renders nowhere

| instance | the value | why it never reached the page |
|---|---|---|
| **S295** | `page_hero_image_url` | the route resolved it for one of seven shells |
| **S303 item** | an uploaded photo | the bytes change, the **URL does not**, so the browser serves the old one |

Both leave the **database perfect and the product looking broken**. That is the
expensive shape, because the owner's next move is to **do the correct thing again** —
re-upload, re-save, re-check — and it fails identically. Saving is not shipping.

### (b) Wrong-trade vocabulary survived a sweep that reported completeness

| instance | what still said pest |
|---|---|
| **S297** | admin placeholders and defaults |
| **S298** | the fix-chain system prompt — which **wrote to the live site** |

S293 PR B de-pested `seoPrompts.ts` and missed `useSeoFixChain.ts` **one directory
away**, in the same feature, on the same afternoon.

> **"Swept" is a claim about the sweep, not about the code.** A completed sweep reports
> what it covered; it cannot report what it never looked at. This is the same shape as
> the 138-file search result the ROADMAP already refuses to treat as a defect count —
> and the same shape as §3 below, where the search tool itself returns false negatives.

The two classes fail in opposite directions — (a) renders nothing when it should,
(b) renders something it shouldn't — which is exactly why one description could not
cover both without distorting one of them.

## 2. A guard written to catch a class shipped containing that class — twice

Both were caught **only by running the mutations**, never by reading the code:

- **S300** — the parse anchor `MODERN_PRO_TENANT` prefix-matched `MODERN_PRO_TENANT_RENAMED`,
  so renaming the config left the parse quietly working against a stale block.
- **S301** — the scrim scan counted the value in its **own explanatory comment**, and
  failed on the file it was written to protect.

> **Writing the guard does not exempt you from the defect the guard is for.** The
> mutation is not a formality after the guard is written; it is the only thing that
> distinguishes a guard from a comment that happens to compile.

## 3. GitHub code search returns false negatives

It missed `irrigationContent.ts` entirely, and separately missed a string that was
then read by opening the same file. **Fine for finding candidates. Never for asserting
absence.** An "audit" built on a search result is a search result.

Corollary already in the ROADMAP: 138 files matching `"pest control"` is *unclassified*,
not a defect count.

## 4. A version increment is not evidence of a deploy

A stale-Codespace deploy **succeeded**, bumped the function 13 → 14, and shipped **old
bytes**. Everything reported success. **Only the deployed body is evidence** — which is
why the standing rule is CLI-deploys, MCP-verifies, reading deployed source rather than
local.

## 5. A hazard nobody triggered still fired

The S300 warning said a `page_content` row created before its content-map entry would
put a live tile and nav link in front of customers pointing at a 404. On 2026-08-26 a
**stray click on *New* in the admin** created an `artificial-turf` row with an empty
title, and it was live until deleted.

> **The warning was written before the row existed and described it exactly.** The
> hazard did not need anyone to act deliberately — only to click.

Filed, not fixed: a service slug with a `page_content` row but no content-map entry is
a 404 waiting to be linked. The tile filter and the nav both key on **the row**; the
route keys on **the map**. Nothing reconciles them.

## 6. Two structural facts worth not rediscovering

- **The nav does not derive from the content map.** `getAllServicePages` queries
  `page_content` directly with exclusion lists only. Removing a map entry does *not*
  remove a nav link — which is why the row deletion had to precede the deploy, not
  follow it. `DECISIONS.md` records the prior incident where an empty return from this
  same query put 12 pest links on an irrigation tenant's every page.
- **The `dang-comic` shell family is unreachable.** `dang`'s stored `branding.theme` is
  `modern-pro`, every dispatch keys on `template === 'dang-comic'`, and nothing sets
  that value — and `dang` is `render_model: 'standalone'`, so it never routes through
  `/tenant/[slug]` at all. Dead code in the same class as `DefaultPestPage`.

---

## Open / pending (carried to next)

Everything below is Scott's; none of it is blocked on repo work.

1. **pls launch checklist** — `seo.noindex` still `'true'` (pls is invisible to
   Google), `custom_domain` NULL, `notifications.lead_email` unset. Full block in
   `docs/ROADMAP.md`. **These gate revenue, not polish.**
2. **S300 turf entry** — five owner facts → the content entry → *then* its
   `page_content` row. That order, or the tile appears linking to a 404.
3. **S296 stage 0** — a `rua` Scott controls on `_dmarc.homeflowpro.ai`, then
   `mail.homeflowpro.ai` as a **full** domain setup (no `sp=` on the apex, so it
   inherits `p=quarantine`). Then: `email_events` + `resend-webhook` → set
   `MAIL_SENDING_DOMAIN=pestflow.ai` → deploy the fail-closed helper. **That order is
   load-bearing: fail-closed against an unset secret stops all mail.** And the cutover
   is a **policy escalation** — `p=none` → `p=quarantine` turns a delivered
   misconfiguration into a quarantined one.
4. **Four ROADMAP items from S303** — image uploads overwriting in place;
   `image_url` vs `page_hero_image_url`; the 1200×600-vs-4/3 guidance; the
   page_content-slug 404 guard.
