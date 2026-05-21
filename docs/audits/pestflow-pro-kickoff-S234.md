# PestFlow Pro — Session kickoff: S234

## Goal

Fix the broken **Testimonials → Import Google Reviews** feature in admin by refactoring the Places API call from client-side (Vite SPA) to a Supabase edge function. Move the API key from Doppler/`VITE_*` exposure to Edge Function Secrets. Populate the tenant's `settings.integrations.google_place_id` server-side from already-captured `google_fid` / `google_cid` so the Reviews import has a stable identifier to query.

## Test/pilot tenant

Dang (`dangpestcontrol.com`, slug `dang`, UUID `1611b16f-381b-4d4f-ba3a-fbde56ad425b`). Kirk's admin is at `dang.pestflowpro.ai/admin`. The "Import Google Reviews" button currently shows a red error banner — that's the regression to fix.

## Tier impact

Testimonials is a tier-1 feature (available on every plan including Starter). Refactor must not change the tier-gate surface. Confirm during /investigate.

## Surfaces affected

- `src/components/admin/ReviewsTab.tsx` — caller of the broken Places API call
- `src/components/admin/TestimonialsTab.tsx` — second caller (per v94 todo `places-api-server-refactor` item)
- `supabase/functions/places-reviews/` — likely needs creation (may already exist as a stub — verify in /investigate)
- `_shared/auth/requireTenantUser.ts` — auth helper for tenant-context edge fns (C2 pattern; do NOT modify, just import)
- `_shared/cors.ts` — CORS helper (do NOT modify)
- Doppler entry `VITE_GOOGLE_PLACES_API_KEY` — to be **deleted by Scott post-merge**, not by CC Web
- Supabase Edge Function Secret `GOOGLE_PLACES_API_KEY` — to be **set by Scott pre-merge**, not by CC Web
- `tenants.settings.integrations.google_place_id` — currently empty on Dang per v93 audit; needs server-side population from `google_fid` + `google_cid` (already captured per S222 GBP metadata work)

## Protected paths touched

- `supabase/functions/_shared/auth/` — read-only, do NOT edit
- No migration files (`supabase/migrations/`) expected for this work

**Validator gate REQUIRED.** This change touches the auth surface (new edge fn, tenant-context requireTenantUser pattern) and exposes a previously client-side API key as a server-side secret. Per standing rule: **Perplexity AND Gemini both required before implementation.** Document waiver only if tooling unavailable, with explicit Scott approval.

---

## Wave 1 — /investigate (death audit)

Run `/investigate` and produce `docs/audits/s234-places-api-refactor-audit.md`. Probe questions:

1. **Current broken state — what does the user actually see?**
   - Open Dang admin, navigate to Testimonials tab
   - Reproduce the "Import Google Reviews" failure
   - Capture: console error, network request URL + status, response body
2. **Current code path — what's the call shape?**
   - In `ReviewsTab.tsx` and `TestimonialsTab.tsx`, find every Places API call
   - Note: API key source (env var name), URL pattern, params, response shape consumed
3. **Edge fn inventory**
   - Does `supabase/functions/places-reviews/` already exist as a stub?
   - List all edge fns matching `places-*` or `reviews-*`
4. **Tenant data state**
   - Query: `SELECT slug, settings->'integrations'->>'google_place_id' AS place_id, settings->'integrations'->>'google_fid' AS fid, settings->'integrations'->>'google_cid' AS cid FROM tenants WHERE slug = 'dang';`
   - Confirm: `google_place_id` is empty/null; `google_fid` and `google_cid` are populated
5. **Doppler state**
   - Is `VITE_GOOGLE_PLACES_API_KEY` present in `pestflow-pro/prd`? Capture the truncated key prefix (first 6 chars) for verification — do not paste the full value into the audit doc
6. **Tier gate**
   - Confirm Testimonials tab is currently visible to tier 1+. The refactor must not change this

Stop-and-report after Wave 1. Do NOT implement until Scott reviews the audit and validator gate completes.

---

## Wave 2 — Spec + validator gate

After /investigate audit is reviewed:

1. Draft `docs/audits/s234-places-api-refactor-spec.md` with:
   - Edge fn name and route (`places-reviews`)
   - Request/response contract (JSON shape)
   - Auth pattern (`requireTenantUser` C2)
   - Place ID resolution logic: read `settings.integrations.google_place_id`; if empty, server-side resolve from `google_fid` via Places API FindPlaceFromText, then write back to `settings.integrations.google_place_id` for caching
   - CORS allowlist (use existing `_shared/cors.ts` helpers)
   - Error states (no Place ID, no FID/CID, Places API quota exceeded, network failure)
2. Submit spec to Perplexity AND Gemini for validator gate
3. Capture both responses in `docs/audits/s234-validator-gate.md`
4. Resolve any disagreements with Scott before implementation

---

## Wave 3 — Implementation

Only after Wave 2 validator gate is GREEN:

