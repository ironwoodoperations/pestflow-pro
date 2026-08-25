# S296 STAGE 0 — the sending domain becomes one runtime value

*Design. **No code in this PR.** The validator gate has now been run by Scott and returned three
changes, incorporated below. Stage 0 remains designed, not implemented: no `from:` address changed.*

Investigation record: `INVESTIGATION_s296-email-sender.md` (PR #295, merged `8c8ba11`).

---

## Gate reconciliation — 2 of my 5 covered, 3 not

The gate was run against Scott's own prompts, not the five questions in this document. Coverage is
judged against **the returned synthesis** (CHANGE 1–3, WARM-UP, REPLY-TO), not against raw validator
transcripts, which I have not seen. Where the synthesis is silent I record *not covered* rather than
inferring coverage.

| # | question | verdict |
|---|---|---|
| 1 | Rollback mechanism — runtime env var vs deploy-time constant; per-invocation hazard | **COVERED** — CHANGE 2, and it corrects me |
| 2 | Cross-domain `Reply-To` — DMARC alignment / independent spam scoring | **COVERED** — REPLY-TO, and it corrects me |
| 3 | Mixed-domain staging — does one recipient seeing two `From` domains score worse than a clean switch | **NOT COVERED** |
| 4 | Beyond "verified" — is a DMARC record separately required, and at what `p=` | **NOT COVERED** |
| 5 | The `via` construction — DMARC compatibility; duplication of Gmail's own "via" annotation | **NOT COVERED** |

### Q3 — still open, and it is still the one that can overturn the order

Nothing in the synthesis addresses the per-recipient hazard: a tenant admin who receives credentials
from one domain and a reveal-ready from another *during the transition*.

The nearest adjacent material is WARM-UP's published ramp (150/day day 1 → 2,000/day day 7). That
describes a volume ramp **on the new domain**; it does not say whether the two-domain overlap period is
neutral or harmful. A ramp schedule presumes staging is fine. It does not establish it.

I am not treating "the gate returned a ramp schedule" as "the gate approved mixed-domain staging."
That inference is exactly the shape this document is supposed to refuse.

### Q4 — not covered, and CHANGE 1 makes it *more* load-bearing, not less

No DMARC requirement and no `p=` value came back. CHANGE 1 introduces a subdomain, and subdomains do
not have independent DMARC policy by default: **`mail.homeflowpro.ai` inherits the apex's DMARC policy
unless the apex publishes an `sp=` tag or the subdomain publishes its own `_dmarc` record.**

That matters here for the same reason CHANGE 1 exists. The apex is Scott's human mail domain. If the
subdomain's policy has to be managed by editing the apex's DMARC record, then DMARC becomes a shared
control surface between transactional mail and his personal mail — reintroducing, at the policy layer,
precisely the coupling CHANGE 1 removes at the reputation layer.

**The clean form is a `_dmarc.mail.homeflowpro.ai` record of its own**, so the subdomain's policy can
be tightened or loosened without touching the apex. Whether it should start at `p=none` and at what
point it moves is the unanswered half of Q4 and should go back through the gate with CHANGE 1's
subdomain in the prompt, since the original question presumed apex sending.

### Q5 — not covered; half of it I can answer from the spec, half I cannot

DMARC evaluates the **domain** of the `From` header. The display name is free text and has no
alignment interaction, so `{businessName} via HomeFlow Pro <support@…>` cannot break DMARC. That half
is settled by the specification, not by the gate.

The unanswered half is Gmail's automatic annotation. Gmail appends its own "via" when the `From`
domain differs from the authenticating domain; with CHANGE 1, DKIM signs on `mail.homeflowpro.ai` and
the `From` is on `mail.homeflowpro.ai`, so it should be aligned and no annotation should appear —
**but that is my reasoning from how the annotation is triggered, not a gate answer, and the failure
mode if I am wrong is a visibly doubled "via" on tenant-branded mail.** Worth one line in a re-run.

---

## The three changes

### CHANGE 1 — send from a subdomain, not the apex

`mail.homeflowpro.ai`, not `homeflowpro.ai`. The apex stays verified in Resend and stays Scott's human
mail domain; it does not bulk-send. Requires new DNS records and Resend verification **before** any
cutover — cheapest now, at zero sends.

This produces a better shape than the one I designed, because the apex keeps something the subdomain
does not have: **a resolvable MX, because Scott's mail is there.** So:

| header | domain | why |
|---|---|---|
| `From` | `…@mail.homeflowpro.ai` | sending reputation isolated from the apex |
| `Reply-To` | `…@homeflowpro.ai` (apex) | replies land in a mailbox that exists |

Replies are **inbound** mail. Routing them to the apex adds no sending volume there, so this does not
reopen what CHANGE 1 closes. And the existing `reply_to` literals are *already* apex addresses
(`onboarding@`, `sales@`, `support@`) — so **stage 0 moves only the `From` domain and leaves every
`Reply-To` untouched.** That makes the change smaller than the original design, not larger.

### CHANGE 2 — the rollback claim was overstated

Accepted in full. My "rollback is deleting a secret" line was wrong in the way that matters: it stated
a *latency* property the documentation does not support.

- **Read inside the request handler, never at module scope.** Strictly better under either propagation
  mechanism, and it costs nothing.
- **The runbook does not say "instant".** It says: changing the secret is *eventually* correct over an
  unknown window; a no-op redeploy forces isolate recycling and makes it deterministic. The win is
  unchanged and it was never really latency — **the emergency action is redeploying a known-good
  bundle, not editing code under pressure.**
- **Fail closed on an unset secret: ACCEPTED**, with one ordering requirement below.

#### Fail-closed contradicts stage 0's no-op property unless the secret is set first

This is the one thing in CHANGE 2 that does not drop straight in.

My design had stage 0 deploy with `MAIL_SENDING_DOMAIN` **unset**, relying on the `|| 'pestflow.ai'`
fallback to make the deploy a no-op. Fail-closed removes that fallback. Deploying fail-closed code
against an unset secret does not preserve today's behaviour — **it stops all mail on deploy.**

Resolution, and the sequencing is load-bearing:

1. **Set `MAIL_SENDING_DOMAIN=pestflow.ai` explicitly, first**, while the current code still ignores it.
2. **Then** deploy the fail-closed helper. The secret is set, the value is the current domain, and the
   deploy is a genuine no-op.
3. Cutover is changing that value to `mail.homeflowpro.ai`. Rollback is changing it back.

The secret is then **always set**, which is what makes fail-closed safe rather than fragile: an unset
value now means real misconfiguration, and throwing is the correct response to it. The throw must name
the missing variable, so the log line says what to fix instead of only that mail failed.

I do not disagree with fail-closed. Silently falling back to the retired domain after cutover is the
worse failure, because nothing surfaces it — mail keeps flowing under the wrong brand and the only
signal is someone eventually noticing the address.

### CHANGE 3 — Resend webhooks before cutover

Accepted. Without delivery telemetry the staged migration is unobservable, and the stage-4 mail is
exactly where an unobserved regression is a customer lockout.

**New edge function `resend-webhook`** (`verify_jwt = false` — Resend cannot present a Supabase JWT;
authentication is the Svix signature, not the gateway).

Subscribed events: `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`,
`email.complained`, `email.failed`.

| concern | handling |
|---|---|
| **Idempotency** | unique constraint on `svix_id`; insert `ON CONFLICT DO NOTHING`. At-least-once delivery means duplicates are normal traffic, not an error to log |
| **Ordering** | order state by the **event timestamp in the payload**, never by arrival. A derived per-message status is updated only when the incoming event's timestamp is newer than the stored one |
| **Signature** | real constant-time HMAC-SHA256 verification over `svix-id.svix-timestamp.body`, plus a timestamp-skew bound to stop replay |

> **On the signature check specifically:** it must be an HMAC comparison, not a shape or length check
> on the header. A regex that matches the *form* of a signature passes for every forged value with the
> right shape — a guard that cannot fail is not evidence. This is the S296-adjacent mistake already
> made once in this codebase's history and it is cheap to not repeat.

**Storage** — new table `email_events`: `svix_id` (unique), `event_type`, `resend_message_id`,
`recipient`, `tenant_id` (nullable — platform mail has none), `occurred_at` (from payload),
`received_at`, `payload jsonb`.

> ⚠️ **This is a schema change and needs Scott's approval as a migration.** It is not applied here.

> ⚠️ **RLS note for a future session.** This table holds recipient email addresses and must be
> **service-role only — `anon` correctly blocked.** `CLAUDE.md`'s standing RLS audit treats "anon
> blocked" as a defect to fix. For `email_events` that result is *correct* and must not be "fixed".
> Flagged here so the audit's own rule does not open a data leak.

**`delivery_delayed` is the signal that matters.** It is the closest thing to receiver-side deferral,
which is the first symptom of throttling — and it arrives before any bounce does.

---

## Withdrawn, corrected, and re-scoped

### My "the current mismatch is phishing-shaped" argument — WITHDRAWN

The previous revision argued that today's `From: …@pestflow.ai` + `Reply-To: …@homeflowpro.ai` split
was itself a phishing-shaped hazard, and used that as an argument *for* moving quickly.

The gate finds a cross-domain `Reply-To` has **zero effect on DMARC alignment** and is standard
multi-tenant practice. The argument was wrong and it is withdrawn, not softened.

What survives is a strictly weaker claim: today's split is a **brand** inconsistency — the envelope
says the retired vertical while the reply path says the platform. That is a reason to finish the
migration. It is not a deliverability risk, and it does not add urgency.

### Warm-up volume rationale — WITHDRAWN

Resend's guidance is not to manufacture volume for transactional mail. Recorded baseline: **150/day
day 1 → 2,000/day day 7; bounce <4%, spam <0.08%.**

`notify-new-lead` still ships **last** — because it is the highest-consequence mail, not because
anything else is warming the domain. The earlier framing had it last *and* had review requests warming
the domain; only the first half was right.

### NEW from the gate — the `Reply-To` domain needs a resolvable MX

Today's `reply_to` values are our own apex addresses, so this is satisfied now. It becomes live the
moment `reply_to` is a **tenant-supplied** address we do not control (`notify-new-lead` already does
this: `replyTo: businessEmail || notifyEmail`).

**Decision: validate at save time, never at send time.**

- An unresolvable `Reply-To` costs the *tenant* a lost reply. It does **not** affect our sending
  reputation — the gate's own finding is that `Reply-To` has no alignment interaction.
- So it is a data-quality problem, not a deliverability problem, and it belongs where the data is
  entered: validate the business email in admin settings, warn there, and never add a DNS lookup to
  the mail path or block a send on it.

> **The check must be MX *or* A/AAAA, not MX alone.** RFC 5321 §5.1 specifies an implicit MX: a domain
> with an address record and no MX record still accepts mail. An MX-only check would report working
> domains as broken — a guard narrower than the claim it makes, which is the recurring defect in this
> codebase and would here produce false warnings on valid tenant addresses.

---

## The design, as revised

### One value, read inside the handler

**`supabase/functions/_shared/mailFrom.ts`** (new):

```ts
// The sending domain. ONE value, read at REQUEST TIME (never at module scope) from an
// edge-function secret, so the emergency action is redeploying a known-good bundle
// rather than editing code under pressure.
//
// Fails CLOSED. The secret is set explicitly to the live domain BEFORE this code deploys,
// so "unset" always means misconfiguration — never the pre-cutover state.
function sendingDomain(): string {
  const d = Deno.env.get('MAIL_SENDING_DOMAIN');
  if (!d) throw new Error('MAIL_SENDING_DOMAIN is not set — refusing to send from an unknown domain');
  return d;
}
```

The module exposes the shapes, so no caller assembles a `From` string:

- **platform → tenant**: `HomeFlow Pro <support@{domain}>`
- **end-customer**: `{businessName} <noreply@{domain}>`
- **F3 auth mail**: `{businessName} via HomeFlow Pro <support@{domain}>`, and **`HomeFlow Pro` alone**
  when the tenant name is absent — never a placeholder, never a substitute name (S294 rule)

`Reply-To` values are unchanged and stay on the apex.

### The literals all go

`_shared/sendEmail.ts:29` stops hardcoding the address. The three files that bypass the helper —
`send-onboarding-email:28`, `:59`, `send-intake-email:19` — move onto it, so **no `from:` literal
remains anywhere.** That is what makes the cutover one value rather than four.

### Coupled items — shipping inside stage 0, as approved

- **`send-reveal-ready:84`** — `fromName: 'PestFlow Pro'` → `PLATFORM_NAME`. Coupled: changing it
  before the domain moves yields `HomeFlow Pro <noreply@pestflow.ai>` to prospects, the exact
  display-name/domain mismatch the S294 deferral existed to avoid.
- **`send-intake-email:72`** — subject-line fallback; **omit** rather than substitute.
- **`send-intake-email:74`** — `<h2>Your PestFlow Pro Website Setup</h2>`, retired name in body copy
  to a prospect.

### What stage 0 does NOT do

It changes no address in production. With the secret set to `pestflow.ai` first (CHANGE 2 sequencing),
every message sends exactly as it does today. Stage 0 is the mechanism; the cutover is changing one
secret's value.

---

## Verification I could not perform from this session

**No DNS resolver is available here.** `dig` is not installed and DNS-over-HTTPS is blocked by the
proxy (`CONNECT tunnel failed, 403`).

My first probe returned empty output for every domain including `pestflow.ai`, which is actively
sending — that emptiness was the *missing binary*, not a missing record. Recorded because reading it
as "no DMARC record exists" is precisely the vacuous-evidence failure this project keeps hitting: a
probe that cannot succeed returns nothing, and nothing reads like a finding.

**So the DMARC state of both domains is unverified here.** Before cutover, confirm on a machine with a
resolver:

```
dig +short TXT _dmarc.homeflowpro.ai
dig +short TXT _dmarc.mail.homeflowpro.ai
dig +short TXT _dmarc.pestflow.ai
dig +short MX  homeflowpro.ai
```

Resend's domain state is likewise unverified from here (no credentials in this session); the
2026-08-25 09:16 verification is taken as given.

---

## Status

Gate run; three changes incorporated. **No code written, no address changed.** Open:

1. **Q3, Q4, Q5 were not covered** by the returned synthesis. Q3 can still overturn the staged order;
   Q4 now carries CHANGE 1's subdomain-policy question, which the original prompt did not contain.
2. **The `email_events` migration** needs approval before stage 0 can be implemented, since CHANGE 3
   puts webhooks before cutover.
3. **DNS for `mail.homeflowpro.ai`** — new records and Resend verification, ahead of any cutover.
