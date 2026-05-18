# PestFlow Pro — Session kickoff: S228

**Session theme:** Admin surface cleanup — dashboard redesign + Reports tab pruning + SEO Connect tab pruning
**Pattern to mirror:** N/A — frontend prune + reorganization, no new external connector (Vercel Analytics decision deferred to investigation phase)
**Test/pilot tenant:** Dang (already running S224 PageSpeed + S226 Zernio + S227 SEO Analytics tiles)
**Tier impact:** None — cleanup applies to all tiers
**Surfaces affected:** Admin → Dashboard, Reports tab, SEO Connect sub-tab
**Execution venue:** Claude Code Web in Scott's Codespace
**Predecessor:** S227 SEO Analytics MVP (PR #88) — assumed shipped or shipping by S228 kickoff

---

## TL;DR

PestFlow Pro's admin has accumulated tiles that fall into three failure modes:
1. **No real data** — placeholder integrations like GA4 (Google add-user bug parked), Ahrefs/Bing Webmaster Tools we won't subscribe to.
2. **Redundant data** — flagged during planning but Scott's pre-flight decision (kickoff revision) is to leave the lead/conversion tiles in place and let users observe. Revisit if Kirk surfaces a complaint.
3. **Click-outs instead of insights** — Dashboard's SEO Performance and Social Media cards both link out instead of showing data, despite us having real `seo_runs` (S227) and `zernio_runs` (S225/S226) tables populated and ready.

S228 prunes the dead, visualizes the click-outs. Two dashboard cards (SEO Performance, Social Media) get real-data treatment using existing run tables — no new backend.

Pure frontend session: **no new tables, no new edge functions, no new cron jobs.** One investigation item (Vercel Analytics API capability) may spill into S229.

---

## Locked scoping decisions (do not re-litigate in session)

### Dashboard

**Current state** (per planning screenshots, Dang admin):
- 4 top stat cards: Total Leads (10), New This Month (10), New This Week (3), Conversion Rate (10%)
- SEO Performance card — empty state, "No audit run yet" + click-through to Run SEO Audit
- Social Media card — shows 2 published + last published date + click-through to Manage Social
- Leads Per Month chart (Dec–May)
- Recent Leads list (names, services, status badges)
- Quick Links footer (View All Leads, Edit Site Content, Manage SEO, View Live Site)

**Target state:**

Top stat row (4 cards):
- KEEP: New This Month
- KEEP: This Week Conversion Rate (verify the current "Conversion Rate" card is weekly-scoped, not all-time; rename label if needed)
- REPLACE: SEO Performance → real-data mini-tile sourced from `seo_runs` (latest successful rankings run summary — keyword count, top position, last refresh)
- REPLACE: Social Media → real-data mini-tile sourced from `zernio_runs` (combined followers/engagement/reach across YouTube + Facebook + Instagram, last refresh)

Both new mini-tiles match the existing top-stat-card layout — same dimensions, same border, same typography — they're just richer in the body.

Below stat row:
- KEEP: Leads Per Month chart (trend data not captured by top stats; earns its place)
- REMOVE: Recent Leads list (names belong in CRM; click-into-detail is wrong UX for a glance surface)
- KEEP: Quick Links footer

### Reports tab

**Current state** (per planning screenshots):
- 4 top stat cards: Total Leads (10), New (Uncontacted) (6), Converted (1), Conversion Rate (10%)
- Time toggle (7/30/90 Days/All Time)
- Leads Over Time chart + Lead Status panel (right)
- Top Requested Services (6 services with lead counts)
- Lead Funnel section (New 6, Contacted 1, Quoted 1, Won 1, Lost 1; "Conversion rate (won / won+lost): 50%")
- Site Performance (PageSpeed: 99/96/96/100)
- Social Analytics (YouTube/Facebook/Instagram metrics)
- Social Posts counts table (Total 8, Published 2, Scheduled 0, Drafts 4, with Facebook/FB+IG breakdown)
- SEO Coverage tile (Meta Title 100%, Meta Description 100%, Focus Keyword 64%)
- Blog Analytics (16 published, most recent post, missing excerpts)
- Advanced Analytics section header
- Lead Source Breakdown chart (last 6 months, by service type)
- Social Posts Scheduled chart (last 6 months)

**Target state:**

> **Kickoff revision (Scott's pre-flight decision):** All conversion- and lead-related tiles are retained as-is, even where the original kickoff flagged redundancy. Philosophy: leave them visible to Kirk + future tenants, observe in production, fix if a real complaint surfaces. The Reports tab is allowed to be redundant for now.

Top stat row:
- KEEP: Total Leads
- KEEP: New (Uncontacted)
- KEEP: Converted
- KEEP: Conversion Rate

Main grid:
- KEEP: Leads Over Time chart
- KEEP: Lead Status panel
- KEEP: Top Requested Services
- KEEP: Lead Funnel section
- KEEP: Site Performance (PageSpeed)
- KEEP: Social Analytics (Zernio)
- KEEP: Social Posts counts table
- KEEP: SEO Coverage tile — if death audit confirms real data (page-level meta fill rate is genuinely useful; verify before deciding)
- RELOCATE: Blog Analytics → Content section (find the right home; if Content has no good slot, fall back to a small dashboard card or a single-line Reports summary — don't force a bad placement)
- REMOVE: Advanced Analytics section header
- REMOVE: Lead Source Breakdown chart (redundant with Top Requested Services in simpler form — unrelated to conversion; removal stands)
- REMOVE: Social Posts Scheduled chart (redundant with Social Posts counts table — unrelated to conversion; removal stands)

The new S227 SEO Analytics tile mounts here via S227 Phase 7 — already in repo by S228 start.

### SEO Connect tab

**Current state** (per planning screenshots):
- Google Search Console (Connected, dangpestcontrol.com)
- Google Analytics 4 (Not Connected, sample preview chart)
- Google PageSpeed Insights (Active — No Setup Required, working)
- Vercel Analytics (Active — Auto-Connected, "View Vercel Analytics →" — link-out, no real data in PFP)
- Ahrefs Webmaster Tools (Not Connected, Sign Up Free)
- Bing Webmaster Tools (Not Connected, Sign Up Free)

**Target state:**
- REMOVE: Google Search Console (S227 supersedes; Google add-user bug parked indefinitely for sensitive-scope automation)
- REMOVE: Google Analytics 4 (Not Connected; Google add-user bug also blocks; deferred indefinitely)
- KEEP: Google PageSpeed Insights (no change — works from S224)
- KEEP + INVESTIGATE: Vercel Analytics — currently a link-out; goal is real data in PFP. See Phase 4 below.
- REMOVE: Ahrefs Webmaster Tools (won't subscribe)
- REMOVE: Bing Webmaster Tools (won't subscribe)
- KEEP: S227 SEO Analytics tile (mounted via S227 Phase 7; no change)

Net result: 3 tiles on SEO Connect (PageSpeed + Vercel + S227), down from 7.

### CRM

Untouched this session per Scott's explicit call.

---

## Death-audit checklist (Phase 1)

Same shape as S227 — execute fully before any deletion. Save output to `docs/audits/s228-death-audit.txt`. Stop and report before Phase 2.

### File-level inventory

Identify the owning file for each tile being removed, replaced, or relocated:

Dashboard:
- Top stat cards container
- SEO Performance card component
- Social Media card component
- Recent Leads list component
- Leads Per Month chart (keep, but verify it's not coupled to anything we're removing)

Reports tab (removals/relocations only — conversion tiles retained, do not touch):
- Advanced Analytics section header
- Lead Source Breakdown chart
- Social Posts Scheduled chart
- Blog Analytics tile (relocating, not removing — track new home target too)
- SEO Coverage tile (verify real data; don't remove)

Reports tab (conversion tiles, audit-only for paper-trail; DO NOT prepare for removal):
- Top stat cards (4)
- Lead Status panel
- Lead Funnel section

SEO Connect tab:
- Each of GSC, GA4, Ahrefs, Bing tile components
- Vercel Analytics tile component (modify or replace, not remove)

### Dependency map

For each removal target:
- What imports/exports does it touch?
- Are any types or hooks shared with components we're keeping?
- Any `settings` table keys associated (e.g., GA4 measurement ID, GSC property URL)? These don't need DB deletion but go dark — document in handoff which keys are now orphaned.
- Any cron jobs or edge fns coupled to these tiles? Should not be — verify.

### Real-data audit for replacement tiles

Confirm before Phase 2:
- `seo_runs` table has data for Dang (it should — S227 cron is firing weekly)
- `zernio_runs` table has data for Dang (it should — S225/S226 shipped)
- Both tables have RLS scoped to tenant_id (verify the new mini-tiles can read via existing auth pattern)

---

## Implementation order (phased, with stop points)

### Phase 1 — Death audit + dependency map
File-level inventory + import/export trace. Save to `docs/audits/s228-death-audit.txt`. Stop and report.

### Phase 2 — Dashboard redesign
- Keep two top stat cards (New This Month, This Week Conversion Rate)
- Replace SEO Performance card with `seo_runs`-sourced mini-tile
- Replace Social Media card with `zernio_runs`-sourced mini-tile
- Both mini-tiles mirror existing top-stat-card layout — no new design system
- Remove Recent Leads list
- Keep Leads Per Month chart + Quick Links

Stop point: dashboard renders clean for Dang, both new mini-tiles populated with real data, browser-verified.

### Phase 3 — Reports tab cleanup (narrower than original kickoff)
- DO NOT touch top stat row (all 4 cards retained)
- DO NOT touch Lead Status panel
- DO NOT touch Lead Funnel section
- Remove Advanced Analytics section + both charts (Lead Source Breakdown, Social Posts Scheduled)
- Relocate Blog Analytics to Content (final placement decided during this phase)
- Verify SEO Coverage is real data, keep
- Confirm S227 SEO Analytics tile renders here as expected (mounted in S227 Phase 7)

Stop point: reports tab has Advanced Analytics section gone, Blog Analytics relocated, every conversion/lead tile untouched.

### Phase 4 — SEO Connect tab cleanup + Vercel investigation
- Remove four tiles (GSC, GA4, Ahrefs, Bing)
- Keep PageSpeed + S227 SEO Analytics unchanged
- **Sub-phase 4a: Vercel Analytics investigation.** Read Vercel's Analytics API docs. Can authenticated API access expose page-views, visitors, top pages, geography to our edge fn? Cost? Auth model (Vercel team token vs OAuth)?
  - If lift is small (one edge fn + one tile, similar to S227 pattern, no auth gymnastics): ship in S228 Phase 4b
  - If lift is significant (OAuth, plan-tier gates, etc.): downgrade tile to "Status: Active on Vercel; click to view detailed metrics" with link-out + log S229 backlog item for full integration

Stop point: SEO Connect tab is materially shorter. Vercel decision documented in commit message regardless of outcome.

### Phase 5 — Verification
Per-shell + Dang browser pass against the verification matrix below.

### Phase 6 — Doc updates
- Rewrite `docs/audits/pestflow-pro-kickoff-S228.md` with final session content (this brief becomes canonical)
- Bump `pestflow-pro-todo-v94.html` → `v95`
- Write `docs/handoffs/pestflow-pro-handoff-S228-shipped.md`
- Write `docs/audits/pestflow-pro-kickoff-S229.md` (next candidate — likely Vercel Analytics full integration if 4a deferred, or another adjacent cleanup/expansion item)

### Phase 7 — Ship
PR-based merge per S227 precedent.

---

## Validator gate

**None required for the prune/redesign work** — no new caching, auth, payments, CSS architecture, Next.js metadata, RLS, or Supabase edge function behavior changes.

**Exception:** If Phase 4 includes building a Vercel Analytics edge fn (S227-pattern external connector), THAT triggers the gate — schema design, error handling, auth, all the usual questions.

---

## Verification matrix

| Surface | Check | Method |
|---|---|---|
| Dashboard | 4 top stat cards present, two are real-data mini-tiles | Browser, Dang admin |
| Dashboard | SEO Performance mini-tile shows real `seo_runs` data | Browser + DB cross-check |
| Dashboard | Social Media mini-tile shows real `zernio_runs` data | Browser + DB cross-check |
| Dashboard | Recent Leads list absent | Browser |
| Dashboard | Leads Per Month chart present | Browser |
| Dashboard | Quick Links present | Browser |
| Reports | Top stat row intact (Total Leads, New Uncontacted, Converted, Conversion Rate) | Browser |
| Reports | Lead Status panel intact | Browser |
| Reports | Lead Funnel section intact | Browser |
| Reports | Advanced Analytics section absent (header + both charts) | Browser |
| Reports | Blog Analytics relocated to Content section | Browser, navigate to Content |
| Reports | SEO Coverage tile present with real percentages | Browser |
| Reports | S227 SEO Analytics tile renders | Browser |
| SEO Connect | Four tiles absent (GSC, GA4, Ahrefs, Bing) | Browser |
| SEO Connect | PageSpeed + Vercel + S227 SEO Analytics present (Vercel possibly downgraded per 4a outcome) | Browser |
| BL canary | All three affected surfaces render clean on BL shell | Browser, BL shell |
| Codebase-is-truth | Any edge fn changes verified via SHA hash equality post-revert | MCP fetch + diff |

---

## Deliverables

1. PR (single, focused on admin surface cleanup) merged to main
2. `docs/handoffs/pestflow-pro-handoff-S228-shipped.md`
3. `docs/handoffs/pestflow-pro-todo-v95.html`
4. `docs/audits/pestflow-pro-kickoff-S228.md` (rewritten from this brief at session end)
5. `docs/audits/s228-death-audit.txt`
6. `docs/audits/pestflow-pro-kickoff-S229.md` (next candidate)

---

## Rules carry over (no exceptions)

- Feature branch + PR (v3.1 hook enforces)
- Targeted `git add` only — never `git add .` or directory-wide
- Context discipline: 50/60/70% notifications, 80% hard stop
- Stop-on-fail at every phase boundary
- Implement decisions immediately
- Mirror existing patterns — don't invent (the two new mini-tiles MUST mirror existing top-stat-card layout)
- Windows-only references throughout
- Codebase-is-truth for any edge fn changes (SHA equality post-revert pattern from S227)

---

## Non-obvious risks

1. **Tile removal orphans imports.** Death audit must surface the full dependency chain before any delete. A removed tile that leaves dead imports causes lint/type errors.

2. **Mini-tile design space (Phase 2).** The two new mini-tiles (SEO Performance + Social Media) have no existing precedent on the dashboard. Risk: invented styling that drifts from the rest of the dashboard. Mitigation: mirror existing top-stat-card layout exactly — same border, same dimensions, same typography. The "mini-tile" is just a top-stat-card with a richer body. Resist the urge to design something new.

3. **Vercel Analytics rabbit hole (Phase 4a).** Vercel's API may have auth/cost gotchas similar to DataForSEO's. If investigation reveals more lift than expected, defer to S229 — don't expand S228 scope.

4. **"SEO Coverage" tile decision.** Scott was uncertain what it showed during planning. Death audit must confirm it's pulling real data (page-level meta-title/description/focus-keyword fill rates) before deciding keep vs remove. Default: keep unless audit proves it's hardcoded/stale.

5. **Blog Analytics relocation target.** Content section is the intended home. If Content has no good slot, the fallback hierarchy is: small dashboard card → single-line Reports summary → keep in current location. Don't force a bad placement.

6. **Reports tab redundancy is allowed (kickoff revision).** Original kickoff slated three conversion-related tiles for removal (top stat cards 2–4, Lead Status, Lead Funnel). Scott's pre-flight call: keep them all, let users see the current shape, revisit only if real complaints surface. Phase 3 must not touch any conversion/lead tile. If CC Web's death audit surfaces "redundancy" rationale that contradicts this, escalate before deleting — don't act on the original kickoff text.
