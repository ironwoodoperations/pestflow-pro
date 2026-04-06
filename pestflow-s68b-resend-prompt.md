# PestFlow Pro — S68b Claude Code Prompt (Resend Email Wiring)
_Hand this to Claude Code. Work on main. Do not self-serve._

---

## SESSION RULES
- Read PESTFLOW-SKILL.md and TASKS.md at session start
- After every task: `git add . && git commit -m "task[N]: description" && git push`
- Dev server: `doppler run -- npm run dev` — never plain `npm run dev`
- All files under 200 lines — split if needed
- STOP at 50% context window and output plain summary
- Do NOT generate a context file — plain summary only at end
- Model: claude-sonnet-4-6 always

## CRITICAL CONSTANTS
```
Supabase ID:     biezzykcgzkrwdgqpsar
Demo Tenant ID:  9215b06b-3eb5-49a1-a16e-7ff214bf6783
Demo Admin:      admin@pestflowpro.com / pf123demo
From email:      onboarding@pestflow.ai
Resend secret:   RESEND_API_KEY (already in Supabase edge function secrets)
```

---

## BACKGROUND

Resend domain `pestflow.ai` is now approved. Wire up all four transactional
emails using the Resend API. All emails send from `onboarding@pestflow.ai`.
Do not change anything that is already correct.

---

## SHARED EMAIL HELPER — create this first

Create `supabase/functions/_shared/sendEmail.ts`:

```typescript
export async function sendEmail({
  to,
  cc,
  subject,
  html,
}: {
  to: string
  cc?: string
  subject: string
  html: string
}): Promise<void> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
  const payload: Record<string, unknown> = {
    from: 'PestFlow Pro <onboarding@pestflow.ai>',
    to,
    subject,
    html,
  }
  if (cc) payload.cc = cc

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error:', err)
    // Non-fatal — log and continue. Do not throw unless caller needs to know.
    throw new Error(`Resend failed: ${err}`)
  }
}
```

Commit: `git add . && git commit -m "task[1]: add shared sendEmail helper" && git push`

---

## TASK 2 — Lead acknowledgment + owner notification emails

**Trigger:** When a visitor submits the quote/contact form on a client's public site.

**Find:** The edge function or frontend handler that processes quote form submissions.
Likely `supabase/functions/submit-lead/index.ts` or similar. If handled in the
frontend directly via a Supabase insert, find that component in
`src/components/public/` or `src/pages/public/`.

**After the lead is saved to the database, send TWO emails:**

### Email A — Customer acknowledgment (to the visitor)
- **To:** visitor's email from the form
- **CC:** tenant's `settings.notifications.lead_email`
- **Subject:** `Thank you for contacting [Business Name]!`
- **HTML body:**
```html
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:[primary_color]">[Business Name]</h2>
  <p>Hi [visitor_first_name],</p>
  <p>Thank you for reaching out! We've received your inquiry and will be in
  touch with you as soon as possible — usually within 1 business day.</p>
  <p>If you need immediate assistance, please call us at
  <strong>[business_phone]</strong>.</p>
  <p>We look forward to helping you!</p>
  <p style="margin-top:32px;color:#888;font-size:12px">
    Powered by <a href="https://pestflowpro.com" style="color:#888">PestFlow Pro</a>
  </p>
</div>
```

### Email B — Owner lead notification (to the business)
- **To:** tenant's `settings.notifications.lead_email`
- **Subject:** `New lead from [visitor_name] — [Business Name]`
- **HTML body:**
```html
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:[primary_color]">New Lead — [Business Name]</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:8px;font-weight:bold">Name</td>
        <td style="padding:8px">[visitor_name]</td></tr>
    <tr style="background:#f9f9f9">
        <td style="padding:8px;font-weight:bold">Email</td>
        <td style="padding:8px">[visitor_email]</td></tr>
    <tr><td style="padding:8px;font-weight:bold">Phone</td>
        <td style="padding:8px">[visitor_phone]</td></tr>
    <tr style="background:#f9f9f9">
        <td style="padding:8px;font-weight:bold">Message</td>
        <td style="padding:8px">[visitor_message]</td></tr>
    <tr><td style="padding:8px;font-weight:bold">Submitted</td>
        <td style="padding:8px">[timestamp]</td></tr>
  </table>
  <p style="margin-top:32px;color:#888;font-size:12px">
    Powered by <a href="https://pestflowpro.com" style="color:#888">PestFlow Pro</a>
  </p>
</div>
```

