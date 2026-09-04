# S334 Gate Record — Atomic Provisioning RPC

**Date:** 2026-09-04
**Branch:** `spec/s334-provisioning-rpc-gate-record`
**Posture:** conservative-wins
**Disposition:** ✅ **APPROVE WITH CONDITIONS** — both validators, independently.

This is a **RECORD ONLY**. No migration, function, or product code is in this PR. The build
order in §7 is what the next sessions execute; nothing in it has been started.

---

## 1. Submission text

*Pasted byte-exact. Unlike the two verdicts, this is plain text with box-drawing rules and
layout-significant indentation, so it is kept inside a fence to preserve that layout as
written. **The fence belongs to this record, not to the submission** — the text between the
fence markers is the submission, unaltered and not re-wrapped.*

```text
VALIDATOR GATE SUBMISSION — PestFlow Pro S334
Atomic tenant-provisioning RPC: design review before implementation

You are one of two independent reviewers (the other is a different frontier
model). We take the more conservative verdict where you disagree. Please return
one of APPROVE / APPROVE WITH CONDITIONS / REJECT, with numbered conditions.
Do not assume repository access — everything needed is below. Where I state a
fact as "verified", it was read from the live database or the deployed function
bundle today, not from documentation.

════════════════════════════════════════════════════════════════════════
1. SYSTEM
════════════════════════════════════════════════════════════════════════

Multi-tenant SaaS: marketing websites + admin dashboards for local home-services
businesses (pest control, irrigation, lawn care). Postgres via Supabase. Public
sites are Next.js App Router with ISR; the admin is a Vite SPA; server-side work
runs in Deno edge functions. ~9 tenants today, 2 paying, target 40-60. Delivery
is concierge: one operator provisions every client by hand.

Tenant provisioning is a single Deno edge function, `provision-tenant`:
  - gateway verify_jwt = false
  - in-source auth: constant-time compare of an `x-pfp-internal-key` header
    against a server-side env secret (node:crypto timingSafeEqual, with a
    length-equality pre-check)
  - uses the Postgres service-role key for all database work

════════════════════════════════════════════════════════════════════════
2. WHAT THE FUNCTION DOES TODAY (verified against the deployed bundle)
════════════════════════════════════════════════════════════════════════

Roughly 23 durable writes across TEN tables, executed sequentially over separate
network round trips, with no transaction:

  tenants, tenant_users, profiles, settings, page_content, onboarding_sessions,
  service_areas, ai_authority_prompts, blog_posts, prospects

Ordering, abbreviated:

  Step 1  tenants insert (or update when a tenant_id is supplied)
  Step 2  EXTERNAL: gotrue createUser  -> then tenant_users insert, profiles upsert
  Step 3  settings x11 upserts, each preceded by its own read-then-merge
  Step 4  page_content xN upserts (seeded from the tenant's vertical)
  Step 5  page_content overlay from scraped prospect content
  Step 7  onboarding_sessions update (consumed = true)
  Step 8  EXTERNAL: Zernio POST /api/v1/profiles -> then settings.integrations update
  Step 9  (entire block gated on `if (prospect_id)`)
          9a  settings.business_info overlay      9b   settings.seo upsert
          9b-seo page_content meta updates        9c   service_areas upserts
          9f  settings.seo.service_areas update  <-- THE ONLY HARD ABORT
          9g  ai_authority_prompts upsert         9d   blog_posts x3 (pest only)
          9e  prospects stage update              9g-legal page_content x4
  Step 10 EXTERNAL: Outscraper fire-and-forget

FAILURE BEHAVIOUR IS THE DEFECT. Exactly ONE of those operations aborts on
error (9f). The rest log and continue, and several discard the error entirely.
A failed run therefore returns HTTP 200 with `{success: true}` while the tenant
is partially built, and nobody is told.

RELEVANT SCHEMA FACTS (verified):
  - profiles.id IS the auth user id (PK, and FK to auth.users.id).
    tenant_users.user_id also references it. There is no id to write until
    gotrue answers.
  - Unique constraints available as ON CONFLICT targets:
      settings(tenant_id, key)            page_content(tenant_id, page_slug)
      service_areas(tenant_id, slug)      ai_authority_prompts(tenant_id, prompt_text)
      blog_posts(tenant_id, slug)         tenant_users(tenant_id, user_id)
      profiles(id)                        tenants(slug)
  - Triggers that fire INSIDE the write path:
      trg_strip_settings_secrets   BEFORE INSERT OR UPDATE ON settings
        (strips four Vault secret keys, files an observation row)
      settings_bump_updated_at     BEFORE UPDATE ON settings
      page_content_bump_updated_at BEFORE UPDATE ON page_content
      trg_enforce_location_cap     BEFORE INSERT ON service_areas
        (can RAISE, aborting a seed part-way through)
      prospect_stage_change_log    AFTER UPDATE ON prospects
  - EXECUTE-grant convention for privileged functions, verified:
      admin_delete_tenant, get_tenant_secret, insert_report_and_findings,
      check_and_record_rate_limit  ->  service_role EXECUTE only
      (the Postgres default of EXECUTE TO PUBLIC was explicitly revoked)

════════════════════════════════════════════════════════════════════════
3. THE SIX CONDITIONS ALREADY BINDING (from a prior, closed gate)
════════════════════════════════════════════════════════════════════════

  1. Atomic provisioning through ONE Postgres function. A failure returns
     non-2xx, never a success payload with warnings.
  2. Auth user creation happens FIRST, OUTSIDE the transaction. Forced by the
     FK chain above. The accepted orphan on failure is an auth user with no
     tenant — cheap to detect and clean. A sweep for that condition currently
     returns zero rows.
  3. A selection table, with catalog validation SERVER-SIDE. The wizard picker
     is not a security boundary.
  4. The backend rejects an empty selection for a service-based vertical even
     if the UI is bypassed.
  5. The canonical "publicly listed service" predicate is CONSUMED, not
     reimplemented.
  6. A tenant with zero services renders HTTP 200 everywhere — navigation,
     home tiles, sitemap, JSON-LD.

Additionally deferred into this work: the settings merge must happen DATABASE-
SIDE in a single statement. A prior session narrowed a lost-update race to a
single request and explicitly did NOT claim to have closed it; closing it needs
a DB function, which is what this session builds.

════════════════════════════════════════════════════════════════════════
4. QUESTIONS — where the conditions do not resolve against the real code
════════════════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────────────
QUESTION A — THERE ARE THREE EXTERNAL CALLS, NOT ONE
────────────────────────────────────────────────────────────────────────
Condition 2 names only auth. Verified, there are three:

  gotrue      before all DB writes. Condition 2 covers it.
  Zernio      BETWEEN Postgres writes. Creates a social-media profile for the
              tenant, then writes the returned id into settings.integrations.
              No idempotency key on the vendor's create endpoint.
  Outscraper  after the response body is built; fire-and-forget.

A Zernio failure or a retry leaves an orphaned vendor-side profile that nothing
in our database points at. The auth-orphan sweep cannot find it, because it is
not in our database at all.

Options considered:
  A1. Move the Zernio call after COMMIT. The tenant is complete and correct;
      settings.integrations.zernio_profile_id is filled by a second, small
      transaction. Failure leaves a tenant with no social profile, which is the
      current state of every existing tenant and is already handled downstream
      as "not configured".
  A2. Enqueue it. A durable queue row is written inside the transaction; a
      worker drains it. This pattern already exists in the system for outbound
      lead delivery. Costs a table and a cron.
  A3. Keep it inline before the transaction, alongside auth. Makes an orphaned
      vendor profile the price of any later failure, and adds an external
      dependency to the critical path of every provision.

We propose A1, with A2 recorded as the upgrade if the failure rate justifies it.
Is A1 acceptable, or does the un-retryable vendor call require a durable record
written inside the transaction (A2) to be defensible?

────────────────────────────────────────────────────────────────────────
QUESTION B — HALF THE SEED IS GATED ON A CRM FOREIGN KEY
────────────────────────────────────────────────────────────────────────
Steps 9a-9g run only `if (prospect_id)`. That block contains settings.seo, all
per-page SEO metadata, ALL service_areas rows, ai_authority_prompts, the starter
blog posts, and the four legal pages (terms, privacy, sms-terms, accessibility).

`prospects` is a sales CRM table. The next client to be provisioned has no
prospect row. Provisioning them today yields a tenant with an admin login and
page content, and with no sitemap-relevant SEO, no service areas and no legal
pages — silently, because every step in that block swallows its own error.

We propose the RPC take an explicit, fully-specified input payload and seed
unconditionally, with prospect-derived data as an OPTIONAL overlay rather than
the switch that decides whether the tenant is seeded at all.

Is there a reason to preserve the current coupling that we are not seeing? Our
concern is that decoupling widens the change beyond "make the existing writes
atomic" — we would be changing WHAT is written for a prospect-less tenant, not
only its failure semantics. Is that acceptable inside this change, or should it
be a separate one, accepting that a prospect-less tenant stays broken meanwhile?

────────────────────────────────────────────────────────────────────────
QUESTION C — CONDITIONS 1, 3 AND 5 ARE NOT JOINTLY SATISFIABLE AS WRITTEN
────────────────────────────────────────────────────────────────────────
The canonical predicate from condition 5 is a TypeScript module in the Next.js
application tree. It imports two further modules from that tree, and the service
catalogs themselves (12 pest slugs, 5 irrigation, 17 lawn) are TypeScript
objects in a third location. Postgres cannot import any of it.

So "the RPC validates the selection against the catalog" cannot simultaneously
happen in Postgres (condition 1) and consume the existing predicate (condition
5).

Constraints that bear on the fix:
  - A `shared/lib/` directory IS reachable from both the Next.js/Vite tree
    (extensionless imports) and from Deno edge functions (explicit .ts). This
    is established and in production: a merge helper was moved there for
    exactly this reason and the deployed bundle carries it verbatim.
  - The edge-function `_shared/` directory is NOT a good home: a CI workflow
    republishes sixteen edge functions whenever anything under it changes. A
    catalog edit should not redeploy sixteen functions.
  - A copy-plus-equality-test pattern ALREADY EXISTS for these slugs: the edge
    tree restates them and a test pins the two lists equal. It is a copy with a
    drift guard, not consumption.

Options:
  C1. Project the catalog into a Postgres table, generated from the TypeScript
      source, with a drift guard. Satisfies 1 and 3 literally. Creates a second
      copy of the catalog — which is the exact defect the predicate work just
      removed — and makes the guard permanently load-bearing.
  C2. Extract the slug/title sets to shared/lib. The Deno edge function
      validates the selection against the real catalog before calling the RPC;
      the RPC performs all writes atomically. The edge function is server-side
      and is the only caller (see Question D), so condition 3's stated intent —
      "the wizard picker is not a security boundary" — is met. The RPC still
      enforces structural invariants (non-empty for a service-based vertical,
      well-formed slugs, no duplicates) as defence in depth.
  C3. Status quo pattern: another copy in the edge tree with an equality test.

We propose C2. The objection we anticipate is that the RPC then trusts its
caller for catalog membership. Our answer is that the RPC is not reachable by
any other caller. Is that sufficient, or does condition 3 require the catalog to
be enforced in Postgres itself (C1) regardless of who can call the function?

────────────────────────────────────────────────────────────────────────
QUESTION D — EXECUTE GRANTS AND THE TRUST BOUNDARY
────────────────────────────────────────────────────────────────────────
We propose:

  CREATE FUNCTION public.provision_tenant_atomic(...) SECURITY DEFINER
    SET search_path = '';
  REVOKE ALL ON FUNCTION public.provision_tenant_atomic(...) FROM PUBLIC;
  REVOKE ALL ON FUNCTION public.provision_tenant_atomic(...) FROM anon, authenticated;
  GRANT EXECUTE ON FUNCTION public.provision_tenant_atomic(...) TO service_role;

matching the verified convention for admin_delete_tenant. A test asserts, against
the live catalog rather than migration text, that no anon / authenticated /
PUBLIC EXECUTE grant exists.

Two sub-questions:
  D1. Postgres grants EXECUTE to PUBLIC by default on function creation. Is an
      explicit REVOKE in the same migration sufficient, or should the guard also
      run as a periodic check, given that a later CREATE OR REPLACE does not
      reset grants but a DROP-and-recreate does?
  D2. SECURITY DEFINER with `SET search_path = ''` requires every object to be
      schema-qualified. Is there a reason to prefer SECURITY INVOKER here, given
      the caller is already service_role and therefore already bypasses RLS?

────────────────────────────────────────────────────────────────────────
QUESTION E — CONDITIONS 4 AND 6 TOGETHER
────────────────────────────────────────────────────────────────────────
Condition 4 requires the backend to reject an EMPTY selection for a
service-based vertical. Condition 6 requires a tenant with ZERO services to
render 200 on every surface.

These describe different moments — 4 governs provisioning input, 6 governs
rendering an existing tenant — but a reviewer could read them as contradictory.
Our reading: a tenant may not be CREATED with zero services, but a tenant may
COME TO HAVE zero services (every page deleted by an admin, or a vertical
changed), and that state must render rather than 500. No tenant is in that state
today, so condition 6 needs a constructed test rather than an observed one.

Is that reading correct? And is a constructed fixture adequate evidence for
condition 6, or is a real temporary tenant required?

────────────────────────────────────────────────────────────────────────
QUESTION F — THE DB-SIDE SETTINGS MERGE
────────────────────────────────────────────────────────────────────────
Eleven settings keys are seeded. Today each is read, merged in TypeScript, and
upserted — three round trips per key, and a lost-update window between the read
and the upsert.

We propose a single statement per key inside the transaction:

  INSERT INTO public.settings (tenant_id, key, value)
  VALUES ($1, $2, $3)
  ON CONFLICT (tenant_id, key)
  DO UPDATE SET value = public.settings.value || EXCLUDED.value

with the caveat that `||` is a SHALLOW jsonb merge and the existing TypeScript
helper additionally enforces two rules the operator relies on:
  (i)  an EMPTY overlay value must not overwrite a NON-EMPTY existing one
       (the seed writes `wizard.x || body.x || ''`, so blank fields arrive as
       '' on a re-provision and would otherwise blank real data). Note that 0
       and false are meaningful values here, not empty.
  (ii) business_info has grouped keys that are all-or-nothing under a CHECK
       constraint (a four-part address, a lat/lng pair, hours-requires-timezone).
       A partial group raises 23514 and fails the whole write.

So a bare `||` is NOT equivalent to the current behaviour. Should those two
rules be reimplemented in PL/pgSQL (one definition, in the transaction, but a
second copy of logic that already exists and is tested in TypeScript), or should
the merged value continue to be computed in TypeScript and passed in as a single
already-merged jsonb parameter (one definition, but the read is then outside the
transaction and the race is narrowed rather than closed)?

════════════════════════════════════════════════════════════════════════
5. WHAT WE ARE ASKING FOR
════════════════════════════════════════════════════════════════════════

A verdict of APPROVE / APPROVE WITH CONDITIONS / REJECT, with numbered
conditions, addressing A through F. Please flag explicitly:

  - any failure mode in the proposed ordering (auth outside, writes inside,
    Zernio after commit) that we have not named;
  - anything in the trigger set that behaves differently inside an explicit
    transaction than it does today across separate statements;
  - whether the partial-failure surface actually closes, or merely moves —
    specifically, what state the system is in if the transaction commits and
    the post-commit steps then fail;
  - any condition among the six that our proposal fails to meet, including one
    we believe we are meeting.

Assume we will implement exactly what is approved and nothing more.
```

