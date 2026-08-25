# S296 STAGE 0 — the sending domain becomes one runtime value

*Design. **No code in this PR.** The validator gate has now been run by Scott and returned three
changes, incorporated below. Stage 0 remains designed, not implemented: no `from:` address changed.*

Investigation record: `INVESTIGATION_s296-email-sender.md` (PR #295, merged `8c8ba11`).

---

## Gate reconciliation — all five now closed

Run by Scott. Two answered by the returned synthesis, **one answered by DNS he resolved himself**,
one settled from specification, and **one decided as a judgement call and recorded as such rather
than dressed up as a validated fact.**

| # | question | outcome |
|---|---|---|
| 1 | Rollback mechanism | **ANSWERED** — CHANGE 2; corrects me |
| 2 | Cross-domain `Reply-To` | **ANSWERED** — REPLY-TO; corrects me |
| 3 | Mixed-domain staging | **NOT answered by the gate — DECIDED by Scott.** Proceed staged |
| 4 | DMARC beyond "verified" | **ANSWERED BY DNS**, not by the validators |
| 5 | The `via` construction | **SETTLED FROM SPEC** — no re-run needed |

### Q3 — a decision, not a finding

The gate did not answer it. Scott decided it directly: **proceed staged**, because the recipient sets
barely overlap — a tenant receives credentials and resets; a tenant's *customer* receives lead mail —
and the overlap window is days.

**Recorded as his judgement call, not as a validated fact.** If a staged cutover later shows a
deliverability cost, this is the assumption to re-examine first, and it should be findable as an
assumption rather than misremembered as something a validator confirmed.

### Q4 — answered by the DNS, and the answer was the one that needed acting on

Resolved facts (Scott ran the lookups; I have no resolver — see below):

| domain | DMARC | MX | notes |
|---|---|---|---|
| `homeflowpro.ai` | `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net` | **Google Workspace** | Resend DKIM selector present; `send.homeflowpro.ai` exists with its own SPF (Return-Path) |
| `pestflow.ai` | `v=DMARC1; p=none` | **NONE** | DKIM present |
| `mail.homeflowpro.ai` | — | — | **does not exist yet** |

**No `sp=` on the apex, so subdomains inherit `p`.** `mail.homeflowpro.ai` would inherit
`p=quarantine` from the moment it exists. It needs its own `_dmarc.mail.homeflowpro.ai`, its own
Resend verification, its own DKIM and its own Return-Path subdomain — **budget it as a full second
domain setup, not a DNS line item.**

The apex having **Google Workspace MX** also confirms CHANGE 1's Reply-To split from the other side:
`pestflow.ai` has **no MX at all**, so a reply to today's `From` has nowhere to land. Moving `From`
to the subdomain while `Reply-To` stays on the apex is the first arrangement in this migration where
a reply actually reaches a mailbox.

### Q5 — settled from specification

Gmail's own "via" annotation appears when the `From` domain differs from the DKIM `d=` /
Return-Path domain. Ours will align, so Gmail adds nothing and there is no doubled "via". The literal
`via HomeFlow Pro` is display-name free text and cannot affect alignment. **No re-run needed.**

---

## ⚠️ FIRST-CLASS RISK — the cutover is a POLICY ESCALATION

Found in the DNS, and missed by both validators and by both of us until the records were read.

| | today | after cutover |
|---|---|---|
| domain | `pestflow.ai` | `mail.homeflowpro.ai` (inheriting the apex) |
| DMARC policy | **`p=none`** | **`p=quarantine`** |
| an alignment failure is… | **delivered** | **sent to spam** |

This is not the same migration with a new name on it. **Today a misconfiguration still lands in the
inbox; after cutover the identical misconfiguration lands in spam.** The safety margin that has been
quietly absorbing any SPF/DKIM imperfection on `pestflow.ai` does not exist on the destination.

It sharpens two things already in this document:
- **Stage 4 (credentials, invite, password reset) is where this bites**, because a quarantined
  password reset is a lockout rather than a delay.
- **It is the strongest argument for CHANGE 3's webhooks landing first.** Under `p=none` an
  authentication problem is survivable and largely invisible; under `p=quarantine` it is neither, and
  `email.delivery_delayed` / `email.bounced` become the only way to see it.

**A deliberate `p=none` on `_dmarc.mail.homeflowpro.ai` during the staged period is worth
considering** — it makes the subdomain's policy an explicit choice rather than an inherited one, and
it can be tightened to match the apex once delivery history exists. A proposal, not a decision.

## ⚠️ BLOCKER before stage 0 — the DMARC reports go to GoDaddy, not to Scott

`rua=mailto:dmarc_rua@onsecureserver.net`. **Scott receives no DMARC aggregate reports for the domain
he is migrating onto.**

Without a `rua` he controls, the migration is unobservable *at the authentication layer* — and
CHANGE 3's Resend webhooks do not close this gap. They report what Resend did with a message;
aggregate reports say what **receivers** did with the authentication, including for mail Resend never
sent. Under `p=quarantine` that is the difference between knowing why mail is being quarantined and
guessing.

**Adding his own `rua` is a five-minute DNS edit and it must happen BEFORE stage 0.** It is also the
cheapest action available here: it changes no code, sends no mail, and starts accumulating the
baseline that makes the cutover legible.

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

## DNS — RESOLVED by Scott; what I could not do, and why that mattered

**No DNS resolver is available in this session.** `dig` is not installed and DNS-over-HTTPS is
proxy-blocked (`CONNECT tunnel failed, 403`). Scott ran the lookups; the facts are in Q4 above.

Kept as a record because of *how* the probe failed: my first attempt returned empty output for every
domain **including `pestflow.ai`, which is actively sending.** That emptiness was the missing binary,
not a missing record. Reading it as "no DMARC record exists" would have produced a confident and
completely wrong finding — and it would have concluded the opposite of the truth, since the real
records are exactly what surfaced both the policy escalation and the misdirected `rua`.

A probe that cannot succeed returns nothing, and nothing reads like a clean result.

Resend's domain state remains unverified from here (no credentials in this session); the
2026-08-25 09:16 verification is taken as given.

---

## Status

Gate closed on all five questions; three changes incorporated. **No code written, no address
changed.** `email_events` migration **APPROVED**. Remaining, in order:

1. **Add a `rua` Scott controls** to `_dmarc.homeflowpro.ai` — five-minute DNS edit, **before stage
   0**, or the migration is unobservable at the authentication layer regardless of webhooks.
2. **Stand up `mail.homeflowpro.ai` as a full domain setup** — its own `_dmarc`, its own Resend
   verification, its own DKIM, its own Return-Path subdomain. It inherits `p=quarantine` otherwise.
3. **Implement stage 0**, in this order: `email_events` migration + `resend-webhook` → set
   `MAIL_SENDING_DOMAIN=pestflow.ai` → deploy the fail-closed helper. The CHANGE 2 sequencing is
   load-bearing; reversing the last two steps stops all mail.

Carried assumption, deliberately visible: **Q3 (staged vs clean switch) is Scott's judgement call,
not a validated finding.** Re-examine it first if delivery degrades.
