# IRONWOOD OPERATIONS GROUP — MASTER BUILD CONTEXT v7
## Session Handoff Document | Last Updated: March 2026

---

## HOW TO USE THIS FILE
Upload this file to every new Claude chat session.
Tell Claude: "Read this file first. This is the full context for building PestFlow. Ask no questions — just read and confirm you understand, then wait for instructions."

---

# SECTION 1 — WHO WE ARE

**Owner:** Scott Devore (Solo founder/operator — not a coder but executes precisely)
**Company:** Ironwood Operations Group (holding company)
**Primary Build:** PestFlow — vertical SaaS for pest control companies
**Future Products:** PoolFlow, PlumbingFlow, LawnFlow, HVACFlow (same core architecture)
**Goal:** $100M+ exit-ready SaaS platform within 5 years
**Immediate Goal:** First paying customers within 30 days
**Scott's Daily Capacity:** 5–7 hours/day
**Devices:** Microsoft Surface Pro 11 + Samsung Galaxy Tab S10+ + Samsung S25 Ultra

---

# SECTION 2 — INFRASTRUCTURE STATUS

## Microsoft 365 (PARTIALLY COMPLETE)
- Tenant: ironwoodoperationsgroup.com ✅
- Product domain: pestflow.ai ✅
- Admin accounts configured ✅
- Security: MFA on, Defender on, Safe Links on ✅

### M365 Account Structure (CONFIRMED)
| Account | Type | Status |
|---------|------|--------|
| admin@IronwoodOperationsGroup.onmicrosoft.com | Licensed User | Break-glass recovery account — DO NOT TOUCH |
| scott@ironwoodoperationsgroup.com | Licensed User | Scott's daily driver — DO NOT TOUCH |
| billing@ironwoodoperationsgroup.com | Unlicensed | Needs conversion to shared mailbox |
| sales@ironwoodoperationsgroup.com | Needs conversion | Microsoft sync errors — retry later |
| dev@ironwoodoperationsgroup.com | Needs conversion | Microsoft sync errors — retry later |
| security@ironwoodoperationsgroup.com | Needs conversion | Microsoft sync errors — retry later |
| support@ironwoodoperationsgroup.com | Needs conversion | Microsoft sync errors — retry later |

### M365 Pending Tasks
- [ ] Convert billing@, sales@, dev@, security@, support@ to shared mailboxes (Microsoft sync was erroring — retry when M365 cooperates)
- [ ] Finalize Conditional Access policies
- [ ] Verify Audit logging ON in Microsoft Purview
- [ ] Secure break-glass admin account (MFA, document credentials in Key Vault)

## Supabase (ACTIVE — PRIMARY BUILD)
- Org: Ironwood Operations Group
- **Primary project: pestflow-prod** (AWS us-east-1, ACTIVE, NANO tier)
- **Tenant project: tenant-alpha-dang** (AWS us-west-2, ACTIVE — Dang Pest Control proof of concept, Day 26 task)

### CRITICAL DECISIONS LOCKED
1. **Tenant isolation field: `company_id`** — NOT tenant_id. Every table uses company_id. This is final.
2. **Previous schema was scrapped** — ChatGPT built a website CMS, not a SaaS. Clean slate confirmed.
3. **Migration files are the source of truth** — all schema changes go through SQL migrations, committed to GitHub.
4. **Appointments table IS the job record** — jobs table is deprecated. Appointments extended into full lifecycle engine.
5. **Auto-generate all subscription appointments on creation** — quarterly plan = 4 appointments generated instantly. Enables revenue forecasting, routing projections, hiring planning.
6. **Checklist model is two-layer** — checklist_templates (service plan level) + appointment_checklist_items (per job instance). This is final.
7. **Materials tracking uses catalog with SKUs + free-text escape hatch** — EPA reg numbers stored in catalog. materials_used JSONB on appointments. This is final.
8. **GPS tracking is check-in/check-out only for Phase 8D** — technician_locations table stub built, automations wired in Phase 8G.
9. **Estimates do NOT convert directly into invoices** — they seed invoice line items when an invoice is generated. Invoices are separate records linked by FK. convert_estimate_to_invoice() function handles the conversion.
10. **Subscription billing is per-visit (appointment-level invoicing)** — one invoice per completed visit. Not period billing. Clean, reportable, matches dispatch board structure.
11. **Line items are separate relational tables** — estimate_line_items and invoice_line_items. NOT JSONB. Required for revenue reporting and gross margin per job.
12. **Payment methods: credit_card, ach, check, cash, other** — Stripe fields stubbed in Phase 8E, wired in Phase 8F.

---

# SECTION 3 — DATABASE STATUS (pestflow-prod)