---

## 2. Appendix A — PERPLEXITY verdict (VERBATIM)

*Pasted byte-exact. Not reformatted, re-wrapped, or heading-normalised — the H1 below is the
verdict's own. Attribution: **3 external links** (postgresql.org ×2, supabase.com ×1).*

# APPROVE WITH CONDITIONS
The core architecture is sound **only if** provisioning is reduced to: auth creation first, one database RPC that either commits all tenant state or none, and all non-transactional integrations moved out of the critical path. Your proposed A1, B, C2, D, E interpretation, and a database-side merge in F are directionally correct—but several conditions must be binding before implementation.
## Numbered conditions
1. **Use auth-first, then exactly one atomic database RPC; make no external network call inside the DB transaction or provisioning critical path.**  
   The required order should be:
   1. Edge function authenticates the operator request.
   2. Edge function creates the GoTrue user.
   3. Edge function calls `public.provision_tenant_atomic(...)` once.
   4. The RPC validates inputs and performs every durable application-data write.
   5. The RPC returns success only after the enclosing statement/transaction commits.
   6. Only then may the edge function initiate Zernio and Outscraper work.
   If GoTrue succeeds and the RPC fails, return a non-2xx response with a stable machine-readable error code and the created `auth_user_id`. That is an intentional compensable orphan—not a successful provision. The retry protocol must either:
   - reuse that known `auth_user_id`, or
   - detect and reuse a safe-to-reuse unbound auth account by immutable identity such as normalized email.
   It must not blindly call GoTrue `createUser` again and turn an application-data failure into an “email already exists” dead end.
