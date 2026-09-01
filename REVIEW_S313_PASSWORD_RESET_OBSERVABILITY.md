# S313 — password-reset-request observability. Validator gate submission.

**Status: GATE RUN. Both models APPROVE WITH CONDITIONS. All conditions resolved.**

⚠️ **The verdict TEXTS have not been pasted.** The conditions and the identification
criteria were relayed in summary form; the raw output was not included. Appendices A and B
stay placeholders rather than be reconstructed from that summary — the S309 precedent,
where the round-2 slots stayed empty across two turns for exactly this reason. A
reconstruction is indistinguishable from a transcript to a later reader, which is the
entire value of a slot labelled VERBATIM.

---

## Scope, stated plainly

**This change adds logging. It changes nothing else.**

| | |
|---|---|
| Response bytes | **unchanged** — `200 {"status":"ok"}` on every path, as before |
| Control flow | **unchanged** — no new early return, no branch reordered, no condition altered |
| Timing | **unchanged** — the 700 ms `MIN_RESPONSE_MS` floor is untouched |
| `slugFromRequest` | **unchanged** — still returns `null` on the apex (see the reported defect) |
| `verify_jwt` | **stays FALSE** — public unauthenticated endpoint by design |

The added `else` arms contain a `console.*` call and an assignment to a local `outcome`
string, and nothing else. No arm returns, throws, or changes what the caller receives.

## Why it was needed

Verified against deployed **v4** on 2026-09-01. The function was structurally incapable
of reporting a failure:

- three nested `try`/`catch` with **empty handlers**;
- the Resend send went through `runDetached()`, which did `p.catch(() => {})`;
- every path returned `200 {status:'ok'}` after the artificial floor.

Tenant-not-found, `generateLink` error and Resend rejection were indistinguishable from
success **to the operator as well as to the caller**. There were zero `function_logs`
entries, so nobody could answer whether "Forgot password?" worked.

**The conflation that caused it:** anti-enumeration requires the **response** to be
uniform. It does not require the **server** to be blind. The uniform response is correct
and is preserved exactly.

## What is logged

Prefix `[password-reset-request]`, one `rid` per invocation, one `outcome` line always.

| reason code | branch |
|---|---|
| `no_slug` | `slugFromRequest` returned null — apex, custom domain, or no Origin/Referer |
| `tenant_not_found` | slug parsed but names no `tenants` row |
| `invalid_email` | address failed the shape check |
| `generate_link_failed` | `generateLink` returned an error — includes `status` and `message`. The ordinary nonexistent-email case lands here; logged at **warn**, since it is expected |
| `generate_link_threw` | `generateLink` threw |
| `no_hashed_token` | succeeded but `properties.hashed_token` absent |
| `send_failed` | Resend rejected — logged from `runDetached`, which previously discarded it |
| `send_dispatched` | the attempt was handed off. Delivery is not knowable here |
| `bad_method` / `unhandled` | non-POST; outer catch |

`invoked` is logged unconditionally so an **absence** of logs is unambiguous: it means the
function was never called, not that it ran quietly. `outcome` initialises to `'unset'`, so
a fall-through cannot read as success.

## What is NEVER logged — the hard constraint

- **the email address in full** — only a truncated SHA-256 tag;
- **`hashed_token`** — a bearer credential; anyone reading it can take over the account;
- **the constructed recovery link** — same;
- the request body, or `JSON.stringify` of anything.

Asserted mechanically, not by review: `passwordResetLogging.test.ts` scans every
`console.*` call for `${email}`, `${hashed}`, `${link}`, `token_hash=${`, `${body}` and
`JSON.stringify`, and fails on any hit.

**The email tag is a correlation key, not a privacy guarantee, and the code says so.**
Email addresses are low-entropy and enumerable, so anyone holding both log access and a
candidate list can confirm a guess by hashing it. Log access stays sensitive. What the tag
buys is that a casual reader does not see customer addresses and a leaked line is not
itself a mailing list.

## THE QUESTION WE MOST WANT ANSWERED

**Could any log line added here leak an enumeration signal through timing or volume?**

Our own reasoning, offered to be checked rather than trusted:

- **Timing.** Every synchronous `console.*` happens before `ok()`, which pads to a fixed
  700 ms from request start. `emailTag` is one SHA-256 over a short string. Both are
  microseconds inside a 700 ms floor. `send_failed` is logged *after* the response, in the
  detached path, so it cannot affect response timing at all.
- **Volume.** The number of log lines does differ by path — an existing address produces
  `invoked` + `send_dispatched` + `outcome`, a nonexistent one `invoked` +
  `generate_link_failed` + `outcome`. That difference is visible **only to someone who can
  read the logs**, who is already trusted. It is not observable to the caller.