## Migrations Completed
| Migration | Status | What It Did |
|-----------|--------|-------------|
| Migration 001 | ✅ COMPLETE | Fixed companies table, added RLS to all 16 existing tables, created handle_updated_at() trigger, created current_user_company_ids() helper function, added indexes |
| Migration 002 | ✅ COMPLETE | Created profiles table extending auth.users, auto-create profile trigger on signup, RLS on profiles |
| Migration 003 | ✅ COMPLETE | Phase 8A: leads, pipeline_stages, lead_tasks, lead_notes — full CRM engine with RLS, indexes, seed function |
| Migration 004 | ✅ COMPLETE | Extended customers table: customer_type, company_name, secondary contact, full address, autopay, net_terms, do_not_contact, referred_by, tags, internal_notes, status check constraint, 3 indexes |
| Migration 005 | ✅ COMPLETE | Extended properties table: access_notes, pest_history, service_preferences, foundation_type, lot_size, year_built, number_of_units, is_active, property_type check constraint, 2 indexes |
| Migration 006 | ✅ COMPLETE | lead_to_customer conversion function: converts lead → customer + property in one call, marks lead as converted, tested end-to-end |
| Migration 007 | ✅ COMPLETE | customer_subscriptions table, auto-generate appointments trigger, cancel_subscription() function — tested end-to-end with 4 quarterly appointments auto-generated |
| Migration 008 | ✅ COMPLETE | Full job lifecycle engine on appointments: status check constraint, 7 lifecycle columns, GPS check-in/out, materials, followup, invoice_id FK, route_sequence, advance_appointment_status() function — tested end-to-end through full lifecycle |
| Migration 009 | ✅ COMPLETE | Dispatch board engine: technician_schedules table, dispatch_log audit trail, assign_appointment() function, get_dispatch_board() function |
| Migration 010 Part A | ✅ COMPLETE | Phase 8D DDL: checklist_templates, checklist_template_items, appointment_checklist_items, appointment_photos. Fixed missing updated_at on technicians. |
| Migration 010 Part B | ✅ COMPLETE | Phase 8D Functions: generate_appointment_checklist(), complete_checklist_item() — tested end-to-end |
| Migration 011 Part A | ✅ COMPLETE | Phase 8D DDL: materials_catalog, technician_locations stub |
| Migration 011 Part B | ✅ COMPLETE | Phase 8D Functions: log_material_used() — tested end-to-end with JSONB append to appointments |
| Migration 012 Part A | ✅ COMPLETE | Phase 8E DDL: Extended estimates table (approval workflow, sent/viewed tracking, discount, tax_rate, conversion FK), new estimate_line_items table with RLS and indexes |
| Migration 012 Part B | ✅ COMPLETE | Phase 8E Functions: add_estimate_line_item(), recalculate_estimate_totals(), send_estimate(), mark_estimate_viewed(), approve_estimate(), reject_estimate() — tested end-to-end |
| Migration 013 Part A | ✅ COMPLETE | Phase 8E DDL: Extended invoices table (estimate FK, subscription FK, invoice_type, generated_by, amount_paid, net_terms, sent/viewed tracking), extended payments table (Stripe fields, processing_fee, net_amount, check_number, recorded_by), new invoice_line_items table with RLS and indexes |
| Migration 013 Part B | ✅ COMPLETE | Phase 8E Functions: add_invoice_line_item(), recalculate_invoice_totals(), convert_estimate_to_invoice(), generate_invoice_from_appointment(), record_payment(), get_ar_aging() — tested end-to-end |

## Tables in pestflow-prod (Current State)

### Original Tables (now properly secured)
- activity_logs ✅ RLS
- appointments ✅ RLS + EXTENDED (Migrations 007, 008) — full job lifecycle engine
- attachments ✅ RLS
- companies ✅ RLS + extended with slug, phone, email, address, timezone, plan_tier, is_active, trial_ends_at, subscription_id, updated_at
- company_users ✅ RLS
- customers ✅ RLS + EXTENDED (Migration 004) — 25 columns total
- estimates ✅ RLS + EXTENDED (Migration 012) — full approval workflow, sent/viewed tracking
- invoices ✅ RLS + EXTENDED (Migration 013) — line items, partial payments, subscription billing hooks
- jobs ⚠️ DEPRECATED — replaced by appointments table. Do not use for new development.
- notes ✅ RLS
- payments ✅ RLS + EXTENDED (Migration 013) — Stripe fields, processing fee, net amount, check number
- properties ✅ RLS + EXTENDED (Migration 005) — 22 columns total
- routes ✅ RLS + EXTENDED (Migration 008) — added updated_at, notes, total_jobs
- service_plans ✅ RLS
- technicians ✅ RLS + EXTENDED (Migration 010) — added updated_at
- users ⚠️ DEPRECATED — replaced by profiles. Do not use for new development.

### New Tables (Migrations 002–013)
- profiles ✅ RLS (extends auth.users, auto-created on signup)
- pipeline_stages ✅ RLS
- leads ✅ RLS
- lead_tasks ✅ RLS
- lead_notes ✅ RLS
- customer_subscriptions ✅ RLS (Migration 007)
- technician_schedules ✅ RLS (Migration 009)
- dispatch_log ✅ RLS (Migration 009)
- checklist_templates ✅ RLS (Migration 010)
- checklist_template_items ✅ RLS (Migration 010)
- appointment_checklist_items ✅ RLS (Migration 010)
- appointment_photos ✅ RLS (Migration 010)
- materials_catalog ✅ RLS (Migration 011)
- technician_locations ✅ RLS (Migration 011 — STUB, automations in Phase 8G)
- estimate_line_items ✅ RLS (Migration 012)
- invoice_line_items ✅ RLS (Migration 013)

