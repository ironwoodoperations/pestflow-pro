// Branded auth emails for invite-team-member + password-reset-request.
//
// All URLs use the .ai brand (pestflowpro.ai). DO NOT copy send-credentials-email —
// it carries .com drift and support@homeflowpro.ai. There is no support@ address here;
// the set-password link is the only CTA. Links are bearer credentials — callers must
// never log them.

interface EmailParts { subject: string; html: string; text: string }

const WRAP = (inner: string) => `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="padding:28px 32px">${inner}</div>
      <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:18px 32px;text-align:center">
        <p style="margin:0;font-size:12px;color:#9ca3af">
          Powered by <a href="https://pestflowpro.ai" style="color:#f97316;text-decoration:none">PestFlow Pro</a>
        </p>
      </div>
    </div>
  </div>
</body></html>`

const BTN = (url: string, label: string) =>
  `<a href="${url}" style="display:inline-block;background:#16a34a;color:#ffffff;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none">${label}</a>`

/** Invite to a brand-new account — recipient sets their password to activate. */
export function inviteEmail(businessName: string, link: string): EmailParts {
  const subject = `You've been invited to ${businessName}`
  const html = WRAP(`
    <h1 style="margin:0 0 12px;font-size:20px;color:#111827">You've been invited to ${businessName}</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#4b5563;line-height:1.6">
      An admin added you to the ${businessName} dashboard. Click below to set your password and get started.
      This link expires and can only be used once.
    </p>
    <p style="margin:0 0 24px">${BTN(link, 'Set Your Password')}</p>
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>`)
  const text = `You've been invited to ${businessName}.\n\nSet your password to get started:\n${link}\n\nThis link expires and can only be used once. If you didn't expect this, ignore this email.`
  return { subject, html, text }
}

/** Existing account added to another tenant — no password reset, just a heads-up + login. */
export function addedToTenantEmail(businessName: string, loginUrl: string): EmailParts {
  const subject = `You've been added to ${businessName}`
  const html = WRAP(`
    <h1 style="margin:0 0 12px;font-size:20px;color:#111827">You've been added to ${businessName}</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#4b5563;line-height:1.6">
      Your existing PestFlow Pro account now has access to the ${businessName} dashboard.
      Sign in with your current email and password.
    </p>
    <p style="margin:0 0 24px">${BTN(loginUrl, 'Go to Dashboard')}</p>
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5">
      If you didn't expect this, you can safely ignore this email.
    </p>`)
  const text = `You've been added to ${businessName}.\n\nSign in with your existing email and password:\n${loginUrl}\n\nIf you didn't expect this, ignore this email.`
  return { subject, html, text }
}

/** Password recovery — recipient sets a new password. */
export function recoveryEmail(businessName: string, link: string): EmailParts {
  const subject = `Reset your ${businessName} password`
  const html = WRAP(`
    <h1 style="margin:0 0 12px;font-size:20px;color:#111827">Reset your password</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#4b5563;line-height:1.6">
      We received a request to reset the password for your ${businessName} account.
      Click below to choose a new one. This link expires and can only be used once.
    </p>
    <p style="margin:0 0 24px">${BTN(link, 'Reset Password')}</p>
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5">
      If you didn't request this, you can safely ignore this email — your password won't change.
    </p>`)
  const text = `Reset your ${businessName} password:\n${link}\n\nThis link expires and can only be used once. If you didn't request this, ignore this email.`
  return { subject, html, text }
}