- **Is that reasoning wrong anywhere?** Specifically: is there a path by which log volume
  or log-write latency becomes externally observable — back-pressure, rate limiting on the
  logging sink, worker CPU contention, or anything else — that we have not considered?

## Also reported, deliberately NOT fixed

**"Forgot password?" is structurally dead on the apex, and the button is rendered there.**
Confirmed, not inferred:

- `subdomainRouter.ts:39` maps `pestflowpro.ai` and `www.pestflowpro.ai` to the master
  tenant, so the admin login page renders on the apex.
- `App.tsx:78` routes `/admin/login` unconditionally.
- `Login.tsx:159` renders **Forgot password?** with no host or tenant gate.
- `slugFromRequest` returns `null` for `host === APP_BASE_DOMAIN`, so the function does
  nothing and still answers 200.

The user sees "check your email" and no email is ever sent. **It is a button that cannot
work.** After this change it at least logs `reason=no_slug`.

Two further dead hosts, found while confirming the above and worth folding into the same
ticket:

- **`www.pestflowpro.ai`** takes a *different* dead path. `slugFromRequest` sees a
  `.pestflowpro.ai` suffix and returns the left-most label `www`, which matches no tenant
  → `tenant_not_found`. Same outcome, different reason code.
- **Custom domains** return `null` → `no_slug`. Currently only `dang` has one set.

The client router and the edge function **disagree about what the apex is**: the router
treats it as a real tenant (`pestflow-pro`), the function treats it as no tenant. That
disagreement is the root of the defect, and fixing it is out of scope here.

## Verification

- 21 guard assertions in `passwordResetLogging.test.ts`, a source scan in this repo's
  existing idiom — the handler imports from `https://esm.sh`, which Node's ESM loader
  rejects, so it cannot execute under vitest. Named to avoid the `index.test.ts`
  exclusion the vitest config flags as the dangerous direction.
- **8 mutations, 8 caught**: leaking the email, leaking the token, restoring the
  swallowing catch, dropping the invocation log, defaulting `outcome` to `ok`, changing
  the response body, removing the timing floor, and returning an error field to the
  caller. A ninth attempt was a bad mutation on my part — a `/* comment */` inside the
  response, correctly ignored because structural assertions run against comment-stripped
  source.
- Full suite: `tsc` clean, eslint 0 errors, **1203 tests / 44 files**, build succeeds.

**Not covered:** that the logs actually appear at runtime. Only a live invocation shows
that, and it is step 4 of the deploy.

## Deploy

1. Merge → wait for Vercel **READY**.
2. Deploy the function with **`verify_jwt` explicitly FALSE** — it is public and
   unauthenticated by design, and the gateway toggle has silently reverted to ON before.
3. Re-read the deployed body to confirm what shipped. A version increment is not evidence.
4. Invoke once from a tenant subdomain and once from the apex, and confirm the two produce
   `send_dispatched` and `no_slug` respectively — that is the proof the whole change exists
   to obtain.

---

# Gate round 1 — APPROVE WITH CONDITIONS from both. Conditions resolved.

## BLOCKING 1 (both models) — sanitize `generate_link_failed`. **DONE.**

**This condition is Scott's defect, and it is recorded that way.** The brief asked for
`error.message`. That instruction was the hole: an SDK error object carries more than its
displayed message, and a provider message is an unbounded upstream string that can contain
the address, a URL, or whatever a future SDK version puts there.

Now logged — allowlisted structured fields ONLY:

```
reason=generate_link_failed status=<error.status ?? 'null'> code=<error.code ?? error.name ?? 'unknown'>
```

Never the raw message. Never the error object. If a human-readable string is ever wanted,
map a **known code** to one of **our own fixed internal strings** — do not
sanitize-and-pass-through, which re-opens the same hole one upstream change later.

## BLOCKING 2 (Gemini) — floor computed immediately before output. **SATISFIED ON INSPECTION.**

Verified rather than implemented; neither model could see the code. `ok()` already does
this, and **this branch did not alter it** — `git diff origin/main` produces no `+`/`-`
line touching these:

```ts
    const elapsed = Date.now() - started
    if (elapsed < MIN_RESPONSE_MS) await sleep(MIN_RESPONSE_MS - elapsed)
```

`started` is captured as the first statement of the handler; the subtraction and the sleep
are the last thing before the `Response` is constructed. Nothing added by S313 sits between
them.

## BLOCKING 3 (Perplexity) — upstream rate limiting / WAF. **ACCEPTED AND DEFERRED — not satisfied.**

