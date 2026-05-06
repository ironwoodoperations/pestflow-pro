-- S194 PR 1: Update dang tenant's branding.theme from 'dang' to 'modern-pro'
--
-- Context:
-- S190 deleted src/shells/dang/ from Vite but the dang.pestflowpro.com
-- middleware carve-out remained active. S192 audit confirmed dang was
-- rendering via Vite SPA falling through to modern-pro default. S194 PR 1
-- retires the carve-out so dang renders via Next.js App Router.
--
-- The Next.js layout dispatcher (app/tenant/[slug]/layout.tsx) matches
-- against five exact theme strings and renders an explicit error page
-- ("Theme not yet ported") for unrecognized themes — there is no default
-- shell. theme='dang' must move to a valid Next.js shell name BEFORE the
-- routing change activates, or dang.pestflowpro.com renders broken.
--
-- modern-pro chosen as the closest match to dang's historical Vite
-- fallthrough behavior. CSS vars adapt to dang's primary (#F97316) and
-- accent (#06B6D4) via computeShellCssVars — no visual mismatch concern.
--
-- Idempotent: predicate matches only rows where theme='dang', so re-running
-- after migration applies is a no-op.

UPDATE settings
SET value = jsonb_set(value, '{theme}', '"modern-pro"')
WHERE tenant_id = '1611b16f-381b-4d4f-ba3a-fbde56ad425b'
  AND key = 'branding'
  AND value->>'theme' = 'dang';

-- Reload PostgREST schema cache (defensive; schema unchanged but matches
-- standing pattern from S189 onward).
NOTIFY pgrst, 'reload schema';
