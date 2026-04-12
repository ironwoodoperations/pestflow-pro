# IRONWOOD IMPROVEMENT TASKS
**Purpose:** Things that make the platform and team better — not features, not bugs.
**Rule:** None of these block current work. Pull from this list between sprints or when a session finishes early.
**Owner:** Review with Claude AI before starting any item. Each one needs a mini-spec before Claude Code touches it.

---

## TIER 1 — DO THESE SOON (before Week 3 frontend build)

### T1-01 — Convert SKILL.md to .claude/skills/ folder (both repos)
**Why:** Sharper Claude Code context per task type. Less noise in CLAUDE.md.
**What:** Create `.claude/skills/` folder in pestflow-pro and pestflow-platform.
**Files to create:**
- `architect.md` — schema rules, API design patterns, data model decisions
- `frontend.md` — component patterns, Tailwind conventions, Radix UI usage
- `devops.md` — Vercel deploy rules, GitHub Actions, Doppler, cron jobs
- `qa.md` — test patterns, RLS verification, edge case checklist
- `security.md` — OWASP basics, RLS audit rules, Stripe webhook security, auth patterns
**Boot command update:** Change both CLAUDE.md boot sequences to read `.claude/skills/[relevant].md` based on task type instead of single SKILL.md.
**Estimated effort:** 2–3 hours
**Repo:** Both

---

### T1-02 — Stripe live mode (pestflow-pro)
**Why:** Nothing else matters until real payments work. This is the revenue gate.
**What:** Manual task — Scott only. Claude Code not involved.
**Steps:**
1. Doppler → pestflow-pro project → swap STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY to live keys
2. Stripe dashboard → Webhooks → add production endpoint → copy signing secret
3. Doppler → update STRIPE_WEBHOOK_SECRET to live signing secret
4. Test with a real $1 charge on a test tenant
5. Confirm webhook fires and subscription activates
**Estimated effort:** 20 minutes
**Repo:** pestflow-pro

---

### T1-03 — Kirk DNS flip (Dang custom domain)
**Why:** Dang Pest Control is a live paying client. Custom domain should be live.
**What:** Manual task — Kirk + Scott. Claude Code not involved.
**Steps:**
1. Kirk adds CNAME record pointing dang domain to pestflowpro.com
2. Scott flips `verified = true` in tenants table for Dang slug
3. Confirm custom domain serves correctly
**Estimated effort:** 15 minutes + DNS propagation wait
**Repo:** pestflow-pro (DB change only)

---

### T1-04 — Cypress Creek bundle.social team setup
**Why:** Social posting is a selling feature. Cypress Creek cannot use it without this.
**What:** Manual task — Scott only.
**Steps:**
1. Log into bundle.social
2. Create team for Cypress Creek
3. Connect their social accounts
4. Test a post from pestflow-pro admin SocialTab
**Estimated effort:** 30 minutes
**Repo:** pestflow-pro (no code change)

---

## TIER 2 — DO THESE DURING WEEK 2 (API layer build)

### T2-01 — Resend email templates (pestflow-pro)
**Why:** Plain text emails work but look unprofessional. Client-facing emails need branding.
**What:** Claude Code task.
**Templates needed:**
- Welcome email (new tenant signup)
- Site reveal (when site goes live)
- Client intake request
- DNS verification instructions
- Dunning (failed payment)
**Approach:** Resend template builder or React Email components stored in `/emails/` folder.
**Spec needed from:** Claude AI before Claude Code builds
**Estimated effort:** 3–4 hours
**Repo:** pestflow-pro

---

### T2-02 — Supabase webhooks → Zapier Session A (ZAP 1–5)
**Why:** Automation between pestflow-pro events and external tools.
**What:** Scott sets up Supabase webhooks, Claude Code wires the edge functions.
**Zapier flows 1–5:** (define with Claude AI before building — exact flows TBD)
**Dependency:** Scott must create Zapier account and define the 5 flows first
**Spec needed from:** Claude AI
**Estimated effort:** 2–3 hours
**Repo:** pestflow-pro

---

### T2-03 — Zapier Session B (ZAP 6–9)
**Why:** Continuation of automation layer.
**What:** Scott-driven — defines remaining Zapier flows.
**Dependency:** Zapier Session A complete
**Estimated effort:** 2 hours
**Repo:** pestflow-pro

---

### T2-04 — Day 6 design decisions answered + Migration 014 (pestflow-platform)
**Why:** THIS IS THE CURRENT BLOCKER. Messaging automation schema.
**What:** Answer 4 design questions then Claude Code writes Migrations 014 + 015.
**Design decisions (recommended answers):**
1. SMS + email → ONE message_queue table, channel column (sms | email)
2. Merge fields → customer_name, appointment_date, technician_name, amount_due, company_name, company_phone, appointment_address
3. Automation rules need conditions → YES, add condition_field + condition_operator + condition_value
4. Opt-out → stub now with sms_opt_out BOOLEAN DEFAULT false on customers table
**Estimated effort:** 4–5 hours
**Repo:** pestflow-platform

---

