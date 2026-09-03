# S324 — INVESTIGATION: THE PROVISIONING WRITE SET

**Read-only.** No branch, no commits, no PR, no migration, no deploy. Nothing was changed.

**Repo state:** `main` @ `195db2f`. **S323 PR A (#330) IS MERGED** — it is in `main` as of this
investigation. Nothing below depends on it.

**`REVIEW_S323_SERVICE_SELECTION.md` DOES NOT EXIST.** The repo carries 17 `REVIEW_*.md` files
and that is not one of them. The brief's arbitration summary is therefore authoritative, as it
said it would be.

**Artifact verification.** `get_edge_function(provision-tenant)` returned **v102, ACTIVE,
`verify_jwt: false`, `ezbr_sha256 a1b36ee1…`, deployed 2026-09-02**. The deployed bundle carries
six files. Five are **byte-identical** to the repo:

| bundled file | deployed vs repo |
|---|---|
| `provision-tenant/index.ts` (1128 lines) | **IDENTICAL** |
| `_shared/authorityPrompts.ts` | IDENTICAL |
| `_shared/provisioningSeed.ts` | IDENTICAL |
| `_shared/service-areas.ts` | IDENTICAL |
| `shared/lib/platformBrand.ts` | IDENTICAL |
| `_shared/verticalCopy.ts` | **DIFFERS** — repo has the S323 PR A `lawn` key + header comment; deployed does not |

The one difference is my own PR A change, merged this session and not yet deployed. It is inert:
`lawn` is unreachable in that map until the CHECK widens. **No repo/deployed drift of the
api-quote kind exists here.**

---

## 1. THE COMPLETE OPERATION INVENTORY, IN EXECUTION ORDER

`P` = Postgres write · `R` = Postgres read · `X` = external API call · `A` = Supabase Auth API

| # | line | operation | class | on failure | idempotent as written |
|---|---|---|---|---|---|
| 0 | 202 | read `onboarding_sessions.wizard_data` | R | warns, falls back to body | n/a |
| 1 | 284 | `tenants` SELECT by slug (collision guard) | R | — | n/a |
| 2 | **298** | `tenants` INSERT `{slug,name,entitlement}` | **P** | **ABORTS 500** | **yes, via the 409 at 284** |
| 3 | **311** | `tenants` UPDATE (only when `body.tenant_id` given) | **P** | **error DISCARDED — not even logged** | yes |
| 4 | **316** | `auth.admin.createUser` | **A** | branches; unknown error ABORTS 500 | **no — see §2** |
| 5 | 330 | `auth.admin.listUsers` (O(n) scan) | A | ABORTS 500 if no match | n/a |
| 6 | 350 | `profiles` SELECT (tenant-collision guard) | R | ABORTS 500 | n/a |
| 7 | **383** | `auth.admin.updateUserById` — **password reset** | **A** | ABORTS 500 | **no — resets password every run** |
| 8 | **420** | `tenant_users` INSERT `role:'admin'` | **P** | **logs and continues** (23505 tolerated) | yes (unique `tenant_id,user_id`) |
| 9 | **429** | `profiles` UPSERT `onConflict:'id'` | **P** | **logs and continues** | yes |
| 10 | **560** | `settings` UPSERT ×11 keys, in a loop | **P** | **logs and continues, per row** | yes as rows — **but see §5, it REPLACES** |
| 11 | **584** | `page_content` UPSERT ×N (vertical seed) | **P** | **logs and continues, per row** | yes |
| 12 | 593 | `prospects.scraped_content` SELECT | R | caught, non-fatal | n/a |
| 13 | **602** | `page_content` UPSERT (scraped overlay) | **P** | **logs and continues** | yes |
| 14 | **621** | `onboarding_sessions` UPDATE `consumed:true` | **P** | **error DISCARDED — not even logged** | yes |
| 15 | **630** | **`POST https://zernio.com/api/v1/profiles`** | **X** | caught, non-fatal | **NO — creates a new profile every run** |
| 16 | 647 | `settings` SELECT integrations | R | — | n/a |
| 17 | **654** | `settings` UPDATE integrations (zernio id) | **P** | logs and continues | yes |
| 18 | 671 | `prospects.intake_data` SELECT | R | caught, non-fatal | n/a |
| 19 | **690** | `settings` UPDATE `business_info` (intake overlay) | **P** | **error DISCARDED** | yes (merge) |
| 20 | **714** | `settings` UPDATE `branding` (intake overlay) | **P** | **error DISCARDED** | yes (merge) |
| 21 | **739** | `settings` UPSERT `seo` | **P** | **error DISCARDED** | yes as a row — **REPLACES, see §5** |
| 22 | **762** | `page_content` UPDATE meta_title/description ×N | **P** | **error DISCARDED** | yes |
| 23 | **777** | `service_areas` UPSERT (live, from CRM) | **P** | logs and continues | yes |
| 24 | **824** | `service_areas` UPSERT (draft zip cities, `ignoreDuplicates`) | **P** | **error DISCARDED** | yes |
| 25 | 841 | `service_areas` SELECT (projection) | R | — | n/a |
| 26 | 845 | `settings.seo` SELECT | R | — | n/a |
| 27 | **848** | `settings` UPDATE `seo.service_areas` | **P** | **ABORTS 500** — the only mid-sequence hard abort | yes (merge) |
| 28 | 889 | `settings.demo_mode` SELECT | R | — | n/a |
| 29 | 905 | `rpc('operator_tenant_id')` | R | skips prompt seeding | n/a |
| 30 | 920/932/954 | `settings`,`page_content`,`service_areas` SELECT | R | — | n/a |
| 31 | **967** | **`ai_authority_prompts` INSERT ×N** | **P** | logs and continues | **NO — no unique constraint, see §6** |
| 32 | **1010** | `blog_posts` UPSERT ×3 (pest only) | **P** | logs and continues | yes |
| 33 | **1019** | `prospects` UPDATE `pipeline_stage` | **P** | **error DISCARDED** | yes |
| 34 | 1027 | `page_content` SELECT (master legal templates) | R | warns, skips | n/a |
| 35 | **1068** | `page_content` UPSERT ×4 legal | **P** | warns and continues | yes |
| 36 | 1090 | `settings.integrations` SELECT | R | caught | n/a |
| 37 | 1098 | **`vault.decrypted_secrets` SELECT** | R (privileged) | caught | n/a |
| 38 | **1102** | **`POST …/functions/v1/outscraper-reviews`** | **X** | fire-and-forget, `.catch()` only | **no — re-fires every run** |
| 39 | 1115 | `return { success: true }` | — | — | — |

**The gate's premise, confirmed with a count.** 22 durable Postgres writes across 8 tables.
**Exactly one of them aborts** (#27, `seo.service_areas`). **Eleven discard their error entirely**
— several not even to the log (#3, #14, #19, #20, #21, #22, #24, #33). Every other failure is
logged and stepped over, and the function then returns `success: true` at line 1115. A tenant can
finish provisioning with no `tenant_users` row, no settings, no pages, and the caller is told it
worked. **This is exactly the false-200 both models described.**

---

## 2. THE AUTH USER, AND WHAT DEPENDS ON IT

**Call site: line 316**, `supabase.auth.admin.createUser({ email, password, email_confirm: true })`,
inside `if (resolvedAdminEmail && resolvedAdminPassword)`. If both are absent the whole block is
skipped with a `console.warn` at line 434 and **provisioning proceeds to create an admin-less
tenant**.

### The dependency chain — precise

```
auth.admin.createUser (316)  ──►  authData.user.id
        │  (on "already registered")
        └─►  auth.admin.listUsers (330) ──► existing.id
                                              │
                                    resolvedUserId ──┬──► profiles SELECT (350)   [guard, read]
                                                     ├──► auth.admin.updateUserById (383) [password]
                                                     ├──► tenant_users.user_id  (420)  FK
                                                     └──► profiles.id           (429)  FK/PK
```

**Two Postgres writes take the auth user id as a key**, both inside `if (resolvedUserId)` at
line 416:

* **`tenant_users` (420)** — `{ tenant_id, user_id: resolvedUserId, role: 'admin' }`. This is the
  SSOT for membership and role since S273. `user_id` references the auth user.
* **`profiles` (429)** — `{ id: resolvedUserId, tenant_id, full_name }`, upserted on `id`.
  `profiles.id` **IS** the auth user id (`profiles_pkey PRIMARY KEY (id)`).

Nothing else in the function reads or writes `resolvedUserId`.

**So: auth-before-transaction is possible, and it is the only ordering that is.** Both
FK-dependent writes are late (420, 429) and adjacent; everything before them needs only
`tenantId`. The id must exist before the transaction can write those two rows.

**One thing the gate question also omitted:** the auth branch is not just *create*. Line 383
**resets the password of an existing user on every re-run**, and gotrue ≥2.149 kills their live
sessions when it does. That is an un-rollbackable side effect on a human being, and it fires
before any of the seed writes.

---

## 3. THE ORDERING PROBLEM

Auth is an HTTP call to gotrue. It cannot join a Postgres transaction, cannot be rolled back by
one, and `createUser` is **not idempotent** — the second call returns "already been registered"
and the code falls into the listUsers/password-reset branch. There is no option with no orphan.

### (a) Auth first, then the transaction
Orphan on failure: **an auth user with no tenant membership.**
Detectable by `auth.users LEFT JOIN public.profiles` / `tenant_users` → NULL. Cheap: one query,
no ambiguity, and the row is inert — a user with no `tenant_users` row has no tenant, and RLS
gives them nothing. Cleanup is `auth.admin.deleteUser`.
Cost: on the "already registered" path, the password has already been reset before the
transaction runs, so a failed transaction leaves a real person locked out of a tenant that did
not change. That is the sharp edge of (a), and it exists **today**.

### (b) Transaction first, auth after commit
Orphan on failure: **a fully-seeded tenant with no admin, and the caller was already told it
succeeded** if the response is sent before the auth call, or a 500 after a committed transaction
if it is not. Detectable, but the tenant is *live* — it renders, it collects leads, and nobody
can log in to it. Recovery means a second provisioning run, which re-enters the whole write set.
**Worse orphan, and it inverts the FK dependency**: `tenant_users` and `profiles` cannot be
written inside the transaction at all, because the id does not exist yet.

### (c) Transaction first with admin membership inside it, auth after, plus compensation
**Not possible as stated.** `profiles.id` is the auth user id and `tenant_users.user_id`
references it. There is no id to write until gotrue has answered. (c) would require decoupling
membership from the auth id — a schema change well outside this arc.

### (d) What the code actually suggests — auth first, transaction second, with the split moved
This is (a) with the boundary drawn where the code already draws it. Steps 4–7 (auth) run first
and already fail closed on every branch: unknown createUser error → 500 (409), lookup
inconsistency → 500 (346), tenant collision → 409 (369), password sync → 500 (395). **The auth
phase is already the best-behaved part of this function.** Then one RPC takes
`(tenant_id, user_id, …)` and does all 22 Postgres writes atomically.

### RECOMMENDATION — (a)/(d), auth first, then one transactional RPC

Three reasons:

1. **The FK chain permits nothing else.** (b) and (c) need the user id before it exists.
2. **The orphan is the cheapest one to detect and clean up.** An auth user with no membership is
   one LEFT JOIN away and harmless while it sits there. A live admin-less tenant is neither.
3. **It matches the code's existing failure posture.** Auth already aborts on every branch;
   it is the *seed* half that lies. Making the seed half transactional fixes the half that is broken.

**Two things the implementation session must handle, both currently unhandled:**

* **Move the password reset (383) after the transaction commits, or make it conditional.**
  Today a failed seed still resets a live customer's password. Under (a) that gets worse, not
  better, because the transaction can now roll back cleanly while the password change cannot.
* **The orphan sweep needs somewhere to live.** A query, not a cron, to start:
  `select u.id, u.email from auth.users u left join public.tenant_users tu on tu.user_id = u.id
  where tu.id is null` — currently returns nothing, and should keep returning nothing.

**Scott picks. I recommend (a)/(d).**

---

## 4. EVERYTHING ELSE THAT IS AN EXTERNAL CALL

Auth is **not** the only one. Three non-Postgres side effects, all un-rollbackable:

| line | call | when | rollback | notes |
|---|---|---|---|---|
| 316/330/383 | **Supabase Auth (gotrue)** | always, if email+password | none | §2 |
| **630** | **`POST https://zernio.com/api/v1/profiles`** | always, if `ZERNIO_API_KEY` set | **none** | §D2 — creates a billable third-party record |
| **1102** | **`POST …/functions/v1/outscraper-reviews`** | if a Google id is present | none | fire-and-forget; spends Outscraper credits |

Also privileged but internal: **line 1098 reads `vault.decrypted_secrets`** to get the Outscraper
cron secret. Not an external call, but it is a secret read that must stay outside anything a
future RPC exposes to a lower-privilege caller.

**No email send. No SMS.** I walked the function for `resend`, `sendEmail`, `textbelt`, `mail`
and `sms` and found none — the welcome-email concern in the brief does not apply to
`provision-tenant`. Credentials reach the customer by Scott's mailto flow, outside this function.

**Consequence for the RPC:** three calls must sit outside the transaction. Zernio (630) and
Outscraper (1102) are both **after** all the writes they depend on and both already
non-fatal — they can simply move after the commit with no reordering. Auth must move before it.

---

## 5. THE SETTINGS WRITES — MERGE vs REPLACE

**Answer: the primary seed REPLACES. It is the S292 shape, in the function that runs first.**

| line | key(s) | shape | verdict |
|---|---|---|---|
| **560** | **all 11 keys, incl. `business_info`** | `upsert(row, {onConflict:'tenant_id,key'})` with a **freshly-built object** | **WHOLE REPLACEMENT** |
| 654 | `integrations` | SELECT then `{...currentIntg, zernio_profile_id}` | merge (read-modify-write) |
| 690 | `business_info` | SELECT then `{...currentBi, …}` | merge |
| 714 | `branding` | SELECT then `{...currentBr, …}` | merge |
| **739** | **`seo`** | `upsert` with exactly 3 keys | **WHOLE REPLACEMENT** |
| 848 | `seo.service_areas` | SELECT then `{...currentSeoValue, …}` | merge |

**Line 560 is the finding.** On a first provision it is harmless — there is nothing to destroy.
On a **re-provision with `body.tenant_id`**, which Step 1's else-branch at 311 explicitly
supports and which `BundleSocialSetup` actively tells the operator to do (§D2), it overwrites
`business_info` wholesale with wizard-or-empty values. Every key the customer has since edited in
the admin dashboard — and every key not in the seed's literal, which for `pls` today includes
`google_business_token`-adjacent structured fields — is replaced by `''`.

**`src/lib/businessInfoMerge.ts` does not protect this path and cannot.** Its only consumer is
`src/pages/admin/Onboarding.tsx` (the client wizard). `provision-tenant` is bundled by the
Supabase CLI, which packages only `supabase/functions/**`, so it cannot import from `src/`. The
guard S292 built exists on one write path and the other one was never brought under it.

Line 739 (`seo`) has the same shape with a smaller blast radius: it drops any `seo` key that is
not `meta_description`, `service_areas` or `focus_keyword`. Note it also writes
`service_areas: []` and relies on line 848 to repair it — which is why 848 is the only hard abort
in the function.

**Not fixed here, per the brief.** Both belong in the RPC's write list as merges.

---

## 6. IDEMPOTENCY AS IT STANDS TODAY

**Double invocation with the same body, no `tenant_id`:** the second call **409s at line 291** on
the slug-exists guard. That guard is the only thing standing between this function and a
duplicate-tenant mess, and it works.

**Double invocation with `tenant_id` supplied** (the re-provision path, and the one the operator
UI recommends) — per operation:

| operation | second run |
|---|---|
| tenants (311) | UPDATE, harmless |
| **auth createUser (316)** | "already registered" → **listUsers → PASSWORD RESET (383) → live sessions killed** |
| tenant_users (420) | 23505, caught, no duplicate |
| profiles (429) | upsert on `id`, no duplicate |
| **settings (560)** | **11 keys REPLACED — customer edits destroyed (§5)** |
| page_content (584/602/1068) | upsert on `(tenant_id,page_slug)`, no duplicate |
| **Zernio (630)** | **a SECOND Zernio profile is created**; the id at 654 overwrites the first, orphaning it |
| service_areas (777/824) | upsert on `(tenant_id,slug)`, no duplicate |
| **ai_authority_prompts (967)** | **plain INSERT with NO unique constraint → FULL DUPLICATE SET** |
| blog_posts (1010) | upsert on `(tenant_id,slug)`, no duplicate |
| **Outscraper (1102)** | **re-fires, spending credits** |

Verified against `pg_constraint`: `ai_authority_prompts` has **only `PRIMARY KEY (id)`** — no
unique constraint of any kind. Every other seeded table has the unique key its upsert names.

Live check: no tenant currently carries duplicate prompts (`pls` 10/10 distinct, `dang` 10/10,
`vita-glow` 1/1, the five demo tenants 0). **Nothing has been re-provisioned since S289 added
that insert** — the absence of duplicates is luck of scheduling, not a guard.

**Does deferred idempotency-key work have to come forward?**
**No — but two smaller things do, and they are cheaper than an idempotency key.**
The slug guard already makes the *new-tenant* path safe, which is the path Grandview and the
next two tenants take. What is unsafe is the *re-provision* path, and it is unsafe for four
specific reasons above, three of which are one-line fixes inside the RPC work:
a unique constraint on `ai_authority_prompts (tenant_id, prompt_text)`, the settings merge (§5),
and moving/guarding the password reset. Only Zernio needs a decision rather than a fix — §D2.
**An idempotency key can stay deferred. These four cannot.**

---

## 7. THE PUBLICLY-LISTED-SERVICE PREDICATE

**There are TWO predicates, they are structurally different, and they disagree today. This is a
live defect.**

### Predicate A — "which services does this tenant list", `getAllServicePages`
`app/tenant/[slug]/_lib/queries.ts:108` — `page_content` rows **minus a fixed exclusion list**
(`navConfig.ts:4,7` — `NON_SERVICE_SLUGS` + `CUSTOM_PAGE_SLUGS`, 9 slugs).

**Four surfaces already share it, and they already agree:**

| surface | line |
|---|---|
| nav (Services dropdown) | `app/tenant/[slug]/layout.tsx:88` |
| home service tiles | `app/tenant/[slug]/page.tsx:178` (tile config at 192 only *filters and orders*; `titleBySlug.has()` keeps it a subset) |
| XML sitemap | `app/sitemap.ts:103` |
| quote-form service list | `app/tenant/[slug]/quote/page.tsx:53` |

**So the models' "one canonical definition" requirement is already 4/4 satisfied for A.**

### Predicate B — "which slugs actually render a service page", `serviceSlugsFor`
`app/tenant/[slug]/_lib/serviceData.ts` → `app/tenant/[slug]/[service]/page.tsx:87`.
Membership in the **vertical's content map**, not in `page_content`. A slug that misses it falls
to the location branch, finds no `service_areas` row, and **`notFound()`s**.

### They disagree, and there is a live row proving it

`dang` has a `page_content` row for **`wasp-control`**. It is not in `NON_SERVICE_SLUGS` or
`CUSTOM_PAGE_SLUGS`, so **Predicate A lists it** — nav, tile, sitemap. `PEST_CONTENT_MAP` has
`wasp-hornet-control` and **not** `wasp-control` (verified by key dump: 12 keys, no
`wasp-control`), so **Predicate B 404s it**.

That is the same defect class as the 2026-08-26 `artificial-turf` incident, still open, and it is
**exactly what the models were asking for when they required one canonical predicate**. The
existing `adminVerticalPreset.test.ts` documents `wasp-control` as a deliberate legacy slug, but
documents it as an *admin sidebar* concern — nothing connects it to the public 404.

**Scope note:** the only tenant currently affected is `dang`, which the brief puts out of scope,
and `dang` may still be served by the Vite app rather than this route. **I did not verify which
app serves `dang` today and am not claiming it.** The defect is in the predicate pair, not in
`dang`; every other tenant's rows happen to be a subset of their vertical's map
(`pls` 5/5, the six pest tenants 12/12, `vita-glow` routes on its own template branch at
`[service]/page.tsx:65` before either predicate).

### What the RPC session should take from this
A single predicate is `page_content` row **AND** content-map membership. Both halves already
exist; nothing new is needed but the intersection, and one place to compute it. **Service JSON-LD
is not a fifth list** — `generateServiceSchema` is called per-page
(`_components/DefaultPestPage.tsx:45`, and `src/components/seo/SEOHead.tsx:153` in the Vite app),
never over a list, so it inherits whatever the route decided.

---

# ADDENDUM — TWO LIVE DEFECTS

## D1 — THE DEMO TIER SWITCHER

**Confirmed exactly as described, and it is worse in one way the brief did not name: the broken
predicate is duplicated in TWO components.**

* `src/components/admin/TierToggle.tsx:11-15` — `useIsDemoTenant()`
* `src/components/admin/SocialTab.tsx:17-21` — **a byte-identical copy**, used at lines 46, 85,
  136, 158, 194 and passed to `ConnectionsModal` at 215

On `precisionlawnsystems.com`: `hostname.split('.')` → 2 parts, does not end `.pestflowpro.ai`,
so `slug = ''`, so `slug === ''` → **true**. The localhost escape hatch matches every custom
domain. Live since pls's domain went up.

Wrong in both directions, as the brief says: `apex-protect.pestflowpro.ai` → `slug =
'apex-protect'` → **false**. The five demo tenants — the only place this belongs — do not get it.
It renders on the operator tenant, on localhost, and on every custom domain.

**Severity — cosmetic, and I agree with the brief's reasoning rather than restating it.**
Verified independently: `src/context/PlanContext.tsx:55-57`, `setTier` calls `setTierState` and
nothing else — no `supabase` call, no storage, no persistence. The comment at 53-55 says the same,
and enforcement is `check_tenant_access` server-side. **Not a privilege escalation.** What it is:
a paying client seeing an internal demo control on their own dashboard.

### The recommended fix — assessed, and it is cheaper than expected

Gate on `settings.demo_mode.active === true`. Live values confirm it works:

| tenant | `demo_mode` | gate result |
|---|---|---|
| apex-protect, coastal-pest, heartland-pest, metro-pest-concierge, urban-strike | `{active:true, seeded_at:…}` | **shows** ✓ |
| pls | `{"active": false}` (no `seeded_at`) | hidden ✓ |
| dang, pestflow-pro | `{active:false, seeded_at:""}` | hidden ✓ |
| **vita-glow** | **NO ROW AT ALL** (6 settings rows; `demo_mode` absent) | hidden ✓ **only with `=== true`** |

**The brief's `=== true` requirement is not hypothetical — `vita-glow` has no `demo_mode` row
today.** `!== false` would show the switcher on a real client.

**How `demo_mode` reaches the Vite admin app: it already does, in the right component.**
`src/pages/admin/Dashboard.tsx:80` fetches it alongside `business_info` and `branding`, and line
84 is already `setDemoActive(demoRes.data?.value?.active === true)` — **the exact predicate,
already written, already correct.** `<TierToggle />` renders from that same component at line 138,
and `<SocialTab />` at line 214.

So the fix is a **prop, not a query and not a context change**: pass `demoActive` down. That
pattern is already in use — `ConnectionsModal` takes `isDemoTenant` as a prop at `SocialTab:215`.

**It is NOT on the tenant context.** `TenantBoot` (`src/context/TenantBootProvider.tsx:9-12`)
carries `id, slug, name, template, primaryColor, accentColor, logoUrl, ctaText` — no demo flag.
Adding one means changing the `get_tenant_boot` RPC **and** bumping the `pfp_tenant_boot_v2`
localStorage cache key, because a stale cache would feed the old shape. Avoidable; the prop is
strictly cheaper.

**On the localhost dev affordance.** It should not be a hostname test at all — that is the hole.
Two options that are not hostname-shaped: (i) drop it entirely and develop against a demo tenant,
which is what the control is for; or (ii) `import.meta.env.DEV`, which Vite statically replaces
with `false` at build time so the branch is **removed from the production bundle** and cannot
reach a client at all. **I recommend (ii)**: `demoActive || import.meta.env.DEV`.

## D2 — ZERNIO PROFILES

### The brief's premise is wrong, and the truth is more useful

**`provision-tenant` DOES call Zernio.** Step 8, **line 630**:
`POST https://zernio.com/api/v1/profiles`, `Authorization: Bearer ${ZERNIO_API_KEY}`, body
`{ name, description }`. It is in the **deployed** bundle too (v102, byte-identical). The
`BundleSocialSetup:88` instruction is not advice that has never worked — it is advice that has
**never been tried**.

**Why every tenant is empty — dates, not absence:**

| | |
|---|---|
| Zernio step added to `provision-tenant` | **2026-08-23** (`b3b79ea`) |
| `pls` created | 2026-08-19 |
| `vita-glow` created | 2026-07-29 |
| five demo tenants | 2026-05-09 |
| `dang` / operator | 2026-04-08 / 2026-04-04 |

**Every existing tenant predates the code by at least four days.** No tenant has been provisioned
since. So Step 8 has never executed for anyone. It is untested code, not missing code.

**This is still a defect worth its own line, for a different reason than the brief gives:** the
step is gated on `if (ZERNIO_API_KEY)` (line 628) and does **nothing, silently**, when the secret
is unset. I cannot read Edge Function Secrets, so **I cannot tell you whether `ZERNIO_API_KEY` is
set** — and neither can the operator UI, which is the actual problem. The first Grandview
provision is the first time anyone will find out.

### Live values — confirmed exactly as the brief states

| tenant | `zernio_profile_id` | integrations keys |
|---|---|---|
| pls | **NULL** (key absent) | 8 |
| vita-glow | **`''`** (empty string) | 3 |
| 5 demo tenants | `DEMO_FAKE_001`…`005` | 6 each |
| dang | `69dd26eaa42cd3ddf3fa8802` | **23** |
| pestflow-pro | `69dd1cea82e215ed45d4de75` | 6 |

### The decision — (a) provisioning-time vs (b) lazy. **I agree with (b), and add one reason.**

The brief's reasons hold. The reason it does not name is stronger than either:
**(a) makes the third-party call a member of the very write set S324 is trying to make atomic.**
Zernio at line 630 sits *between* the settings seed (560) and the intake overlay (690). Under a
transactional RPC it must move out, and then it is a post-commit call anyway — which is (b) minus
the laziness. **(a) buys nothing and costs the ordering problem twice.**

### What (b) needs — assessed, with the answers

**1. What the create API needs, and whether it is idempotent.**
From the live call at 630: `Authorization: Bearer <ZERNIO_API_KEY>` and
`{ name, description }`. **No idempotency key, no dedup field, and no conditional-create
endpoint is used anywhere in the repo.** The response is parsed defensively at 640-641
(`profile._id || profile.id || id || _id`) — three shapes, which suggests the contract was
discovered rather than documented. **Calling it twice will create two profiles.** I could not
test this — it is a paid third-party API and this session is read-only — so treat "two profiles"
as the safe assumption, not a verified fact. **The lazy path therefore needs its own guard:
re-read `integrations` inside the handler immediately before creating, and skip if a valid id
appeared meanwhile.** Two operators clicking Connect at once is the realistic race.

**2. MERGE or REPLACE — and there is a ready-made answer already in `zernio-connect`.**
`zernio-connect:142-144` already writes integrations as
`{ ...stripVaultSecrets(integrations), zernio_accounts }` — a read-modify-write **merge**, using
the shared S255 guard (`_shared/secrets/stripVaultSecrets.ts`) that removes the four Vault keys
and *preserves every other key exactly*. A lazy create should use the identical shape. **dang's 23
keys are safe under it.**
**But note the gap it reveals:** `provision-tenant:654` writes
`{ ...currentIntg, zernio_profile_id }` **without `stripVaultSecrets`** — the only integrations
writer in the codebase that skips it (`places-reviews:157`, `outscraper-reviews:59,230` and
`zernio-connect:144` all use it). Latent, not live: I checked all four tenants' key lists and
**none currently holds any of the four Vault keys**, so nothing is round-tripping today. It should
still be brought in line.

**3. `''` and NULL.** `zernio-connect:77-80` reads `integrations.zernio_profile_id` and tests
`if (!profileId)` — **falsy, so it already handles `''` and `undefined` identically**. That is
the correct predicate and the lazy branch should reuse it verbatim. `vita-glow`'s `''` proves the
empty string is real, and `!profileId` catches it. **Do not "improve" this to `=== undefined`.**

**4. The five `DEMO_FAKE_00x` placeholders — the sharpest edge in the whole addendum.**
They are **truthy**, so `!profileId` is false, so lazy creation **skips**, and the tenant then
fails *inside Zernio* with a remote error instead of a clean local one. Today they fail fast at
the local check; under (b) they would fail slow and further away. Three options:

* **Recognise the sentinel** — `if (!profileId || profileId.startsWith('DEMO_FAKE_'))`. One
  condition, matches the existing falsy test, keeps demo tenants failing locally and clearly.
  **This is what I recommend**, with the sentinel named in a shared constant rather than inlined
  twice.
* Create real Zernio profiles for the five demo tenants — pays a third party for five invented
  businesses, and S289 already established that demo tenants should not consume external quota.
* Null them out — a data migration, and it makes `BundleSocialSetup`'s "profile ready" badge flip
  for five tenants at once. Avoid.

**RECOMMEND ONLY. Scott decides both.**

---

## PREMISES THAT DID NOT SURVIVE CHECKING

Four, in descending order of consequence:

1. **"Confirm whether provision-tenant calls Zernio AT ALL. Evidence says it does not."** — It
   does, at line 630, in the deployed bundle. The step is four days younger than the youngest
   tenant, so it has never run. Different defect, different fix.
2. **"Both models require ONE canonical definition shared by navigation, service tiles, the XML
   sitemap and service JSON-LD."** — Those four already share `getAllServicePages`. The
   disagreement is between that predicate and the **router's** content-map predicate, which the
   requirement does not name and which is the one producing a live 404.
3. **"provision-tenant … LOGS AND CONTINUES on an upsert failure."** — True but understated:
   **eight** of the writes discard the error without logging at all. There is no log line to find
   for those.
4. **`REVIEW_S323_SERVICE_SELECTION.md`** does not exist. Not a premise failure — the brief
   anticipated it — but recorded so the next session does not go looking.

One more worth flagging even though no brief asserted otherwise: **re-provisioning an existing
tenant resets its admin's password and kills their sessions** (line 383). `BundleSocialSetup:88`
tells the operator to re-provision a paying client to get a Zernio profile. Following that
instruction today would log `pls` out and change his password. That is the single most dangerous
sentence in the operator UI.

## WHAT I DID NOT VERIFY

* **Whether `ZERNIO_API_KEY` is set.** Edge Function Secrets are not readable from here.
* **Whether calling Zernio's create endpoint twice actually creates two profiles.** Paid
  third-party API, read-only session. Assumed non-idempotent.
* **Which app currently serves `dang`.** Relevant to whether the `wasp-control` 404 is reachable
  in production right now; not relevant to the predicate defect itself.
* **A full behavioural test of `provision-tenant`.** It has no test harness (`index.test.ts`
  exists but the root `tsconfig` excludes `supabase/`), and the shared modules it calls are the
  only part under test. Stated, not worked around.