**Recorded as accepted risk, with Scott's name on the acceptance, not as a condition met.**
Supabase offers no per-function rate limiting, there is no CDN we control in front of the
endpoint, and an in-function limiter is a database table and its own design. It is not
satisfiable in this PR and the PR does not pretend it is.

ROADMAP item opened: *"Public unauthenticated edge functions have no rate limiting —
password-reset-request is the live example."*

The two halves that **were** in scope are done:

- **Scanners no longer log.** `if (req.method !== 'POST') return ok()` — no log line. A GET
  or HEAD on a public endpoint is a scanner, and letting one drive unbounded log writes is
  the amplification concern itself. OPTIONS already returned before any logging. `invoked`
  stays **after** the method check and **before** email validation, because distinguishing
  junk input from real input is the point of having it.
- **Every payload is compact and structured.** `key=value` pairs only. No headers, no
  bodies, no user agents, no stack serialization, no raw provider payloads.

## Non-blocking, both models — **TAKEN: the email tag is gone.**

The truncated SHA-256 tag is deleted, along with the comment explaining why it was not a
privacy guarantee. **That comment was the weakest part of the change** — it documented a
caveat instead of removing it. `rid`, a random per-request id, was already doing the only
correlation actually needed. Cross-request correlation by address is not a requirement:
with two live tenants, slug + timestamp + outcome locates any request.

**No keyed HMAC either** — that is a secret to manage for a need we do not have.

## Non-blocking — DECLINED, with reasons

**1. Load-testing p50/p95/p99 across paths at concurrency. DECLINED as
disproportionate — but Perplexity's framing is adopted and the source is corrected.**

Right in principle, out of proportion for this change. What is *not* declined is the
correction it implies: the source previously said the floor meant a fast path
*"can't be timed as an oracle."* **That overclaimed.** A fixed floor bounds the fast path
from below and removes the obvious signal; it does not demonstrate that no residual
distribution difference survives at p95/p99 under concurrency.

**The floor is risk reduction, NOT proof of timing indistinguishability.** The source now
says so, and a test asserts the corrected wording stays corrected — the overclaim may
appear exactly once, inside the retraction that quotes it.

**2. Host values in logs. DECLINED because there is nothing to do.** We do not log Host,
and Perplexity is right that it is attacker-controlled and unbounded. Keeping it that way.

## The apex finding — its own ticket, with Perplexity's shape

Both models say fix **both sides**, server-side authoritative. Perplexity adds the part
worth keeping: **one canonical host-to-tenant mapping shared by the router and the
function**, with contract tests over apex, `www`, custom domains, unknown hosts, absent
Origin, and Referer fallback. Filed as its own ROADMAP item in that shape. **Not fixed
here.**

## Verification after the conditions

26 assertions, and **6 gate-condition mutations, 6 caught**: restoring `error.message`,
logging the whole error object, reintroducing the SHA-256 tag, making scanners log again,
restoring the timing overclaim, and leaking the email.

One test needed correcting on the way: a blanket "the overclaim never appears" assertion
failed on the **retraction that quotes it** — the same shape of error this file's first run
hit. Prose about a removed claim is not the claim.

---

# Appendix A — Gemini verdict (VERBATIM)

> ⚠️ **NOT YET SUPPLIED.** The conditions arrived in summary form; the raw text did not.
>
> **HOW TO CONFIRM THIS SLOT IS GEMINI** — checked BEFORE filling, never corrected after,
> because S309 round 1 was filed with the two models reversed:
>
> | | Appendix A — **GEMINI** | Appendix B — **PERPLEXITY** |
> |---|---|---|
> | citations | **none** | **inline**, to supabase and github |
> | structure | numbered sections | prose |
> | verdict | "Verdict" with **four numbered conditions** | a **single paragraph** |
>
> Paste unfenced between the markers — verdicts carry their own code fences — then
> checksum both and record the byte counts.

<!-- BEGIN APPENDIX A VERDICT — BYTE-EXACT, DO NOT EDIT -->
[PASTE GEMINI VERDICT VERBATIM — NOT YET SUPPLIED]
<!-- END APPENDIX A VERDICT -->

# Appendix B — Perplexity verdict (VERBATIM)

> ⚠️ **NOT YET SUPPLIED.** Same convention as Appendix A, whose table gives the test for
> confirming this slot is really Perplexity: **inline citations present** (supabase,
> github), prose rather than numbered sections, and a **single-paragraph** verdict.

<!-- BEGIN APPENDIX B VERDICT — BYTE-EXACT, DO NOT EDIT -->
[PASTE PERPLEXITY VERDICT VERBATIM — NOT YET SUPPLIED]
<!-- END APPENDIX B VERDICT -->
