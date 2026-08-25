# Session log — branch `investigate/s298-seo-fix-chain-vertical`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-08-25 16:16 UTC
- Branch: `investigate/s298-seo-fix-chain-vertical`
- Commit: `3ed4b23` — investigate: seo fix-chain hardcodes pest in all four branches, and writes it live
- Author: Claude
- Files changed:
  - INVESTIGATION_s298-seo-fix-chain-vertical.md
- Next recommended action: AWAITING Scott's approval to write the fix. `/investigate`
  protocol — this branch is the REPORT and stays that way; the fix goes on a SEPARATE
  branch `fix/s298-seo-fix-chain-vertical`. Do not stack the fix here.
  ESTABLISHED, do not re-derive: (1) both defects confirmed — all four `buildPrompt`
  branches hardcode pest-control, and the output is persisted by `apply-finding-fix` to
  `page_content.intro` / `seo_meta.*` then pushed live by `triggerRevalidate`;
  `biz.city` is ALWAYS undefined because NO tenant has a `city` key (9 of 9 —
  `address_locality` is the real field), so the prompt gets the full street address under
  a `City:` label while `meta_title` instructs the model to include the city.
  (2) EXPOSURE: both non-pest tenants (pls, vita-glow) are tier 3 Pro — Generate and
  Apply are Pro, only Fix-all is Elite — so the tier gate does NOT stop this.
  (3) NO CLEANUP NEEDED: only `dang` (pest) has ever generated; pls and vita-glow have
  zero `report_findings` rows; the live-copy scan on non-pest tenants is clean AND the
  control fired 234 (`seo_meta`) + 109 (`page_content.intro`) on pest tenants, so the
  zeroes are evidence rather than a broken probe. Word-boundary anchored deliberately —
  unanchored `pest` matches "PestFlow Pro".
  THE FIX, when approved: move the prompt into `seoPrompts.ts` as an exported
  `buildFixFieldPrompt` (that is what makes the assembled string testable at all), trade
  via `tradeClause`/`tradeNounFor`, vertical from `useAdminPreset()`, city from
  `cityFromBusinessInfo` with the "include the city" rule DROPPED when it is '', and add
  `NO_INVENT`. NO fifth vocabulary module. GUARD: 4 fix_fields x 3 verticals = 12
  assembled strings, with an explicit `expect(FIX_FIELDS).toHaveLength(4)` — an emptied
  list generates zero cases and passes green, which this project has hit three times.
  REPORTED, NOT FIXED: `cityFromBusinessInfo` regex-parses `address` and never reads
  `address_locality`; right answer on all current data, so not widened into this fix.