2. **Approve A1 for Zernio, provided “Zernio unavailable” is explicitly modeled as a successful provision with a pending/incomplete integration state—not as a hidden post-commit failure.**  
   A durable queue/outbox (A2) is stronger and will eventually be preferable if automatic provisioning volume, reliability expectations, or retries increase. But it is not required for this gate at your current concierge scale, because the baseline state—tenant exists with Zernio unconfigured—is already valid and downstream-supported.
   However, A1 needs these protections:
   - The tenant RPC must never write a fake or speculative Zernio profile ID.
   - The post-commit Zernio routine must update `settings.integrations` only after receiving and validating the vendor profile identifier.
   - A Zernio failure must yield an operationally visible result: structured log, alert/error record, or operator-visible “Zernio pending/failed” status tied to the tenant. A log line alone is not enough if it is not monitored.
   - The operator must have an explicit, safe retry action for Zernio setup.
   - The retry flow must establish whether Zernio can look up a profile by a stable tenant/external reference before issuing another create. If Zernio has no retrieve/search endpoint and no idempotency key, A1 necessarily retains a vendor-side duplicate risk after timeout/ambiguous-response failures. That risk is acceptable only if it is documented as a compensable vendor operation and the operational workflow can identify and retire duplicates.
   - Do not place the Zernio call “after the response body is built” in a best-effort background continuation. Serverless/edge runtimes can stop work after sending the response. Either await the post-commit attempt and return a successful provisioning result that explicitly says `zernio: pending|failed`, or persist an outbox/job record and process it asynchronously.
   The state after a committed tenant transaction and failed Zernio call is therefore: **a fully provisioned, internally consistent tenant with `integrations.zernio_profile_id` absent and integration status pending/failed.** That is not a partial tenant build and does satisfy Condition 1, but only if it is observable and retryable.
