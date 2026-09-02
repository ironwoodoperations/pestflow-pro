# S313 — password-reset-request observability. Validator gate submission.

**Status: GATE RUN. Both models APPROVE WITH CONDITIONS. All conditions resolved.**

✅ **The verdict TEXTS are recorded verbatim in Appendices A and B.** They arrived after
the conditions, and the appendices stayed empty in the interval rather than be
reconstructed from the summary — the S309 precedent, where the round-2 slots also stayed
empty across two turns. A reconstruction is indistinguishable from a transcript to a later
reader, which is the entire value of a slot labelled VERBATIM. Byte counts and SHA-256
checksums for both are recorded at the head of Appendix A, along with the attribution
criteria, which were fixed **before** the texts were placed.

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

> ✅ **SUPPLIED AND ATTRIBUTED.** Recorded verbatim below.
>
> **ATTRIBUTION ASSERTED BEFORE FILLING, NOT AFTER** — S309 round 1 was filed with the two
> models reversed, so the criteria below were fixed first and the texts were then matched
> against them. All four hold:
>
> | | Appendix A — **GEMINI** | Appendix B — **PERPLEXITY** |
> |---|---|---|
> | citations | **none** — 0 links, 0 occurrences of `http` | **inline** — 3 links: supabase, github, supabase |
> | structure | numbered sections `1.`–`4.` | prose, `##` headings |
> | verdict | `Verdict` → `VERDICT: APPROVE WITH CONDITIONS` + **four numbered conditions** | a **single bolded paragraph** |
>
> **Appendix A byte count: 6845. SHA-256: `ddcf0a89251dff1c8ff766e8042c13e1ec9114c523bbb436b6490c8319b8d833`**
> **Appendix B byte count: 14008. SHA-256: `9e921c94855a127062e7d39b4d0cb508d902a0d731a0102f07f46a853b13eafe`**
>
> Recorded unfenced between the markers — the verdicts carry their own code fences.
> The one edit applied to either text: the labels Scott typed ahead of each (`perplexity`,
> `Gemini`) were stripped, since they are his identification of the source, not the
> models' words. Nothing inside either verdict was altered.

<!-- BEGIN APPENDIX A VERDICT — BYTE-EXACT, DO NOT EDIT -->
Here is the assessment of the proposed logging change.

Direct Assessment: What is Correct vs. What is Wrong
Correct

* Separation of Observability and Client Response: The core thesis—that anti-enumeration requires response uniformity, not server-side blindness—is correct. Modern edge environments can safely log internal failures without compromising user privacy or anti-enumeration guarantees if designed carefully.

* Logging Discipline: Excluding bearer credentials (raw recovery tokens, constructed links) and full email addresses from logs prevents credential leakage via log sinks/aggregator tools.

* Uniform 700ms Timing Floor & Response Payload: Enforcing a static response body and a tight time floor ensures the external HTTP interface remains consistent.

* Initialization Safeguards: Setting an `outcome` variable to `'unset'` prevents unhandled execution branches from falsely reporting a successful result.

Wrong / Risks Identified

* Timing Leak Potential via Log-Write Latency Under High Load (Question 1): While a 700ms floor covers standard operational latency, synchronous I/O or stdout flushes under heavy log volume can exceed 700ms on failing paths if one execution path emits significantly more log lines or triggers heavy string operations (e.g., synchronous SHA-256 hashing) that another does not.

* Credential/Data Leak via Supabase Auth Error Payloads (Question 3): Logging `generate_link_failed` status and raw error messages (`message`) poses a direct risk. Supabase/GoTrue error messages can reflect upstream service details, database messages, or sensitive payload reflections.

* Log Ingestion Flooding / DoS via `invoked` Log Line (Question 4): Emitting an `invoked` line prior to basic input validation on a public, unauthenticated endpoint creates an asymmetric DoS vulnerability against log ingestion limits and log storage costs.

Assessment of Specific Questions
1. Leakage of Enumeration Signals to External Callers

* Response Body & Size: Because the response literal and headers are identical across all execution paths, size-based enumeration is prevented.

