---
name: office-hours
description: Surface assumptions and architectural questions BEFORE any code is written. Use when scoping a feature, when a request feels too vague, or when the Ironwood Task Force protocol calls for an IMPLEMENTATION BRIEF first.
---

# /office-hours — Assumption surfacing protocol

## Purpose

Stops the agent from writing code on assumptions. Every fuzzy edge of the request becomes an explicit question BEFORE work starts. Produces an `IMPLEMENTATION_BRIEF.md`. This is the Ironwood "no code until IMPLEMENTATION BRIEF is approved" rule, made into a callable workflow.

## When to invoke

- User says "build me X" but X has multiple reasonable interpretations
- The task touches more than one module
- The task touches anything on the DO NOT TOUCH list
- The agent is uncertain about data model, naming, or schema decisions
- The agent finds itself thinking "I'll just assume Y"

## Hard gate

**NO CODE during /office-hours.** No source file writes. No edits. No migrations. The only output is a Markdown question list and (if approved) an `IMPLEMENTATION_BRIEF.md` file on a `spec/<task>` branch.

## Workflow

### Step 1 — Read context

Read in this order, do not skip:
1. `CLAUDE.md`
2. `GIT_RULES.md`
3. `SKILL.md` (if exists)
4. `PROJECT_MANIFEST.md`
5. `docs/03-system-architecture.md` (if exists)
6. The most relevant docs/ file for the requested area
7. The last 3 entries in PROJECT_MANIFEST.md "Session —" log

### Step 2 — Map the request

Restate the user's request in your own words. List:
- What is being asked for
- What is NOT being asked for (explicit exclusions)
- What modules / files / tables this likely touches
- What modules / files / tables this MIGHT touch (gray areas)

### Step 3 — Surface the unknowns

Generate a numbered list of questions in these categories:

- **Scope** — what is in/out
- **Data model** — table changes, new columns, FKs, RLS
- **API surface** — new endpoints, contracts, auth
- **UI** — new screens, state, edge cases (empty, error, loading)
- **Integration** — external services, webhooks, env vars
- **Tenant isolation** — how does this respect tenant_id / company_id
- **Cross-product** — does this touch pestflow-pro AND pestflow-platform
- **Rollback** — how do we undo this if it goes wrong
- **Customer-impact** — does any paying customer touch this code path

For each question, propose a default answer (your best guess based on context) so the user can say "yes, that default" instead of typing a full answer.

### Step 4 — Present, then wait

Output the question list. Wait for the user to respond. Do not proceed.

### Step 5 — Generate the IMPLEMENTATION BRIEF

After the user answers, create branch and write the brief:

```bash
git checkout -b spec/<task-short-name>
```

Write `IMPLEMENTATION_BRIEF.md` in the repo root. Required sections:
- Project Header (from IRONWOOD_OPS_PROCESS_STARTER)
- Scope (in / out)
- Schema changes (with rollback SQL)
- Acceptance Criteria (specific, measurable)
- Test Plan
- Deployment Plan
- Rollback Plan
- Open Risks

Commit and open the PR:

```bash
git add IMPLEMENTATION_BRIEF.md
git commit -m "spec: implementation brief for <task>"
git push -u origin spec/<task-short-name>
gh pr create --title "spec: <task> implementation brief" --body "Wave 0 spec for <task>. Doc-only PR; auto-merge."
gh pr merge --auto --squash
```

### Step 6 — Hand off

State: "Brief PR opened (#N). Auto-merge enabled. Brief will land on main when CI passes (~90s). Ready to begin Wave 1 (Research) when you confirm."

Do not proceed to code. Wait for explicit "begin Wave 1" from the user, and ideally wait for the brief PR to merge so future waves can branch off the latest main.

## Forbidden actions during /office-hours

- Writing any file other than `IMPLEMENTATION_BRIEF.md`
- Editing any source file
- Running any migration
- Pushing to `main` directly (blocked by hook anyway)
- Proceeding to code before the brief is merged
