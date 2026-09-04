# S334 Gate Record — Atomic Provisioning RPC

**Date:** 2026-09-04
**Branch:** `spec/s334-provisioning-rpc-gate-record`
**Posture:** conservative-wins
**Disposition:** ✅ **APPROVE WITH CONDITIONS** — both validators, independently.

This is a **RECORD ONLY**. No migration, function, or product code is in this PR. The build
order in §7 is what the next sessions execute; nothing in it has been started.

---

## 1. Submission text

> ⚠️ **NOT SUPPLIED.**

The submission put to the two validators was not provided to this session. The slot is left
empty deliberately rather than reconstructed from the arbitration summary, because a
reconstruction is indistinguishable from a transcript to a later reader — which destroys the
only thing a verbatim slot is for.

**To fill:** paste the submission text here, replacing this block.

---

## 2. Appendix A — PERPLEXITY verdict (VERBATIM)

> ⚠️ **NOT SUPPLIED.**

**To fill:** paste the Perplexity verdict here, byte-exact, replacing this block. Do not
re-wrap, reformat, or clean it up.

---

## 3. Appendix B — GEMINI verdict (VERBATIM)

> ⚠️ **NOT SUPPLIED.**

**To fill:** paste the Gemini verdict here, byte-exact, replacing this block. Do not re-wrap,
reformat, or clean it up.

---

### Attribution check — NOT RUN

The S309 round-1 discriminator (Perplexity output carries inline source citations; Gemini
output carries none) **could not be executed**, because neither appendix text exists to check.

The check is a precondition on writing the appendices, and it has not been satisfied. It must
be run at the moment the texts are pasted in, and the write aborted if it fails:

| | requirement | expected evidence |
|---|---|---|
| **Appendix A** | **at least one** markdown link to an external source | `postgresql.org`, `supabase.com` |
| **Appendix B** | **zero** such links | — |

If A has no citations, or B has citations, the two are swapped or duplicated. **Stop and say
so. Do not guess and do not reorder them.**

Neither a Perplexity nor a Gemini connector is wired into this execution environment, so the
texts cannot be regenerated here — they must come from the operator. This matches the
disclosure precedent set by `s234-validator-gate.md` and `s267-validator-gate.md`, both of
which recorded validator unavailability rather than fabricating model quotes.

---

## 4. Arbitration

Both verdicts are **APPROVE WITH CONDITIONS**. They diverge on exactly one question.

### Question A — Zernio: an external vendor call between Postgres writes, with no idempotency key

| | position |
|---|---|
| **Perplexity** | **A1** (call it after commit) is acceptable at concierge scale — and states **A2 is "stronger and will eventually be preferable"** |
| **Gemini** | **A2** (durable queue row written inside the transaction) is **MANDATORY**; A1 violates gate condition 1 |

**RESOLVED: A2.** Conservative-wins.

Worth recording precisely, because it is the reason this resolution is cheap: **A2 overrules
neither model into a position it argued against.** Perplexity independently called A2 stronger.
The disagreement is about *timing*, not *direction* — one model wanted it now, the other
wanted it eventually, and neither defends A1 as the better end state.

**Precedent — a fourth queue is a known pattern, not new infrastructure.** This repo already
runs three queues of exactly this shape, all three confirmed present in the live database:

| queue | status |
|---|---|
| `lead_bridge_queue` | live |
| `tenant_offboard_queue` | live |
| `sms_queue` | live |

### Two places where the stricter reading is NOT the obvious one

Conservative-wins is not "always take the harsher condition". In both cases below the
*stricter-sounding* verdict is the one that would cause damage.

**F — settings merge. TAKE PERPLEXITY'S.**

- **Gemini** names a generic deep-merge helper.
- **Perplexity** explicitly **forbids a generic operator** and requires: per-key policy,
  whole-array replacement, and `business_info` groups validated **as groups** before the row
  write.

A blanket deep merge would **corrupt `hours_structured`**, and could assemble a **partial
address quad that 23514s**. The generic helper is the simpler-looking option and the wrong one.

**Carried from Gemini regardless:** use `RAISE EXCEPTION USING ERRCODE = '22023'` for the
empty-selection case.

**Outscraper — Perplexity's explicit condition governs.**

- **Gemini** never names Outscraper; its condition 1 covers outbound integrations generically.
- **Perplexity** is explicit that it must leave the response-tail path, **because edge runtimes
  can stop work after the response is sent**.

Same queue as Zernio. The generic condition does not contradict this — it simply does not
reach it, so the specific reading stands.

### Conditions with no counterpart in the other verdict — therefore standing

