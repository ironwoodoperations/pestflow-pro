-- S286 — CONTENT-TABLE CLAIM SWEEP.
--
-- READ-ONLY. This script SELECTs. It never UPDATEs, DELETEs or INSERTs, and that
-- is a deliberate design constraint, not an omission — see WHY IT ONLY REPORTS.
--
-- ============================================================================
-- SCOPE — stated here so that a green result cannot be mistaken for more than
-- it is. Six times in this arc a guard has come back clean while the defect sat
-- somewhere it structurally could not see; S281's own DB sweep is the most
-- recent. It reported "(903) 555-0142: 0 remaining" and was correct about the
-- three tables it scanned — seo_meta, service_areas, settings.seo — while four
-- rows carrying that number sat in two tables it never looked at.
--
-- COVERS (exactly these, nothing else):
--     blog_posts.title
--     blog_posts.content
--     blog_posts.excerpt
--     social_posts.caption
--
-- DOES NOT COVER:
--   - seo_meta, service_areas, settings.*        -> S281's sweep; re-run that
--   - page_content.*                             -> NOT swept by anything yet
--   - faqs.question / faqs.answer                -> NOT swept by anything yet
--   - reviews, team_members, campaigns           -> NOT swept by anything yet
--   - any source file                            -> shared/lib/noUnverifiedClaims.test.ts
--                                                   (app/tenant/** and src/shells/** only)
--
-- The "NOT swept by anything yet" lines are the honest part. They are the next
-- place to look when this returns nothing and a claim is still reaching a page.
-- ============================================================================
--
-- WHY IT ONLY REPORTS, AND MUST KEEP ONLY REPORTING
--
-- Rule (a): the database is where tenant facts are SUPPOSED to live. A blunt
-- sweep would delete exactly the content the architecture wants there. S281 hit
-- this precisely: Dang's seo_meta says "same-day service" and it STAYS, because
-- it is Kirk's own claim about his own business, while the demo tenants'
-- identical string was machine-seeded for businesses that never made it, and
-- went. seo_meta had `user_edited` to tell those apart.
--
-- THESE TWO TABLES HAVE NO SUCH COLUMN. blog_posts has no authorship flag at
-- all; social_posts has `ai_generated`, which is reported below as a hint and is
-- NOT a verdict — an owner can edit an AI-drafted caption, and an owner can
-- paste a fabricated one by hand. So this script classifies nothing. It hands a
-- human the rows and the evidence, and a human decides.
--
-- ============================================================================
-- RUNNING IT
--   psql "$SUPABASE_DB_URL" -f supabase/tests/claims_content_sweep.sql
-- or via the Supabase MCP execute_sql tool (it is a plain SELECT).
--
-- ZERO ROWS = clean, for the four columns named above and nothing more.
-- ============================================================================

-- PATTERNS. Held in a CTE rather than psql \set variables so this file is
-- portable: it runs under psql AND under the Supabase MCP execute_sql tool,
-- which is not psql and does not understand meta-commands.
--
-- phone_re — the fabricated demo number. 555-01xx is the reserved fictional
-- range, so the pattern is deliberately wider than the single literal found so
-- far: a different seeded 555-01 number is the same defect in a new mask.
-- Tolerates (903) 555-0142, 903-555-0142, 903.555.0142 and 9035550142.
--
-- capacity_re — identical to CAPACITY_OR_TERMS in
-- shared/lib/noUnverifiedClaims.test.ts, so the code guard and this one cannot
-- drift into disagreeing about what counts as a claim.
with pat as (
  select
    '\(?903\)?[ .\-]?555[ .\-]?01[0-9]{2}'   as phone_re,
    '(same-day|next-day|24/7|no contracts)'    as capacity_re
)
select
  'blog_posts'                          as table_name,
  t.slug                                as tenant_slug,
  b.id::text                            as row_id,
  case when b.published_at is not null then 'PUBLISHED' else 'draft' end as visibility,
  null::boolean                         as ai_generated,   -- column does not exist on this table
  trim(
    case when coalesce(b.title,'')   ~* pat.phone_re then 'title '   else '' end ||
    case when coalesce(b.content,'') ~* pat.phone_re then 'content ' else '' end ||
    case when coalesce(b.excerpt,'') ~* pat.phone_re then 'excerpt ' else '' end
  )                                     as phone_in,
  case when coalesce(b.title,'') || ' ' || coalesce(b.content,'') || ' ' || coalesce(b.excerpt,'')
            ~* pat.capacity_re then 'yes' else '' end      as capacity_claim,
  left(coalesce(b.title, ''), 70)       as sample
from blog_posts b
join tenants t on t.id = b.tenant_id
cross join pat
where coalesce(b.title,'')   ~* pat.phone_re
   or coalesce(b.content,'') ~* pat.phone_re
   or coalesce(b.excerpt,'') ~* pat.phone_re
   or (coalesce(b.title,'') || ' ' || coalesce(b.content,'') || ' ' || coalesce(b.excerpt,'')) ~* pat.capacity_re

union all

select
  'social_posts',
  t.slug,
  s.id::text,
  coalesce(s.status, 'unknown'),
  s.ai_generated,          -- a HINT about origin, never a verdict. See above.
  trim(case when coalesce(s.caption,'') ~* pat.phone_re then 'caption ' else '' end),
  case when coalesce(s.caption,'') ~* pat.capacity_re then 'yes' else '' end,
  left(coalesce(s.caption, ''), 70)
from social_posts s
join tenants t on t.id = s.tenant_id
cross join pat
where coalesce(s.caption,'') ~* pat.phone_re
   or coalesce(s.caption,'') ~* pat.capacity_re

order by table_name, tenant_slug, row_id;
