# PestFlow Pro — S270 / S271 Handoff (SHIPPED)

**Date:** 2026-06-16 · **Sessions:** S270 (build) + S271 (fix) · **Orchestrator:** Claude.ai (MCP-first) + Claude Code
**Theme:** Prospect Teardown Engine — built, run against real prospect (Tops), proven against a human assessment, then fixed. Tops meeting prep finalized.

## What shipped

**S270 — Prospect Teardown Engine v0.2 (PR #201, merged 3e27de9)**
- New standalone CLI tooling under tools/teardown/ — opportunity scorer + mobile walkthrough recorder + orchestrator. Sandbox only; does NOT touch provision-tenant, RLS, or any tenant-isolation path.
- Scrapes only public marketing pages, one pass per domain.
- Ran end-to-end against Tops (topspest.com). Engine worked; produced score + walkthrough + frames.

**S271 — Opportunity Scorer v0.3 (PR #202, merged 6183882)**
Three gaps proven against ground truth (the human Tops assessment) and fixed:
- FIX 1: hosted-builder detection (Wix/Squarespace/GoDaddy/Duda) -> new signals.platform, +20. v0.2 reported Wix as "Other/Unknown" and scored 0 — the single biggest miss.
- FIX 2: platform-boilerplate denylist — Wix's "Website Builder" footer no longer earns the bogus +8 vendor credit; real "Site by <Agency>" credits still do.
- FIX 3: placeholder/template-leftover scan — placeholder phone +15, other leftovers +8, capped +20.
- Recorder: scroll dwell 1200->2500ms so the clip clears ~15s and all four frames (2/6/10/14s) land in-bounds (v0.2 produced a 7.6s clip -> only 2 frames; failed acceptance #2/#3).

## Validation result (the point of the exercise)

v0.3 re-run on Tops, verified against a live fetch of topspest.com (2026-06-16):
- platform: "Wix" (was "Other/Unknown")
- Placeholder phone "(222) 222-222" caught — confirmed live on the page, malformed 11-digit shape and all
- Bogus "Website Builder" vendor credit gone
- Tier moved D->B (score 12 -> 52) — now matches the human assessment's "strong upgrade target" read. Engine and analyst agree.

Engine is validated on the Wix path. Still optional-but-recommended before calling it fully proven: run v0.3 against one real WordPress pest-control site to confirm a genuine Blue Duck still tiers A/B correctly.

## Known scorer issues (logged for v0.4 — none blocking)
- Bracket-placeholder false positive: FIX 3's bracket regex matched "[AddressInput]" (a Wix form-field component name in script/config), not visible copy. Too greedy against builder output. Should require visible body copy or exclude single-CamelCase code-identifier tokens. NOT cited to Kyle.
- hasGA false positive: scorer reports hasGA: true off Wix internal CSS classes (g-calculated, g-frontend, etc.), not a real GA4/UA tag. Tighten the GA fingerprint.
- h1Count source-vs-rendered: scorer counts 3 H1s in rendered HTML; the human assessment counted 2. Minor, non-blocking.

## Tops / Kyle meeting — state (prospect meeting this week)

Verdict: B-tier, strong upgrade target. A teardown is the WRONG asset — Tops is well-served. The play is the human assessment ("you did this better than most; here's how a purpose-built platform takes good to dominant"), NOT the scorer's framing.

Assessment corrected and ready (Topps-Pest-Control-Website-Assessment.docx, held in Scott's local/project files — not committed to the repo):
- FIXED: Section 3 "No visible analytics or lead tracking" was factually wrong — the live site has Google Search Console verified + Wix built-in analytics. Rewritten to "Limited, platform-locked tracking" (defensible: GSC verified, Wix analytics present, but no dedicated lead-attribution setup). This was the one credibility landmine; it's defused.

Meeting ammunition (all verified live 2026-06-16):
- LEAD WITH: placeholder phone "(222) 222-222" live on the homepage next to a CTA. Real, costing calls now.
- Platform is Wix — confirmed beyond doubt. Ownership/lock-in argument is solid.
- Strong schema + city/service pages — confirmed; credit it honestly.

Know before the meeting (not in the assessment): Tops has Wix Bookings installed — they already take some bookings online. Don't imply zero booking. Frame Remi + integrated lead capture as "one system tying booking, calls, follow-up, reviews, content together," not "you don't have booking."

## Carried forward / next up (unchanged)
- Tops onboarding shell decision — post-meeting call. provision-tenant v97, render_model=standard path validated (S258/S259 dry-run). If Kyle says yes, real tenant creation — Tops only, never a random site.
- Remi warm transfer — VAPI-dashboard config.
- Claire two-identity setup — murphygurl92->Dang admin repoint + claire@homeflowpro.ai operator login.
- Open follow-ups: two bold-local cosmetic nits, provision-tenant v97 .com->.ai drift, role-store SSOT, export-tenant-data, Remi ring-delay, PROJECT_MANIFEST log churn.
- NEW backlog: scorer v0.4 (three known issues above); optional WordPress-site validation run to fully close engine-proving.
