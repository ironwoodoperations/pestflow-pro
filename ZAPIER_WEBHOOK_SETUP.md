# ZAPIER WEBHOOK SETUP — PestFlow Pro
**For Scott — Supabase Dashboard Configuration**
Last Updated: 2026-04-11

This file documents the exact Supabase webhook configuration needed before building Zapier ZAPs 1–7.
Each webhook fires an HTTP POST to a Zapier catch hook URL when the specified database event occurs.

---

## PRE-FLIGHT CHECK

Both required Postgres extensions are confirmed active on `biezzykcgzkrwdgqpsar`:
- ✅ `pg_cron` v1.6.4
- ✅ `pg_net` v0.20.0

---

## HOW TO CREATE A WEBHOOK IN SUPABASE

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/biezzykcgzkrwdgqpsar)
2. Left sidebar → **Database** → **Webhooks**
3. Click **Create a new webhook**
4. Fill in the fields exactly as described for each webhook below
5. Click **Create webhook**

---

## WEBHOOK 1 — New Prospect Created (ZAP 1)

**What triggers it:** Scott fills in the prospect intake form in Ironwood and clicks Save.
**Purpose:** Notify Scott's CRM pipeline, start Zapier automation for new lead.

| Field | Value |
|-------|-------|
| Name | `zap1-new-prospect` |
| Table | `prospects` |
| Events | ✅ INSERT |
| URL | *(paste your Zapier Catch Hook URL for ZAP 1)* |
| HTTP Method | POST |
| Headers | `Content-Type: application/json` |
| Payload | Include all columns (default) |

**Key fields in the Zapier payload you'll use:**
- `record.id` — prospect UUID
- `record.contact_name` — full name
- `record.company_name` — business name
- `record.email` — contact email
- `record.phone` — phone number
- `record.status` — will be `prospect`
- `record.created_at` — timestamp

---

## WEBHOOK 2 — Intake Form Submitted (ZAP 2)

**What triggers it:** Client completes the intake form and submits it (sets `intake_submitted_at`).
**Purpose:** Send intake confirmation email, move prospect to `quoted` status in pipeline.

| Field | Value |
|-------|-------|
| Name | `zap2-intake-submitted` |
| Table | `prospects` |
| Events | ✅ UPDATE |
| Filter condition | `intake_submitted_at IS NOT NULL` |
| URL | *(paste your Zapier Catch Hook URL for ZAP 2)* |
| HTTP Method | POST |
| Headers | `Content-Type: application/json` |

**Key fields in the Zapier payload:**
- `record.id` — prospect UUID
- `record.contact_name` — first name for greeting
- `record.company_name` — business name
- `record.email` — send confirmation to this address
- `record.intake_submitted_at` — submission timestamp
- `record.intake_data` — JSONB blob of all intake responses

**Zapier action:** Call `send-intake-confirmation` edge function:
```
POST https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/send-intake-confirmation
Body: {
  "to": "{{record.email}}",
  "firstName": "{{record.contact_name}}".split(' ')[0],
  "businessName": "{{record.company_name}}"
}
```

---

## WEBHOOK 3 — Setup Invoice Sent (ZAP 3)

**What triggers it:** Scott generates and sends the setup invoice (sets `setup_invoice_sent_at`).
**Purpose:** Log the event, potentially notify Scott for follow-up.

| Field | Value |
|-------|-------|
| Name | `zap3-invoice-sent` |
| Table | `prospects` |
| Events | ✅ UPDATE |
| Filter condition | `setup_invoice_sent_at IS NOT NULL` |
| URL | *(paste your Zapier Catch Hook URL for ZAP 3)* |
| HTTP Method | POST |
| Headers | `Content-Type: application/json` |

**Key fields in the Zapier payload:**
- `record.id` — prospect UUID
- `record.company_name` — business name
- `record.email` — prospect email
- `record.setup_invoice_url` — Stripe hosted invoice URL
- `record.setup_invoice_sent_at` — timestamp sent

---

## WEBHOOK 4 — Prospect Provisioned / Site Created (ZAP 5)

**What triggers it:** Scott clicks "Create Site" and `ironwood-provision` succeeds. A new row is inserted into `tenants`.
**Purpose:** Trigger welcome email, update prospect status to `provisioned`, notify Scott.

| Field | Value |
|-------|-------|
| Name | `zap5-tenant-provisioned` |
| Table | `tenants` |
| Events | ✅ INSERT |
| URL | *(paste your Zapier Catch Hook URL for ZAP 5)* |
| HTTP Method | POST |
| Headers | `Content-Type: application/json` |

