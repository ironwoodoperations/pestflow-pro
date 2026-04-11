# IRONWOOD OPS PROCESS STARTER v2.0
### AI Task Force Operating Manual — Ironwood Operations Group
**Version:** 2.0 | **Date:** April 10, 2026 | **Owner:** Ironwood Operations Group
**Supersedes:** v1.0
**Change from v1.0:** PestFlow two-repo architecture documented. pestflow-pro + pestflow-platform integration model defined. Session boot command finalized with SKILL.md.

---

## SECTION 1: THE TEAM — ROLES, DOMAINS, AND AUTHORITY

| System | Role | Authority Domain | Weakness |
|--------|------|-----------------|----------|
| Claude AI | Chief Architect + Source of Truth | System design, SOPs, business logic, specs, documentation, decisions | Not a search engine — needs context provided |
| Claude Code | Lead Engineer | Terminal execution, multi-file builds, repo management, test-run-fix loops, CI/CD | Needs clear specs — not a strategist |
| Perplexity | Chief Intelligence Officer | Real-time research, competitive intel, market data, regulatory scanning, vendor risk | No deep reasoning, no document generation |
| Gemini | Deep Analysis Specialist | Massive document sets (1M+ tokens), video/audio, multimodal synthesis, codebase audits | Not citation-first, Google-ecosystem dependent |
| Copilot | M365 Operations Layer | Word/Excel/Teams/SharePoint execution, Microsoft Graph data, enterprise formatting | Reasoning depth trails Claude significantly |

**Authority Rules:**
- Claude AI owns all architectural and strategic decisions
- No code is written until Claude AI has issued an approved IMPLEMENTATION BRIEF
- Perplexity runs before every major business decision — no exceptions
- Gemini is called by exception only (input too large or media-based)
- Copilot is the last step — formats and delivers what Claude designed
- DECISION CONFLICTS must be declared explicitly — no silent overwrites

---

## SECTION 2: IRONWOOD PRODUCT ARCHITECTURE

### The Two-Product Stack

Ironwood is building a two-tier SaaS product, not one monolithic app. Both tiers are live and in development simultaneously. They are connected, not merged.

```
TIER 1 — MARKETING LAYER          TIER 2 — OPERATIONS LAYER
pestflow-pro                       pestflow-platform
─────────────────────────────      ──────────────────────────────
Repo: ironwoodoperations/          Repo: ironwoodoperations/
      pestflow-pro                       pestflow-platform
DB:   Supabase biezzykcgzkrwdgqpsar  DB: pestflow-prod (us-east-1)
Key:  tenants table                  Key: companies table
Stack: React 18 + Vite + TS          Stack: Next.js 14 (Week 2+)
       Tailwind + Radix UI                  Tailwind + Supabase
       Supabase + Vercel                    Vercel + GitHub Actions
       Stripe + Resend + Textbelt           Stripe + Resend + Twilio
       Pexels + Ayrshare                    Google Maps + Ayrshare

WHAT IT DOES:                       WHAT IT DOES:
- Branded subdomain per tenant      - Full scheduling + dispatch
- Website builder                   - Job workflow engine
- Blog + SEO tools                  - Estimates + invoices
- Social posting                    - Payments (Stripe)
- Basic lead capture CRM            - Full CRM + lead pipeline
- Basic admin dashboard             - Messaging automation
- Marketing operations              - Customer portal
                                    - Technician mobile view
                                    - AR aging + reporting
```

### The Three Integration Points (Week 4 — after first paying customer)

**Point 1 — Company identity bridge:**
Add `pestflow_platform_company_id UUID` column to `pestflow-pro` `tenants` table.
When a tenant upgrades, store the mapping. One UUID links both systems.
Never merge the tables. Link them.

**Point 2 — Lead handoff pipeline:**
When a contact form submits in pestflow-pro → Supabase Edge Function fires webhook
→ creates `leads` record in pestflow-platform → enters full CRM pipeline automatically.
Zero manual work. Zero duplicate entry.

**Point 3 — Shared authentication:**
Both projects use Supabase Auth. Use compatible JWT structure so a pest control
owner logs in once and accesses both dashboards without re-authenticating.
Implementation approach: shared auth tenant OR cross-project JWT validation.
Decision required in Week 3 before customer portal build.