## Estimates Table — Current Columns (Post Migration 012)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| company_id | uuid | NOT NULL |
| customer_id | uuid | NOT NULL |
| property_id | uuid | Nullable |
| lead_id | uuid | FK → leads(id) SET NULL |
| appointment_id | uuid | FK → appointments(id) SET NULL |
| assigned_to | uuid | FK → profiles(id) SET NULL |
| estimate_number | text | |
| status | text | CHECK: draft, sent, viewed, approved, rejected, expired, converted |
| discount | numeric(10,2) | NOT NULL DEFAULT 0 |
| tax_rate | numeric(5,4) | NOT NULL DEFAULT 0 |
| subtotal | numeric | DEFAULT 0 |
| tax | numeric | DEFAULT 0 |
| total | numeric | DEFAULT 0 |
| notes | text | |
| internal_notes | text | Office-only |
| sent_at | timestamptz | |
| viewed_at | timestamptz | |
| issued_at | timestamptz | |
| approved_at | timestamptz | |
| rejected_at | timestamptz | |
| expires_at | timestamptz | |
| accepted_by | text | Customer name who approved |
| rejection_reason | text | |
| converted_to_invoice_id | uuid | FK → invoices(id) SET NULL |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

## Estimate Line Items Table — Current Columns (Migration 012)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| company_id | uuid | NOT NULL |
| estimate_id | uuid | FK → estimates(id) CASCADE |
| line_order | integer | DEFAULT 0 |
| description | text | NOT NULL |
| service_plan_id | uuid | FK → service_plans(id) SET NULL |
| quantity | numeric | NOT NULL DEFAULT 1 |
| unit_price | numeric(10,2) | NOT NULL DEFAULT 0 |
| discount_pct | numeric(5,4) | NOT NULL DEFAULT 0 |
| line_total | numeric(10,2) | NOT NULL DEFAULT 0 |
| is_taxable | boolean | NOT NULL DEFAULT true |
| notes | text | |
| created_at | timestamptz | NOT NULL |

## Invoices Table — Current Columns (Post Migration 013)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| company_id | uuid | NOT NULL |
| customer_id | uuid | NOT NULL |
| property_id | uuid | Nullable |
| appointment_id | uuid | FK → appointments(id) |
| estimate_id | uuid | FK → estimates(id) SET NULL |
| subscription_id | uuid | FK → customer_subscriptions(id) SET NULL |
| invoice_number | text | |
| status | text | CHECK: draft, sent, viewed, partial, paid, void, uncollectible |
| invoice_type | text | CHECK: service, subscription, one_time. DEFAULT service |
| generated_by | text | CHECK: manual, estimate, appointment. DEFAULT manual |
| discount | numeric(10,2) | NOT NULL DEFAULT 0 |
| tax_rate | numeric(5,4) | NOT NULL DEFAULT 0 |
| subtotal | numeric | DEFAULT 0 |
| tax | numeric | DEFAULT 0 |
| total | numeric | DEFAULT 0 |
| amount_paid | numeric(10,2) | NOT NULL DEFAULT 0 |
| balance_due | numeric | DEFAULT 0 |
| net_terms | text | CHECK: due_on_receipt, net_15, net_30, net_45. DEFAULT due_on_receipt |
| sent_at | timestamptz | |
| viewed_at | timestamptz | |
| internal_notes | text | |
| due_at | timestamptz | |
| paid_at | timestamptz | |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

## Invoice Line Items Table — Current Columns (Migration 013)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| company_id | uuid | NOT NULL |
| invoice_id | uuid | FK → invoices(id) CASCADE |
| line_order | integer | DEFAULT 0 |
| description | text | NOT NULL |
| service_plan_id | uuid | FK → service_plans(id) SET NULL |
| quantity | numeric | NOT NULL DEFAULT 1 |
| unit_price | numeric(10,2) | NOT NULL DEFAULT 0 |
| discount_pct | numeric(5,4) | NOT NULL DEFAULT 0 |
| line_total | numeric(10,2) | NOT NULL DEFAULT 0 |
| is_taxable | boolean | NOT NULL DEFAULT true |
| notes | text | |
| created_at | timestamptz | NOT NULL |

## Payments Table — Current Columns (Post Migration 013)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| company_id | uuid | NOT NULL |
| invoice_id | uuid | NOT NULL FK → invoices(id) |
| customer_id | uuid | NOT NULL |
| amount | numeric | NOT NULL |
| payment_method | text | CHECK: credit_card, ach, check, cash, other |
| payment_status | text | CHECK: pending, completed, failed, refunded. DEFAULT completed |
| transaction_reference | text | |
| stripe_payment_intent_id | text | Phase 8F |
| stripe_charge_id | text | Phase 8F |
| processing_fee | numeric(10,2) | NOT NULL DEFAULT 0 |
| net_amount | numeric(10,2) | amount − processing_fee |
| check_number | text | |
| notes | text | |
| recorded_by | uuid | FK → profiles(id) SET NULL |
| paid_at | timestamptz | NOT NULL DEFAULT now() |
| created_at | timestamptz | NOT NULL |