* Log-Write Latency & 700ms Floor:

   * A 700ms floor is typically sufficient to mask small microsecond-level CPU differences. However, console writing in serverless/edge environments can become blocking under resource constraints or heavy stdout buffering.

   * If a failed branch emits multiple log lines (e.g., `invoked`, `no_hashed_token`, `generate_link_failed`) while a fast-path branch emits fewer, the cumulative overhead during log flushes under load could cause the total processing time to exceed 700ms.

   * Mitigation: Ensure the 700ms delay calculation measures total time spent right before sending the final response rather than using a static `setTimeout(700)`. Compute `remainingTime = Math.max(0, 700 - (Date.now() - startTime))` at the absolute end of the request lifecycle.

2. Truncated SHA-256 Tag vs. Alternatives

* Assessment: The truncated SHA-256 tag is not the ideal solution here.

* Why: As noted in the comments, email addresses have low entropy. An attacker with log access and a rainbow table or list of target emails can easily match the truncated SHA-256 hash to reverse the target. Furthermore, logging an identifier derived directly from user input on unauthenticated requests allows attackers to pollute logs with predictable keys.

* Better Alternative: Log a random per-request execution ID (`requestId` / `traceId`).

   * Emitting a random UUID/ULID per request allows operators to group all log lines (`invoked`, `outcome`, errors) belonging to a single execution trace without logging any derivative of the user's input.

   * If correlation across multiple requests from the same user is strictly necessary for debugging, prefer an ephemeral HMAC keyed with a daily/rotating server secret (`HMAC-SHA256(email, daily_secret)`) over a static SHA-256 tag.

3. Sensitivity of Auth Provider Error Payloads (`generate_link_failed`)

* Assessment: High Risk.

* Why: Supabase Auth (GoTrue) or connected SMTP/email providers can include unpredictable details in error messages (e.g., internal database constraints, rate-limit state details, reflection of input params, or third-party API keys in misconfigured environments).

* Mitigation: Sanitize or map error messages before writing to logs. Log the HTTP status code and a sanitized internal error code, or sanitize the message string to strip sensitive variables before output.

4. Denial-of-Service / Log-Flooding Concerns for Unauthenticated `invoked` Log

* Assessment: Moderate Risk.

* Why: An unauthenticated public endpoint hit with a high-volume request flood will emit a log line for every single request, even invalid spam requests. This can lead to rapid log exhaustion, quota overages, or elevated log ingestion costs.

* Mitigation:

   1. Perform lightweight request sanity checks (e.g., HTTP method check, body size check) before emitting the `invoked` log line, OR

   2. Implement IP-based / network-level rate limiting (e.g., via Cloudflare, Supabase platform rate limits, or API Gateway) upstream of edge function execution.

Separate Finding (Comment Only)
Issue: Domain resolution mismatch between client router and edge function (`apex` domain vs. `www` vs. custom domains).

Recommendation: Fix both.

1. Edge Function (Backend): Update the hostname-to-tenant resolver so that the apex domain maps to the primary tenant slug (matching client router logic) rather than returning `null`.

2. Client Application (Frontend): Disable or hide the "Forgot password?" UI flow if tenant context cannot be definitively determined on the client side, preventing confusing user states where success UI is shown for non-actionable requests.

Verdict
VERDICT: APPROVE WITH CONDITIONS

Conditions

1. [BLOCKING] Sanitize Auth Error Logging: Do not log raw error messages (`message`) from `generate_link_failed` without sanitization or filtering to prevent unintentional leakage of internal credentials, database structure, or API secrets into log storage.

2. [BLOCKING] Dynamic Timing Adjustment: Ensure the 700ms floor measures execution duration dynamically immediately prior to output (`Math.max(0, 700 - (Date.now() - start))`) to guarantee that logging overhead under high load does not breach the 700ms boundary and create a timing side-channel.

3. [NON-BLOCKING] Replace SHA-256 Tag with Request Trace ID: Replace the truncated SHA-256 email hash with a random per-request UUID/trace ID (or an ephemeral server-secret HMAC) to avoid low-entropy offline dictionary attacks against log data.