3. **Move Outscraper out of the response-tail fire-and-forget path, and treat it as an independent post-provision side effect.**  
   It must not affect the success of provisioning, and it must not be relied on to run after an HTTP response has been sent. The minimum acceptable implementation is an awaited, bounded post-commit dispatch whose failure is recorded against the tenant and can be retried manually. A transactional outbox is preferable if the lead/SEO enrichment is important enough to promise eventual execution.
   Outscraper failure after commit leaves a complete tenant with enrichment/outbound scraping unstarted or unknown. That is acceptable only when:
   - no core page, dashboard, or onboarding flow assumes the result exists;
   - its status is visible to the operator; and
   - a retry does not corrupt or duplicate critical application data.
   There is no distributed transaction spanning Postgres, GoTrue, Zernio, or Outscraper. The correct target is not impossible global atomicity; it is strict atomicity for your internal database state plus explicit compensating/retry semantics for every external action.
4. **Decouple baseline tenant seeding from `prospect_id`; implement Question B in this change.**  
   Do not preserve the current CRM foreign-key coupling. It is not merely a product-policy difference; it is an existing correctness defect that causes a prospect-less tenant to be provisioned in an incomplete state while reporting success.
   The RPC input must make baseline seed data explicit and tenant provisioning must seed, unconditionally:
   - required `settings`, including baseline SEO;
   - vertical-derived `page_content`;
   - selected `service_areas`;
   - applicable authority prompts;
   - starter content where that is product policy;
   - legal pages;
   - all data required for a coherent public site and admin experience.
   `prospect_id` may be accepted as an optional relation and source of **overlay** data. It must not decide whether mandatory tenant state is created. The prospect stage update and its `prospect_stage_change_log` trigger belong in the transaction when `prospect_id` is supplied and valid.
   This broadens the write set, but it does not broaden the atomicity goal improperly. It makes the actual contractual provisioning result coherent for both CRM-originated and non-CRM-originated clients. Shipping atomicity while preserving a known deterministic path to a functionally incomplete tenant would not satisfy the intent of the closed gate.