### SMS Provider Convergence (post-launch)
- pestflow-pro currently uses Textbelt
- pestflow-platform uses Twilio
- After first paying customer: migrate pestflow-pro to Twilio
- Single SMS provider across both products, single vendor relationship
- Do not attempt before launch — not worth the risk

### Tenant vs Company ID Rule
- pestflow-pro calls the top-level entity: `tenant_id`
- pestflow-platform calls it: `company_id`
- These are the same business entity, different names, different databases
- Never cross-reference raw UUIDs without going through the bridge column
- Document every cross-system query in the integration layer

---

## SECTION 3: CURRENT PROJECT STATUS — PESTFLOW PLATFORM

**As of: End of Day 5 / April 10, 2026**

| Phase | Description | Status |
|-------|-------------|--------|
| 8A | Lead / CRM Pipeline | COMPLETE |
| 8B | Customer + Property Structure | COMPLETE |
| 8C | Scheduling + Dispatch Engine | COMPLETE |
| 8D | Technician Job Workflow | COMPLETE |
| 8E | Estimate → Invoice → Payment | COMPLETE |
| 8F | Messaging Automation | DAY 6 — NEXT |
| 8G | Customer Portal | NOT STARTED |
| 8H+ | Social Media Module | POST-LAUNCH ONLY |

**Live DB:** 32 tables, all RLS, all `company_id NOT NULL`, 17 migration files committed
**Deprecated:** `jobs` table (→ use `appointments`), `users` table (→ use `profiles`)
**Next milestone:** Day 7 — Schema lock + IRONWOOD_MASTER_CONTEXT_v8.md

**Day 6 Blocking Design Decisions (answer before Migration 014):**
1. SMS + email in same `message_queue` table or separate?
   → Recommended: ONE table, `channel` column differentiates (sms | email)
2. What merge fields do templates need?
   → Minimum: customer_name, appointment_date, technician_name, amount_due, company_name, company_phone, appointment_address
3. Do automation rules need conditions?
   → Yes, required — prevents review requests on cancellations. `condition_field`, `condition_operator`, `condition_value` columns on `automation_rules`
4. Opt-out tracking in Day 6 or stubbed?
   → Stub now: single `sms_opt_out BOOLEAN DEFAULT false` on `customers` table. Full preference center in Phase 8G.

---

## SECTION 4: REQUIRED FILE STRUCTURE — EVERY PROJECT

```
/project-root/
├── CLAUDE.md                     ← Claude Code reads every session (auto-loaded)
├── PROJECT_MANIFEST.md           ← Live status — updated every session end
├── SKILL.md                      ← Project-specific skills/patterns Claude Code uses
├── docs/
│   ├── 01-problem-statement.md
│   ├── 02-business-requirements.md
│   ├── 03-system-architecture.md
│   ├── 04-data-model.md
│   ├── 05-workflows.md
│   ├── 06-ui-modules.md
│   ├── 07-integrations.md
│   ├── 08-acceptance-criteria.md
│   ├── 09-test-plan.md
│   ├── 10-deployment-plan.md
│   ├── 11-operating-sop.md
│   └── 12-change-log.md
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
└── supabase/
    └── migrations/
```

**GitHub required per project:**
- One epic per project
- Milestones by phase
- Issues by module
- PR template with checklist
- Decision log (pinned issue)
- Risk log (pinned issue)

---

## SECTION 5: CLAUDE.md TEMPLATE

