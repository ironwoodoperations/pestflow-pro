# PestFlow Pro — Project Context (Session 44 Ready)
_Maintained by Scott / Ironwood Operations Group_
_Do not let Claude Code overwrite this file — it is generated here and handed to Claude Code_

---

## ⚠️ SESSION RULES
- Stop and output a summary at 50% context window — do not go past this
- Keep responses short and action-focused
- After every Claude Code task: `git add . && git commit -m "description" && git push`
- Working directly on main — no PR needed
- Follow the session roadmap exactly. Log conflicts in commit messages.
- Do NOT generate a session 45 context file. End with a plain summary only.

---

## CRITICAL CONSTANTS (never change)

```
Live URL:       https://pestflowpro.com
Admin URL:      https://pestflowpro.com/admin/login
GitHub:         https://github.com/ironwoodoperations/pestflow-pro
Supabase URL:   https://biezzykcgzkrwdgqpsar.supabase.co
Supabase ID:    biezzykcgzkrwdgqpsar
Demo Tenant ID: 9215b06b-3eb5-49a1-a16e-7ff214bf6783
Demo Admin:     admin@pestflowpro.com / pf123demo
Dev server:     doppler run -- npm run dev -> localhost:8080
Model:          claude-sonnet-4-6 (ALWAYS — no exceptions)
Stack:          React 18 + TypeScript + Vite + Tailwind + Supabase + Vercel
```

---

## DEMO COMPANY

```
Name:        Ironclad Pest Solutions
Phone:       (903) 555-0142
Email:       info@ironclad-pest.com
Address:     1204 S. Main Street, Tyler, TX 75701
Slug:        ironclad
Hours:       Mon-Fri 7am-6pm | Sat 8am-2pm
Tagline:     Pest Control You Can Count On.
Founded:     2009
Industry:    Pest Control
```

---

## TEST TENANTS

```
Lone Star Pest Defense
  Tenant ID:   7e8acdd5-b258-4a8c-9124-22b24383e3c3
  Slug:        lonestarpest
  URL:         https://lonestarpest.pestflowpro.com
  Admin:       admin@lonestarpestdefense.com / lspd123demo
  Plan:        Tier 2 — Grow — $149/mo

Peakview Pest Control (test client — provisioned via Stripe flow)
  Slug:        peakviewpestcontrol
  URL:         https://peakviewpestcontrol.pestflowpro.com
  Admin:       info@peakviewpest.com / PeakviewpestcontrolPest26!
  Plan:        Tier 2 — Grow — $149/mo
  Shell:       clean-friendly
  Payment:     paid (test mode)
```

---

## BUILD STATUS (end of S43)

- Build: 0 TS errors
- Bundle: 387 kB — under 450 kB limit ✅
- Full Stripe payment flow: working end-to-end
- Webhook: fixed (`--no-verify-jwt` on stripe-webhook function)
- PaymentSuccess page: polls tenants table — only shows ready when tenant exists
- provision-tenant v5: `tenants.name` NOT NULL handled
- RLS: anon SELECT policies added to `tenants` + `settings` — public sites work
- Pest image auto-search: PestImagePicker.tsx with Pexels auto-query per slug
- Setup fee: still not showing on Stripe checkout (subscription only) — carry to S44

---

## ⚠️ KNOWN REMAINING ISSUE — Setup fee not on checkout

The $2,000 setup fee is still not appearing as a line item in Stripe checkout.
Only the $149/mo subscription shows. The invoice item approach is implemented in
`create-checkout-session` but not rendering. This must be fixed in S44.

Stripe docs: to include a one-time fee with a subscription checkout, create an
`InvoiceItem` on the customer BEFORE creating the checkout session. Stripe will
bundle it into the first invoice automatically.

The correct sequence:
1. Create or retrieve Stripe Customer by email
2. Create InvoiceItem: `stripe.invoiceItems.create({ customer, price: setupPriceId })`
   or for custom amount: `stripe.invoiceItems.create({ customer, amount, currency: 'usd', description: 'Setup Fee' })`
