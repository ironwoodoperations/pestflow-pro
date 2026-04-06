# PestFlow Pro — S64 Claude Code Prompt
_Hand this to Claude Code. Work on main. Do not generate a context file._

---

## SESSION RULES
- Read PESTFLOW-SKILL.md at session start
- After every task: `git add . && git commit -m "task[N]: description" && git push`
- Dev server: `doppler run -- npm run dev` — never plain npm run dev
- All files under 200 lines — split if needed
- STOP at 50% context window and output plain summary
- Do NOT generate a context file — plain summary only at end

## CRITICAL CONSTANTS
```
Supabase ID:  biezzykcgzkrwdgqpsar
Demo Admin:   admin@pestflowpro.com / pf123demo
Model:        claude-sonnet-4-6
Edge functions deploy command: supabase functions deploy <name> --project-ref biezzykcgzkrwdgqpsar --no-verify-jwt (provision-tenant only)
provision-tenant MUST always use --no-verify-jwt. All others use standard deploy without that flag.
```

---

## BACKGROUND

Two edge functions are broken blocking first real client provisioning (Cypress Creek Pest Control). No external tools touched the code — all fixes are being applied fresh here.

---

## TASK 1 — Clean up stale Cypress Creek partial provision

Previous failed provision attempts may have left partial rows in the database that will cause the next attempt to fail on slug conflict or duplicate auth email.

Run this SQL in Supabase SQL editor (project biezzykcgzkrwdgqpsar):

```sql
-- Find stale tenant
SELECT id, slug, name FROM tenants WHERE slug = 'cypress-creek-pest-control';

-- If row exists, get its tenant_id then clean up all related rows
-- Replace <tenant_id> with the actual UUID found above
DELETE FROM settings WHERE tenant_id = '<tenant_id>';
DELETE FROM page_content WHERE tenant_id = '<tenant_id>';
DELETE FROM profiles WHERE tenant_id = '<tenant_id>';
DELETE FROM tenants WHERE slug = 'cypress-creek-pest-control';

-- Also check for orphaned auth user
-- Go to Supabase Dashboard → Authentication → Users
-- Delete any user with email admin@cypresscreekpest.com if it exists
```

After cleanup, confirm:
```sql
SELECT id FROM tenants WHERE slug = 'cypress-creek-pest-control';
-- Should return 0 rows
```

Commit: `task[1]: clean stale cypress creek partial provision`

---

## TASK 2 — Fix create-checkout-session: stripe_payments insert crashes before returning URL

**File:** `supabase/functions/create-checkout-session/index.ts`

**Problem:** The `stripe_payments` table insert runs after the Stripe session is created but has no try/catch. If the insert fails for any reason (table missing, type mismatch, missing SUPABASE_SERVICE_ROLE_KEY secret), the function throws and the outer catch returns `{ error: ... }` — the `{ url }` is never sent back. The Stripe session WAS created successfully but the frontend gets no URL.

**Fix:** Wrap the stripe_payments insert in its own try/catch so it is non-fatal. The URL must always be returned if the Stripe session was created successfully.

Find the section after the Stripe session is created and before the return. Change it from:

```typescript
await supabase.from('stripe_payments').insert({ ... })
return json({ url: session.url, session_id: session.id })
```

To:

```typescript
try {
  await supabase.from('stripe_payments').insert({ ... })
} catch (insertErr: any) {
  console.error('stripe_payments insert failed (non-fatal):', insertErr.message)
}
return json({ url: session.url, session_id: session.id })
```

Also improve the outer catch block to surface the actual Stripe error message:

```typescript
} catch (err: any) {
  console.error('create-checkout-session error:', err?.message, err?.type, err?.code)
  return json({ error: err?.message || 'Internal server error' }, 500)
}
```

After editing, deploy:
```bash
supabase functions deploy create-checkout-session --project-ref biezzykcgzkrwdgqpsar
```

Commit: `task[2]: fix create-checkout-session stripe_payments insert non-fatal`

---

## TASK 3 — Fix ironwood-provision: surface real error instead of swallowing it

**File:** `supabase/functions/ironwood-provision/index.ts`