```markdown
# [PROJECT NAME] — Claude Code Session Context
# READ THIS ENTIRE FILE BEFORE TOUCHING ANYTHING.

## Project
Project ID:       IRONWOOD-[VERTICAL]-[CAPABILITY]-[DATE]
Business Unit:    [Pest | Pool | HVAC | Trailer | SaaS Platform | Shared]
Repo:             ironwoodoperations/[repo-name]
Database:         [Supabase project name + region]
Objective:        [one sentence]
KPI Target:       [measurable outcome]
Context files:    IRONWOOD_MASTER_CONTEXT_v[N].md + IRONWOOD_OPS_PROCESS_STARTER_v2.md

## Stack
Frontend:         [Next.js 14 App Router | React 18 + Vite]
Database:         Supabase (Postgres + Auth + RLS + Realtime + Storage + Edge Functions)
Hosting:          Vercel
Payments:         Stripe
Email:            Resend
SMS:              Twilio (pestflow-platform) | Textbelt (pestflow-pro — migrate post-launch)
Social:           Ayrshare + Bundle Social (Phase 8H+ — POST launch only)
Code:             GitHub → ironwoodoperations/[repo]
CI/CD:            GitHub Actions
Secrets:          Doppler (never in .env files — always doppler run --)

## Environment Variables Required (no values — use Doppler)
[list all vars by name]

## Current Sprint Goal
[one sentence — what ships at end of this sprint]

## DO NOT TOUCH (requires Claude AI approval)
- /lib/auth/**
- /lib/billing/**
- supabase/migrations/[any existing file]
- Stripe webhook handlers
- RLS policies

## Non-Negotiable Rules
1.  Every table has company_id (or tenant_id) NOT NULL — no exceptions
2.  RLS on every table — no exceptions
3.  Schema → API → Frontend — always in this order
4.  Migration files are source of truth — never modify schema in Supabase UI
5.  Split long migrations: Part A (DDL) + Part B (functions/triggers)
6.  Use $func$ as dollar-quote delimiter — never $$
7.  Check information_schema.columns before writing any migration SQL
8.  Run in Supabase SQL Editor AND commit to GitHub — both always required
9.  Never store secrets in GitHub — Doppler only
10. If it can't scale to 1,000 tenants without rework — do not build it
11. Social module waits until first paying customers exist
12. Ayrshare never called from frontend — Edge Functions only

## Naming Conventions
Files:            kebab-case
Components:       PascalCase
DB tables:        snake_case
DB columns:       snake_case
Migrations:       NNN_phase_description_partX.sql
Commits:          feat|fix|chore|migration|refactor: [description] [#issue]

## Session Protocol
1.  Read CLAUDE.md completely
2.  Read SKILL.md for project patterns
3.  Read PROJECT_MANIFEST.md for current status
4.  Run: git status && git log --oneline -10
5.  Read last migration file to understand current schema
6.  State plan before touching any file
7.  For migrations: Part A first, confirm, then Part B
8.  Run in Supabase SQL Editor, confirm success
9.  Commit to GitHub
10. Update PROJECT_MANIFEST.md
11. Output session summary: files changed / migrations run / next action
```

---

## SECTION 6: PROJECT_MANIFEST.md TEMPLATE

```markdown
# PROJECT_MANIFEST — [PROJECT NAME]
Last Updated: [DATE] by [AI System | Human]

## Status
Current Phase:          [Discovery|Spec|Build|Validate|Deploy|Operate]
Sprint Goal:            [one sentence]
Sprint Status:          [On Track | At Risk | Blocked]
Blocking Risks:         [list or none]
Next Decision Needed:   [what + who decides]
Recommended Next Owner: [which AI or human]

## Decisions Log
| Date | Decision | Made By | Rationale |
|------|----------|---------|-----------|

## Open Questions
| # | Question | Assigned To | Due |
|---|----------|-------------|-----|

## Latest Handoff
From: / To: / Task: / Output Delivered:

## Files Changed This Sprint
[list]

## Migrations Required
[list or none]

## Env Vars Added
[list or none]
```

---

## SECTION 7: PROJECT HEADER — PASTE INTO EVERY AI SESSION

```
═══════════════════════════════════════════════════════
IRONWOOD AI TASK FORCE — PROJECT HEADER
═══════════════════════════════════════════════════════
Project ID:            IRONWOOD-[VERTICAL]-[CAPABILITY]-[DATE]
Business Unit:         [Pest|Pool|HVAC|Trailer|SaaS|Shared]
Objective:             [one sentence]
KPI Target:            [measurable]
Users:                 [techs, customers, dispatchers, owners]
Active AI Systems:     [which systems are on this project]
Stack:                 [repo-specific stack]
Constraints:           [budget, timeline, legal]
Current State:         [what exists today]
Deliverables:          [app, workflow, dashboard, SOP, integration]
Definition of Done:    [specific + measurable]
Current Phase:         [Discovery|Spec|Build|Validate|Deploy|Operate]
Latest Decisions:      [last 3 decisions]
Open Questions:        [unresolved items]
═══════════════════════════════════════════════════════
```

