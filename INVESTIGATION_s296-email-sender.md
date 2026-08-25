# INVESTIGATION — S296: the email sender split

*Classification only. No `from:` address changed, no file edited. Read on 2026-08-25 against `main` @ `5362a3b`.*

---

## The split, in one line

**Every `From` header is on `pestflow.ai`. Every `Reply-To` is already on `homeflowpro.ai`.**

| header | addresses in use |
|---|---|
| **From** | `noreply@pestflow.ai` ×6 · `onboarding@pestflow.ai` ×1 |
| **Reply-To** | `onboarding@homeflowpro.ai` ×3 · `sales@homeflowpro.ai` ×2 · `support@homeflowpro.ai` ×1 |

The migration is half-done and nobody decided to do it that way. A reply already reaches the right
inbox; the envelope it replies to still says the pest vertical.

*(A grep for `from:` also matches `Record<string, unknown>` in `send-intake-email`'s local helper —
excluded as a type annotation, not an address.)*

---

## The structural cause: there is no sending-address module

`supabase/functions/_shared/sendEmail.ts:29` hardcodes the address and exposes **only a display name**:

```ts
from: `${fromName} <noreply@pestflow.ai>`,
```

A caller cannot choose its `from` address. Three of the seven therefore bypass the helper entirely and
carry their own literal — `send-onboarding-email:28,59`, `send-intake-email:19` — which is why the
cutover is seven edits rather than one.

That is the same shape S294 fixed for the platform *name*: five hardcoded copies became one constant.
The address has no equivalent.

---

## Classification — by the recipient the code resolves, not the filename

| # | file | recipient expression | current `from` | current `reply_to` | bucket |
|---|---|---|---|---|---|
| 1 | `send-onboarding-email` **mode 1** | `to: [to]` — the new client contractor (`:30`) | `PestFlow Pro <noreply@pestflow.ai>` (`:28`, local) | `onboarding@homeflowpro.ai` (`:29`) | **B** |
| 2 | `send-onboarding-email` **mode 2** | `to: ['scott@homeflowpro.ai']` (`:61`) | same literal (`:59`) | same (`:60`) | **neither — see F1** |
| 3 | `send-credentials-email` | the tenant's admin address | shared helper → `noreply@pestflow.ai`; `fromName: 'PestFlow Pro'` (`:210`) | `support@homeflowpro.ai` (`:219`) | **B** |
| 4 | `send-reveal-ready` | the tenant's contact | shared helper; `fromName: 'PestFlow Pro'` (`:84`) | `sales@homeflowpro.ai` (`:83`) | **B** |
| 5 | `send-intake-email` | `to: prospectEmail` (`:70`) — a **prospective** tenant | `PestFlow Pro <noreply@pestflow.ai>` (`:19`, local) | `onboarding@homeflowpro.ai` (`:71`) | **B (pre-contract)** |
| 6 | `authEmails` | **none** | **none** | **none** | **neither — see F2** |
| 7 | `invite-team-member` | `to: email` (`:134`, `:137`) — tenant staff | shared helper; **`fromName: businessName`** | **absent** | **B — see F3** |
| 8 | `password-reset-request` | `to: email` (`:108`) — a tenant user | shared helper; **`fromName: businessName`** | **absent** | **B — see F3** |

### Bucket A is EMPTY

**Not one of the seven sends to a contractor's own customer.** Every recipient is Scott's customer, a
prospective customer, or Scott himself. The brief's bucket A does not apply to this file set.

---

## F0 — the real bucket-A senders are OUTSIDE the seven

Two files send to the contractor's customer, and neither is in scope as briefed:

| file | recipient | current shape |
|---|---|---|
| `notify-new-lead` **Email A** (`:161`) | `to: lead.email` — the person who filled in the quote form | `fromName: businessName`, **`replyTo: businessEmail \|\| notifyEmail`** (`:163`) |
| `send-review-request` (`:68`) | `to: [recipientEmail]` — a customer asked for a review | `from: ${businessName} <noreply@pestflow.ai>` (`:67`) |