## Appointments Table — Current Columns (Post Migrations 007 + 008)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| company_id | uuid | Tenant field — NOT NULL |
| customer_id | uuid | NOT NULL |
| property_id | uuid | NOT NULL |
| technician_id | uuid | Nullable — unassigned until dispatched |
| route_id | uuid | FK → routes(id) |
| service_plan_id | uuid | FK → service_plans(id) |
| subscription_id | uuid | FK → customer_subscriptions(id) |
| appointment_type | text | CHECK: service, inspection, estimate, callback, emergency, setup, followup |
| status | text | CHECK: scheduled, assigned, en_route, in_progress, completed, invoiced, cancelled |
| priority | text | CHECK: normal, urgent, callback. DEFAULT normal |
| scheduled_start | timestamptz | NOT NULL |
| scheduled_end | timestamptz | |
| sequence_number | integer | Visit 1 of 4, 2 of 4, etc. |
| route_sequence | integer | Order within day's route |
| generated_by | text | CHECK: manual, subscription, followup |
| assigned_at | timestamptz | Auto-stamped when status → assigned |
| arrived_at | timestamptz | Auto-stamped when status → en_route |
| started_at | timestamptz | Auto-stamped when status → in_progress |
| completed_at | timestamptz | Auto-stamped when status → completed |
| cancelled_at | timestamptz | Auto-stamped when status → cancelled |
| actual_duration | integer | Minutes — auto-calculated on completion |
| technician_notes | text | Appended on each status advance |
| materials_used | jsonb | DEFAULT [] — entries appended by log_material_used() |
| followup_required | boolean | DEFAULT false |
| followup_notes | text | |
| check_in_lat | numeric(10,7) | GPS on en_route |
| check_in_lng | numeric(10,7) | GPS on en_route |
| check_out_lat | numeric(10,7) | GPS on completed |
| check_out_lng | numeric(10,7) | GPS on completed |
| invoice_id | uuid | FK → invoices(id) — populated by generate_invoice_from_appointment() |
| cancelled_reason | text | |
| notes | text | Office/scheduler notes |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

## Key Functions in Database
- `public.current_user_company_ids()` — returns all company IDs for current user (used in all RLS policies)
- `public.handle_updated_at()` — trigger function, fires on all tables with updated_at
- `public.handle_new_user()` — trigger on auth.users, auto-creates profile on signup
- `public.seed_default_pipeline_stages(company_id)` — seeds default kanban stages for new company
- `public.convert_lead_to_customer(lead_id)` — converts lead → customer + property, marks lead converted ✅ TESTED
- `public.generate_subscription_appointments(subscription_id)` — generates all visits for a subscription based on service plan frequency ✅ TESTED
- `public.handle_new_subscription()` — trigger: fires generate_subscription_appointments on insert ✅ TESTED
- `public.cancel_subscription(subscription_id, reason)` — cancels subscription + all future scheduled/assigned appointments ✅ TESTED
- `public.advance_appointment_status(appointment_id, new_status, notes, lat, lng)` — walks job through lifecycle, auto-stamps all timestamps, calculates duration, updates subscription visit count ✅ TESTED
- `public.assign_appointment(appointment_id, technician_id, route_id, route_sequence, performed_by, notes)` — assigns tech, logs to dispatch_log ✅ TESTED
- `public.get_dispatch_board(company_id, date)` — returns full day view: routes with jobs + unassigned pool ✅ TESTED
- `public.generate_appointment_checklist(appointment_id)` — instantiates checklist items from service plan template ✅ TESTED
- `public.complete_checklist_item(item_id, technician_id, response_text, response_number, notes)` — marks item complete ✅ TESTED
- `public.log_material_used(appointment_id, catalog_item_id, quantity_used, custom_material, notes)` — appends material entry to appointments.materials_used JSONB ✅ TESTED
- `public.recalculate_estimate_totals(estimate_id)` — sums line items, applies tax_rate and discount, updates estimate header ✅ TESTED
- `public.add_estimate_line_item(estimate_id, description, quantity, unit_price, discount_pct, is_taxable, service_plan_id, notes)` — inserts line item, auto-recalculates totals ✅ TESTED
- `public.send_estimate(estimate_id)` — stamps sent_at, status → sent ✅ TESTED
- `public.mark_estimate_viewed(estimate_id)` — stamps viewed_at, status → viewed ✅ TESTED
- `public.approve_estimate(estimate_id, accepted_by)` — stamps approved_at, status → approved ✅ TESTED
- `public.reject_estimate(estimate_id, reason)` — stamps rejected_at, status → rejected ✅ TESTED
- `public.recalculate_invoice_totals(invoice_id)` — sums line items, applies tax_rate and discount, updates invoice header and balance_due ✅ TESTED
- `public.add_invoice_line_item(invoice_id, description, quantity, unit_price, discount_pct, is_taxable, service_plan_id, notes)` — inserts line item, auto-recalculates totals ✅ TESTED
- `public.convert_estimate_to_invoice(estimate_id)` — creates invoice from approved estimate, copies all line items, marks estimate converted ✅ TESTED
- `public.generate_invoice_from_appointment(appointment_id)` — creates invoice from completed appointment, links back via invoice_id FK ✅ TESTED
- `public.record_payment(invoice_id, amount, method, transaction_ref, stripe_payment_intent_id, stripe_charge_id, check_number, processing_fee, notes, recorded_by)` — inserts payment, updates amount_paid and balance_due, flips status to partial or paid ✅ TESTED
- `public.get_ar_aging(company_id)` — returns AR aging buckets: current, 1–30, 31–60, 61–90, over_90 ✅ BUILT