5. **Use C2 only if the RPC’s exposure is actually limited to the edge-function trust boundary and the catalog check remains server-side; otherwise use C1.**  
   C2 is acceptable in this deployment model, but condition 3 should be restated precisely:
   > Catalog membership is validated server-side by the sole authorized caller using the canonical shared catalog; the database RPC validates structural invariants and is executable only by `service_role`.
   That meets the real security objective: a browser cannot manufacture arbitrary service slugs by bypassing the picker. Moving the shared catalog into `shared/lib/` is preferable to another edge-local copy, because it lets the Next.js app and the Deno function consume the same source artifact rather than pinning two copies through a drift test.
   C2 is approved only if all of the following are true:
   - `shared/lib/` becomes the sole canonical home of catalog data and the public-listing predicate inputs needed by both application and provisioning code.
   - The edge function imports the actual shared catalog and validates membership itself; it does not accept a frontend “validated” flag or trust client-provided service metadata.
   - The RPC takes a normalized selection payload and independently rejects malformed slugs, duplicate slugs, unsupported verticals, selections inconsistent with the declared vertical, and empty selection for service-based verticals.
   - `provision_tenant_atomic` has no `anon`, `authenticated`, or `PUBLIC` execution path, including indirect exposed wrappers.
   - No other service-role-capable routine can call this RPC with arbitrary user-controlled payloads without performing the same catalog validation.
   If the last point cannot be demonstrated, C1 becomes required. “Only the edge function calls it” must be enforced by grants and actual deployment architecture, not merely intended by convention.
6. **Do not claim that C2 satisfies a literal reading of Condition 3 unless the condition is amended.**  
   As currently worded—“A selection table, with catalog validation SERVER-SIDE”—C2 may satisfy the server-side validation intent, but it does **not** use a selection table unless you create one. Also, C2 does not make Postgres the catalog authority.
   Resolve this explicitly in the implementation specification in one of two ways:
   - **Preferred:** revise the condition to require a canonical shared catalog plus server-side validation at the sole privileged edge caller, with database structural validation and privileged RPC grants; or
   - Create a transactional `tenant_services` / selected-services relation as the actual selection table and define its role clearly. If service selections presently exist only as a JSON blob or implicit page seeds, add this table only if it is already part of your intended domain model—not merely to satisfy wording.
   Do not create a catalog projection table merely as a second authoritative copy without a compelling database-native use case. That would reintroduce the drift problem condition 5 was designed to eliminate.
7. **Reject empty selected services for service-based verticals at both server validation and RPC validation; separately make zero-service rendering total and non-throwing.**  
   Your interpretation of Conditions 4 and 6 is correct. They govern different state transitions:
   - **Creation invariant:** a service-based tenant cannot be provisioned with an empty service selection.
   - **Rendering resilience:** any existing tenant state, including one that later has zero active/publicly listed services, must return HTTP 200 on every required public surface.
   The implementation must define the rendering behavior, not only suppress an exception:
   - Navigation omits or safely degrades service links.
   - Home-page service tiles render an empty state or omit the section.
   - Sitemap emits no service URLs but remains valid.
   - JSON-LD omits service-specific entities/properties that require a service rather than emitting invalid empty values.
   - Service-list and service-detail routes do not crash because an expected first service is absent.
   - ISR/cache behavior must not preserve a prior service list in a way that causes broken links after deletion.
   A constructed test fixture is adequate evidence. A real temporary production tenant is not required and is a worse validation mechanism because it can contaminate operational data and caches. The fixture should exercise the same rendering/data-fetching path as production, including the ISR route handlers or equivalent integration tests—not merely a component snapshot with mocked arrays.
8. **Implement the settings merge inside the database transaction; do not precompute a merged JSON document in TypeScript.**  
   Passing a pre-merged JSON parameter would preserve the read-before-write race. It narrows neither the race sufficiently nor fulfills the explicit deferred requirement to close it at the database layer. A bare shallow `jsonb ||` merge is also not acceptable because it violates the current non-empty overwrite semantics and may violate grouped-field invariants.
   Use one database-owned merge implementation, preferably a helper such as `public.merge_setting_value(existing jsonb, incoming jsonb, setting_key text) returns jsonb`, called from the `INSERT ... ON CONFLICT ... DO UPDATE` expression. Its behavior must be specified and tested for:
   - A missing incoming property does not erase an existing property.
   - JSON `null`, `''`, and any other declared “empty overlay” values do not overwrite a non-empty existing value.
   - `false` and `0` remain valid overwrite values and are never treated as empty.
   - Nested-object behavior is explicit per settings key: either shallow replacement, recursive merge, or field-specific policy. Do not accidentally change semantic behavior by using a generic operator.
   - Arrays have explicit behavior—normally replace-whole-array unless existing product semantics say otherwise.
   - `business_info` groups are evaluated as groups before the final row write, so an otherwise-invalid partial four-field address, latitude/longitude pair, or time-without-timezone does not reach the table.
   - Constraint failures such as SQLSTATE `23514` propagate out of the RPC and abort the entire transaction.
   - The secret-stripping trigger remains authoritative: callers cannot use this merge helper to persist any of the four Vault secret keys.
   A PL/pgSQL helper is not an undesirable “second copy” in the same sense as C1/C3 catalog duplication. It is the required authoritative write-side concurrency rule. The TypeScript helper can remain as UI/preflight behavior, but it must not be presented as the authoritative persistence implementation. Test both implementations against the same fixture corpus until the TypeScript path no longer performs persistence merges.