3. Create Checkout Session with mode: 'subscription', only the subscription price
4. Stripe bundles the pending invoice item into the first payment

---

## STRIPE SETUP

```
Webhook endpoint: https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/stripe-webhook
Webhook name:     pestflow-pro-webhook (sandbox)
Events:           checkout.session.completed, invoice.payment_succeeded,
                  customer.subscription.deleted
JWT verification: disabled (--no-verify-jwt) — Stripe signature handles security
```

Price IDs in Doppler + Supabase secrets:
```
STRIPE_PRICE_STANDARD_SETUP      = price_1TIZ0uCZBM0TUusSbUjj6yTX  ($2,000)
STRIPE_PRICE_CUSTOM_MIGRATION    = price_1TIZ1rCZBM0TUusSm3PEXfLu  ($3,500)
STRIPE_PRICE_PREMIUM_MIGRATION   = price_1TIZ3XCZBM0TUusSZmWrD0VW  ($5,000)
STRIPE_PRICE_STARTER             = price_1TIZ6DCZBM0TUusSaC2UdcYG  ($99/mo)
STRIPE_PRICE_GROW                = price_1TIZA1CZBM0TUusSJfld1aNT  ($149/mo)
STRIPE_PRICE_PRO                 = price_1TIZE2CZBM0TUusSPFZZVDQk  ($249/mo)
STRIPE_PRICE_ELITE               = price_1TIZF1CZBM0TUusSuoAbLJZT  ($499/mo)
```

---

## EDGE FUNCTIONS

| Function | Status | Notes |
|---|---|---|
| notify-new-lead | ACTIVE | FROM: no-reply@pestflow.ai |
| send-review-request | ACTIVE v2 | From: no-reply@pestflow.ai |
| publish-scheduled-posts | ACTIVE | FB Graph API v19.0 + pg_cron |
| send-sms | ACTIVE | TEXTBELT_API_KEY set |
| send-onboarding-email | ACTIVE | From: onboarding@pestflow.ai |
| provision-tenant | ACTIVE v5 | tenants.name handled |
| create-checkout-session | ACTIVE | Setup fee invoice item not rendering — fix S44 |
| stripe-webhook | ACTIVE | --no-verify-jwt, signature verified in code |

---

## PROVISION-TENANT (v5)

1. Auto-creates tenants row with slug + name (NOT NULL safe)
2. Creates auth user via Admin API (no NULL columns)
3. Inserts into tenant_users (has_role passes on first login)
4. Seeds all 11 settings keys with correct shapes
5. Returns tenant_id in response
6. Called automatically by stripe-webhook after payment confirmed

---

## PRICING MODEL

| Package | Upfront | Monthly |
|---|---|---|
| Standard Build (template) | $2,000 | $99-$499/mo |
| Custom Migration (Firecrawl rebuild) | $3,500 | $99-$499/mo |
| Premium Migration (Firecrawl + new design) | $5,000 | $99-$499/mo |

Monthly tiers: Tier 1 Starter $99 / Tier 2 Grow $149 / Tier 3 Pro $249 / Tier 4 Elite $499

---

## SETTINGS KEYS (JSONB) — ALL 11 REQUIRED

```
business_info        -> {name, phone, email, address, hours, tagline, industry,
                         license, certifications, founded_year, num_technicians}
branding             -> {logo_url, primary_color, accent_color, template, cta_text, favicon_url}
customization        -> {hero_headline, show_license, show_years,
                         show_technicians, show_certifications}
social_links         -> {facebook, instagram, google, youtube}
integrations         -> {google_place_id, facebook_page_id, facebook_access_token,
                         google_analytics_id, pexels_api_key, textbelt_api_key,
                         owner_sms_number, ayrshare_api_key, google_maps_api_key}
onboarding_complete  -> {"complete": true}
hero_media           -> {"youtube_id": "", "thumbnail_url": ""}
holiday_mode         -> {"enabled": false, "holiday": "", "message": "", "auto_schedule": ""}
notifications        -> {"cc_email": "", "lead_email": "", "monthly_report_email": ""}
demo_mode            -> {"active": false, "seeded_at": ""}
subscription         -> {"tier": 1, "plan_name": "Starter", "monthly_price": 99}
```

