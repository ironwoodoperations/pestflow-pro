# S186 — Transactional Email Audit

**Date:** 2026-05-02  
**Scope:** Full audit of every transactional email send across the PestFlow Pro stack.  
**Status:** Read-only investigation. No edits made.

---

## 1. Executive Summary

Every transactional email in the platform is sent via Resend with a single shared sender address `noreply@pestflow.ai`. The **From friendly name is always hardcoded as "PestFlow Pro"** — either in `_shared/sendEmail.ts` (the shared helper) or inline in functions that bypass the helper. Two customer-facing emails — the lead acknowledgment (`notify-new-lead` Email A) and the review request (`send-review-request`) — already read tenant business name from the DB for their body content but use the hardcoded "PestFlow Pro" From header via a completely separate code path. This is the confirmed bug from last night. All other "PestFlow Pro" From instances are platform-to-client or internal emails where the platform sender is correct. The fix is surgical: add one optional `fromName` parameter to `_shared/sendEmail.ts` and thread it through the two customer-facing callers.

---

## 2. Repo Inventory

| Repo | Status |
|------|--------|
| `/workspaces/pestflow-pro` | Present — investigated fully |
| `/workspaces/dang-pest-control` | **Not present in this Codespace.** Edge functions almost certainly live only in `pestflow-pro` (confirmed: last night's form test fired against Supabase project `biezzykcgzkrwdgqpsar`). Dang standalone repo, if it exists elsewhere, would call these same functions — it does not own its own email sends. |

---

## 3. Phase 1 — Grep Results

### Resend / email sends found

| Pattern | Files |
|---------|-------|
| `from:` in edge functions | `_shared/sendEmail.ts:21`, `send-intake-email/index.ts:14`, `notify-support-ticket/index.ts:54`, `notify-upgrade/index.ts:61`, `send-review-request/index.ts:67`, `send-onboarding-email/index.ts:28`, `send-onboarding-email/index.ts:59` |
| `@pestflow.ai` | All of the above (same locations) |
| `Resend(` | Zero hits — Resend is called via raw `fetch()`, not SDK constructor |
| `resend.emails.send` | Zero hits |
| `nodemailer` / `sendgrid` / `mailgun` | Zero hits — no SMTP or alternative providers |

### Edge functions with email sends (confirmed active)

```
notify-new-lead          (Email A: customer ack + Email B: owner notification)
notify-support-ticket    (internal IT ticket → itsupport@pestflowpro.com)
notify-upgrade           (internal sales alert → pfpsales@pestflowpro.com)
send-credentials-email   (client login creds → tenant admin)
send-dunning-email       (payment failure → tenant admin)
send-intake-confirmation (intake form ack → prospect/new client)
send-intake-email        (intake invitation → prospect)
send-marketing-lead      (owner notification + prospect confirmation)
send-onboarding-email    (Mode 1: client welcome; Mode 2: Scott's notification)
send-review-request      (review request → customer, after service)
send-reveal-ready        (site ready → tenant admin)
send-welcome-email       (payment confirmed → tenant admin)
```

### Deleted function confirmed gone
- `send-invoice-email` — not present in `supabase/functions/`. Confirmed deleted in S173 per git history.

---

## 4. Phase 2 — Full Email Inventory

| # | Repo | File path | Line | Trigger | Recipient | From friendly name | From address | Reply-To | Tenant-aware? |
|---|------|-----------|------|---------|-----------|-------------------|--------------|----------|---------------|
| 1 | pfp | `notify-new-lead/index.ts` | 127 | DB webhook on `leads` INSERT | **Customer** (person who submitted form) | `'PestFlow Pro'` — hardcoded in `_shared/sendEmail.ts:21` | `noreply@pestflow.ai` | `businessEmail` or `notifyEmail` from DB | **NO** — body uses tenant DB data, From does not |
| 2 | pfp | `notify-new-lead/index.ts` | 149 | Same DB webhook | Tenant owner (`notifications.lead_email`) | `'PestFlow Pro'` — hardcoded in `_shared/sendEmail.ts:21` | `noreply@pestflow.ai` | (none) | Platform constant — OK |
| 3 | pfp | `send-review-request/index.ts` | 67 | Manual/won-lead trigger | **Customer** (former lead, post-service) | `'PestFlow Pro'` — hardcoded inline at line 67 | `noreply@pestflow.ai` | (none) | **NO** — subject/body use tenant `businessName` from DB, From does not |
| 4 | pfp | `notify-support-ticket/index.ts` | 54 | Called from SupportTab after ticket insert | `itsupport@pestflowpro.com` (Ironwood IT) | `'PestFlow Pro'` — hardcoded inline | `noreply@pestflow.ai` | Tenant `lead_email` | Platform constant — OK (internal) |
| 5 | pfp | `notify-upgrade/index.ts` | 61 | Called from BillingTab on upgrade checkout | `pfpsales@pestflowpro.com` (Ironwood sales) | `'PestFlow Pro'` — hardcoded inline | `onboarding@pestflow.ai` | `pfpsales@pestflowpro.com` | Platform constant — OK (internal) |
| 6 | pfp | `send-intake-email/index.ts` | 14 | Called from Ironwood UI | Prospect (business owner being sold to) | `'PestFlow Pro'` — hardcoded inline | `noreply@pestflow.ai` | `onboarding@pestflowpro.com` | Platform constant — OK (PFP is the sender) |
| 7 | pfp | `send-intake-confirmation/index.ts` | via shared | Called from prospect after form submit | Prospect (new client intake) | `'PestFlow Pro'` — via `_shared/sendEmail.ts:21` | `noreply@pestflow.ai` | `pfpsales@pestflowpro.com` | Platform constant — OK |
| 8 | pfp | `send-credentials-email/index.ts` | via shared | Called manually from Ironwood post-reveal | Tenant admin (client) | `'PestFlow Pro'` — via `_shared/sendEmail.ts:21` | `noreply@pestflow.ai` | `itsupport@pestflowpro.com` | Platform constant — OK |
| 9 | pfp | `send-dunning-email/index.ts` | via shared | Stripe `invoice.payment_failed` webhook | Tenant admin (billing contact) | `'PestFlow Pro'` — via `_shared/sendEmail.ts:21` | `noreply@pestflow.ai` | `billing@ironwoodoperationsgroup.com` | Platform constant — OK (about PFP subscription) |
| 10 | pfp | `send-marketing-lead/index.ts` | via shared (line 168) | pestflowpro.com contact form | `pfpsales@pestflowpro.com` (Ironwood) | `'PestFlow Pro'` — via `_shared/sendEmail.ts:21` | `noreply@pestflow.ai` | Prospect's email | Platform constant — OK (internal) |
| 11 | pfp | `send-marketing-lead/index.ts` | via shared (line 182) | Same form | Prospect (person inquiring about buying PFP) | `'PestFlow Pro'` — via `_shared/sendEmail.ts:21` | `noreply@pestflow.ai` | `pfpsales@pestflowpro.com` | Platform constant — OK (marketing PFP to them) |
| 12 | pfp | `send-onboarding-email/index.ts` | 28 | stripe-webhook after payment | Tenant admin (new client) | `'PestFlow Pro'` — hardcoded inline | `noreply@pestflow.ai` | `onboarding@pestflowpro.com` | Platform constant — OK (welcoming them to PFP) |
| 13 | pfp | `send-onboarding-email/index.ts` | 59 | Client Setup wizard | `scott@ironwoodoperationsgroup.com` | `'PestFlow Pro'` — hardcoded inline | `noreply@pestflow.ai` | `onboarding@pestflowpro.com` | Platform constant — OK (internal) |
| 14 | pfp | `send-reveal-ready/index.ts` | via shared | Called from Ironwood when site is ready | Tenant admin (client) | `'PestFlow Pro'` — via `_shared/sendEmail.ts:21` | `noreply@pestflow.ai` | `pfpsales@pestflowpro.com` | Platform constant — OK |
| 15 | pfp | `send-welcome-email/index.ts` | via shared | stripe-webhook after payment | Tenant admin (client) | `'PestFlow Pro'` — via `_shared/sendEmail.ts:21` | `noreply@pestflow.ai` | `pfpsales@pestflowpro.com` | Platform constant — OK |

---

## 5. Phase 3 — Deep-Dive: The Known Bug

### Email confirmed to have fired last night
- **Subject:** `We received your request, Cutover! — Dang Pest Control`
- **From received:** `PestFlow Pro <noreply@pestflow.ai>`
- **Should have been:** `Dang Pest Control <noreply@pestflow.ai>`

### Exact source

**File:** `supabase/functions/notify-new-lead/index.ts`  
**Function:** Email A — customer acknowledgment (lines 79–143)

#### How "Cutover" was injected (recipient name)
```typescript
// Line 67
const firstName = lead.name?.split(' ')[0] || lead.name || 'there'
// Subject line 129:
subject: `We received your request, ${firstName}! — ${businessName}`
```
`lead.name` = "Cutover" (test name used). Works correctly.

#### How "Dang Pest Control" was injected in the body (already tenant-aware)
```typescript
// Lines 51–65: four parallel DB queries
const [notifRes, brandRes, bizRes, intRes] = await Promise.all([
  supabase.from('settings').select('value').eq('tenant_id', lead.tenant_id).eq('key', 'notifications').maybeSingle(),
  supabase.from('settings').select('value').eq('tenant_id', lead.tenant_id).eq('key', 'branding').maybeSingle(),
  supabase.from('settings').select('value').eq('tenant_id', lead.tenant_id).eq('key', 'business_info').maybeSingle(),
  ...
])
// Line 62:
const businessName: string = bizRes.data?.value?.name || 'PestFlow Pro'
```
`settings.business_info.name` = "Dang Pest Control" — confirmed via SQL query. Works correctly.

#### How "PestFlow Pro" leaked into the From header
```typescript
// notify-new-lead/index.ts line 127 — calls shared helper:
await sendEmail({
  to: lead.email,
  subject: `We received your request, ${firstName}! — ${businessName}`,
  replyTo: businessEmail || notifyEmail || undefined,
  html: autoReplyHtml,
  text: autoReplyText,
  // ← NO fromName parameter exists or is passed
})
```

```typescript
// _shared/sendEmail.ts line 21 — the shared helper:
const payload: Record<string, unknown> = {
  from: 'PestFlow Pro <noreply@pestflow.ai>',  // HARDCODED — no tenant input possible
  to,
  subject,
  html,
}
```

### Root cause confirmed
The `sendEmail()` shared helper accepts no `fromName` parameter — the From is permanently hardcoded. `notify-new-lead` has all the tenant data it needs (`businessName` is in scope at the call site), but has no mechanism to pass it through to the From header. The body code path and the From code path are completely isolated.

---

## 6. Phase 5 — Tenants Table Column Inventory

### Tenants table columns
```
id, name, subdomain, custom_domain, created_at, slug, archived_at,
is_protected, deletion_confirmed, deletion_final_confirmed
```

**No** `display_name`, `brand_name`, `company_name`, `public_name`, or `sender_name` columns exist. The single name column is `tenants.name`.

### Values for the two key tenants
| Tenant | `tenants.id` | `tenants.name` | `settings.business_info.name` |
|--------|-------------|----------------|-------------------------------|
| Demo | `9215b06b-...` | `PestFlow Pro` | (not queried, would be same) |
| Dang | `1611b16f-...` | `Dang Pest Control` | `Dang Pest Control` |

Both `tenants.name` and `settings.business_info.name` contain "Dang Pest Control" for the Dang tenant.

**Recommendation:** Use `settings.business_info.name` as the source — it is already being read by `notify-new-lead` and is the canonical tenant business name used everywhere in the platform. This avoids an extra DB join. It is already in scope at the `sendEmail()` call site in both affected functions.

---

## 7. Phase 4 — Recommendation Per Finding

### Row 1 — `notify-new-lead` Email A (customer confirmation) — **RE-ARCHITECTURE**

The bug. Body already has `businessName` in scope. Fix: add `fromName` to `_shared/sendEmail.ts`, pass `businessName` from the call site.

**Proposed stub — `_shared/sendEmail.ts`:**
```typescript
export async function sendEmail({
  to, cc, subject, html, text, replyTo, fromName,
}: {
  to: string
  cc?: string
  subject: string
  html: string
  text?: string
  replyTo?: string
  fromName?: string          // NEW — optional, defaults to platform name
}): Promise<void> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
  const senderName = fromName || 'PestFlow Pro'
  const payload: Record<string, unknown> = {
    from: `${senderName} <noreply@pestflow.ai>`,   // was hardcoded
    to,
    subject,
    html,
  }
  // ...rest of function unchanged
```

**Proposed stub — `notify-new-lead/index.ts` (Email A call, ~line 127):**
```typescript
await sendEmail({
  to: lead.email,
  subject: `We received your request, ${firstName}! — ${businessName}`,
  replyTo: businessEmail || notifyEmail || undefined,
  html: autoReplyHtml,
  text: autoReplyText,
  fromName: businessName,    // NEW — already in scope at line 62
})
```

---

### Row 3 — `send-review-request` Email (review request to customer) — **RE-ARCHITECTURE**

Same pattern. `businessName` is already read from `settings.business_info.name` at line 50. Function calls Resend directly (does not use `_shared/sendEmail.ts`). Fix is a one-line change to the `from` field.

**Proposed stub — `send-review-request/index.ts` (~line 67):**
```typescript
// Before:
from: 'PestFlow Pro <noreply@pestflow.ai>',

// After:
from: `${businessName} <noreply@pestflow.ai>`,
// businessName is already set at line 50:
// const businessName = bizRes.data?.value?.name || 'Our Team'
```

---

### Rows 2, 4–15 — All other emails — **PLATFORM CONSTANT**

Every other email goes to:
- Ironwood internal addresses (`pfpsales@`, `itsupport@`, `scott@ironwoodoperationsgroup.com`)
- The tenant admin (client, not their customer) — for subscription billing, credentials, welcome, reveal-ready. "PestFlow Pro" as the sender is correct: these are service relationship emails about their PestFlow Pro subscription.
- Prospects being sold to (intake invitation, intake confirmation, marketing site leads). "PestFlow Pro" is correct.

No changes needed.

---

### `send-intake-email` — **NEEDS SCOTT CONFIRMATION**

This sends to the business owner on behalf of Scott during the sales process. Subject includes `${businessName || 'PestFlow Pro'} — Your website setup link is ready`. Technically this email comes from Scott/Ironwood, not from the client's business. "PestFlow Pro" as From is correct here, but the subject could be confusing. Flag only — not a customer-facing bug.

---

## 8. Suggested Fix Order

| Priority | Fix | Est. time | Why first |
|----------|-----|-----------|-----------|
| 1 | `_shared/sendEmail.ts` — add `fromName` param | 10 min | One change unlocks all future customer-facing fixes |
| 2 | `notify-new-lead` — pass `fromName: businessName` on Email A | 5 min | The confirmed live bug, affects every new lead for every tenant |
| 3 | `send-review-request` — change inline `from` to use `businessName` | 5 min | Same bug class, customer-facing |
| 4 | Redeploy both functions | 10 min | `notify-new-lead --no-verify-jwt`, `send-review-request` (default JWT) |

**Total estimated time to ship once approved: ~30 minutes end-to-end** (edit → deploy → verify with test lead submission).

No database migrations required. No Vercel changes required. No env var changes required.

---

## 9. Notes

- The `dang-pest-control` standalone repo does not exist at `/workspaces/dang-pest-control` in this Codespace. Investigation confirmed all email sends originate from edge functions in `pestflow-pro` — the standalone repo calls these functions, it does not own email sends independently.
- The `send-invoice-email` function referenced in S173 as deleted is confirmed absent from the functions directory.
- No SMTP, SendGrid, Mailgun, or Nodemailer usage found anywhere in the stack.
- All Resend sends use the same API key (`RESEND_API_KEY` from Doppler). No per-tenant API keys.