9. **Make the RPC transaction behavior explicit and preserve error propagation.**  
   An RPC invoked as one SQL statement normally executes atomically with its caller’s transaction context; a `ROLLBACK` discards updates made in that transaction. Do not attempt `COMMIT` or `ROLLBACK` inside a PL/pgSQL function. Let unhandled exceptions escape so Postgres aborts the statement/transaction. [postgresql](https://www.postgresql.org/docs/current/sql-rollback.html)
   In particular:
   - Do not wrap individual writes in `EXCEPTION WHEN OTHERS THEN log-and-continue` blocks.
   - If you must catch a narrow, expected exception to annotate it, re-raise after preserving an appropriate SQLSTATE/message.
   - The edge function must map any database/RPC error to non-2xx and must never return `{ success: true }` in the presence of a failed required write.
   - Validate all required inputs before writing where practical. Database constraints remain the final authority.
   - Ensure the client call uses a single RPC invocation rather than reconstructing “atomic” behavior from separate REST writes.
10. **Account for trigger behavior as part of the transaction contract.**  
    The listed triggers are compatible with atomic execution, but their practical behavior changes in ways you must test:
    - `trg_strip_settings_secrets` runs per `settings` row before insert/update. If it inserts an observation row in the same database transaction, that observation rolls back together with the provisioning transaction on later failure. That is normally desirable for internal consistency, but it means it cannot be your durable audit evidence of rejected/rolled-back secret-write attempts. If such evidence is security-required, it needs an intentionally independent audit path.
    - `settings_bump_updated_at` and `page_content_bump_updated_at` run for every conflict-update during the seed. That is expected, but it means re-provisioning mutates timestamps even where the logical merge preserves values. Decide whether that is acceptable and test it.
    - `trg_enforce_location_cap` can raise mid-seed. In the proposed RPC it correctly aborts the full tenant transaction; it will no longer leave earlier `service_areas`, settings, or page rows behind. This is a principal benefit of the redesign.
    - `prospect_stage_change_log` runs after the `prospects` update but inside the same transaction. If a later statement fails, both the prospect stage change and its log record roll back. This is correct for transactional consistency, but it differs from the current multi-round-trip behavior where a previously committed prospect update can survive a subsequent failure.
    Test a failure injected at each trigger-bearing write position, not only a happy path and one late-stage failure.
11. **Use the proposed restrictive grants and retain `SECURITY DEFINER`, but harden deployment-time verification.**  
    `SECURITY DEFINER` is justified because this is a privileged, narrowly exposed provisioning capability and because you want its database permissions to be independent of the invoking API role. `SECURITY INVOKER` is not inherently wrong when the caller is `service_role`, but it makes the privilege model depend on the broad service role and provides no meaningful safety improvement here. With a fixed empty `search_path`, schema-qualified references, and restricted execute grants, `SECURITY DEFINER` provides a better-defined privilege boundary.
    Your grant plan is required:
    ```sql
    CREATE FUNCTION public.provision_tenant_atomic(...)
    SECURITY DEFINER
    SET search_path = '';
    REVOKE ALL ON FUNCTION public.provision_tenant_atomic(...) FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.provision_tenant_atomic(...) FROM anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.provision_tenant_atomic(...) TO service_role;
    ```
    PostgreSQL grants `EXECUTE` to `PUBLIC` by default for newly created functions, and both PostgreSQL and Supabase documentation recommend explicitly revoking it before selectively granting access. `SECURITY DEFINER` routines should set a safe search path; an empty path requires schema qualification of every referenced relation and function. [postgresql](https://www.postgresql.org/docs/current/sql-createfunction.html)
    D1: the explicit revoke in the same migration is sufficient for that exact create/replace operation **if the migration is atomic and no client can invoke the transient function between statements**. But it is not sufficient as the only long-term control because a future drop-and-recreate can restore default `PUBLIC` execution. Require:
    - a live-catalog privilege test in CI and deployment verification, as proposed;
    - a migration/lint rule requiring restrictive function grants for privileged routines;
    - preferably `ALTER DEFAULT PRIVILEGES ... REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC` for the owning migration role/schema, followed by explicit grants per routine. Supabase documents this default-privilege pattern. [supabase](https://supabase.com/docs/guides/database/functions)
    A periodic production check is recommended but not a substitute for deploy-time enforcement. It can be low-frequency and alert-only; it need not block this implementation if CI and deployment verification are binding.
12. **Define idempotency and retry behavior for the internal RPC before rollout.**  
    Atomicity prevents partial commits; it does not make retries safe by itself. The internal RPC needs a deterministic idempotency model.
    At minimum:
    - A retry for the same intended tenant must resolve to the same tenant identity rather than accidentally updating a tenant found only by a reused slug.
    - If `tenant_id` is accepted, it must be validated against the expected immutable identity and caller intent. Do not let a provisioning request mutate an unrelated tenant just because its UUID is supplied.
    - If provisioning by slug is allowed, normalize it once and make collision semantics explicit: conflict/error, idempotent match, or controlled re-provision. Never silently overwrite an existing tenant with divergent source payload.
    - The RPC should return the durable tenant ID and a provision state/version sufficient for the caller to decide whether post-commit setup may run.
    - Re-provisioning must not create duplicate `service_areas`, prompts, posts, or tenant-user rows; existing unique constraints help, but behavior for removed catalog items/content must be explicitly defined as preserve, reconcile, or reject.
    - The auth user must be created before the transaction as required, but any auth-user rollback cleanup must be a separate best-effort compensating action and must never mask the original RPC failure.
## Answers A–F
| Question | Verdict | Required interpretation |
|---|---|---|
| A — Zernio | A1 approved conditionally | Post-commit Zernio is acceptable because its absence is a valid supported tenant state. Make failure visible, retryable, and protected against ambiguous-response duplicates. Do not fire-and-forget after response completion. |
| B — Prospect coupling | Decouple now | Baseline tenant seed must be unconditional. Prospect data is an optional overlay plus optional CRM-stage update, not a prerequisite for legal, SEO, service-area, prompt, or baseline page state. |
| C — Catalog/predicate | C2 approved with an amendment | Put canonical catalog source in `shared/lib/`; validate server-side in the privileged edge function; make RPC enforce structural invariants and restrict it to service role. Amend condition 3 if it literally requires DB catalog membership/table validation. |
| D — Grants/security | Proposed design approved | Keep `SECURITY DEFINER`, `SET search_path = ''`, qualified object names, explicit revokes, service-role-only grant, and live-catalog test. Add default privilege hardening and deploy-time enforcement. |
| E — Empty vs zero services | Your reading is correct | Reject zero selections at creation for service-based verticals; render any later zero-service tenant with 200. A constructed integration fixture is adequate. |
| F — Merge | DB helper required | Do not use bare `jsonb ||`; do not premerge in TypeScript. Implement the authoritative merge and group validation in database-side code under the transaction. |
## Residual failure states
After these conditions, the partial-failure surface is substantially closed for the tenant’s durable Postgres state:
| Failure point | Required resulting state | HTTP result |
|---|---|---|
| GoTrue user creation fails | No tenant database writes; no auth user | Non-2xx |
| GoTrue succeeds, RPC fails | Auth-only orphan; no tenant/application rows from the failed attempt | Non-2xx |
| Any required DB statement or listed trigger fails | Entire RPC transaction rolls back, including all transactional trigger side effects | Non-2xx |
| RPC commits, Zernio fails | Complete tenant; Zernio ID absent; explicit failed/pending integration state | Provisioning success only if that state is returned/recorded visibly |
| RPC commits, Outscraper dispatch fails | Complete tenant; scrape/enrichment pending/failed and retryable | Provisioning success only if visibly recorded |
| Response transport fails after commit | Tenant may be committed though caller did not receive success; retry must be idempotent | Client sees failure/timeout; server state is safely recoverable |
The last row is important: no design can guarantee that an HTTP client receives the response after the database commits. Your retry contract—not transaction handling—must make that ambiguity safe.
## Gate assessment
Your proposal meets the prior conditions only after the adjustments above:
- **Condition 1:** Met once all mandatory database writes, including unconditional baseline seed and applicable prospect transition, occur within one error-propagating RPC transaction.
- **Condition 2:** Met if auth runs first and the orphan/retry workflow is implemented.
- **Condition 3:** Met in intent through C2, but the written condition needs clarification if “selection table” and database catalog enforcement are mandatory literal requirements.
- **Condition 4:** Met only if both edge validation and RPC validation reject empty selections for applicable verticals.
- **Condition 5:** Met only if the shared catalog/predicate source becomes truly canonical and the edge function consumes it rather than carrying another copied catalog.
- **Condition 6:** Met only with end-to-end/route-level zero-service fixtures covering navigation, home, sitemap, and JSON-LD.

---

## 3. Appendix B — GEMINI verdict (VERBATIM)

*Pasted byte-exact. Not reformatted or re-wrapped. Attribution: **zero external links**, as
expected for this model.*

VERDICT: APPROVE WITH CONDITIONS

The proposed architecture correctly addresses the severe defect in the legacy provisioning path (partial writes returning `200 OK`). Below are the explicit resolutions for Questions A through F, accompanied by binding engineering conditions.

Direct Resolving Answers to Questions A–F
Question A — External Call Failure Surface (Zernio)
Resolution: A2 is MANDATORY (Durable Queue inside Transaction).

Option A1 introduces a "silent partial success" state where the tenant database state commits, but the vendor integration fails post-commit. Because this leaves the system with non-atomic side effects, A1 violates the core principle of Gate Condition 1. Enqueueing an integration task inside the atomic Postgres transaction guarantees that if the transaction commits, the side effect is guaranteed to be attempted by an asynchronous worker with exponential backoff.

Question B — Sales CRM (`prospects`) Decoupling
Resolution: Decouple completely within this change.

Conditioning core tenant infrastructure (SEO, legal pages, service areas) on `prospect_id` is an architectural debt that causes broken tenants when provisioning non-prospect clients. The RPC input schema must explicitly accept base tenant seeding parameters. Prospect data must serve strictly as an optional input overlay. The scope expansion is necessary to ensure every provisioned tenant is structural and functional upon execution.

Question C — Catalog Validation & Predicate Sharing
Resolution: C2 is ACCEPTABLE, subject to strict DB-level structural invariant checks.

Moving catalog definitions to `shared/lib/` and performing strict catalog verification inside the Deno Edge function prior to database invocation satisfies Condition 3. Because the RPC is restricted to `service_role` (see Question D), the edge function serves as the trusted API boundary. However, the RPC must independently enforce structural bounds (e.g., array non-emptiness for service verticals, string format checks, and duplicate detection).

Question D — Permissions and Grants
Resolution: Strict RPC isolation model approved.

* D1 (Grants & Drift): A periodic CI guard or schema assertion test is required alongside the migration `REVOKE`. Schema migrations and reset scripts can re-grant standard schema permissions if standard Postgres defaults execute without explicit overrides.

* D2 (Security Model): `SECURITY DEFINER` with `SET search_path = ''` is the correct posture. Even though the primary caller is `service_role`, using `SECURITY DEFINER` locks the function's execution environment against search path hijacking attacks and enforces strict schema qualification (`public.table_name`).

Question E — Provisioning vs. Rendering Constraints
Resolution: Interpretation is correct.

Condition 4 governs the input payload boundary during tenant provisioning (rejecting initial zero-service creations for service-based verticals). Condition 6 governs the runtime application boundary (ensuring existing tenants rendered with zero active services do not trigger application exceptions/500s). For testing Condition 6, an isolated database-backed integration test (creating, stripping, rendering, and rolling back a fixture tenant) is sufficient and preferred over creating a permanent production fixture.

Question F — Database-Side Settings Merge Strategy
Resolution: Reimplement merge rules in PL/pgSQL.

Computing the merge in TypeScript before passing it into the database retains a race condition during concurrent operations. The merge semantics (preserving non-empty strings over empty overlays while respecting boolean `false` and integer `0`, along with validating composite objects) must be encapsulated in a pure PL/pgSQL utility function (e.g., `public.jsonb_deep_merge_non_empty(base jsonb, overlay jsonb)`) executed strictly inside the RPC transaction.

Binding Conditions for Implementation

1. Transactional Enqueueing for Outbound Integrations (A2):

   * The RPC must insert an integration payload row into an outbound jobs/queue table (`outbound_integration_queue`) within the main database transaction.

   * Post-commit, an edge function or cron worker must process this queue with exponential backoff retries for the Zernio integration.

2. Decoupled Base Provisioning Schema:

   * The PL/pgSQL function signature must accept a complete jsonb config object defining: settings, SEO metadata, base legal page inputs, and service selections.

   * The execution path for generating page content, legal pages, service areas, and default settings must run independently of whether `prospect_id` is present.

3. Database-Level Invariant Enforcement:

   * The RPC must raise an explicit exception (`RAISE EXCEPTION USING ERRCODE = '22023'`) if a service-based vertical is submitted with an empty service array, bypassing any caller logic.

4. Pure PL/pgSQL JSONB Merge Utility:

   * Implement a dedicated helper function in Postgres to perform the non-empty string overlay logic (`public.jsonb_merge_settings(existing jsonb, overlay jsonb)`).

   * All 11 setting key updates within the RPC must use this function in their `ON CONFLICT DO UPDATE SET value = public.jsonb_merge_settings(...)` clauses.

5. Trigger Isolation & Abort Handling:

   * The existing `trg_enforce_location_cap` trigger on `service_areas` must be tested to ensure that throwing a location cap exception correctly triggers a full rollback of the RPC transaction without leaving persistent state in any of the 10 target tables.

6. Revoke Assertions in CI:

   * An integration test targeting the database metadata (`information_schema.routine_privileges`) must run on every CI build to assert that `public.provision_tenant_atomic` grants `EXECUTE` strictly to `service_role`, and explicitly denies `anon`, `authenticated`, and `PUBLIC`.

---

### Attribution check — RAN, **PASSED**

The S309 round-1 discriminator (Perplexity output carries inline source citations; Gemini output
carries none) was **executed against both texts before either was written into this file.**

| condition | required | observed | |
|---|---|---|---|
| **Appendix A** | ≥ 1 external markdown link | **3** — `postgresql.org` ×2, `supabase.com` ×1 | ✅ |
| **Appendix B** | zero external markdown links | **0** | ✅ |
| **A ≠ B** | not byte-identical | sha256 `e6f4273e…` vs `6f8ba842…` | ✅ |

The links found in A, in order of appearance:

- `[postgresql](https://www.postgresql.org/docs/current/sql-rollback.html)`
- `[postgresql](https://www.postgresql.org/docs/current/sql-createfunction.html)`
- `[supabase](https://supabase.com/docs/guides/database/functions)`

**The check is not vacuous.** Four mutations were run, and every one of them **failed** the check,
as it must:

| mutation | result |
|---|---|
| **M1** — strip the citations from A | ❌ fails (A link count → 0) |
| **M2** — inject one citation into B | ❌ fails (B link count → 1) |
| **M3** — **the same document pasted twice** | ❌ fails (byte-identity **and** B link count) |
| **M4** — the two swapped | ❌ fails (both link conditions) |

M3 is the live failure mode this check exists for: an earlier attempt at this gate returned the
same document twice. Byte-identity catches it independently of the citation counts, so a duplicate
is detected even if both copies were the *citation-free* one.

Those digests are sha256 of each appendix **exactly as embedded below** (23788 and 5822
characters, trailing newline stripped), so they are reproducible from this file.

Only external markdown links of the form `[text](http…)` count. Inline code, bare URLs, and
reference-style text do not, so a code sample mentioning a URL cannot forge a citation.

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

**All three verbatim slots are now filled, byte-exact.** Each was checked programmatically after
writing: present exactly once, byte-identical to the supplied text, with a mutation test
confirming the comparison is not vacuous. Digests of the embedded text: submission
`a8c1a3e0…`, Appendix A `e6f4273e…`, Appendix B `6f8ba842…`. Nothing in this record is
reconstructed, summarised or re-wrapped.