---

## RLS STATUS (after S43 fix)

| Table | anon SELECT | authenticated SELECT |
|---|---|---|
| tenants | ✅ USING (true) | ✅ |
| settings | ✅ USING (true) | ✅ |
| tenant_users | ❌ anon blocked (correct) | ✅ own rows only |
| stripe_payments | ❌ anon blocked (correct) | ✅ own tenant only |

---

## SHELL SYSTEM (stable — do not modify in S44)

```
src/shells/
  modern-pro/     navy+emerald, centered hero
  bold-local/     charcoal+amber, 2-col split hero
  clean-friendly/ white+sky, giant phone CTA hero
  rustic-rugged/  brown+rust, split left/right hero
  youpest/        dark charcoal+green, migration demo
```

---

## CLIENT SETUP WIZARD — 7 STEPS

1. Business Info
2. Plan selection
3. Template selection (4 shells)
4. Integrations
5. Review → "Continue to Payment →"
6. Payment — generates Stripe checkout link (setup fee + subscription)
7. Success screen

---

## RULES (NEVER VIOLATE)

- Model is ALWAYS claude-sonnet-4-6
- Relative imports only — NO @/ aliases
- Single useState object for forms — never per-field state
- maybeSingle() not single() for settings queries
- All files under 200 lines — check with wc -l before editing, split first
- Admin tabs lazy-loaded with React.lazy()
- PageHelpBanner on every admin tab
- Footer "Powered by PestFlow Pro" badge on ALL shells
- HolidayBanner ABOVE Navbar — PublicShell handles this
- Working directly on main — no PR needed
- Stop and output a summary at 50% context window — no exceptions
- Do NOT generate a context file — plain summary only at end
- Dev server: always doppler run -- npm run dev — never npm run dev directly

---

## PERMANENTLY OUT OF SCOPE

- Invoice generator / Customer portal / Technician calendar
- PDF reports / PDF export / Self-serve pricing page

---

## SESSION LOG

| Session | Date | Key Completions |
|---------|------|----------------|
| 1-29 | Mar-Apr 2026 | Full platform build |
| 30 | Apr 2026 | Shell infrastructure + Modern Pro + Bold & Local |
| 31 | Apr 2026 | Clean & Friendly + Rustic & Rugged shells |
| 32 | Apr 2026 | Customization layer, Ayrshare posting, Facebook UX |
| 33 | Apr 2026 | 4 ShellHomeSections built |
| 34 | Apr 2026 | Legal checkboxes, /terms + /privacy, provision-tenant, Client Setup wizard |
| 35 | Apr 2026 | Bundle 463 to 370 kB. Rebuilt 3 shell heroes |
| 36 | Apr 2026 | Pest images, shell CTA colors, TCPA consent, Lighthouse caching. Bundle: 375 kB |
| 37 | Apr 2026 | Dashboard redesign (SEO/Social widgets, plan card, amber padlocks). GoogleMapEmbed |
| 38 | Apr 2026 | Subdomain routing live. lonestarpest.pestflowpro.com resolves. Doppler wired |
| 39 | Apr 2026 | Tenant auth isolation. has_role fixed. lonestarpest login working |
| 40 | Apr 2026 | provision-tenant v3. Firecrawl tool. youpest shell. Bundle: 384 kB |
| 41 | Apr 2026 | provision-tenant v4. Wizard delivery-ready. Prices fixed. Template picker. Success screen |
| 42 | Apr 2026 | Stripe checkout + webhook. 7-step wizard. Bundle: 384 kB |
| 43 | Apr 2026 | Webhook 401 fix. RLS anon fix. provision-tenant v5. Pest image picker. Bundle: 387 kB |

---

## ROADMAP

| Session | Focus |
|---------|-------|
| S44 | Setup fee fix + Billing tab + polish — this session |
| S45 | First real paying client delivery |

---

## SESSION 44 SCOPE

### Focus 1 — Fix Setup Fee on Stripe Checkout (carry from S43)