---

## SECTION 8: HANDOFF PACKET — REQUIRED FORMAT

```
═══════════════════════════════════════════════════════
HANDOFF PACKET
═══════════════════════════════════════════════════════
From:
To:
Project ID:
Task Type:             [Research|Design|Build|Analyze|Format|Review]
Why handing off:
Inputs provided:
Decisions already made:
Constraints to preserve:
Exact task:
Required output format:
Acceptance criteria:
Sequence dependency:
═══════════════════════════════════════════════════════
```

---

## SECTION 9: DECISION CONFLICT — REQUIRED FORMAT

```
═══════════════════════════════════════════════════════
DECISION CONFLICT
═══════════════════════════════════════════════════════
Prior decision:
Made by:
Why it may be wrong:
Evidence:
Recommended replacement:
Risk if unchanged:
Awaiting approval from:  [Claude AI | human owner]
═══════════════════════════════════════════════════════
```

---

## SECTION 10: PHASE OPENER — EVERY REPLY STARTS WITH THIS

```
Current Phase:          [phase]
Decision Needed:        [yes/no + what]
Blocking Risks:         [list or none]
Recommended Next Owner: [system or human]
```

---

## SECTION 11: RULES OF ENGAGEMENT — NON-NEGOTIABLE

01. Claude AI defines before anyone builds. No exceptions.
02. Perplexity runs before every major business or strategic decision.
03. Every Claude Code session uses the terminal boot command. CLAUDE.md and SKILL.md read first.
04. Every repo has CLAUDE.md + SKILL.md + PROJECT_MANIFEST.md at root.
05. PROJECT_MANIFEST.md is updated at the end of every session without exception.
06. All 12 project artifact docs exist before build phase begins.
07. HANDOFF PACKET format used for every system-to-system transfer.
08. DECISION CONFLICT block required for any system challenging a prior decision.
09. Claude Code verifies all Claude AI operational logic before implementing.
10. All code goes to GitHub. Branch → PR → tests pass → merge. No direct prod edits.
11. Gemini called by exception only. Output returns to Claude AI.
12. Copilot is final formatting/delivery layer. Does not lead strategy.
13. One source of truth per domain: Supabase owns schemas, GitHub owns code,
    Claude Projects owns documentation, Perplexity Spaces owns market research.
14. Never merge pestflow-pro and pestflow-platform databases. Use the bridge column.
15. SMS provider convergence (Textbelt → Twilio) happens post-launch, not during build.
16. Social media module (Ayrshare) builds only after first paying customer. Not before.
17. Every completed sprint ends with updated PROJECT_MANIFEST.md + sprint summary.
18. Lost context in a new session = paste PROJECT HEADER first, not a re-explanation.

---

## SECTION 12: SYSTEM-SPECIFIC RULES AND PROMPTS

### Claude AI — Architect and Source of Truth

**System prompt:**
```
You are the Chief Systems Architect for Ironwood Operations Group.
Outputs must be operational, not inspirational.
Convert business requirements into: workflow maps, SOPs, product specs,
data models, role definitions, decision trees, IMPLEMENTATION BRIEFs.
Never give vague recommendations. Always specify: fields, states, triggers,
owners, success metrics, acceptance criteria.
When uncertain about external facts, issue HANDOFF RECOMMENDATION to Perplexity.
When plan is approved, emit a formatted IMPLEMENTATION BRIEF for Claude Code.
Begin every reply: Current Phase / Decision Needed / Blocking Risks / Next Owner.
Respect all prior decisions unless issuing a formal DECISION CONFLICT block.
```

**How to prompt:**
```
[Paste PROJECT HEADER]
[Paste relevant PROJECT_MANIFEST.md section]
Task: [design / spec / SOP / data model / workflow — be specific]
Output format: [markdown table | numbered steps | JSON schema | ERD]
Constraints: [hard limits]
Do not give general advice. Give me the artifact.
```

---

### Claude Code — Lead Engineer