## RLS Pattern (DO NOT DEVIATE)
Every policy follows this exact pattern:
```sql
using (company_id in (select public.current_user_company_ids()))
```

## Appointment Status Lifecycle (CONFIRMED)
`scheduled` → `assigned` → `en_route` → `in_progress` → `completed` → `invoiced` → `cancelled`

## Estimate Status Values (CONFIRMED)
`draft`, `sent`, `viewed`, `approved`, `rejected`, `expired`, `converted`

## Invoice Status Values (CONFIRMED)
`draft`, `sent`, `viewed`, `partial`, `paid`, `void`, `uncollectible`

## Payment Status Values (CONFIRMED)
`pending`, `completed`, `failed`, `refunded`

## Payment Method Values (CONFIRMED)
`credit_card`, `ach`, `check`, `cash`, `other`

## Subscription Status Values (CONFIRMED)
`active`, `paused`, `cancelled`, `expired`

## Leads Table — Status Values (CONFIRMED)
`new`, `contacted`, `qualified`, `quoted`, `won`, `lost`, `unqualified`, `converted`

## Service Plan Frequency Values (CONFIRMED)
`monthly` (12 visits), `bi_monthly` (6 visits), `quarterly` (4 visits), `semi_annual` (2 visits), `annual` (1 visit), `one_time` (1 visit)

## Invoice Type Values (CONFIRMED)
`service`, `subscription`, `one_time`

## Invoice Generated By Values (CONFIRMED)
`manual`, `estimate`, `appointment`

## Net Terms Values (CONFIRMED)
`due_on_receipt`, `net_15`, `net_30`, `net_45`

---

# SECTION 4 — TECH STACK (FINAL — DO NOT CHANGE)

| Layer | Tool | Notes |
|-------|------|-------|
| Strategy/Architecture | Claude AI (this chat) | Model: Claude Sonnet 4.6 |
| Code Execution | Claude Code | Primary build tool — web version at claude.ai/code |
| Source Control | GitHub (ironwoodoperations org) | Repo: pestflow-platform |
| Database + Auth | Supabase (pestflow-prod) | Postgres + RLS + Edge Functions |
| Frontend Deployment | Vercel | Scott deploys directly |
| Internal Ops | Microsoft 365 | Files in OneDrive/SharePoint |
| Payments | Stripe | |
| SMS/Messaging | Twilio | |
| Maps/Routing | Google Maps API | |
| Email | SendGrid | |

**NOT using:** Base44 ❌ | Lovable ❌ | Google Workspace ❌

### Claude Code Notes
- Use the WEB version at claude.ai/code (not terminal install)
- Connect repo via "Select a repository" button
- Always paste SQL content directly — no backtick code fences when sending to Supabase SQL Editor
- Claude Code creates branches automatically — always create PR and merge to main after each session
- GitHub = file storage only. Supabase SQL Editor = where migrations actually run

### Supabase SQL Editor Rules
- For long migrations with PL/pgSQL functions, split into Part A (DDL) and Part B (functions)
- Use `$func$` as dollar-quote delimiter instead of `$$` — prevents Supabase comment injection bug
- Always Ctrl+A → Delete before pasting new SQL
- **NEVER run multiple statements in one block if they contain UUIDs or subqueries** — Supabase injects comments mid-query and breaks execution. One statement per tab when in doubt.
- If you see "unterminated dollar-quoted string" or "unterminated quoted string" errors — Supabase injected a comment. Split the block further.

---

# SECTION 5 — COMPETITIVE LANDSCAPE

## GorillaDesk (Primary Competitor — Benchmark)
**Pricing:** $49/mo (1 route), $99/mo (growth)
**Strengths:** Very easy UX, built by former pest operators, 4.8–5 star reviews, unlimited admin users
**Weaknesses:** Multi-service scheduling clunky, customer portal locked behind expensive plan, no AI, legacy UX

