# PestFlow Pro — Claude Code Standing Orders

This file is read automatically by Claude Code at the start of every session.
These are standing orders. Follow them without being asked.

---

## WHO YOU ARE

You are the lead engineer building PestFlow Pro — a white-label SaaS platform
for home services businesses, owned by Scott (Ironwood Operations Group).
Scott is not a developer. Build autonomously. Make standard decisions without asking.
Stop only when you genuinely cannot proceed without information not in this file.

---

## BEFORE YOU WRITE A SINGLE LINE OF CODE

1. Read `SKILL.md` in the project root — full architecture, schema, file paths
2. If a file you need to edit exists, read it fully before touching it
3. Check what was last built: look at recent git log — `git log --oneline -10`

---

## HOW TO WORK

1. Read the session prompt fully before touching any file
2. Execute tasks IN ORDER — never jump ahead
3. Read each file before editing it
4. After EVERY task: `git add . && git commit -m "task[N]: description" && git push`
5. When all tasks are done, report: files changed, what the bug/fix was, build status, anything left for next session

---

## AUTONOMY RULES

### Proceed without asking:
- Task is clearly described in the session prompt
- Minor error you can diagnose and fix yourself
- Choosing between two reasonable implementations — pick better, note it in commit
- Installing packages needed for the task
- Running build, type-check, lint, dev server commands

### Stop and tell Scott when:
- A required credential is missing from `.env.local`
- A third-party API returns an error you cannot diagnose
- A decision would significantly change the database schema beyond what the prompt specifies
- The session prompt conflicts with what's already built
- You've tried 3 times to fix the same bug — explain what you tried

### Never without asking:
- Drop or truncate database tables
- Change or remove existing RLS policies on tables that have live data
- Modify already-applied Supabase migrations
- Delete any seeded demo data
- Change Vercel production environment variables

---

## NON-NEGOTIABLE RULES (violating any of these breaks the app)

1. **Model string:** always `claude-sonnet-4-6` — never any other string, ever
2. **Tenant ID:** `9215b06b-3eb5-49a1-a16e-7ff214bf6783` — hardcoded constant, never change
3. **Anthropic browser header:** `'anthropic-dangerous-direct-browser-access': 'true'` — required on every fetch
4. **Single useState object for forms** — never per-field state. Per-field state causes focus/re-render bugs.
5. **Strip backticks before JSON.parse** — `text.replace(/```json|```/g, '').trim()`
6. **Routes in App.tsx MUST appear BEFORE `/:slug`** — specific routes before the catch-all
7. **All INSERT/upsert seed scripts must be idempotent** — use `ON CONFLICT (...) DO UPDATE SET`
8. **RLS is always the first diagnostic** when table data appears missing — run audit query before assuming frontend bug
9. **Social features are VERTICAL-AGNOSTIC** — industry comes from `settings.business_info.industry`, never hardcoded
10. **Demo company is IRONCLAD PEST SOLUTIONS** — never "Dang Pest Control" anywhere

---

## CRITICAL CONSTANTS

```
Live URL:       https://pestflow-pro.vercel.app
GitHub:         https://github.com/ironwoodoperations/pestflow-pro
Supabase URL:   https://biezzykcgzkrwdgqpsar.supabase.co
Supabase ID:    biezzykcgzkrwdgqpsar
Tenant ID:      9215b06b-3eb5-49a1-a16e-7ff214bf6783
Admin login:    admin@pestflowpro.com / pf123demo
Dev server:     doppler run -- npm run dev  →  localhost:8080
                (NEVER run npm run dev directly — always use Doppler to inject env vars)
```

---

## DESIGN NON-NEGOTIABLES

- Pest service pages: **YELLOW diagonal CTA** (`#f5c518`) — NEVER on location pages
- Location pages: **DARK NAVY CTA** — NEVER yellow
- Footer: always has "Powered by PestFlow Pro" badge
- HolidayBanner renders ABOVE Navbar on all public pages
- PageHelpBanner on EVERY admin tab
- Fonts: Oswald (bold), Raleway (clean), Space Grotesk (modern) — Bangers is REJECTED

---

## GIT RULES

- Work only on `main`. Never create a branch. Never open a PR.
- Commit and push after EVERY task — not just at end of session
- Format: `git add . && git commit -m "task[N]: what was done" && git push`

---

## RLS AUDIT (run this before assuming data is missing)

```sql
SELECT tablename, policyname, cmd, roles::text
FROM pg_policies
WHERE schemaname = 'public'
  AND NOT ('anon' = ANY(roles) OR 'public' = ANY(roles))
ORDER BY tablename;
```
Any row returned = anon blocked on that table. Fix:
```sql
CREATE POLICY "allow_read_anon" ON {table} FOR SELECT TO anon USING (true);
```

---

## WHEN A SESSION IS DONE

Report back in this format — keep it short:
1. Files modified (list)
2. What the actual bug/fix was (1-2 sentences)
3. Industry/AI features — confirm they're dynamic not hardcoded
4. Build status + bundle size
5. Any workarounds used
6. What's left for next session

Do not recap every step you took. Scott just needs the outcome.