### T2-05 — Day 7 schema lock + IRONWOOD_MASTER_CONTEXT_v8.md
**Why:** Database must be declared production-ready before API layer starts.
**What:** Full schema audit + documentation + new master context file.
**Checklist:**
- Every table has company_id NOT NULL
- No RLS policy deviates from standard pattern
- Deprecated tables not referenced anywhere
- ERD generated
- All 19+ migrations committed and documented
**Estimated effort:** 4 hours
**Repo:** pestflow-platform

---

## TIER 3 — DO THESE DURING WEEK 3 (frontend build)

### T3-01 — Mobile Maestro skill file
**Why:** Technician mobile view is a Week 3 deliverable. Claude Code needs mobile-specific rules.
**What:** Create `.claude/skills/mobile.md` covering:
- Touch interaction patterns
- PWA requirements
- Safe area handling (iOS notch)
- Offline-first considerations for field technicians
- Bottom nav conventions
**Spec needed from:** Claude AI
**Estimated effort:** 1 hour (spec writing)
**Repo:** pestflow-platform

---

### T3-02 — Dang custom pages use Dang shell styling
**Why:** Custom pages currently render in default shell, not Dang's visual identity.
**What:** Claude Code task — contained to CustomPage renderer component.
**Dependency:** Read current CustomPage renderer before scoping
**Estimated effort:** 1–2 hours
**Repo:** pestflow-pro

---

### T3-03 — pestflow-pro + pestflow-platform integration bridge (Point 1)
**Why:** Sets up the company identity link between both products.
**What:** Add pestflow_platform_company_id UUID column to pestflow-pro tenants table.
**Migration:** One-line ALTER TABLE — straightforward.
**Note:** This is structural only. No UI change. No user-facing impact.
**Spec needed from:** Claude AI to confirm column name and FK constraints
**Estimated effort:** 30 minutes
**Repo:** pestflow-pro (schema only)

---

### T3-04 — Lead handoff webhook (Integration Point 2)
**Why:** Contact form submissions in pestflow-pro should auto-create leads in pestflow-platform.
**What:** Supabase Edge Function in pestflow-pro fires on new contact_submissions insert → POST to pestflow-platform webhook → creates leads record.
**Dependency:** pestflow-platform API layer must exist (Week 2 complete)
**Spec needed from:** Claude AI — define payload shape and webhook auth
**Estimated effort:** 3–4 hours
**Repo:** Both

---

### T3-05 — Auth compatibility review (Integration Point 3)
**Why:** Long-term, one login should access both products.
**What:** Claude AI analysis task — not a build task yet.
**Question to answer:** Shared Supabase auth tenant vs cross-project JWT validation — which approach fits the current architecture?
**Deliverable:** Decision memo from Claude AI, not code
**Estimated effort:** 1 hour (analysis)
**Repo:** Neither — Claude AI session only

---

## TIER 4 — POST FIRST PAYING CUSTOMER

### T4-01 — SMS convergence (Textbelt → Twilio in pestflow-pro)
**Why:** Two SMS providers sending to same customers is a support and billing problem.
**What:** Replace Textbelt calls in pestflow-pro with Twilio.
**Rule:** Do not touch until pestflow-platform is live and Twilio is proven stable.
**Estimated effort:** 2–3 hours
**Repo:** pestflow-pro

---

### T4-02 — Social media module Phase 8H (pestflow-platform)
**Why:** Ayrshare integration for operations-layer social automation.
**Rule:** Do not build until first paying customer exists. No exceptions.
**What:** Schema (social_brand_profiles, social_posts, social_post_platforms, social_schedules) + Claude API for content generation + Ayrshare via Edge Functions.
**Spec needed from:** Claude AI (full spec, not a stub)
**Estimated effort:** 1 week
**Repo:** pestflow-platform

---

### T4-03 — Static site export (pestflow-pro)
**Why:** Some clients may want a static export of their site.
**What:** Low priority — define use case before building.
**Estimated effort:** TBD
**Repo:** pestflow-pro

---

### T4-04 — Firecrawl upgrade
**Why:** Current Firecrawl usage may have limitations at scale.
**What:** Scott evaluates plan tier — manual decision, not a build task.
**Estimated effort:** 30 minutes (research + upgrade if needed)
**Repo:** Neither

---

### T4-05 — PoolFlow vertical
**Why:** Second vertical on the shared platform core.
**What:** Clone pest control vertical schema, adapt for pool service (water chemistry logs, equipment checks, photo proof, recurring routes).
**Rule:** Do not start until PestFlow has first paying customer and schema is proven stable.
**Spec needed from:** Claude AI + Perplexity (market research first)
**Estimated effort:** 2–3 weeks
**Repo:** New repo — ironwoodoperations/poolflow-platform

---

## HOW TO USE THIS LIST

**Starting a new session:** Tell Claude AI "Pull my next task from IRONWOOD_IMPROVEMENT_TASKS.md" and state which tier is appropriate for where you are in the roadmap.

**Completing a task:** Tell Claude Code to update this file — move the item to a COMPLETED section at the bottom with the date and commit hash.

**Adding a new task:** Tell Claude AI the idea, it writes the task card in the correct format, you paste it into the right tier.

**Never:** Start a Tier 2+ task during a Tier 1 sprint. Finish what is blocking first.

---
*Last updated: April 12, 2026*
*Next review: After Day 7 schema lock*
