# PestFlow Pro — S272 Handoff (SHIPPED)

**Date:** 2026-06-16 · **Session:** S272 · **Orchestrator:** Claude.ai (MCP-first) + Claude Code

## What this session was

Started as a routine Claire login fix; uncovered and resolved a TOTAL PRODUCTION OUTAGE — the live site (pestflowpro.ai and all tenant subdomains) was serving a broken build to every real user. Only discovered because Claire (sales director) couldn't log in. No monitoring caught it.

## Root cause (the one-liner)

**Production is a Next.js app that reads `NEXT_PUBLIC_SUPABASE_*` env vars. Those were empty strings in Vercel Production scope (and flagged "Sensitive," which silently blocks dashboard in-place edits). With no Supabase URL/key, every public tenant page returned "Site Not Found" and the Next-rendered lead forms (ContactForm/QuoteForm) failed. The admin login path (Vite app, `VITE_SUPABASE_*`) was a SEPARATE concern that also had a placeholder `aBcDe` URL in Production scope.**

## Why it took so long to fix (lessons — READ THESE)

1. **Two apps, two env-var families.** Repo builds `build:vite && build:next`. Vite admin SPA reads `VITE_*`; Next public shells read `NEXT_PUBLIC_*`. We fixated on `VITE_*` first; the public-site outage was actually `NEXT_PUBLIC_*`. ALWAYS confirm which build serves the domain in question before touching env vars.
2. **Vercel "Redeploy" does NOT rebuild.** It re-publishes the existing (cached/overridden) build artifact. ~8 dashboard redeploys changed nothing. The only reliable fix was the CLI: `vercel pull --environment=production && vercel build --prod && vercel deploy --prebuilt --prod --force`.
3. **"Sensitive"-flagged env vars cannot be edited in place** — must delete + re-add. Silent save failures wasted multiple cycles.
4. **Duplicate env-var rows** (same key, overlapping Production + Pre-Production scopes) caused unpredictable build values. Dedupe to one row per key, all environments.
5. **Wrong verification target.** We grepped the Vite `dist/assets/index-*.js` bundle to verify — but the production `vercel build` emits Next output to `.vercel/output` and produces NO `dist/` at all. The Vite hash never changing was a red herring; we were measuring a stale artifact the prod build doesn't even ship. CORRECT verification is curling the actual rendered Next page (e.g. `curl https://urban-strike.pestflowpro.ai/ | grep -i "Site Not Found"`).

## The fix that worked

1. Deduped + corrected Production env vars (delete Sensitive ones, re-add via CLI):
   - VITE_SUPABASE_URL = https://biezzykcgzkrwdgqpsar.supabase.co
   - VITE_SUPABASE_ANON_KEY = (real anon key)
   - NEXT_PUBLIC_SUPABASE_URL = https://biezzykcgzkrwdgqpsar.supabase.co
   - NEXT_PUBLIC_SUPABASE_ANON_KEY = (real anon key)
   All four scoped to all environments, NOT Sensitive.
2. Forced clean CLI deploy from Codespace: `vercel pull --environment=production && vercel build --prod && vercel deploy --prebuilt --prod --force`. Aliased to pestflowpro.ai.
3. Verified live: urban-strike.pestflowpro.ai renders real content; dang.pestflowpro.ai/admin/login works. Confirmed on Scott's tablet AND Claire's device.

## Backend confirmed healthy throughout

Supabase (biezzykcgzkrwdgqpsar) was never the problem: anon REST returned 200 with data the whole time. RLS `anon_read_tenants` USING(true) correct. The fault was 100% the frontend env/deploy layer.

## Also done this session (Claire cleanup — the original task)

- Deleted Claire's broken/orphaned auth identity (murphygurl92@gmail.com had profiles.tenant_id pointed at operator tenant instead of Dang — a latent cross-tenant RLS exposure across 6 policies that scope by profiles.tenant_id).
- Deleted 5 orphan/test auth users (scottdevore2@gmail.com, murphynyc@yahoo.com, verify@s168test.example, admin-placeholder@s169.test, scott@homflowpro.ai) across all three role stores (user_roles, tenant_users, profiles, auth.users).
- DISCOVERED: there are THREE role stores — profiles (tenant-scoped), tenant_users (tenant-scoped, what ProtectedRoute reads), user_roles (global, FK-enforced to auth.users). SSOT drift is real and logged.
- Claire's login was left AS-IS per Scott's decision (not re-added this session).

## Carried forward / next up

- **MONITORING GAP (new, high priority):** Add production uptime/health check so a broken deploy is caught automatically, not by a customer call. Even a simple cron curling `urban-strike.pestflowpro.ai` for "Site Not Found" would have caught this. Scope a real check.
- **Cleanup:** close/delete throwaway branches chore/rebuild-env, chore/rebuild-2 and PRs #204/#205 (rebuild commits, not real code).
- Supabase URL Configuration still localhost:3000 + no redirect URLs — fix before any OAuth/magic-link/password-reset flow.
- Set the 4 Supabase env vars to NOT Sensitive so future edits don't silently fail.
- Original roadmap items UNTOUCHED and still next: invite-team-member feature (customer self-serve team logins — fully scoped this session, ready to build), Remi warm transfer, Claire two-identity setup, optional scorer WordPress validation.