`create-checkout-session` edge function must be fixed so the setup fee appears
as a line item in the Stripe checkout alongside the subscription.

Check Supabase edge function logs first:
```bash
npx supabase functions logs create-checkout-session --project-ref biezzykcgzkrwdgqpsar
```

Correct implementation:
1. Retrieve or create Stripe Customer by email
2. Create InvoiceItem on the customer BEFORE the session:
   ```typescript
   await stripe.invoiceItems.create({
     customer: customer.id,
     price: setupPriceId,  // or use amount + currency + description for custom
     currency: 'usd',
   })
   ```
3. Create Checkout Session with `mode: 'subscription'` + subscription price only
4. Stripe automatically bundles the pending invoice item

After fixing, test with a new throwaway slug (use `setuptest` as slug).
Stripe test card: `4242 4242 4242 4242` / 12/29 / 424
Confirm checkout page shows both: Setup Fee ($2,000) AND Grow Plan ($149/mo).
Clean up `setuptest` tenant from DB after confirming.
Re-deploy function after fix:
```bash
npx supabase functions deploy create-checkout-session --project-ref biezzykcgzkrwdgqpsar
```

---

### Focus 2 — Billing Tab

Add a Billing tab to the admin sidebar.

File: `src/components/admin/tabs/BillingTab.tsx`
- Must be lazy-loaded with React.lazy()
- Must have PageHelpBanner
- Must stay under 200 lines — split if needed

Content:
- Current plan name + price (from settings.subscription)
- Payment history table: date, description, amount, status — from stripe_payments table
- If no payments: "No payment history yet"
- "Need to upgrade or change your plan?" → mailto:scott@ironwoodoperationsgroup.com?subject=Plan Change Request

Add to admin sidebar nav — visible to all plan tiers.

---

### Focus 3 — Onboarding Email on Provision

When `stripe-webhook` calls `provision-tenant` after payment, fire the
`send-onboarding-email` edge function with the client's email, name, live URL,
and admin login credentials.

The `provision_data` stored in `stripe_payments` has everything needed:
- `provision_data.email` — client email
- `provision_data.business_info.name` — company name
- `provision_data.slug` — for live URL construction
- `provision_data.admin_password` — generated password

Call from `stripe-webhook` after successful provisioning:
```typescript
await fetch(`${supabaseUrl}/functions/v1/send-onboarding-email`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${serviceRoleKey}`
  },
  body: JSON.stringify({
    to: provision_data.email,
    company_name: provision_data.business_info.name,
    live_url: `https://${provision_data.slug}.pestflowpro.com`,
    admin_url: `https://${provision_data.slug}.pestflowpro.com/admin/login`,
    admin_email: provision_data.email,
    admin_password: provision_data.admin_password,
  })
})
```

Re-deploy stripe-webhook after this change.

---

## SESSION 44 TASK ORDER

1. Check create-checkout-session logs — find why setup fee invoice item not rendering
2. Fix invoice item creation — re-deploy function
3. Test with `setuptest` slug — confirm both line items appear in checkout
4. Run payment through with test card — confirm provisioning still works
5. Clean up setuptest tenant
6. Build BillingTab (lazy, PageHelpBanner, under 200 lines)
7. Wire onboarding email into stripe-webhook post-provision
8. Re-deploy stripe-webhook
9. Final build — 0 TS errors, bundle under 450 kB
10. Plain summary only — no context file

---

## SESSION 44 STARTER BLOCK

Here is the full project context for PestFlow Pro. Read it completely before doing anything.

[paste full contents of this MD file]

Session 43 complete. End-to-end Stripe payment flow working. RLS anon policies added.
Pest image auto-search built. Bundle: 387 kB.

One carry-over: setup fee ($2,000) is not showing on Stripe checkout — only the
subscription renders. Fix this first in S44.

Then: Billing tab in admin, onboarding email on provision.

Do NOT generate a session 45 context file. End with a plain summary only.
Stop and output a summary at 50% context window.
Report exact bundle size after final build.
Dev server: doppler run -- npm run dev — never npm run dev directly.