## FieldRoutes / PestRoutes (Mid-Market — Avoid Their Mistakes)
**Weaknesses (our attack angle):** 3-year contracts, charges before software is live, broken multi-service scheduling, terrible support, poor mobile app, PE-owned bureaucracy

## Our Positioning
**"What GorillaDesk should be in the AI era — with FieldRoutes' depth, none of FieldRoutes' pain."**

---

# SECTION 6 — PRICING TIERS

| Tier | Monthly | Setup Fee | Key Features |
|------|---------|-----------|--------------|
| Starter | $149/mo | $1,500 | Website, lead forms, CRM lite, basic scheduling |
| Growth | $299/mo | $2,500 | + SMS automations, review engine, invoicing, booking |
| Pro | $499/mo | $3,500 | + Dispatch, route optimization, technician app, customer portal |
| Enterprise | $799/mo | Custom | + Multi-location, white label, API access, advanced reporting |

**No contracts. Cancel anytime. 14-day free trial.**

---

# SECTION 7 — BUILD ORDER (PHASE 8)

## Tenant Field Standard: USE `company_id` EVERYWHERE
This is locked. Do not use tenant_id. Every table has company_id NOT NULL.

## Phase 8 Build Order
1. Phase 8A — Lead/CRM pipeline ✅ COMPLETE (Migration 003)
2. Phase 8B — Customer + property structure ✅ COMPLETE (Migrations 004, 005, 006)
3. Phase 8C — Scheduling + dispatch engine ✅ COMPLETE (Migrations 007, 008, 009)
4. Phase 8D — Technician job workflow ✅ COMPLETE (Migrations 010, 011)
5. Phase 8E — Estimate → Invoice → Payment ✅ COMPLETE (Migrations 012, 013)
6. Phase 8F — Messaging automation (NEXT)
7. Phase 8G — Customer portal

## For Each Phase, Define Before Writing SQL:
1. Objects (what records exist)
2. States (what statuses can they be in)
3. Transitions (what changes state)
4. Permissions (who can do what)
5. Automations (what fires automatically)
6. Reporting outputs (what metrics does this module create)

---

# SECTION 8 — 30-DAY EXECUTION PLAN (UPDATED)

## Week 1 — Foundation Lock (Days 1–7)

**Day 1 STATUS: ✅ COMPLETE**
- [x] Supabase pestflow-prod restored and active
- [x] Decision: company_id as tenant field (final)
- [x] Decision: full clean slate — previous schema scrapped
- [x] Migration 001: Companies fixed, RLS on all 16 tables
- [x] Migration 002: Profiles table + auth trigger
- [x] Migration 003: Phase 8A — Leads/CRM tables complete

**Day 2 STATUS: ✅ COMPLETE**
- [x] Repo renamed from pestguard-pro to pestflow-platform
- [x] supabase/migrations/ folder created in GitHub
- [x] Migrations 001-003 committed to GitHub
- [x] Migration 004: Extend customers table (25 columns)
- [x] Migration 005: Extend properties table (22 columns)
- [x] Migration 006: lead_to_customer conversion function — tested end-to-end
- [x] All migrations committed to GitHub main and running in pestflow-prod
- [ ] M365 shared mailbox conversions — still pending Microsoft sync fix

**Day 3 STATUS: ✅ COMPLETE**
- [x] Decided: appointments table = job record (jobs table deprecated)
- [x] Decided: auto-generate all subscription appointments on creation
- [x] Decided: routes = daily technician schedule container
- [x] Migration 007: customer_subscriptions + auto-generate trigger — tested
- [x] Migration 008: Full job lifecycle engine on appointments — tested end-to-end
- [x] Migration 009: Dispatch board engine — tested end-to-end
- [x] All migrations committed and merged to GitHub main

**Day 4 STATUS: ✅ COMPLETE**
- [x] Decided: two-layer checklist model (template + appointment instance)
- [x] Decided: materials catalog with SKUs + EPA reg numbers + free-text escape hatch
- [x] Decided: GPS check-in/check-out only for Phase 8D — technician_locations stub built
- [x] Migration 010 Part A: checklist_templates, checklist_template_items, appointment_checklist_items, appointment_photos
- [x] Migration 010 Part B: generate_appointment_checklist(), complete_checklist_item() — tested end-to-end
- [x] Migration 011 Part A: materials_catalog, technician_locations stub
- [x] Migration 011 Part B: log_material_used() — tested end-to-end
- [x] All migrations committed and merged to GitHub main

**Day 5 STATUS: ✅ COMPLETE**
- [x] Decided: estimates do not convert directly into invoices — separate records linked by FK
- [x] Decided: subscription billing is per-visit (appointment-level invoicing)
- [x] Decided: separate line items tables (not JSONB) for estimates and invoices
- [x] Decided: payment methods — credit_card, ach, check, cash, other. Stripe stubbed for Phase 8F.
- [x] Migration 012 Part A: Extended estimates table, new estimate_line_items table with RLS
- [x] Migration 012 Part B: add_estimate_line_item(), recalculate_estimate_totals(), send_estimate(), mark_estimate_viewed(), approve_estimate(), reject_estimate() — tested end-to-end
- [x] Migration 013 Part A: Extended invoices table, extended payments table, new invoice_line_items table with RLS
- [x] Migration 013 Part B: add_invoice_line_item(), recalculate_invoice_totals(), convert_estimate_to_invoice(), generate_invoice_from_appointment(), record_payment(), get_ar_aging() — tested end-to-end
- [x] All migrations committed and merged to GitHub main