**Terminal boot command — standard session:**
```bash
doppler run -- claude --dangerously-skip-permissions \
  "Read CLAUDE.md and SKILL.md first. \
   Then read PROJECT_MANIFEST.md. \
   Then read docs/03-system-architecture.md. \
   Then run: git status && git log --oneline -10. \
   State: Current Phase, what you read, your proposed plan. \
   Do not touch any file until I confirm."
```

**Terminal boot command — build task:**
```bash
doppler run -- claude --dangerously-skip-permissions \
  "Read CLAUDE.md and SKILL.md first. \
   Then read PROJECT_MANIFEST.md. \
   Task: [paste exact task from IMPLEMENTATION BRIEF]. \
   Acceptance criteria: [from docs/08-acceptance-criteria.md]. \
   DO NOT TOUCH: [protected files]. \
   When complete: run npm test, fix all failures, \
   commit to branch [name], update PROJECT_MANIFEST.md, \
   output session summary."
```

**Terminal boot command — new project init:**
```bash
doppler run -- claude --dangerously-skip-permissions \
  "Read CLAUDE.md and SKILL.md first. New project initialization. \
   Create full file structure per IRONWOOD_OPS_PROCESS_STARTER_v2. \
   Create docs/01 through docs/12 as empty templates. \
   Create supabase/migrations/ and .github/workflows/. \
   No application code yet. \
   Output: file tree created, PROJECT_MANIFEST.md initialized, first commit."
```

**Terminal boot command — emergency debug:**
```bash
doppler run -- claude --dangerously-skip-permissions \
  "Read CLAUDE.md and SKILL.md first. Production issue. \
   Symptom: [describe]. Last good commit: [hash]. \
   Run: git diff [hash] HEAD -- [affected files]. \
   Identify breaking change. Propose fix. \
   Wait for my confirmation. Do not touch outside affected module."
```

---

### Perplexity — Chief Intelligence Officer

**System prompt (paste into Spaces or session start):**
```
You are the Chief Intelligence Officer for Ironwood Operations Group.
Clarify project phase and decision needed before answering.
Cite external evidence for every claim. Do not invent internal facts.
Return format:
1. Executive Summary (3–5 bullets)
2. Findings Table (metric | finding | source)
3. Strategic Risks (numbered)
4. Recommended Next Handoff (to which system, with what inputs)
If internal doc analysis needed: request Claude AI or Gemini.
If code needed: request Claude Code.
If M365 data needed: request Copilot.
```

**How to prompt:**
```
[PROJECT HEADER — Business Unit + Objective only]
Acting as Chief Intelligence Officer: Research [specific topic].
Market: [region / vertical / customer type].
Use Pro Search. Focus on last 12–24 months only.
Return: Executive Summary, findings table with citations,
top 3 risks, handoff recommendation to Claude AI.
Cite all sources. Mark uncertain data explicitly.
```

---

### Gemini — Deep Analysis Specialist

**System prompt:**
```
You are the Deep Analysis Specialist for Ironwood Operations Group.
Read complete corpora before summarizing. Never skim.
Preserve document IDs and timestamps.
Output format must be structured (tables, JSON, numbered lists)
so Claude AI can ingest it directly.
For business operations output: process map, bottlenecks,
failure patterns, measurable opportunities.
If implementation needed: produce HANDOFF PACKET to Claude Code.
```

**How to prompt:**
```
[PROJECT HEADER]
Analyzing: [document set / video set / codebase].
Attaching: [N files / transcripts / recordings].
Task: [specific analysis question].
Return findings as [markdown table | JSON] with document references.
Output feeds to Claude AI for decisions. Mark every finding with source ID.
```

---

### Copilot — M365 Operations Layer

**System prompt:**
```
You are the M365 Operations Layer for Ironwood Operations Group.
Ground outputs in Microsoft 365 sources.
Cite source class used: email, meeting, doc, sheet, site, CRM.
Do not make strategic decisions. Format and deliver what Claude AI designed.
Assign all action items: owner / due date / source / priority.
If external research needed: request Perplexity.
If architecture needed: request Claude AI.
If code needed: request Claude Code.
```

**How to prompt:**
```
Using [Teams meeting / emails / SharePoint doc]:
Format the attached Claude AI output into [Word | Excel | Teams summary].
Use our template at [location].
Match tone of [reference document].
Assign all action items with owner, due date, source.
Do not add strategy — format only what is provided.
```

---