**`notify-new-lead` Email A already implements bucket A's target shape** — tenant name as the display
name, tenant address as `reply_to`. Only the domain is wrong. It is also the **highest-volume mail the
platform sends**, which matters for the warming plan below.

`notify-new-lead` **Email B** (`:184`, `to: notifyEmail`) goes to the contractor — bucket B, and also
outside the seven.

> If the S296 fix PR covers only the seven, the two files that actually mail end customers keep sending
> from `pestflow.ai`. That is worth deciding deliberately rather than by omission.

## F1 — `send-onboarding-email` is two messages, and only one is client mail

Mode 1 goes to the client; **mode 2 (`:59-61`) goes to `scott@homeflowpro.ai`** — an internal
"new client set up" notification. Same `from` literal, same file, different audience. It needs no
`support@` address and no tenant reply path; it is ops mail.

Two sibling files are the same shape and also outside the seven: `notify-support-ticket:64-65`
(→ `support@homeflowpro.ai`) and `notify-upgrade:77-78` (→ `sales@homeflowpro.ai`, and the **only**
user of `onboarding@pestflow.ai`).

## F2 — `authEmails` is not a mail file

It has **no `to:`, no `from:`, and no send**. It is a template module returning `{subject, html, text}`,
consumed by `invite-team-member` and `password-reset-request`. It cannot be classified A or B; its
delivery identity is entirely its callers'.

It does carry two S294 leftovers, both visible to a tenant: `:16` `Powered by … PestFlow Pro` linking
`pestflowpro.ai`, and `:49` `Your existing PestFlow Pro account…`. Its header comment also still warns
against copying `send-credentials-email` "because it carries … `support@homeflowpro.ai`" — advice that
inverts once `support@homeflowpro.ai` becomes the bucket-B standard.

## F3 — the two auth mails are branded as the TENANT, and this is the real decision

`invite-team-member` and `password-reset-request` both pass **`fromName: businessName`**. Today a PLS
password reset arrives as:

```
From: Precision Lawn Systems LLC <noreply@pestflow.ai>
Reply-To: (none)
```

Three things at once:

1. **A live From-header mismatch that predates S294** — a tenant's brand on a domain that is not
   theirs and not ours-as-branded. This is the exact shape a spoof takes, and it is in production now.
2. **No `reply_to` on either file.** A user who replies to a password-reset email reaches nothing.
3. **Bucket B's target would make it worse, not better.** `support@homeflowpro.ai` under a subject
   reading *"You've been invited to Precision Lawn Systems LLC"* is a different mismatch: the reader
   has no relationship with HomeFlow Pro and has never heard of it.

The shared helper's own doc comment (`sendEmail.ts:4-6`) says customer-facing mail passes the tenant
name and platform mail passes the platform name — so by its own convention these two are mis-set, or
the convention does not cover them. **This needs a decision and I am not making it.** The options:

| option | From | trade-off |
|---|---|---|
| **a** | `{businessName} <noreply@homeflowpro.ai>` | keeps the tenant brand the recipient recognises; display name and domain still differ, but both are now ours |
| **b** | `HomeFlow Pro <support@homeflowpro.ai>`, tenant name kept in the subject/body | header is internally consistent; recipient may not recognise the sender |
| **c** | `{businessName} via HomeFlow Pro <support@homeflowpro.ai>` | the convention Google/Slack use for exactly this; explicit, slightly clumsy |

**My recommendation is (c)** for these two only: it is the one shape that is honest about both parties,
and it is a pattern recipients have already been trained on by other SaaS.

---

## Reputation: the cutover should be staged, and this is the order

`homeflowpro.ai` has **zero sending reputation**. Credentials, invites and password resets are the mail
that must land — a bounced reset locks a paying customer out of their own dashboard.

**I could not verify the Resend domain state from this session** (no Resend credentials here; the
Microsoft 365, Stripe and Tavily MCP connectors are also unauthenticated, though none is relevant).
Taking the brief's statement — verified 2026-08-25 09:16 — as given.

### Staged, lowest-stakes first