**Day 6 (NEXT SESSION — 5 hrs):**
- [ ] Migration 014: Phase 8F — Messaging automation tables
  - message_templates (SMS + email templates with merge fields)
  - message_queue (scheduled outbound messages)
  - message_logs (sent message audit trail)
  - Twilio webhook receiver structure
- [ ] Migration 015: Phase 8F — Automation trigger rules
  - automation_rules table (event → condition → action)
  - Automated triggers: appointment reminders, completion confirmations, review requests, invoice delivery
- [ ] Commit all to GitHub

**Day 7 (4 hrs):**
- [ ] Full schema review: every table, every relationship, every RLS policy
- [ ] Generate complete schema documentation
- [ ] GitHub: all migrations confirmed committed and documented
- [ ] Milestone: Database is production-ready

## Weeks 2–4
(Unchanged — API layer, frontend, sales machine, launch)

---

# SECTION 9 — GITHUB STATUS

- Org: ironwoodoperations
- Repo: pestflow-platform ✅ (renamed from pestguard-pro)
- All migrations 001-013 committed to main ✅
- File path: `supabase/migrations/`
- Naming convention: `001_foundation_rls.sql`, `002_profiles.sql`, etc.
- Old Lovable-generated frontend code still in `src/` — leave it, clean up later

### Files in supabase/migrations/ (confirmed on main)
- 001_foundation_rls.sql ✅
- 002_profiles.sql ✅
- 003_phase8a_leads.sql ✅
- 004_extend_customers.sql ✅
- 005_extend_properties.sql ✅
- 006_lead_to_customer_conversion.sql ✅
- 007_customer_subscriptions.sql ✅
- 008_job_lifecycle_engine.sql ✅
- 009_dispatch_engine.sql ✅
- 010_phase8d_checklists_photos_partA.sql ✅
- 010_phase8d_checklists_photos_partB.sql ✅
- 011_phase8d_materials_locations_partA.sql ✅
- 011_phase8d_materials_locations_partB.sql ✅
- 012_phase8e_estimates_partA.sql ✅
- 012_phase8e_estimates_partB.sql ✅
- 013_phase8e_invoices_payments_partA.sql ✅
- 013_phase8e_invoices_payments_partB.sql ✅

---

# SECTION 10 — FILE STRUCTURE

## OneDrive / SharePoint (Internal Ops)
```
Ironwood Operations Group (SharePoint)
├── Command Center
│   ├── Legal
│   ├── Financial
│   ├── Strategic Planning (this file lives here)
│   └── Security
├── Product Development
│   └── PestFlow
│       ├── Database Schema (SQL files, diagrams)
│       ├── API Documentation
│       ├── Feature Flags (plan matrix)
│       └── QA Notes
├── Sales
└── Customer Success
```

## GitHub (ironwoodoperations org)
```
pestflow-platform (main repo)
├── src/                          ← Old Lovable code — ignore for now
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 001_foundation_rls.sql ✅
│       ├── 002_profiles.sql ✅
│       ├── 003_phase8a_leads.sql ✅
│       ├── 004_extend_customers.sql ✅
│       ├── 005_extend_properties.sql ✅
│       ├── 006_lead_to_customer_conversion.sql ✅
│       ├── 007_customer_subscriptions.sql ✅
│       ├── 008_job_lifecycle_engine.sql ✅
│       ├── 009_dispatch_engine.sql ✅
│       ├── 010_phase8d_checklists_photos_partA.sql ✅
│       ├── 010_phase8d_checklists_photos_partB.sql ✅
│       ├── 011_phase8d_materials_locations_partA.sql ✅
│       ├── 011_phase8d_materials_locations_partB.sql ✅
│       ├── 012_phase8e_estimates_partA.sql ✅
│       ├── 012_phase8e_estimates_partB.sql ✅
│       ├── 013_phase8e_invoices_payments_partA.sql ✅
│       └── 013_phase8e_invoices_payments_partB.sql ✅
├── docs/
└── tests/
```

---

# SECTION 11 — RULES (NON-NEGOTIABLE)

