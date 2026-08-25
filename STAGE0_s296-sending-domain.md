# S296 STAGE 0 — the sending domain becomes one runtime value

*Design + validator-gate brief. **No code in this PR.** The gate fires on stage 0 and has not been run —
see "I cannot run the gate" below.*

Investigation record: `INVESTIGATION_s296-email-sender.md` (PR #295, merged `8c8ba11`).

---

## Decisions taken as given

| | |
|---|---|
| **F3** | `{businessName} via HomeFlow Pro <support@homeflowpro.ai>`, `reply_to: support@homeflowpro.ai`. When `businessName` is absent → **`HomeFlow Pro` alone**, never a placeholder, never a substitute name (S294 login-seed rule) |
| **Widening** | `send-review-request` **in**. `notify-new-lead` **out of this arc** — last, own PR, after real delivery history |
| **Warming source** | review requests, not leads |
| **Order** | stage 0 → low-stakes platform mail → `send-review-request` → credentials/invite/reset → `notify-new-lead` later |

The reasoning behind the widening correction is recorded because it overturns my recommendation and the
correction is the better argument: **a lead notification in spam costs the contractor money on mail he
is not expecting; a password reset in spam costs a customer four minutes on mail he just requested.**
Volume for warming is worth having, but not at the price of the contractor's revenue.

---

## FINDING — one of the two "also in scope" items is COUPLED to stage 0

This changes the order, so it is stated before the design.

### `send-reveal-ready:84` — must NOT ship before stage 0

```ts
fromName: 'PestFlow Pro',      // → `${fromName} <noreply@pestflow.ai>`
```

Changing this to `PLATFORM_NAME` **today** produces:

```
From: HomeFlow Pro <noreply@pestflow.ai>
```

That is **precisely the display-name/domain mismatch that caused the S294 deferral** — a name on a
domain that does not match it. Fixing the retired name in isolation would re-create the exact hazard
the deferral existed to avoid, on mail going to prospects.

**It is safe only once the domain moves.** It ships *with* stage 0, not before it.

### `send-intake-email:72` — genuinely independent

```ts
subject: `${businessName || 'PestFlow Pro'} — Your website setup link is ready`,
```

This is a **subject line, not a header**. It has no interaction with the sending domain, DMARC, or
alignment. The platform name standing in for a tenant's name is the S294 absent-data error and the fix
is to omit rather than substitute.

**Also in that file, same class, not in the brief:** `send-intake-email:74` renders
`<h2>Your PestFlow Pro Website Setup</h2>` — the retired name in body copy, to a prospect. Body copy,
not a header, so it carries no alignment risk; batching it with stage 0 keeps the message internally
consistent rather than saying HomeFlow Pro in the body under a PestFlow Pro From.

> **Recommendation: hold both and ship them inside stage 0.** One is coupled and the other is a single
> line; splitting them out buys nothing and leaves the message half-renamed in the interim.

---

## The current mismatch is an argument FOR moving

Stated plainly because it inverts the usual caution.

**Today, every one of these sends `From: …@pestflow.ai` with `Reply-To: …@homeflowpro.ai`.** That split
is live, in production, right now. It is the same phishing-shaped header the S294 deferral was avoiding
— pointing the other way. The deferral was correct about the direction of the risk and it did not
notice that the risk already existed in the reverse form.

Waiting does not hold a safe position. It holds a mismatched one.

---

## The design

### One value, read at runtime

**`supabase/functions/_shared/mailFrom.ts`** (new):

```ts
// The sending domain. ONE value, read at runtime from an edge-function secret,
// so a rollback is a dashboard change and not a deploy.
const DOMAIN = Deno.env.get('MAIL_SENDING_DOMAIN') || 'pestflow.ai';
```

**The fallback is `pestflow.ai` deliberately.** It is the domain with reputation and it stays verified.
If the secret is unset, missing, or cleared, every message falls back to the address that has been
delivering for months. Rollback is *deleting a secret*, and the failure mode of the rollback mechanism
is the pre-cutover state — not a hard failure and not an unverified domain.

Throwing on an unset secret was considered and rejected: it converts a configuration slip into total
mail failure, and the mail that would stop first is the mail that must land.

The module exposes the two shapes, so no caller assembles a From string:

- **platform → tenant**: `HomeFlow Pro <support@{DOMAIN}>`
- **end-customer**: `{businessName} <noreply@{DOMAIN}>`
- **F3 auth mail**: `{businessName} via HomeFlow Pro <support@{DOMAIN}>`, and `HomeFlow Pro` alone when
  the tenant name is absent

### The literals all go

`_shared/sendEmail.ts:29` stops hardcoding the address. The three files that bypass the helper —
`send-onboarding-email:28`, `:59`, `send-intake-email:19` — move onto it, so **no `from:` literal
remains anywhere.** That is what makes the rollback one value rather than four.

### What stage 0 does NOT do

It does not change a single address in production. `MAIL_SENDING_DOMAIN` is left **unset** on deploy,
so the fallback applies and every message sends exactly as it does today. Stage 0 is the mechanism
only; the cutover is setting the secret, and each later stage is a code change moving one more file's
*bucket*, not its domain.

---

## ⚠️ I cannot run the validator gate

The gate requires **Perplexity and Gemini**. This session has neither — there is no Perplexity or
Gemini connector available to me, and the `ai-authority-perplexity` edge function is a product feature
for tenant prompts, not a research tool I can call.

**I have not run the gate, and I am not substituting a web search for it and calling it one.** S290
established that a parse must not be reported as a test; the same applies here.

Stage 0 is **designed, not implemented.** No file has been changed.

### The gate brief — the five questions

Specific enough to be answerable, and each one could change the design:

1. **Rollback mechanism.** For a sending domain, is a runtime-read environment variable the right
   rollback lever versus a deploy-time constant? Does reading it per-invocation carry a cold-start or
   caching hazard in a serverless mail path?
2. **Cross-domain `Reply-To`.** Does a `Reply-To` on a *different* domain from `From` affect DMARC
   alignment or spam scoring? (DMARC aligns `From` with SPF/DKIM and ignores `Reply-To` — but does any
   major filter score the mismatch independently?) **This is the state we are in today and would remain
   in during the staged period.**
3. **Mixed-domain staging.** For a domain with zero reputation, is a staged cutover by message class
   effective — or does the same recipient receiving mail from two different `From` domains during the
   transition score *worse* than a single clean switch?
4. **Beyond "verified".** Resend reports `homeflowpro.ai` verified (SPF + DKIM). Is a **DMARC** record
   separately required before meaningful volume, and at what `p=` to start — `none` for monitoring, or
   straight to `quarantine`?
5. **The `via` construction.** Is `{businessName} via HomeFlow Pro <support@homeflowpro.ai>` compatible
   with DMARC alignment, and does an explicit "via" in the display name conflict with or duplicate
   Gmail's own automatic "via" annotation?

**Question 3 is the one that could overturn the plan.** If mixed-domain sending scores worse than a
clean switch, the staged order is wrong and the whole approach needs rethinking rather than tuning.

---

## Monitoring, on cutover

**Soft bounces, not hard ones.** Gmail and Outlook throttle unknown domains before rejecting, so the
first symptom is *delay*, not failure. A stage-4 recipient who does not receive a password reset within
a minute is a delivery signal, not a user error — and the natural instinct is to read it as the user's
mistake, which is how the first real signal gets discarded.

---

## Status

Stage 0 designed. **Gate not run, no code written.** Two things needed:

1. **The gate** — the five questions above, through Perplexity and Gemini. I cannot do this.
2. **A decision on the two "also in scope" items** — recommendation is to hold both and ship them
   inside stage 0, because `send-reveal-ready` is coupled and `send-intake-email` alone is one line.