| stage | files | why here |
|---|---|---|
| **1 — internal only** | `send-onboarding-email` mode 2, `notify-support-ticket`, `notify-upgrade` | Recipients are Scott. A delivery failure is noticed immediately and costs nothing. Proves DKIM/SPF end to end before any customer sees it |
| **2 — volume, low stakes** | `notify-new-lead` Email A, `send-review-request` | **The only real volume the platform has.** Warming needs traffic, and these are the files that provide it. A missed review request costs nothing; a lead auto-reply is regrettable but not blocking |
| **3 — tenant, non-critical** | `send-reveal-ready`, `send-intake-email`, `send-onboarding-email` mode 1, `notify-new-lead` Email B | Real customers, but each is a message Scott is already on a call about. A failure is recoverable by phone |
| **4 — transactional-critical, LAST** | `send-credentials-email`, `invite-team-member`, `password-reset-request` | A bounce here is a lockout. Move only after stages 1–3 have shown clean delivery over real volume |

Stage 2 is the argument for widening the fix beyond the seven: **the named seven are all
low-volume**, so cutting them over alone warms the domain with almost no traffic and puts the
critical mail on an unwarmed domain.

### Fallback to pestflow.ai

`pestflow.ai` stays verified, so a rollback is a code change, not a DNS change. It should be **one
edit**, which it is not today:

- introduce `MAIL_FROM` alongside the existing `PLATFORM_NAME` (`shared/lib/platformBrand.ts`), holding
  the bucket-A and bucket-B addresses;
- have `_shared/sendEmail.ts` take the address rather than hardcoding it;
- delete `send-intake-email`'s and `send-onboarding-email`'s local copies so no file can drift.

Then a per-bucket revert is one constant. Without it, rolling back stage 4 under pressure means editing
and redeploying three edge functions by hand.

**Watch for:** Resend's dashboard bounce/complaint rate, and specifically *soft* bounces on stage 4 —
Gmail and Outlook throttle unknown domains before they reject outright, so the first symptom is delay,
not failure. A stage-4 recipient who does not receive a reset within a minute should be treated as a
delivery signal, not a user error.

---

## Report-only: the six business-name fallbacks that name the platform

All six confirmed at the stated lines. Where a **tenant's** name belongs, the **platform's** appears:

| location | line |
|---|---|
| `shared/lib/buildPageMetadata.ts:64` | `tenant.business_name ?? tenant.name ?? 'PestFlow Pro'` |
| `shared/lib/tenantSeoMetadata.ts:17` | identical |
| `src/components/StructuredData.tsx:23` | `info.name \|\| 'PestFlow Pro'` |
| `notify-new-lead:94` | `bizRes.data?.value?.name \|\| 'PestFlow Pro'` |
| `invite-team-member:93` | `bizSetting?.value?.name \|\| 'PestFlow Pro'` |
| `password-reset-request:90` | `bizSetting?.value?.name \|\| 'PestFlow Pro'` |

**The two in this file set (`invite-team-member:93`, `password-reset-request:90`) are worse than the
other four**, because that value becomes the **`fromName`** — the From header, not page copy. A tenant
whose `business_info.name` is unset sends password resets as literally
`PestFlow Pro <noreply@pestflow.ai>` to its own staff.

Two are also *indexable*: `buildPageMetadata` and `tenantSeoMetadata` put it in `<title>`/OG tags.

**`send-review-request:50` shows the correct pattern already exists** — it falls back to `'Our Team'`,
a generic that claims nothing. It is not on the list because it does not name the platform.

Renaming these to `'HomeFlow Pro'` would be the wrong fix: it substitutes one wrong business name for
another. The S294 login precedent applies — the honest fallback is to render nothing, or a neutral
generic where a string is structurally required.

---

## What I did NOT do

No `from:` address changed. No file edited. No Resend or DNS state modified or verified. The staged
plan and the F3 recommendation are proposals awaiting approval.

## Risk / Rollback

None — documentation only.

## Protocol note

The `/investigate` skill's steps 7 and 9 call for `gh pr merge --auto --squash`. `CLAUDE.md` forbids
auto-merge; this is a **draft with no auto-merge**, and any fix PR will be too.