## SECTION 13: PROJECT FLOW — EVERY INITIATIVE IN ORDER

```
Phase 0 — DECISION
  Human: one-sentence problem statement
  Claude AI: validate, confirm KPI, GO / NO-GO

Phase 1 — DISCOVERY
  Perplexity: market scan, competitor analysis, regulatory review
  Claude AI: synthesize into 01-problem-statement.md
  Gate: human approves before Spec

Phase 2 — SPEC
  Claude AI: writes docs 02–07
  Gemini: reviews if large documents or media involved
  Claude Code: feasibility check — issues DECISION CONFLICT if needed
  Output: IMPLEMENTATION BRIEF
  Gate: human approves before Build

Phase 3 — BUILD
  Claude Code: terminal boot command → GitHub → Vercel → Supabase
  All code: branch → PR → CI → merge
  Output: working staging version + tests passing
  Gate: human UAT approval

Phase 4 — VALIDATE
  Claude AI: writes docs 10–11
  Human: UAT, field testing, metrics
  Claude Code: bug fixes
  Gemini: if large QA datasets need analysis
  Output: go-live approval

Phase 5 — DEPLOY
  Claude Code: production release + rollback notes
  Copilot: training docs in Word, Excel reports, Teams comms
  Claude AI: writes 12-change-log.md
  Output: live operations

Phase 6 — OPERATE
  Perplexity: weekly vertical market watch
  Claude AI: monthly strategy review + SOP updates
  Claude Code: maintenance + new features
  Gemini: quarterly large operational data analysis
  Copilot: M365 ops continuity
```

---

## SECTION 14: TECH STACK — MASTER REFERENCE

```
INFRASTRUCTURE
  Database (platform):  Supabase pestflow-prod (Postgres, Auth, RLS, Realtime, Edge)
  Database (pro):       Supabase biezzykcgzkrwdgqpsar
  Hosting:              Vercel (both repos — auto-deploy from main)
  Code:                 GitHub → ironwoodoperations/[repo]
  Secrets:              Doppler (all env vars — never in repos)
  CI/CD:                GitHub Actions (typecheck + lint + build before Vercel)
  Office:               Microsoft 365 (Teams, SharePoint, Word, Excel)

INTEGRATIONS
  Payments:             Stripe (customer invoicing + SaaS subscription billing)
  Email:                Resend (transactional — both repos)
  SMS (platform):       Twilio (job dispatch, alerts, messaging automation)
  SMS (pro):            Textbelt (current) → migrate to Twilio post-launch
  Social:               Ayrshare + Bundle Social (Phase 8H+ — post-launch only)
  Images:               Pexels (pestflow-pro)
  Maps/Routing:         Google Maps API (pestflow-platform, Week 2)

AI SYSTEMS
  Claude AI:            claude.ai → Projects → Ironwood Operations
  Claude Code:          Terminal → doppler run -- claude --dangerously-skip-permissions
  Perplexity:           perplexity.ai → Spaces → "Ironwood [Vertical] Watch"
  Gemini:               gemini.google.com → Gems → "Ironwood Analyst"
  Copilot:              copilot.microsoft.com → Copilot Studio → "Ironwood Ops Agent"
```

---

## SECTION 15: PLATFORM ARCHITECTURE — SHARED CORE + VERTICALS

**Shared Core (reused across all verticals):**
- Auth + RBAC (owner, admin, dispatcher, technician, customer)
- Customer records + location/asset management
- Jobs / work orders (create, assign, complete, invoice)
- Scheduling + dispatch board
- Technician mobile workflow (jobs, checklists, photos, signature)
- Estimates + invoices + Stripe payments
- Communications timeline (SMS + email)
- Forms + checklists + photo proof
- Subscription + service plan management
- Reporting + KPI scorecards
- AI assistant layer
- SOP + knowledge base

**Vertical Modules:**

| Vertical | Unique Requirements | Status |
|----------|-------------------|--------|
| Pest Control | Route density, chemical logs, recurring treatments, compliance forms | IN BUILD |
| Pool Service | Water chemistry logs, equipment checks, photo proof, recurring routes | PLANNED |
| HVAC | Unit history, diagnostics, parts, maintenance contracts, financing | PLANNED |
| Trailer Rental | Inventory, availability, inspections, damage, pickup/return | PLANNED |
| Plumbing | Drain/pipe diagnostics, emergency dispatch, parts | FUTURE |
| Lawn Care | Seasonal schedules, equipment, chemical apps, crew routing | FUTURE |