4. [NON-BLOCKING] Validate Method Before Logging `invoked`: Place basic validation (e.g., verifying `req.method === 'POST'`) ahead of emitting the unconditional `invoked` log line to reduce junk log volume during automated scans.
<!-- END APPENDIX A VERDICT -->

# Appendix B — Perplexity verdict (VERBATIM)

> ✅ **SUPPLIED AND ATTRIBUTED.** Same convention as Appendix A, whose table carries the
> attribution assertion for both slots and the byte counts and checksums for each.

<!-- BEGIN APPENDIX B VERDICT — BYTE-EXACT, DO NOT EDIT -->
The logging change fixes a real operational defect without inherently breaking the endpoint’s anti-enumeration response contract. The main caveats are that server-side logging is not free or magically constant-time under load, and raw auth-provider error messages should not be logged without sanitization.
## What is correct
- Keeping the endpoint unauthenticated is appropriate for a password-reset request flow, provided the public surface is otherwise protected with abuse controls. Returning the same `200 {"status":"ok"}` on all outcomes is the right response-level anti-enumeration behavior.
- The principle behind the change is sound: **uniform client responses do not require uniform internal observability**. Operators need to distinguish:
  - request never reached the function;
  - hostname could not be mapped to a tenant;
  - request input was invalid;
  - recovery-link generation failed;
  - the provider returned no usable token;
  - email dispatch failed;
  - an unexpected exception occurred.
  Supabase Edge Functions are designed to expose invocation logs and metrics through the dashboard/log explorer, so emitting structured, stable event names is aligned with the platform’s observability model. [supabase](https://supabase.com/edge-functions)
- An unconditional `invoked` event is valuable. It makes a missing log trail meaningful: either the request did not reach the deployed function or log delivery/querying is broken, rather than “the successful path simply emitted nothing.”
- Initializing `outcome` to `unset` is a good defensive change. It makes fall-through/forgotten assignment visible rather than accidentally reporting a success-like state.
- Stable prefixes and machine-readable reason codes are preferable to ad hoc prose. They support dashboards, alerts, counts by failure mode, and regression detection without requiring brittle string parsing.
- Not logging the full email, raw request body, recovery token, or constructed recovery URL is correct. The token and link are bearer credentials and must never reach logs. Security logging guidance explicitly warns that logs themselves can become a sensitive data store and should avoid credentials and sensitive user data. [github](https://github.com/orgs/supabase/discussions/35585)
- Fixing the helper so that a mail-provider rejection is actually observed is necessary. A “dispatched” result should mean the send call resolved, not that the recipient ultimately received the mail; that distinction is normal and should be reflected in operator expectations.
## Enumeration and timing
**Assessment:** the change is probably safe against ordinary remote enumeration, but the implementer’s timing argument is too absolute. It should be described as “does not introduce a meaningful new response distinction under normal conditions,” not “cannot leak.”
### Response size
If every code path produces exactly the same serialized status, headers, and body, the logs do not alter response size. Verify this literally in the test suite, including:
- Method rejection paths.
- CORS/preflight behavior, if the function handles it.
- Exceptions raised while parsing request input.
- Any gateway-generated error before the function can return its normal response.
The application’s returned body can be uniform while an upstream/gateway failure is not. That is outside these logging changes, but it matters for the claim that *every* path is indistinguishable.
### Number of log calls
Different outcomes necessarily produce different line counts. For example:
- An invalid email may emit `invoked` plus `invalid_email`.
- A successful request may emit `invoked`, perhaps one correlation record, `send_dispatched`, and a final outcome.
- A link-generation failure may emit `invoked`, `generate_link_failed`, and outcome.
- An exception could produce `invoked` and `unhandled`.
That variation is not visible directly to the caller. However, console writes are still runtime work. Under ordinary conditions, the difference of one or a few bounded log events should be far below a 700 ms floor and should not create a usable oracle.
The weakness is **tail latency under saturation**:
- Console/log ingestion may buffer asynchronously, but that is an implementation behavior, not a security guarantee.
- If logging blocks, backpressures, serializes, samples differently, or competes for CPU/network resources under high log volume, paths with more logs may have a different probability of exceeding the 700 ms floor.
- Once any path exceeds 700 ms, the floor no longer equalizes it. A determined attacker could attempt repeated measurements, especially while also creating load.
This is best treated as a low-likelihood, defense-in-depth concern, not a reason to reject the change. The existing external work is already much more likely to dominate timing differences: tenant lookup, Supabase Auth `generateLink`, and the email provider call can each have outcome-dependent latency. Logging does not solve or uniquely create that fundamental issue.
### Recommended hardening
- Emit a fixed **small maximum** number of structured events per invocation, preferably with one terminal event. “Bounded” is good; “same upper bound with predictable event shape” is better.
- Avoid synchronous or expensive log formatting: no stack serialization, deep object logging, large provider payloads, or JSON-stringifying arbitrary errors.
- Put the timing floor around the entire handler from the earliest practical point to response completion, as appears intended.
- Load-test invalid-email, unknown-email, known-email, provider-error, and tenant-failure paths at realistic and abusive concurrency. Compare p50/p95/p99 response timings, not just single-request timings.
- Add upstream rate limiting/bot controls; these are needed for cost and log-volume protection regardless of whether timing measurements are feasible.
## Email correlation tag
A truncated SHA-256 tag is a reasonable choice **only if the operational need truly requires cross-request correlation for the same address**—for example, diagnosing “this account reports no reset mail” or identifying repeated targeted abuse without retaining the clear address.
The implementation’s caveat is exactly right: a plain deterministic hash of an email is not anonymization. Emails have low entropy, and someone with log access plus a plausible candidate list can hash candidates and compare. Truncation lowers collision resistance and does not materially prevent candidate confirmation when the tag is sufficiently long for operational use.
### Alternatives
| Choice | Cross-request correlation | Privacy characteristics | Assessment |
|---|---:|---|---|
| Omit address-derived data | No | Best minimization | Best if operators do not need to connect repeated reset attempts for the same address |
| Random request ID | Per-request only | Strong minimization | Useful for tracing one invocation across log lines, but cannot identify repeated activity for one account |
| Truncated plain SHA-256 | Yes | Pseudonymous at best; vulnerable to offline confirmation | Acceptable only with the stated caveat, restricted log access, and a narrow retention policy |
| Keyed HMAC of normalized email | Yes | Stronger against offline candidate matching without the secret | Preferred when stable correlation is required |
My preferred design is:
1. Generate a random `request_id` for every invocation.
2. If cross-request email correlation is needed, log a **keyed HMAC-SHA-256** tag over a carefully normalized email value, truncated to a conservative length—for example, 96–128 bits.
3. Keep the HMAC key in a secret manager and rotate it deliberately, understanding that rotation intentionally breaks historical correlation unless a version field is logged.
4. Document retention, access restrictions, and the fact that even HMAC tags remain sensitive operational identifiers.
A keyed HMAC is not an encryption scheme and does not eliminate all privacy concerns, but it prevents a person who merely has log access from confirming candidate emails unless they also have the key. If secret management complexity is not worth that benefit, omit the tag rather than treating a bare SHA-256 hash as private.
## Provider error logging
Logging `generate_link_failed` with raw `status` is generally reasonable. Logging raw `message` is the part I would change.
Supabase’s guidance recommends using structured error properties such as `error.code` and `error.name`, rather than matching or relying on error-message text.  A provider error message can vary by version and may include: [supabase](https://supabase.com/docs/guides/auth/debugging/error-codes)
- An echoed email address or other input.
- A redirect URL, host, or request context.
- Internal service details.
- Policy or configuration information helpful to an attacker.
- In the worst case, unexpected provider-side sensitive content.
Even if current Supabase Auth errors do not expose tokens in this path, the logging boundary should not depend on undocumented future message contents.
Use an allowlisted, structured log record instead, such as:
```ts
console.error("password-reset-request generate_link_failed", {
  reason: "generate_link_failed",
  status: error.status ?? null,
  code: error.code ?? error.name ?? "unknown",
});
```
If human-readable diagnostics are operationally necessary, either:
- map known provider codes/statuses to your own fixed internal reason strings; or
- sanitize and length-bound the message after explicitly removing emails, URLs, query strings, bearer-like values, and secrets.
Do not log a raw error object either—many SDK error objects contain more than their displayed `message`.
## Public log-flood risk
Yes, unconditional `invoked` logging creates a real log-volume and cost/availability risk for a public unauthenticated endpoint. The endpoint was already publicly callable, but the change turns every garbage request into a persistent operational event. An attacker can send malformed bodies, invalid methods, missing origins, and syntactically invalid emails cheaply, producing at least one log entry each time.
This is not an enumeration leak by itself. It is an abuse and observability-availability concern: excessive noise can increase ingestion/query cost, hide meaningful failures, trigger alert fatigue, and contribute to edge-function resource pressure.
### Mitigations
- Enforce rate limits before or at the edge, keyed by source IP and possibly tenant/host. Use conservative limits for malformed and invalid-email requests.
- Add a WAF/CDN bot-control rule in front of the function where available. Reject obvious floods before they invoke the function.
- Keep `invoked` records compact and structured; avoid full headers, bodies, arbitrary error objects, user agents, and large contextual data.
- Use log sampling or aggregation for routine invalid traffic. For example, preserve exact logs for a bounded per-IP/tenant window, then emit periodic counters such as `invalid_email_sampled` rather than a record for every request.
- Alert on aggregate rates—e.g., invalid input, no-slug, tenant-not-found, mail failures—rather than alerting per invocation.
- Apply short retention to public-endpoint diagnostic logs and restrict access because even pseudonymous tags have privacy implications.
One nuance: logging `invoked` before validation is still defensible if its main purpose is proving execution. The right mitigation is not necessarily to remove it; it is to make it cheap and protect the route upstream.
## Separate resolver finding
This should not drive the verdict on a logging-only change, but it is a genuine product defect. The correct remediation is **both**, with server-side alignment as the authoritative fix.
- **Align the resolver with the router:** The edge function must resolve every host that the product presents as a valid tenant-facing host, including the apex if the router maps it to a tenant. Server behavior is the security and correctness boundary; a client rendering decision cannot reliably fix API behavior.
- **Gate or configure the client button as defense in depth:** The client should not present a reset action for a host that cannot support reset delivery. That prevents a misleading “check your email” experience during configuration errors, rollouts, and future resolver drift.
- **Centralize host-to-tenant configuration:** Ideally the router and Edge Function should use one canonical mapping or a generated/shared configuration artifact, with contract tests covering apex, `www`, every custom domain, unknown hosts, absent `Origin`, and `Referer` fallback behavior.
- **Make host failures observable:** `no_slug`, `tenant_not_found`, and the final outcome should make apex/`www` misconfiguration obvious in monitoring. Do not include host values in logs unless they are known-safe and bounded; host headers are attacker-controlled input and can create log injection/noise issues if recorded raw.
The adjacent failure modes you describe are particularly important because the UI tells users the reset was accepted while no mail is sent. Uniform external responses are correct for account privacy, but the tenant/domain routing configuration must be correct so valid users actually receive reset mail.
**Verdict: APPROVE WITH CONDITIONS — BLOCKING: replace raw `generate_link_failed` message logging with an allowlisted code/status or a rigorously sanitized, length-bounded message; BLOCKING: add upstream rate limiting/WAF or equivalent abuse control plus a log-volume strategy for the unconditional `invoked` event; NON-BLOCKING: use a keyed HMAC rather than truncated plain SHA-256 if stable email-level correlation is required; NON-BLOCKING: load-test path timing at concurrency and document the 700 ms floor as risk reduction rather than a proof of timing indistinguishability; NON-BLOCKING: fix the apex/router-resolver mismatch server-side and gate the client UI as defense in depth.**
<!-- END APPENDIX B VERDICT -->
