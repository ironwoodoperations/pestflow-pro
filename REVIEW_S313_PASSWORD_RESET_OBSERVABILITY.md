# S313 — password-reset-request observability. Validator gate submission.

**Status: gate NOT YET RUN.** Appendices A and B are placeholders. Nothing is
reconstructed into a slot labelled VERBATIM — see the S309 precedent, where the round-2
slots stayed empty across two turns rather than be filled from a summary.

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

# Appendix A — Gemini verdict (VERBATIM)

> ⚠️ **NOT YET SUPPLIED.** Paste the raw output between the markers, unfenced — verdicts
> carry their own code fences. Then checksum and record the byte count.

<!-- BEGIN APPENDIX A VERDICT — BYTE-EXACT, DO NOT EDIT -->
[PASTE GEMINI VERDICT VERBATIM — NOT YET SUPPLIED]
<!-- END APPENDIX A VERDICT -->

# Appendix B — Perplexity verdict (VERBATIM)

> ⚠️ **NOT YET SUPPLIED.** Same convention as Appendix A.

<!-- BEGIN APPENDIX B VERDICT — BYTE-EXACT, DO NOT EDIT -->
[PASTE PERPLEXITY VERDICT VERBATIM — NOT YET SUPPLIED]
<!-- END APPENDIX B VERDICT -->