**To get tenant branding for emails:** query `settings` table for keys
`business_info`, `branding`, and `notifications` using the tenant_id.
Use `business_info.name`, `business_info.phone`, `branding.primary_color`,
`notifications.lead_email`.

**If `notifications.lead_email` is empty:** skip Email B silently, still send Email A.
**If visitor email is empty:** skip Email A, still send Email B.
**Emails are non-fatal** — if Resend fails, the lead is still saved. Log the error.

Commit: `git add . && git commit -m "task[2]: lead acknowledgment and owner notification emails via Resend" && git push`

---

## TASK 3 — Intake link email via Resend

**Trigger:** Scott clicks "Send Intake Link" on a prospect record in /ironwood.

**Find:** The handler in `src/components/ironwood/` that generates or sends the
intake link. Currently it likely opens a `mailto:` link or copies to clipboard.

**Change:** Instead of (or in addition to) the mailto, call a new edge function
`send-intake-email` that sends the intake link via Resend.

**Create:** `supabase/functions/send-intake-email/index.ts`

```typescript
// Receives: { prospectEmail, prospectName, intakeUrl, businessName }
// Sends intake invitation email to the prospect
// JWT-protected — use anonClient for getUser(token)
```

Email content:
- **To:** prospect's email
- **Subject:** `[Business Name] — Your website setup link is ready`
- **HTML:**
```html
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:#16a34a">Your PestFlow Pro Website Setup</h2>
  <p>Hi [prospectName],</p>
  <p>We're getting your new website ready! Please take a few minutes to fill
  out the setup form so we can personalize everything for your business.</p>
  <p style="text-align:center;margin:32px 0">
    <a href="[intakeUrl]"
       style="background:#16a34a;color:white;padding:14px 28px;
              border-radius:6px;text-decoration:none;font-weight:bold">
      Complete My Website Setup →
    </a>
  </p>
  <p style="color:#666;font-size:14px">This link expires in 14 days.
  If you have questions, reply to this email.</p>
  <p style="margin-top:32px;color:#888;font-size:12px">
    Powered by <a href="https://pestflowpro.com" style="color:#888">PestFlow Pro</a>
  </p>
</div>
```

**In the frontend**, after calling `send-intake-email` successfully, show a green
toast "Intake link sent to [email]". Keep the "Copy Link" button as a fallback.

Deploy: `supabase functions deploy send-intake-email --project-ref biezzykcgzkrwdgqpsar --no-verify-jwt`

Wait — this IS JWT-protected (Scott is logged in). Deploy WITH jwt verification:
`supabase functions deploy send-intake-email --project-ref biezzykcgzkrwdgqpsar`

Commit: `git add . && git commit -m "task[3]: intake link email via Resend" && git push`

---

## TASK 4 — Invoice email via Resend

**Trigger:** Scott clicks "Send Invoice" on a prospect record after generating
the Stripe invoice URL.

**Find:** The "Send Invoice" button handler in `src/components/ironwood/PaymentLinkPanel.tsx`
or the prospect record. Currently it likely opens a `mailto:` link.

**Change:** Call a new edge function `send-invoice-email` instead.

**Create:** `supabase/functions/send-invoice-email/index.ts`

```typescript
// Receives: { prospectEmail, prospectName, businessName, invoiceUrl, amount }
// JWT-protected
```