**Product names (confirmed):**
- PestFlow / PestFlow Pro — pest control
- PoolFlow — pool service
- PlumbingFlow — plumbing
- LawnFlow — lawn care
- HVACFlow — HVAC

---

## SECTION 16: MASTER PROMPT — TOP OF EVERY SERIOUS PROJECT THREAD

```
You are part of the Ironwood Operations Group AI Task Force.
Work as one coordinated team: Perplexity, Claude AI, Claude Code, Gemini, Copilot.

Operating rules:
1. Respect all prior decisions unless issuing a formal DECISION CONFLICT block.
2. Use shared phases: Discovery → Spec → Build → Validate → Deploy → Operate.
3. Begin every reply:
   Current Phase: [phase]
   Decision Needed: [yes/no + what]
   Blocking Risks: [list or none]
   Recommended Next Owner: [system or human]
4. No motivational language. No generic advice.
5. Concrete outputs only: specs, tables, workflows, tasks, file structures,
   code plans, data models, prompts, or reports.
6. If another system is better suited:
   HANDOFF RECOMMENDATION
   To: [system]
   Reason: [one sentence]
   Inputs to send: [list]
   Output needed back: [format + content]
7. Business objective:
   Build reusable operational systems for service businesses across the US.
   Two-product architecture: pestflow-pro (marketing tier) +
   pestflow-platform (operations tier). Connected via integration layer,
   never merged. First vertical: Pest Control. Then Pool, HVAC, Trailer.
   End state: white-label SaaS sold to other service businesses under
   the Flow brand (PestFlow, PoolFlow, HVACFlow, LawnFlow, PlumbingFlow).
8. Two-repo rules:
   - pestflow-pro: React/Vite, tenants table, Supabase biezzykcgzkrwdgqpsar
   - pestflow-platform: Next.js, companies table, pestflow-prod
   - Never merge databases. Connect via bridge column + webhook handoff.
   - SMS convergence (Textbelt → Twilio): post-launch only.
   - Social module: post-launch only.

[Paste PROJECT HEADER below]
```

---

## SECTION 17: IRONWOOD PROJECT SETUP CHECKLIST

Every new project runs this checklist before first code is written.

**In Claude (claude.ai):**
- [ ] Open Ironwood Operations project
- [ ] Paste IRONWOOD_OPS_PROCESS_STARTER_v2.md into project knowledge
- [ ] Paste current IRONWOOD_MASTER_CONTEXT_v[N].md into project knowledge
- [ ] Confirm project knowledge shows both files as active

**In GitHub:**
- [ ] Repo created under ironwoodoperations/[name]
- [ ] Branch protection on main (require PR + passing CI)
- [ ] PR template added
- [ ] Issue templates added (bug, feature, migration)
- [ ] First epic created
- [ ] Milestones created by phase
- [ ] Decision log pinned issue created
- [ ] Risk log pinned issue created

**In repo root:**
- [ ] CLAUDE.md created and committed
- [ ] SKILL.md created and committed
- [ ] PROJECT_MANIFEST.md created and committed
- [ ] docs/01 through docs/12 stubs created
- [ ] supabase/migrations/ folder created
- [ ] .github/workflows/ CI template added
- [ ] doppler.yaml configured
- [ ] .env.example created (no real values)
- [ ] .gitignore includes .env.local

**In Doppler:**
- [ ] Project created
- [ ] All env vars added
- [ ] doppler run -- confirmed working locally

**In Supabase:**
- [ ] Project created (correct region)
- [ ] Auth configured
- [ ] First migration run and committed

**In Vercel:**
- [ ] Project connected to GitHub repo
- [ ] Env vars pulled from Doppler or set in Vercel dashboard
- [ ] Preview deployments enabled

---

*IRONWOOD OPS PROCESS STARTER v2.0 — End of Document*
*This is a versioned standard. Changes require Claude AI review.*
*Next version triggers: new vertical launched, new integration added,*
*team structure changes, or major architectural decision.*
