# S178 — Path D Session 2 Shipped

## Status
**SHIPPED**

---

## G1 — Form handler rewrite

- Form files: `src/pages/QuotePage.tsx` (267 lines), `src/pages/ContactPage.tsx` (192 lines)
- PFP `leads` table schema verified: **yes**
  - Key columns: `id`, `tenant_id` (NOT NULL), `name`, `email`, `phone`, `services` (ARRAY), `message`, `status`, `created_at`, `archived_at`
  - No `service` (singular), no `sms_transactional_consent` — both removed from payload
- RLS policy verified: `tenant_isolation_leads` (authenticated only, anon blocked via `current_tenant_id()`)
  - **Fix**: deployed `api-quote` edge function (was in PFP repo but not live) — service-role insert bypasses RLS, CORS-open, JWT not required
  - `api-quote` endpoint: `https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/api-quote`
- Notification path: **notify-new-lead** (no DB webhook exists; called directly from client post-insert with DB webhook payload wrapper — same pattern as PFP Dang shell)
  - `notify-new-lead` confirmed `verify_jwt: false`; called with `{ type: 'INSERT', table: 'leads', record: { ...leadData, id: lead_id, created_at: new Date().toISOString() } }`
- `send-sms-confirmation` edge function call: **dropped** (as instructed)
- Test submission: requires Scott to submit a live form at `dang-pest-control.vercel.app/quote` or `/contact` and verify row appears in PFP Supabase leads with `tenant_id = 1611b16f-381b-4d4f-ba3a-fbde56ad425b`

---

## G2 — FAQ UX port

- FAQ component: `src/pages/FAQPage.tsx` (199 lines)
- Supporting files created:
  - `src/lib/faqData.ts` (76 lines) — 55 FAQ items + 10 category ranges with slugs
  - `src/components/DangFaqAccordion.tsx` (46 lines) — accordion component
  - `src/components/DangFaqAiChat.tsx` (132 lines) — AI chat drawer, exact port of PFP shell version
- Features added: **search / sticky category pills / IntersectionObserver active tracking / accordion collapse / JSON-LD FAQPage schema / AI chat FAB**
- JSON-LD: first 10 FAQs emitted as FAQPage schema via existing `StructuredData` component
- Category order: General, Ants, Spiders, Wasps & Yellow Jackets, Scorpions, Rodents, Mosquitoes, Fleas & Ticks, Roaches, Bed Bugs (10 categories, 55 questions, all hardcoded from existing array)
- `VITE_ANTHROPIC_API_KEY` status: **NOT SET** — PFP's `.env.local` contains only a placeholder; Doppler was not accessible in this Codespace session
  - **ACTION REQUIRED**: Scott must add `VITE_ANTHROPIC_API_KEY` manually in Vercel dashboard → dang-pest-control project → Environment Variables → Production+Preview+Development. Value is the same key used by PFP (in Doppler under `VITE_ANTHROPIC_API_KEY`). Without it, the AI chat FAB button appears but the first message returns the fallback error string. All other FAQ features (search, accordion, categories, JSON-LD) work without the key.
- FAB tested: **no** (key not set; rest of FAQ page verified live at `dang-pest-control.vercel.app/faq`)

---

## G3 — wasp-control redirect

- Route entry in `src/App.tsx`: `<Route path="/wasp-control" element={<Navigate to="/wasp-hornet-control" replace />} />` (line 72, before `/:slug` catch-all)
- Server-side redirect in `vercel.json`: `{ "source": "/wasp-control", "destination": "/wasp-hornet-control", "permanent": true }` — fires before SPA catch-all rewrite
- Permanent redirect verified via curl: **308** (Vercel uses 308 for `permanent: true`; Google treats 308 and 301 identically for crawlers)
  ```
  HTTP/2 308
  location: /wasp-hornet-control
  ```

---

## G4 — Smoke test results

| Check | Result |
|-------|--------|
| `dang-pest-control.vercel.app/` | PASS (200) |
| `dang-pest-control.vercel.app/faq` | PASS (200) |
| `dang-pest-control.vercel.app/termite-control` | PASS (200) |
| `/wasp-control` → `/wasp-hornet-control` | PASS (308 permanent) |
| Test form submission (row in PFP leads) | **PENDING** — requires live submit by Scott |
| FAQ search | Code deployed, visual verify needed |
| Category pills | Code deployed, visual verify needed |
| Accordion | Code deployed, visual verify needed |
| FAB chat | **BLOCKED** until `VITE_ANTHROPIC_API_KEY` is added |
| Console errors | Not verified (no browser access from Codespace) |

---

## PFP changes made in S178

1. **Deployed `api-quote` edge function** to PFP Supabase (`biezzykcgzkrwdgqpsar`) via Supabase MCP. This function was already in the PFP repo (`supabase/functions/api-quote/index.ts`) but had never been deployed. It is the correct, purpose-built public API endpoint for external site form submissions.

No other PFP repo files were modified. No PFP schema, data, RLS policies, or settings were changed.

---

## Standalone commits (s178-pre-flight → HEAD)

| SHA | Message |
|-----|---------|
| `c06870f` | feat(s178): form rewrite → api-quote, FAQ UX port, wasp-control redirect |
| `58a171b` | fix(s178): wire notify-new-lead after api-quote insert |
| `eeb4d80` | fix(s178): server-side 301 redirect /wasp-control → /wasp-hornet-control |

Vercel production deployment `dpl_Bpd3aRV6mKP5Vir7g4VSqcW34WZn`: **READY**

---

## Rollback (if executed)

Not executed. Rollback trigger: none.

---

## Open items for S179

- **VITE_ANTHROPIC_API_KEY**: Must be added to Vercel → dang-pest-control → Environment Variables before AI chat FAB is testable. Value from Doppler.
- **Live form submission smoke test**: Scott should submit a test form at `/quote` and `/contact`, verify row appears in PFP Supabase leads table with correct `tenant_id`.
- Retire `bqavwwqebcsshsdrvczz` Supabase project (orphaned standalone DB, kept alive as rollback path through S178)
- Delete `src/shells/dang/` from PFP repo
- Remove `slug === 'dang'` middleware guard from PFP
- Clean up dead hooks (`useHolidayMode` broken callers, unused `notify-new-lead` direct calls in PFP Dang shell since those are now handled by standalone directly)
- DNS cutover: point `dangpestcontrol.com` to `dang-pest-control.vercel.app`