**Key fields in the Zapier payload:**
- `record.id` — tenant UUID
- `record.name` — business name
- `record.slug` — subdomain slug (site is at `{slug}.pestflowpro.com`)
- `record.created_at` — provisioning timestamp

**Zapier action:** Call `send-welcome-email` edge function. You'll need to look up the prospect `email` from the `prospects` table using `tenant_id` (Zapier → Supabase lookup step):
```
POST https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/send-welcome-email
Body: {
  "to": "{{prospect.email}}",
  "firstName": "{{prospect.contact_name first word}}",
  "businessName": "{{record.name}}",
  "siteUrl": "https://{{record.slug}}.pestflowpro.com"
}
```

---

## WEBHOOK 5 — New Lead Submitted (ZAP 6)

**What triggers it:** A visitor submits the quote form on any client's public site.
**Purpose:** Notify the client of the new lead, optionally notify Scott.

| Field | Value |
|-------|-------|
| Name | `zap6-new-lead` |
| Table | `leads` |
| Events | ✅ INSERT |
| URL | *(paste your Zapier Catch Hook URL for ZAP 6)* |
| HTTP Method | POST |
| Headers | `Content-Type: application/json` |

**Key fields in the Zapier payload:**
- `record.id` — lead UUID
- `record.tenant_id` — which client received the lead
- `record.name` — visitor's name
- `record.email` — visitor's email
- `record.phone` — visitor's phone
- `record.services` — requested service(s)
- `record.message` — their message
- `record.created_at` — submission timestamp

**Note:** `notify-new-lead` edge function already handles lead notifications directly. This ZAP is for additional pipeline automation (e.g., creating a CRM contact, sending to a spreadsheet).

---

## WEBHOOK 6 — Blog Post Published (ZAP 7)

**What triggers it:** A client publishes a blog post (sets `published_at` to a non-null timestamp).
**Purpose:** Share the post to social media, send to newsletter, notify Scott.

| Field | Value |
|-------|-------|
| Name | `zap7-blog-published` |
| Table | `blog_posts` |
| Events | ✅ UPDATE |
| Filter condition | `published_at IS NOT NULL` |
| URL | *(paste your Zapier Catch Hook URL for ZAP 7)* |
| HTTP Method | POST |
| Headers | `Content-Type: application/json` |

**Key fields in the Zapier payload:**
- `record.id` — blog post UUID
- `record.tenant_id` — which client published it
- `record.title` — post title
- `record.slug` — URL slug (post is at `{site}/blog/{slug}`)
- `record.excerpt` — short summary
- `record.published_at` — publish timestamp

**Note:** `blog_posts` does NOT have a `status` column — use `published_at IS NOT NULL` as the filter, not `status = 'published'`.

---

## IMPORTANT FILTER NOTE

Supabase webhooks fire on every UPDATE, not just when the filter column first becomes non-null.
This means Webhook 2 (`intake_submitted_at IS NOT NULL`) will fire every time the prospect row is
updated after intake is submitted. To prevent duplicate ZAP runs:

**In Zapier:** Add a Filter step that only continues if the field changed from empty to filled.
Use Zapier's "Only continue if" → `intake_submitted_at` exists AND `old_record.intake_submitted_at`
does not exist. The Supabase webhook payload includes both `record` (new) and `old_record` (previous
values) — use these to detect the transition.

---

## CRON JOB REFERENCE

The scheduled post cron is already active (set up 2026-04-11):

```sql
-- Verify it's running:
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'publish-scheduled-posts';

-- To pause it:
SELECT cron.unschedule('publish-scheduled-posts');

-- To resume at 5-min intervals:
SELECT cron.schedule(
  'publish-scheduled-posts',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/publish-scheduled-posts',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Check cron run history:
SELECT runid, jobid, status, start_time, end_time, return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'publish-scheduled-posts')
ORDER BY start_time DESC LIMIT 10;
```

---

## EDGE FUNCTIONS REFERENCE (for Zapier actions)

All functions accept POST with JSON body. No auth required (`--no-verify-jwt`).

| Function | Endpoint | Purpose |
|----------|----------|---------|
| `send-intake-confirmation` | `/functions/v1/send-intake-confirmation` | After intake form submitted |
| `send-welcome-email` | `/functions/v1/send-welcome-email` | After payment confirmed |
| `send-reveal-ready` | `/functions/v1/send-reveal-ready` | When site is ready to reveal |
| `send-credentials-email` | `/functions/v1/send-credentials-email` | After reveal call, send login |
| `send-dunning-email` | `/functions/v1/send-dunning-email` | Payment failure (pass `attemptCount`) |

Base URL: `https://biezzykcgzkrwdgqpsar.supabase.co`