1. Create `supabase/functions/places-reviews/index.ts`:
   - C2 pattern: `requireTenantUser` gate, `verify_jwt: true`
   - Reads `GOOGLE_PLACES_API_KEY` via `Deno.env.get()` (Edge Function Secret, NOT Vault)
   - Place ID resolution + cache-back to `settings.integrations.google_place_id` via service-role client
   - Returns normalized reviews payload
2. Update `ReviewsTab.tsx` and `TestimonialsTab.tsx`:
   - Replace client-side Places API fetch with `supabase.functions.invoke('places-reviews', ...)` call
   - Use `supabase.auth.refreshSession()` pattern, include Authorization Bearer + apikey headers per PFP convention
   - Preserve existing UI states (loading, empty, error)
3. Do NOT delete `VITE_GOOGLE_PLACES_API_KEY` from Doppler — that's Scott's post-merge action
4. Do NOT change tier gating or Testimonials nav placement

---

## Wave 4 — /qa + /review

1. Run `/qa` — produce `QA_REPORT_S234.md`. Include:
   - Local reproduction of the original broken state on `main` (baseline)
   - Local reproduction of the fix on the feature branch
   - Smoke tests: tier-1 demo tenant (e.g., `coastal-pest`) Testimonials Import Reviews works; cross-tenant 403 if you fake another tenant's JWT
   - Test on Dang's actual data — does it return real reviews?
2. Run `/review` — produce `REVIEW_S234.md`. Hard gate: no CRITICAL or HIGH findings before /ship.

---

## Wave 5 — /ship

Standard `/ship` workflow (PR creation + auto-merge OFF — Scott reviews and merges manually per PFP convention).

- Branch: per CC Web convention (`claude/places-api-refactor-*` or `feat/s234-places-api-server-refactor`)
- PR title: `task[s234]: places API server-side refactor — fixes Testimonials Import Google Reviews`
- PR body: summary + auth-surface acknowledgment + validator-gate waiver/results link + post-merge Scott actions checklist

**Do NOT use `--auto` merge.** Open the PR, wait for Vercel preview READY + CI green, then stop. Scott reviews and merges.

---

## Stop-and-report after PR open

Report back to Scott (whatever channel is active — chat or session-end manifest) with:
1. PR number + URL
2. Vercel preview status + URL
3. CI status (Validate + ci both green)
4. Link to QA_REPORT + REVIEW files in the PR
5. Validator gate disposition (PASS / PASS-WITH-WAIVER + reason)
6. Outstanding Scott actions (see below)

---

## Post-merge Scott actions (NOT CC Web)

1. **Pre-merge:** Set Supabase Edge Function Secret `GOOGLE_PLACES_API_KEY` via Supabase Dashboard → Project Settings → Edge Functions → Secrets (NOT Doppler, NOT Vault). Use the value currently in Doppler `VITE_GOOGLE_PLACES_API_KEY`.
2. **Post-merge:** Verify on production Dang admin that Import Google Reviews now works (reviews populate, no red banner).
3. **Post-merge:** Delete `VITE_GOOGLE_PLACES_API_KEY` from Doppler `pestflow-pro/prd` and `dev` configs.
4. **Post-merge:** Verify `settings.integrations.google_place_id` on Dang is now populated (server-side cache-back worked).
5. **Post-merge:** Audit `GOOGLE_API_DANG_PLACES` Doppler entry status (v94 todo rank 5 item) — may be a legacy duplicate, delete if confirmed unused.

---

## Success criteria

- Testimonials → Import Google Reviews button works on Dang admin, returns real reviews
- No `VITE_GOOGLE_PLACES_API_KEY` references in client bundle (verify via build output grep)
- `places-reviews` edge fn deployed, `verify_jwt: true`, requireTenantUser gate enforced
- Cross-tenant access returns 403 (verified in QA)
- Dang's `settings.integrations.google_place_id` populated server-side
- No tier-gate behavior change on Testimonials tab
- Validator gate documented PASS (or WAIVER with Scott approval)
- All CI checks green; Vercel preview READY

---

## Out of scope for S234

- Image folder feature (rank 9 in v94) — that's S235
- Local keyword research (rank 3 in v94) — backlog
- Any other tenant's Place ID setup — Dang only as pilot

---

## Carry-forward context

- Main HEAD at S234 start: `987ad69` (post-S233 close)
- Active todo: v94 (rank 10 = this work)
- v94 todo lives outside repo in Claude.ai project knowledge; the rank-10 item entry has additional context
- S222 GBP metadata work captured `google_fid` + `google_cid` for Dang (and others) — those are the upstream IDs this work resolves to a place_id from
- S213c-B established the C2 (`requireTenantUser`) auth pattern across 27 edge fns; mirror that pattern exactly
- Edge fn deploy via Supabase MCP `deploy_edge_function` with `verify_jwt: False` is the established pattern (CLI is fallback only)

---

*Kickoff drafted by Claude.ai for S234. CC Web runs autonomously from here per wave protocol. Scott is available in a fresh Claude.ai chat for Q&A during the session if needed.*