**Problem:** The outer catch block returns a generic `'Internal server error'` and throws away `err.message`. Also, if `provision-tenant` returns unexpected HTML (cold start) instead of JSON, `await provRes.json()` throws and you get the generic error with no useful info.

**Fix part A:** Log and surface the real error in the catch block:

```typescript
} catch (err: any) {
  console.error('ironwood-provision error:', err?.message)
  return json({ error: err?.message || 'Internal server error' }, 500)
}
```

**Fix part B:** Safely parse the provision-tenant response. Wrap the JSON parse so a non-JSON response (HTML error page) doesn't crash silently:

```typescript
const rawText = await provRes.text()
let result: any
try {
  result = JSON.parse(rawText)
} catch {
  console.error('provision-tenant returned non-JSON:', rawText.slice(0, 500))
  return json({ error: 'provision-tenant returned an unexpected response. Check edge function logs.' }, 500)
}

console.log('provision-tenant result:', JSON.stringify(result))

if (!result.success) {
  return json({ error: result.error || 'Provision failed' }, 500)
}
```

After editing, deploy:
```bash
supabase functions deploy ironwood-provision --project-ref biezzykcgzkrwdgqpsar
```

Commit: `task[3]: fix ironwood-provision error surfacing and JSON parse safety`

---

## TASK 4 — Fix provision-tenant: add customization to RequestBody type and handle duplicate auth user

**File:** `supabase/functions/provision-tenant/index.ts`

**Fix A — customization missing from RequestBody interface:**

The body destructures `customization: bodyCustomization` but the `RequestBody` interface doesn't define it. Add it:

```typescript
interface RequestBody {
  // ... existing fields ...
  customization?: {
    hero_headline?: string
    show_license?: boolean
    show_years?: boolean
    show_technicians?: boolean
    show_certifications?: boolean
  }
}
```

**Fix B — duplicate auth user fails silently:**

When the same email is provisioned twice, `createUser` fails but the function continues — tenant is created, settings seeded, but no admin login user. Add an explicit check:

Find the `createUser` call and add error handling:

```typescript
const { data: authUser, error: createUserError } = await adminClient.auth.admin.createUser({
  email: adminEmail,
  password: adminPassword,
  email_confirm: true,
})

if (createUserError) {
  // If user already exists, look them up instead of failing
  if (createUserError.message?.includes('already been registered') || createUserError.message?.includes('already exists')) {
    console.warn('Auth user already exists for email:', adminEmail, '— proceeding with existing user')
    // Continue — tenant and settings will still be seeded correctly
  } else {
    console.error('createUser failed:', createUserError.message)
    return json({ success: false, error: `Failed to create admin user: ${createUserError.message}` })
  }
}
```

After editing, deploy WITH --no-verify-jwt (NEVER omit this flag):
```bash
supabase functions deploy provision-tenant --project-ref biezzykcgzkrwdgqpsar --no-verify-jwt
```

Commit: `task[4]: fix provision-tenant customization type and duplicate auth user handling`

---

## TASK 5 — Test the full flow end to end

After all four tasks are complete and deployed, do a full test:

1. Verify Cypress Creek prospect in /ironwood has:
   - Admin Email populated (admin@cypresscreekpest.com)
   - Plan set to Grow
   - Setup Fee set to 499
   - Slug: cypress-creek-pest-control

2. Click **Generate Setup Invoice** → should return an invoice URL, no error

3. Click **Generate Subscription Link** → should open a Stripe checkout URL, no error

4. Click **Create Site** → should succeed with no "Provision failed" error

5. If any step still fails, check Supabase edge function logs:
   - Dashboard → Logs → Edge Functions
   - Filter to the failing function
   - Copy the exact error line and include it in the session summary

Commit: `task[5]: e2e test complete — note results in summary`

---

## DONE CRITERIA
- [ ] No stale Cypress Creek tenant rows in DB
- [ ] Generate Setup Invoice succeeds
- [ ] Generate Subscription Link succeeds  
- [ ] Create Site succeeds — tenant provisioned, admin login works at cypress-creek-pest-control.pestflowpro.com/admin
- [ ] All three edge functions redeployed
- [ ] All changes pushed to main