Email content:
- **To:** prospect email
- **Subject:** `Your PestFlow Pro setup invoice — [Business Name]`
- **HTML:**
```html
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:#16a34a">Your Website Setup Invoice</h2>
  <p>Hi [prospectName],</p>
  <p>Here is your invoice for your new [businessName] website setup.</p>
  <p style="font-size:24px;font-weight:bold;color:#111">Amount: $[amount]</p>
  <p style="text-align:center;margin:32px 0">
    <a href="[invoiceUrl]"
       style="background:#16a34a;color:white;padding:14px 28px;
              border-radius:6px;text-decoration:none;font-weight:bold">
      View & Pay Invoice →
    </a>
  </p>
  <p style="color:#666;font-size:14px">
    Questions? Reply to this email or call us directly.
  </p>
  <p style="margin-top:32px;color:#888;font-size:12px">
    Powered by <a href="https://pestflowpro.com" style="color:#888">PestFlow Pro</a>
  </p>
</div>
```

Deploy: `supabase functions deploy send-invoice-email --project-ref biezzykcgzkrwdgqpsar`

Commit: `git add . && git commit -m "task[4]: invoice email via Resend" && git push`

---

## TASK 5 — "Send Login Credentials" button on provisioned prospect

**Trigger:** Scott clicks a new "Send Login Credentials" button that appears on
a prospect record ONLY after `provisioned_at` is set (site is live).

**Find:** The provisioning section of the prospect record in `/ironwood`.
The "Create Site" button is already there. Add the credentials button below it,
visible only when `prospect.provisioned_at` is not null.

**Create:** `supabase/functions/send-credentials-email/index.ts`

```typescript
// Receives: { adminEmail, adminPassword, slug, businessName }
// JWT-protected
```

Email content:
- **To:** `adminEmail`
- **Subject:** `Your [Business Name] website is live!`
- **HTML:**
```html
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:#16a34a">🎉 Your Website is Live!</h2>
  <p>Hi there,</p>
  <p>Your new <strong>[businessName]</strong> website is ready. Here are your
  admin login details:</p>
  <table style="width:100%;border-collapse:collapse;margin:24px 0">
    <tr style="background:#f9f9f9">
      <td style="padding:12px;font-weight:bold">Website</td>
      <td style="padding:12px">
        <a href="https://[slug].pestflowpro.com">https://[slug].pestflowpro.com</a>
      </td>
    </tr>
    <tr>
      <td style="padding:12px;font-weight:bold">Admin Login</td>
      <td style="padding:12px">
        <a href="https://[slug].pestflowpro.com/admin/login">
          https://[slug].pestflowpro.com/admin/login
        </a>
      </td>
    </tr>
    <tr style="background:#f9f9f9">
      <td style="padding:12px;font-weight:bold">Email</td>
      <td style="padding:12px">[adminEmail]</td>
    </tr>
    <tr>
      <td style="padding:12px;font-weight:bold">Password</td>
      <td style="padding:12px">[adminPassword]</td>
    </tr>
  </table>
  <p style="color:#666;font-size:14px">
    We recommend changing your password after your first login.
  </p>
  <p style="margin-top:32px;color:#888;font-size:12px">
    Powered by <a href="https://pestflowpro.com" style="color:#888">PestFlow Pro</a>
  </p>
</div>
```

**Password source:** The prospect record has `admin_password` or the password Scott
entered during provisioning. Find where it is stored. If not stored, add a
`admin_password` TEXT field to the `prospects` table and populate it from the
provisioning form. Scott enters it during the "Create Site" flow — it is already
shown to him in the UI.

**Button placement:**
```
✓ Provisioned 4/6/2026
[🌐 View Site]  [🔑 Admin Login]  [📧 Send Login Credentials]  ← ADD THIS
```

After clicking: show green toast "Credentials sent to [adminEmail]".

Deploy: `supabase functions deploy send-credentials-email --project-ref biezzykcgzkrwdgqpsar`

Commit: `git add . && git commit -m "task[5]: send credentials email button and edge function" && git push`

---

## END OF SESSION

Output a plain summary of:
- Which tasks completed successfully
- Which did NOT complete and why
- Any new edge function URLs to note
- Any Supabase secret that needs to be set manually

Do NOT generate a context file. Plain text summary only.