Unopposed is not the same as unimportant. Both stand as written:

- **Perplexity 1** — reuse `auth_user_id` on retry rather than re-calling `createUser`.
- **Perplexity 12** — the re-provision idempotency model.

---

## 5. OWNER DECISION — `tenant_services` will be built

Recorded: **a per-tenant service-selection relation (`tenant_services`) WILL be built.**

Perplexity's condition 6 cautioned against adding one *merely to satisfy the wording of gate
condition 3*. **It is not being added for that reason**, and the distinction is load-bearing
rather than rhetorical — the need is documented in the codebase and **predates this gate.**

`src/lib/adminVerticalPreset.ts` records it independently, on the irrigation preset. Verbatim
from the file:

> S300 — artificial-turf REPLACED retaining-walls: the owner discontinued
> retaining walls and now installs turf. A per-customer service change in a
> SHARED vertical preset, tolerable only because pls is the sole irrigation
> tenant. The second irrigation tenant makes this wrong; the real fix is a
> tenant-level service list.

That list is **one customer's services in a shared vertical preset**, and the file names **"a
tenant-level service list"** as the real fix. The same file's `lawn` preset restates the point
in reverse: *"THAT list is one customer's services in a shared preset, and the second
irrigation tenant makes it wrong. The catalog shape is the fix for that class, not a
workaround for lawn."*

### Design shape, recorded

| layer | where it lives |
|---|---|
| per-vertical **CATALOG** | **stays in code**, moves to `shared/lib` as the single canonical source consumed by **both trees** |
| per-tenant **SELECTION** | **the new database table** |
| catalog projection table | **none** — deliberately not built |

---

## 6. Vertical readiness — recorded as fact for the next session

Every count below was read from the real catalogs, not from documentation. `tenant_services`
was confirmed **absent** from the live database.

| vertical | slugs | is it a real catalog? |
|---|---|---|
| **pest** | **12** | ✅ real catalog |
| **lawn** | **17** | ✅ real catalog — but the CHECK **still rejects `'lawn'`** |
| **irrigation** | **5** | ❌ **NOT a catalog** — one tenant's list, needs widening |
| **pool** | — | **does not exist** (resolves to the empty set) |
| **vita-glow** | — | **no vertical, by design** (its shell branch serves any slug with a row) |

The live constraint, read from `pg_constraint` on 2026-09-04:

```
CHECK (((key <> 'business_info'::text)
    OR ((value ->> 'vertical'::text) IS NULL)
    OR ((value ->> 'vertical'::text) = ANY (ARRAY['pest'::text, 'irrigation'::text]))))
```

`'lawn'` is absent from that list. This is the S323 PR C ordering hazard and it is unchanged:
`getVerticalCopy` **throws** for a vertical with no preset and is called from `layout.tsx`, so
setting a tenant to `'lawn'` before the presets land **500s that tenant's entire site via a
JSONB edit, with no deploy involved.**

---

## 7. Build order — recorded, ~3 sessions

| # | step |
|---|---|
| **1** | `tenant_services` + catalog extraction to `shared/lib` |
| **2** | `merge_setting_value` PL/pgSQL helper — per-key policy, tested against **the same fixture corpus** as the TypeScript helper |
| **3** | `provision_tenant_atomic` — all 10 tables, unconditional seed, prospect as overlay, structural invariants, grants + CI grant assertion |
| **4** | outbound integration queue (Zernio + Outscraper) |
| **5** | edge function rewrite — auth first, one RPC call, dispatch after commit, `auth_user_id` reuse on retry |
| **6** | zero-service route-level fixtures (nav, tiles, sitemap, JSON-LD) |

**Why 1 and 2 are first:** they are **independent of each other**, and **neither can affect the
live `pls` tenant.** Step 1 adds a table nothing reads yet; step 2 adds a helper nothing calls
yet. Both are provable before anything they feed exists.

---

## Out of scope — do not touch

- **The `dang` repo.** Separate repo, mid-migration. Its data is readable as evidence; its
  public site is not rendered by this app.
- **Anything that moves the `pls` rendered service list, sitemap, or nav.** `pls` is a paying
  client on its own custom domain with an indexed 14-URL sitemap.

---

## Verification note

§5's quotations were read from `src/lib/adminVerticalPreset.ts` at `34b597e`. §6's counts were
read by importing the catalog modules directly, and the constraint and queue tables were read
from the live database. Nothing in §5–§7 was transcribed from the brief on trust — which is the
same rule (*verify the artifact, not the status*) that the S331/S333 correction exists to record.

**§1–§3 remain unverified and unfilled, because their source texts were never supplied.**
