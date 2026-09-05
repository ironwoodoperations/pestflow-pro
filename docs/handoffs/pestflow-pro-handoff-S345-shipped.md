# PestFlow Pro — Session Handoff S345

**Date:** 2026-09-05
**Arc:** S332 → S345.
**Deploy state:** **SHIPPED AND LIVE.** S345 merged as `254be00` ([#351](https://github.com/ironwoodoperations/pestflow-pro/pull/351)). Every edge function in this arc is deployed, every migration is applied, and the atomic-provisioning chain was exercised end to end against production, including **the first successful tenant deletion in this platform's history.**

The deploy/apply queue is **empty**. One thing is owed from the deploy side: `s343b` was applied live,
mid-test, and has no migration file.

---

## VERIFIED LIVE STATE

Read from production, not inferred from a merge. Deploy times UTC, 2026-09-05 unless noted.

| object | state |
|---|---|
| `process-outbound-queue` | **ACTIVE v3**, `verify_jwt=false`, deployed **03:17:32** — after the #351 merge, so it carries all of S345 Part A. Invoked live: `200 {"claimed":0,…}`. |
| cron `process-outbound-queue` | **jobid 18, `*/15 * * * *`, active=true** |
| `ironwood-provision` | **ACTIVE v64**, `verify_jwt=false`, deployed **02:02:49** — carries the S343 `operators` gate. |
| `provision-tenant` | **ACTIVE v108**, `verify_jwt=false`, deployed **2026-09-04 22:44:19** — carries S341. A lawn payload probe returned **400 `service_not_in_catalog`**, which is the picker proving itself live. |
| `outbound_queue_claim` | returns `TABLE(id, tenant_id, kind, payload, attempts, vendor_ref, prior_status, **idempotency_key uuid**)`. Grants after DROP+CREATE: **`service_role:EXECUTE, postgres:EXECUTE` and nothing else** — zero app-role grants. |
| `settings_business_info_vertical_valid` | admits `'lawn'`; **both escapes preserved** (`key <> 'business_info'`, and `vertical IS NULL`). |
| `profiles_tenant_id_fkey` | `FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE` — applied. |
| `trg_tenant_users_block_last_admin` | present, cascade-aware. |
| `admin_delete_tenant` | S343b applied. md5 **`54937fa95988c4cc7ec401b2b10be307`**, length **4730** — the anchor for the migration file owed below. |

**Why `ironwood-provision` is at v64:** it was deployed twice. **v62** flipped `verify_jwt` true, **v63**
corrected it, and **v64** carried the S343 operator gate. **`verify_jwt=false` throughout the corrected
state**, and S343 pinned it in `config.toml` so a flag-less deploy cannot flip it again.

---

## THE DELETE, AND WHY IT HAD NEVER WORKED

`admin_delete_tenant` had **TWO** blockers, not one, and **had never completed a single run.**

- **S343** found the first by reading the trigger: the last-admin guard counted other admins of the same
  tenant *excluding the row being deleted*, so whichever admin row went last had zero others **by
  construction**. No deletion order satisfied it.
- **S343b** found the second only by **running** it: the function did `DELETE FROM public.user_roles` —
  **a table S273 dropped.** Static reading could not surface this; the statement was never reached,
  because the trigger raised first.

That is why the deleted **CityShield** tenant left **17 orphan rows**. The function reported failure and
the operator moved on; nothing had been cleaned up.

**PROVEN, not asserted:** a throwaway tenant was provisioned, verified across 11 tables, then deleted
via `admin_delete_tenant` — `ok=true`, **zero orphans across all 11 tables**, with the audit row and the
offboard queue rows written. First successful tenant deletion in this platform's history.

---

## WHAT SHIPPED

| session | change | state |
|---|---|---|
| **S333** | corrected the S331 merge status in handoff + ROADMAP (#341) | docs |
| **S334** | gate record for the atomic provisioning RPC — record only (#342) | record |
| **S335** | catalog extraction to `shared/lib` + the `tenant_services` migration file (#343) | merged |
| **S336** | migration file + shared fixture corpus for `merge_setting_value` (#344) | merged |
| **S337** | made the redeploy verifier report the truth (#345) | merged |
| **S339** | the outbound queue worker (#346) — `7ef029d` | **LIVE** |
| **S340** | `provision-tenant` rewritten onto `provision_tenant_atomic` (#347) — `d960c5e` | **LIVE** |
| **S341** | the per-service picker, and the lawn vertical chain (#348) — `72136b4` | **LIVE, CHECK applied** |
| **S342** | vertical selector + service picker in the Ironwood UI (#349) — `743e8e1` | **LIVE** |
| **S343** | six cleanups found by live verification (#350) — `20d692d` | **LIVE, both migrations applied** |
| **S343b** | second `admin_delete_tenant` defect, found by running it | **APPLIED LIVE — no migration file** |
| **S345** | Zernio idempotency, and two guards narrower than they looked (#351) — `254be00` | **LIVE** |

**S338 has no merge commit on `main`. S344 was investigation-only by design** — no PR, no file written,
reported in chat.

**Idempotency is FULLY delivered.** The column, the widened claim RPC and the request header all ship.
The S345 PR described the plumbing as inert; the RPC was widened the same night, so it is not. Verified
live: the key is returned, and is **identical on re-claim after a retryable failure.**

---

## OPEN, IN PRIORITY ORDER

### 1. S346 — THE OPERATOR ALLOWLIST. Kickoff already written.

**`IRONWOOD_OPERATOR_USER_IDS` and `public.operators` are exact opposites**, verified by id rather than
by label:

| source | contents |
|---|---|
| `_shared/aiAuth.ts` → `IRONWOOD_OPERATOR_USER_IDS` | `5181b30a-265f-4a70-a323-bf6e3c53641b` = **admin@pestflowpro.com**, and only that |
| `public.operators` | `32b8fbf4-6378-49b2-b5b5-580d7a0c9a21` = **scott@homeflowpro.ai**, and only that |

`scrape-prospect` **403'd twice on 2026-09-05** because of it, and the same set gates `ai-proxy`'s
`redirect_map` feature.

### 2. S346 part B — `scrape-prospect` is pest-only.

`CANDIDATE_PATHS`, `pathToSlug`, and **both prompts**.

### 3. S346C — THE FOURTH ALLOWLIST, AND THE SIDEBAR THAT LIES. Its own PR, NOT part of S346.

Found while verifying this handoff. Beyond the two sources S346 reconciles, there is a **third operator
list, duplicated**, plus a hardcoded identity display:

- **`IRONWOOD_ALLOWED`** — `src/pages/admin/IronwoodLogin.tsx:9` **and again** `src/pages/IronwoodOps.tsx:48`.
  Three emails each: `admin@pestflowpro.com`, `murphygurl92@gmail.com`, `scott@homeflowpro.ai`.
- **The sidebar footer** — `src/pages/IronwoodOps.tsx:108` renders the literal string
  `admin@pestflowpro.com` instead of `session.user.email`. **It misled a real login check on
  2026-09-05**: the sidebar showed one identity while the session held another. A *display* lie about
  identity, which costs debugging time rather than uptime.

So operator truth lives in **four places that disagree**, two of them copies of each other.

**⚠️ ASK SCOTT BEFORE ANYONE RECONCILES THESE.** `murphygurl92@gmail.com` appears in **neither**
`public.operators` **nor** `aiAuth.ts` — and it has **no `auth.users` row at all**, so it cannot sign
in. It is a dead entry in both copies of `IRONWOOD_ALLOWED`. Whether it should be created, or removed,
is a decision about who gets operator access, not a cleanup.

### 4. `s343b` NEEDS A MIGRATION FILE.

Applied live, mid-test, so the repo has no record of it. The file must carry the `user_roles` DELETE
**removed** and **everything else verbatim** from `pg_get_functiondef`, md5-verified the way S336 and
S339 were. Anchor: md5 `54937fa95988c4cc7ec401b2b10be307`, length 4730. The live function already
carries the explanatory comment at line 71, which the file should preserve.

### 5. Grandview provisions.

---

## RECORDED, NOT BUILT

- **15 consumers are unpinned in `config.toml`** (S343 audit; the older count of six had drifted).
  Reported, not fixed — an unreviewed pin is a silent setting change. `ironwood-provision` **is** pinned
  `verify_jwt = false`. `config.toml` is itself a workflow trigger path.
- **Eight files are still tracked under `supabase/.temp/`.** S343 removed only the churning `cli-latest`.
- **The root `tsconfig.json` EXCLUDES `supabase/`,** so `npx tsc --noEmit` says nothing about
  edge-function code. A targeted strict config found real defects in both S340 and S341. Without one,
  "tsc clean" is a false green for every edge change.
- **`strip_settings_secrets` has no migration file** — same class as the four backfilled in S339, and
  now the same class as `s343b`.
- **`sprinkler-systems` reads wrong as a lawn page title.** A content decision, flagged not changed, and
  pinned by a test so it cannot drift unnoticed.
- **Vercel's `VITE_ANTHROPIC_API_KEY` pair is SAFE TO DELETE** (S344). Nothing reads it; the
  `.env.example` cleanup landed in #132. Deleting it in Vercel is Scott's call.

---

## WORKING RULES THIS ARC EARNED

**1. THE REPO IS NOT THE SYSTEM OF RECORD FOR DEPLOY OR MIGRATION STATE.** This handoff's first draft
claimed "eleven merged sessions and almost none of it is live." That was **false** — everything had been
deployed and applied hours earlier, and none of it is visible from `git log`, because deploys and
`apply_migration` leave no commit. **Query production before writing a carry-forward**, every time. A
session log written from repo state alone will be confidently wrong.

**2. Some defects are only reachable by RUNNING the thing.** `admin_delete_tenant`'s second blocker sat
behind the first: the `user_roles` reference was unreachable until the trigger stopped raising. A
deletion fix that has not deleted anything is not tested — and *fixing* one blocker is not evidence
there was only one.

**3. A substring test is not a proof of absence.** Checking whether `admin_delete_tenant` still contained
`user_roles` returned **true** after S343b — the hit is the *comment* recording the removal. Anchor on
`md5(pg_get_functiondef(...))`, not on grep.

**4. `is_operator()` reads `auth.uid()`, which is NULL under a service-role client.** Calling it as an
RPC from an edge function denies **everyone** — a failure that looks like working code. Query
`public.operators` directly; service_role bypasses its RLS.

**5. `ON DELETE CASCADE` fires a child row's trigger AFTER the parent is already gone** from that
trigger's snapshot. Verified empirically on temp tables in a rolled-back transaction. That is what makes
"the tenant no longer exists" a cascade signal that cannot be spoofed.

**6. `shared/lib` reaches the shipped client bundle, served UNAUTHENTICATED** at `/_admin/assets/*`. The
CI Anthropic guard had never covered `shared/` while this arc spent five sessions moving helpers into
it. Widened in S345.

**7. A test asserting about a forbidden literal must assemble it from fragments,** or it trips the guard
it protects. S345's new guard test failed on a clean tree for exactly this reason.

**8. ABSENT and EMPTY mean opposite things for `services`.** Absent = "not stated" → whole catalog.
`[]` = a statement of nothing → 400. `services.length > 0` collapsed them and would have silently
provisioned all 17 lawn services from a bypassed checklist.

**9. Mutate every guard.** Eight vacuous guards were found across S326–S345, four self-caught in this
window — twice only *after* the mutation caught me.

**10. dang is a SEPARATE REPO and out of scope.** Unchanged, and it held all arc long.