1. Every table has `company_id` — no exceptions (NOT tenant_id — decided Day 1)
2. RLS on every table — before any frontend work
3. Never store secrets in GitHub — Azure Key Vault or Supabase secrets only
4. Schema first, API second, frontend third — always in this order
5. No long-term contracts with customers — ever
6. If it can't scale to 1,000 tenants without rework — don't build it
7. Every module must define: objects, states, transitions, permissions, automations, reporting
8. When in doubt, look at what FieldRoutes does badly and do the opposite
9. When chat context gets full — generate new handoff MD and stop
10. Migration files are the source of truth — never modify schema directly in Supabase UI
11. Always check actual table columns before writing migration SQL — use information_schema query
12. Always run migrations in Supabase SQL Editor AND commit to GitHub — both required
13. appointments table = job record. jobs table is deprecated. Never use jobs for new development.
14. Always split long migrations into Part A (DDL) and Part B (functions) to avoid Supabase injection bug
15. Use `$func$` as dollar-quote delimiter in all PL/pgSQL functions — never `$$`
16. Never run multiple statements in one block if they contain UUIDs or subqueries — Supabase injects comments mid-query. One statement per tab when in doubt.
17. Estimates and invoices are always separate records — never convert one directly into the other. Use convert_estimate_to_invoice() which copies line items and links via FK.
18. Subscription billing is per-visit — one invoice per completed appointment. Never period billing.

---

# SECTION 12 — WORKFLOW LEARNED

## The Two-System Rule
Every migration must happen in TWO places:
1. **Supabase SQL Editor** — this actually changes the live database
2. **GitHub via Claude Code** — this saves the file for version control

GitHub does NOT run SQL. Supabase does NOT auto-sync from GitHub. Both steps are always required.

## Claude Code Workflow
1. Open claude.ai/code
2. Select pestflow-platform repo
3. Start new session
4. Tell Claude Code what files to create and paste SQL content
5. Claude Code commits to a branch automatically
6. Go to GitHub → Compare & pull request
7. Create pull request → Merge → Confirm merge → Delete branch

## Supabase SQL Editor Rules
- Always Ctrl+A to clear before pasting
- Do NOT include triple backtick fences
- For long migrations with functions: split into Part A (DDL) and Part B (functions)
- Use `$func$` not `$$` as dollar-quote delimiter — prevents Supabase comment injection bug
- If you see "unterminated dollar-quoted string" error — Supabase injected a comment. Split the migration.
- If you see "unterminated quoted string" error — Supabase injected a comment mid-UUID. Run one statement at a time in separate tabs.
- Never use subqueries inside test scripts — hardcode all UUIDs instead

## Before Writing Any Migration SQL
Always run this first to see what columns already exist:
```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'TABLE_NAME_HERE'
and table_schema = 'public'
order by ordinal_position;
```

## Check Multiple Tables At Once
```sql
select * from (
    select table_name, column_name, data_type, is_nullable, column_default, ordinal_position
    from information_schema.columns
    where table_name in ('table1', 'table2', 'table3')
    and table_schema = 'public'
) as results
order by table_name, ordinal_position;
```

## UNION Queries in Supabase
Wrap in a subquery to prevent Supabase limit injection bug:
```sql
select * from (
    select 'type_a' as type, id, name from table_a
    union all
    select 'type_b', id, name from table_b
) as results
order by type;
```

---

# SECTION 13 — IMMEDIATE NEXT ACTIONS (START OF DAY 6)

Execute in this order:

1. **Read this file** and confirm understanding
2. **Define Phase 8F data model** before writing any SQL:
   - Objects: message_templates, message_queue, message_logs, automation_rules
   - States: message queue statuses (pending, sent, failed, cancelled)
   - Transitions: what events trigger what messages
   - Automations: appointment reminder (24hr before), completion confirmation, review request (24hr after), invoice delivery on generation
   - Reporting: delivery rates, open rates (future), opt-out tracking
3. **Check existing tables** — confirm no messaging tables already exist via information_schema
4. **Migration 014:** Phase 8F — message_templates, message_queue, message_logs tables with RLS
5. **Migration 015:** Phase 8F — automation_rules table + trigger wiring to appointment status changes and invoice generation
6. **Commit all to GitHub** via Claude Code
7. **Run all in Supabase** pestflow-prod SQL Editor
8. **Test:** simulate appointment created → reminder queued → sent → logged

Key questions to answer before writing Day 6 SQL:
- Do we queue both SMS (Twilio) and email (SendGrid) through the same message_queue table, or separate tables?
- What merge fields do templates need? (customer_name, appointment_date, technician_name, amount_due, etc.)
- Do automation rules need conditions (e.g. only send review request if status = completed, not cancelled)?
- Do we need opt-out/unsubscribe tracking at the customer level in Day 6, or stub it for Phase 8G?

---

# SECTION 14 — CONTEXT HANDOFF PROTOCOL

1. Claude generates updated version of this file
2. Scott downloads it
3. Scott saves to: OneDrive → Command Center → Strategic Planning → IRONWOOD_MASTER_CONTEXT_v[X].md
4. Scott uploads the new version to the next Claude session
5. Old version archived in same folder

---

*Document Version: 7.0*
*Generated: March 2026 — End of Day 5 Session*
*Next version due: After Day 6 completion*
*Sessions to date: 5 complete*
*Phase 8D: COMPLETE — Technician Job Workflow fully built and tested*
*Phase 8E: COMPLETE — Estimate → Invoice → Payment fully built and tested*
*Phase 8F: NEXT — Messaging Automation*
