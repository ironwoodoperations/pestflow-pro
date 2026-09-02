# PestFlow Pro — Session Handoff S320 (SHIPPED)

**Date:** 2026-09-02
**Arc:** S309 → S320. All merged, all deployed or applied, all verified live.
**Final PR:** [#324](https://github.com/ironwoodoperations/pestflow-pro/pull/324) — merged `e61fabf`
**Gate:** S309, S313 and S320 were validator-gated. S320 round 1: both APPROVE WITH CONDITIONS.

---

## What shipped

| session | change | state |
|---|---|---|
| **S309** | `invite-team-member` + `list_tenant_members` resolve the acting tenant from `tenant_users`, not `profiles` | merged `a4b01d3`, applied, deployed v5, **verified live** |
| **S310** | docs corrections + the `artificial-turf` content-map entry | merged |
| **S311** | deterministic `modern-pro` review selection + per-tenant nav logo height | merged `d879f3c` |
| **S313** | `password-reset-request` made observable | deployed **v7**, **verified by real email delivery** |
| **S317** | `PLATFORM_NAME` reached the edge functions; pest branding left client emails | merged `f044ce1` |
| **S319** | HOTFIX — three functions referenced `PLATFORM_NAME` without importing it | merged `daf6e45`, deployed |
| **S318** | custom-domain → tenant resolution in the Edge middleware | merged `c8c3506` |
| **S320** | storage RLS — published credential removed, buckets gated on `tenant_users`, `operators` ACL closed | merged `e61fabf`, **applied via MCP, verified live** |

### S309 — the caller names the tenant, `tenant_users` still authorizes it

Both consumers derived the caller's acting tenant from `profiles.tenant_id` — the table S273
retired as membership truth and S308 replaced as the RLS membership source. Neither moved.

**`profiles.tenant_id` was never the authorization step.** It supplied a *candidate*;
`get_my_tenant_role(...) = 'admin'` against `tenant_users` is what authorizes. The fix changed
where the candidate comes from and left the authorization test **byte-unchanged**.

**The split that hid it:** `provision-tenant` writes a `profiles` row, so *provisioned* admins
worked. `invite-team-member` writes only `tenant_users` — so **every invited admin was broken
and could not invite anyone**, and the UI said only "Invitation failed."

Shipped with a required `tenant_id`, the zero-arg overload dropped, `RAISE` on NULL, and a
deterministic `ORDER BY`. **Two validator rounds — REJECT, then APPROVE WITH CONDITIONS.**
Verified: Dathan, who has **zero `profiles` rows**, resolves `admin` and sees 2 members.

### S313 — a function that could not report its own failure

`password-reset-request` had three empty catch blocks and a `runDetached` doing
`p.catch(() => {})`. Tenant-not-found, `generateLink` failure and a Resend rejection were
indistinguishable from success **to us as well as to the caller**, with zero `function_logs`
entries. Nobody could answer whether "Forgot password?" worked at all.

**The conflation that caused it:** anti-enumeration requires the **response** to be uniform. It
does not require the **server** to be blind. Every branch now logs a distinct reason code and
**nothing about the response changed** — same bytes, same branches, same `MIN_RESPONSE_MS`
floor. The hard constraint holds: the email address, the `token_hash` and the constructed link
are **never** logged; they are bearer credentials.

### S319 — a live production outage, and how it got past everything

`notify-new-lead` v66 threw `ReferenceError` on **every lead carrying a visitor email**,
returned 500, and lost the customer acknowledgement, the owner notification **and** the owner
SMS.

The mechanism is worth keeping: **a template literal does not short-circuit.**
`` `Powered by ${PLATFORM_NAME}` `` evaluates unconditionally — unlike
`businessName || PLATFORM_NAME`, which is why the sibling line survived — and it sat **before**
the try/catch, so nothing caught it.

**No leads were lost. The table was empty for the entire window** — and that is timing at
~1–2 leads/day, not resilience. It is recorded that way on purpose.

It reached production because **CI was green over an undefined identifier**: the guard meant to
prove the import existed was `toContain('platformBrand')`, and it matched a **comment** — one
the import-adding script had itself inserted. See Working Rule 2.

### S320 — storage RLS

Three `logos` policies carried `OR (auth.uid() = '5181b30a-…'::uuid)`. That UUID is
`admin@pestflowpro.com`, whose password is **published on the marketing homepage**. S308 deleted
its `operators` row as a security fix and **missed these**, so it kept INSERT, UPDATE and
**DELETE** on every tenant's logo, Dang's included.

Nine further policies gated on `current_tenant_id()`, which reads `profiles`. The three `logos`
policies carried **both** faults — fixing only the UUID would have left uploads broken for the
same no-`profiles`-row admins.

**Replacing the literal with `is_operator()` is a NARROWING, not a substitution in kind.** The
principal changes, and that is the point: a shared account with a published password, revocable
only by editing three policy expressions → one named identity, revocable by deleting one row.

---

## Verified live state — S320 after apply (do not re-derive)

| check | result |
|---|---|
| `storage.objects` policies | **14 total — unchanged**, not merely "zero bad ones" |
| policy expressions naming the published UUID | **0** |
| policy expressions calling `current_tenant_id()` | **0** |
| policies gated on `tenant_users` | **13** |
| `public.operators` ACL for `authenticated` | `arwdDxtm` → **`rtm`** |
| malformed keys — `garbage/file.png`, root-level `logo.png`, traversal, empty | **all DENY, no exception raised** |
| Dathan (0 `profiles` rows) on pls | can now **upload AND delete** |
| `admin@pestflowpro.com` | **no operator status, no cross-tenant write anywhere** |

**"14 total, unchanged" is the assertion that matters.** "Zero policies contain the UUID" and
"zero call `current_tenant_id()`" both pass equally **if the policies were simply dropped**. The
count is what distinguishes a fix from a deletion.

**The malformed-key row is the predicate-shape decision proven.** `is_tenant_member()` takes
`uuid`, so calling it needs `(storage.foldername(name))[1]::uuid` — a cast on an untrusted
object key that **raises** rather than denies, erroring an entire listing query. The inline
`EXISTS` casts `uuid → text` and cannot raise. Both validators independently made this the
deciding factor. Four malformed shapes now deny cleanly, with no exception.

### The one thing the validators disagreed on

`DELETE`. **Gemini: BLOCKING, split it to admin-only** — storage DELETE is destructive and
unversioned; a purged asset is gone and any public page referencing it breaks. **Perplexity:
explicitly do NOT split** — a manager who may edit a page but not remove its image has an
incoherent privilege boundary, and recoverability should come from versioning or an audit trail.

**Conservative won.** Final shape: `INSERT`/`UPDATE` take `admin`+`manager`, **`DELETE` is
`admin`-only** (plus `is_operator()` on logos), `SELECT` takes any membership.

It cost nothing — **zero `manager` rows exist**, so both choices granted the identical set on the
day. Perplexity's remedy is the better long-run answer and does not exist in this system yet.
**Revisit it together with that remedy, not on its own.** Verification check **2i** is the
arbitration made executable: re-widening DELETE to manager fails there rather than shipping
silently.

---

## Corrections made this session

- **Self-review before the gate found 2 blocking + 4 non-blocking in my own migration.** Writes
  had been narrowed to `admin` only — but the pre-S320 policies had **no role test at all**, so
  that was a narrowing nobody asked for, bundled into a fix, and invisible because no managers
  exist.
- **Retracted "the helper is strictly more robust."** The `::uuid` cast inverts it — see above.
- **Corrected the claim that SELECT policies gate public-bucket reads.** They do not; Supabase
  serves `/object/public/…` without evaluating RLS. Any-membership reads are an admin-UI access
  decision, **not** a privacy one.
- **The `operators` ACL finding was not in the brief** — it came from Perplexity's blocking
  condition and was verified against the catalog rather than taken on trust. Two refinements
  followed from reading it: the gap was on `authenticated` alone (`anon` never had a write verb,
  so that REVOKE is a documented no-op kept as a tripwire), and `authenticated` retains
  `t`/`m`, reported not fixed.
- **Two attribution descriptors did not survive measurement** and were corrected rather than
  repeated: Gemini's sections are plain `(a)`…`(f)` lines, not `####` headings; Perplexity
  carries **8** supabase citations, not 3 — three are its renderer having consumed `[1]` array
  subscripts inside SQL blocks. Recorded as delivered, deliberately not tidied.

---

## Open / pending (carried to next)

### ⚠️ DECIDE BEFORE GRANDVIEW AND JW CUSTOMS — operator access to client dashboards

Full item in `docs/ROADMAP.md` under **Next Up**. The short version: the proposal was a single
shared account with **one password reused on every site**, and that is the exact shape of
`admin@pestflowpro.com` — which this session spent **two migrations** removing. One leak exposes
every client, with no way to tell which site it leaked from and no way to revoke without locking
Scott out everywhere; it is indistinguishable from a client in the audit trail; and a client can
see it in their Users tab and click "Resend invite" on it.

`operators` + `is_operator()` is the right mechanism and already exists — it lacks **reach**
(logos bucket only, not the other buckets, not the admin surfaces). **The decision:**
`operators`/`is_operator()`, or a `tenant_users` row per tenant — and if the latter, **per-tenant
passwords in 1Password, never one shared secret.** Validator gate when specced.

### pls cutover
- **Pre-flight before touching Webnode DNS:** confirm the Vercel **production** build log for
  `e61fabf` shows `generate-domain-map` wrote **2 entries, not `{}`**.
- **A Host-header probe does NOT test this, verified 2026-09-02.** `curl -H "Host:
  precisionlawnsystems.com" pestflow-pro.vercel.app` never reaches our middleware — it resolves
  on real DNS and returns **Webnode's** 404 ("404 - Page not found :: Precisionlawnsystems").
  Recorded so nobody repeats the probe and misreads it as our routing failing.
- **Re-confirm the apex/`www` direction after cutover** — one direction only, and
  `tenants.custom_domain` holds whichever host is canonical.

### From the S320 gate — recorded, deliberately not implemented
Canonical object-key validation client-side; operator-bypass audit logging; whether
`tenant-assets`/`videos` should be private buckets; cross-tenant copy/move bounds; the residual
`TRIGGER`/`MAINTAIN` grant on `operators`; a TEXT-taking `is_tenant_member()` overload. All in
ROADMAP with the reasoning intact.

### Still open, and it is the root cause of S319
**`supabase/functions/` has zero static analysis.** `tsconfig.json` excludes `"supabase"`;
eslint ignores `supabase/functions`. Nothing type-checks or lints any edge function.

### One observation, not a re-report
`password-reset-request`'s `send_failed` detail is `sendEmail`'s thrown message, which is
`Resend failed: ${await res.text()}` — an **upstream provider body**. If Resend ever echoes the
recipient in a validation error, that path writes the address to logs: the one remaining route
to S313's hard constraint. `e.message` in thrown-exception catches was accepted, so it is left
alone; bounding it to a fixed internal string is a one-line change.

### Not verified this session
`invite-team-member` — third in the deploy order.

---

## The five rules this arc earned

Written into `docs/ROADMAP.md` as rules rather than incidents, because the incidents will be
forgotten and the rules should not be.

1. **Verify the artifact, not the status.** Five times the indicator disagreed with reality: CI
   green over an undefined identifier; ten successful deploys, one missing an import;
   `REVOKE … FROM PUBLIC` that did not remove a role-specific `anon` grant; a connector showing
   Connected whose tools were never loaded; and a Host-header probe that measured the wrong
   server entirely.
2. **A guard that checks the wrong thing is worse than no guard.** It converts "untested" into
   "tested" in every reader's head.
3. **Build-time artifacts are not live on write.** Rows do nothing until a production build runs.
   The redirect feature was silently dead for months because the query failed, the script emitted
   `{}`, and **exited 0**.
4. **`supabase/functions/` has zero static analysis.** Still open.
5. **Resolve tenants by slug in a join, never a hand-typed UUID. Always `RETURNING`, always read
   it.** A typed UUID is a silent no-op when wrong.
