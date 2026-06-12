# PestFlow Pro — Session kickoff: S263

**Suggested-Fix Tier Layer (Report Fix-Chain)**

> ⚠️ **This file is SCOPING ONLY.** It is the session's source of truth, committed to the
> repo ahead of the build. Do NOT build anything off this kickoff yet, do NOT touch the DB,
> do NOT deploy. Build starts next session.

---

## Goal

Turn the monthly SEO report's findings into actionable, tier-gated fixes **with NO bulk-write
machinery**. Elite "Fix all" is a **thin loop over the proven per-finding apply** — not an
atomic multi-page transaction. The per-finding apply is the real engineering; Elite is nearly
free once it exists.

---

## Tier model (LOCKED)

| Tier | What they get |
|------|---------------|
| **Free / all tiers** | See the problem + plain-language manual-fix coaching. **Already shipped S261.** This is the only thing Growth and below get. |
| **Pro (tier 3)** | Generate the AI suggested fix (lazy gen, cached) + one-click apply, **per finding**. AI-generated fixes are **Pro+ to both GENERATE and VIEW** — Growth does NOT see them. |
| **Elite (tier 4)** | Everything Pro, plus a **"Fix all"** button that loops the per-finding apply down the whole list, behind **one preview+confirm modal**. |

---

## Grounded state (verified live this session)

`report_findings` columns in play:

- `finding_key`
- `category`
- `severity`
- `page_slug` (**nullable**)
- `problem`
- `suggested_fix` (**nullable**, lazy-gen + `suggested_fix_at` cache)
- `is_resolved` (**already exists**)

Of Dang's **11 current findings**:

- **8 are page-scoped** (`page_slug` set, meta/content categories) → **ARE applyable** (one-click).
- **3 are site-wide** (`page_slug: null`, engagement category) → **NOT one-click-applyable**
  (no single page to write to). These get **no apply button** this session.

---

## Build order

> Step 2 is the real engineering. Elite (step 3) is nearly free after it.

### 1. Generate-suggested-fix action — Pro-gated

- Gate: `check_tenant_access(tenant, 3)`.
- Lazy AI gen via **`ai-proxy`** (never direct), model **`claude-sonnet-4-6`**.
- Writes `suggested_fix` + `suggested_fix_at`, **cached** (don't re-gen if present).

### 2. Per-finding one-click apply — Pro-gated — **THE core work**

For a **page-scoped** finding:

1. Write `suggested_fix` into the correct `page_content` field.
2. **PURGE ISR CACHE in the same turn** — `revalidatePath('/tenant/[slug]', 'layout')`
   (**bracket form, never interpolated**).
3. Flip `is_resolved = true`.

- Per-finding **success/fail** state.
- Must run through a **frontend→edge path with tenant-admin Bearer JWT** —
  **MCP/SQL writes CANNOT purge ISR.**

### 3. Elite "Fix all" — Elite-gated

- Gate: `check_tenant_access(tenant, 4)`.
- Render all findings; one button **loops step 2** over each **applyable (page-scoped)** finding.
- **Preview+confirm modal first** — "This will apply N fixes across M pages" + the list.
- **NO atomic transaction** — each apply independent. A mid-list failure **leaves prior fixes
  applied** and **marks the failed one**.
- **Skips site-wide findings and says so.**

---

## Hard constraints (non-negotiable, from prior learnings)

1. **ISR cache purge in the same turn as EVERY content write.** The per-finding apply must
   purge; the loop inherits it.
2. **Cache purge requires tenant-admin Bearer JWT** (frontend→edge action), not MCP/SQL.
3. **Validator gate (Perplexity + Gemini, conservative-wins) REQUIRED before merge** — this
   work touches caching, content writes, and tier gating.
4. **All AI via `ai-proxy`**, model **`claude-sonnet-4-6`**.
5. **Tier checks via `check_tenant_access` ONLY** — never read `settings.subscription`.
6. **Files < 200 lines.**
7. **`maybeSingle()` for settings.**

---

## Explicitly OUT of scope (the "monster" we are NOT building)

- ❌ No atomic multi-page bulk write.
- ❌ No partial-rollback logic.
- ❌ No separate bulk-write path.
- ✅ Elite = **loop over single-apply.**
- ❌ Site-wide (`page_slug: null`) findings get **no apply button** this session.

---

## Division of labor

| Owner | Responsibility |
|-------|----------------|
| **Claude.ai (MCP)** | Any DB/migration (**none anticipated** — `is_resolved` + `suggested_fix` already exist); edge-fn **deploys + verification**. |
| **CC Web** | All **repo writes** via branch+PR: apply edge fn/route, report-viewer UI, Fix-all loop. |
| **Scott** | Merges + triggers the validator gate. |

---

## Success criteria

- Pro tenant: per-finding **generate** + **one-click apply** works on a page-scoped finding;
  content writes to the correct `page_content` field, ISR purges in the same turn, finding
  flips `is_resolved = true`.
- Growth tenant: sees coaching only — **no** AI suggested fix generated or viewed, **no** apply.
- Elite tenant: "Fix all" loops applyable findings behind one preview+confirm modal; mid-list
  failure leaves prior fixes applied and marks the failed one; site-wide findings skipped with
  a clear message.
- No atomic/bulk-write path exists. Elite is a loop over the single-apply.
- Validator gate (Perplexity + Gemini) documented GREEN before merge.

---

*Kickoff drafted for S263. SCOPING ONLY — no build, no DB, no deploy this session. Build starts
next session off this kickoff.*
