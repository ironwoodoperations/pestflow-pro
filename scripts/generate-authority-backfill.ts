// S289 — generates the AI Authority prompt backfill for tenants that have none.
//
// OUTPUT ONLY. This writes a .sql file for review; it never touches the database.
// Applying it is Claude.ai's job via MCP, after Scott has read it — the same
// split used for every DB change this session.
//
// Inputs are a snapshot of live data (read 2026-08-24). Re-read before applying
// if service areas or verticals have changed since.
import { writeFileSync } from 'node:fs';
import { generateAuthorityPrompts } from '../supabase/functions/_shared/authorityPrompts.ts';

const PEST = ['pest-control','termite-control','termite-inspections','spider-control','roach-control',
  'ant-control','mosquito-control','scorpion-control','bed-bug-control','flea-tick-control',
  'rodent-control','wasp-hornet-control'];
const IRRIGATION = ['sprinkler-systems','drainage','pump-systems','sod-dirt-work','retaining-walls'];
const slugsFor = (v) => v === 'pest' ? PEST : v === 'irrigation' ? IRRIGATION : [];

const sa = (s) => s.split(',').map((x) => {
  const [city, state] = x.split('/').map((y) => y.trim());
  return { city, state: state === '?' ? null : state };
});

// tier -> engines granted, from ai_authority_tier_engines.
const TIER_ENGINES = {
  1: [], 2: ['perplexity_sonar'], 3: ['perplexity_sonar', 'openai_web'],
  4: ['perplexity_sonar', 'openai_web', 'claude_web'],
  5: ['perplexity_sonar', 'openai_web', 'claude_web'],
};
// ai_authority_engine_cost_config. adapter_enabled=false means the job is
// enqueued and immediately skipped — granted but not billed.
const ENGINE = {
  perplexity_sonar: { usd: 0.010, enabled: true },
  openai_web:       { usd: 0.040, enabled: true },
  claude_web:       { usd: 0.020, enabled: false },
  google_aio:       { usd: 0.030, enabled: false },
};
const billable = (tier, includeClaude) => (TIER_ENGINES[tier] ?? [])
  .filter((e) => ENGINE[e].enabled || (includeClaude && e === 'claude_web'));

const TENANTS = [
  // dang already has its ten hand-written prompts. Listed because it RUNS every
  // month and therefore belongs in the cost total; `alreadySeeded` keeps it out
  // of the INSERT, which the not-exists guard would skip anyway.
  { demo:false, alreadySeeded:true, slug:'dang', name:'Dang Pest Control', vertical:'pest', tier:4, city:'Tyler', state:'TX',
    areas:sa('Arp/?, Athens/?, Bullard/TX, Canton/TX, Chandler/?, Chapel Hill/?, Flint/?, Gilmer/?, Gladewater/?, Henderson/TX, Hideaway/?, Jacksonville/TX, Kilgore/TX, Lindale/TX, Longview/TX, Noonday/?, Tyler/TX, Whitehouse/TX') },
  { demo:true, slug:'apex-protect', name:'Apex Pest Protection', vertical:'pest', tier:4, city:'Austin', state:'TX',
    areas:sa('Austin/TX, Cedar Park/TX, Georgetown/TX, Pflugerville/TX, Round Rock/TX') },
  { demo:true, slug:'coastal-pest', name:'Coastal Pest Co.', vertical:'pest', tier:4, city:'Galveston', state:'TX',
    areas:sa('Friendswood/TX, Galveston/TX, League City/TX, Pearland/TX, Texas City/TX') },
  { demo:true, slug:'heartland-pest', name:'Heartland Pest Co.', vertical:'pest', tier:4, city:'Springfield', state:'MO',
    areas:sa('Branson/MO, Joplin/MO, Nixa/MO, Ozark/MO, Springfield/MO') },
  { demo:true, slug:'metro-pest-concierge', name:'Metro Pest Concierge', vertical:'pest', tier:4, city:'Houston', state:'TX',
    areas:sa('Bellaire/TX, Houston/TX, Memorial/TX, River Oaks/TX, West University Place/TX') },
  // THE OPERATOR TENANT. demo_mode.active is false, so the demo filter correctly
  // lets it through — it is not a demo, it is the PestFlow Pro SaaS product.
  { demo:false, operator:true, slug:'pestflow-pro', name:'PestFlow Pro', vertical:'pest', tier:4, city:'Tyler', state:'TX',
    areas:sa('Arp/TX, Bullard/TX, Jacksonville/TX, Lindale/TX, Longview/TX, Nacogdoches/TX, Tyler/TX') },
  { demo:true, slug:'urban-strike', name:'Urban Strike Pest Defense', vertical:'pest', tier:4, city:'Dallas', state:'TX',
    areas:sa('Arlington/TX, Dallas/TX, Fort Worth/TX, Frisco/TX, Plano/TX') },
  // The five live service_areas rows, ordered (created_at, city). All five carry
  // an IDENTICAL created_at — they were inserted in one statement — so the
  // tiebreak is the whole order, and it is alphabetical. There is no priority
  // column on service_areas and no recorded ranking to honour, so the order
  // conveys nothing; what matters is that the walk now covers all five rather
  // than exhausting the first two.
  { demo:false, slug:'pls', name:'Precision Lawn Systems LLC', vertical:'irrigation', tier:3, city:'Hawkins', state:'TX',
    areas:sa('Hawkins/TX, Holly Lake Ranch/TX, Lindale/TX, Longview/TX, Tyler/TX') },
  // vertical NULL, address NULL, zero service areas — branded query only.
  // demo:null means NO settings.demo_mode row exists, not `active: false`.
  { demo:null, slug:'vita-glow', name:'Vita Glow Wellness', vertical:null, tier:3, city:'', state:'', areas:[] },
];

// DEMO TENANTS ARE EXCLUDED, and the filter lives HERE rather than in the
// output file so the .sql is correct by construction — hand-editing it would
// leave the next regeneration silently wrong again.
//
// Five of the nine are invented businesses with no domain, seeded the same
// second. Running AI Authority for them pays three engines to search the live
// web for a company that does not exist, and writes ~150 confirmed-zero
// snapshot rows a month that would pollute any future cross-tenant average.
//
// `demo !== true`, NOT `demo === false`: vita-glow has NO demo_mode settings row
// at all, so its flag here is null. Testing for false would drop a REAL tenant
// silently — the same absent-vs-false trap as `vertical`.
const EXCLUDED = TENANTS.filter((t) => t.demo === true);

// THE OPERATOR TENANT IS EXCLUDED TOO, and for a different reason than the demos.
//
// Non-demo is not the same as a real CLIENT. pestflow-pro has
// demo_mode.active = false — it is not a demo site, it is the PestFlow Pro SaaS
// product itself. Its page_content and service_areas are pest demo scaffolding
// (the same scaffolding that held the fabricated 555-0142 blog posts), so the
// backfill would have had it asking "best pest control in Tyler TX" and scoring
// whether a software product gets cited for pest control.
//
// THE PREDICATE, and why it holds for tenant number ten: exclude the tenant that
// public.operator_tenant_id() names. That SECURITY DEFINER resolver (S273) is the
// platform's single declared answer to "which tenant is the operator" and already
// gates provisioning_status RLS. Every tenant it does not name is a client, so a
// new client is included automatically with no list to remember to update; and if
// the operator tenant ever moves, S273's function is the one place that changes
// and this follows it. What is NOT used here: the slug or the UUID (a hardcoded
// exception is the thing that rots), is_protected (true for dang as well),
// entitlement (4, same as dang), or tenant_users.role (every tenant has exactly
// one 'admin').
//
// Checked and rejected — "absence of a client relationship": prospects.tenant_id
// is set for dang ALONE. pls and vita-glow are real paying clients created
// outside the sales flow and have no prospect row, so that predicate would
// exclude two of the three tenants this backfill exists to serve.
const OPERATOR = TENANTS.filter((t) => t.operator === true);
const REAL = TENANTS.filter((t) => t.demo !== true && t.operator !== true);
console.log(`Excluded ${EXCLUDED.length} demo tenants: ${EXCLUDED.map((t) => t.slug).join(', ')}`);
console.log(`Excluded operator tenant: ${OPERATOR.map((t) => t.slug).join(', ')}`);
console.log(`Real client tenants: ${REAL.map((t) => t.slug).join(', ')}\n`);

const lines = [];
let totalPrompts = 0, totalUsdNow = 0, totalUsdClaude = 0;
const summary = [];
for (const t of REAL) {
  const prompts = generateAuthorityPrompts({
    businessName: t.name, city: t.city, state: t.state,
    serviceAreas: t.areas, serviceSlugs: slugsFor(t.vertical),
  });
  const now = billable(t.tier, false);
  const withClaude = billable(t.tier, true);
  const jobs = prompts.length * now.length;
  const usdNow = prompts.length * now.reduce((a, e) => a + ENGINE[e].usd, 0);
  const usdClaude = prompts.length * withClaude.reduce((a, e) => a + ENGINE[e].usd, 0);
  if (!t.alreadySeeded) totalPrompts += prompts.length;
  totalUsdNow += usdNow; totalUsdClaude += usdClaude;
  summary.push({ slug: t.slug, vertical: t.vertical ?? 'NULL', tier: t.tier,
    enabledEngines: now.length, prompts: prompts.length, callsPerMonth: jobs,
    usdPerMonth: '$' + usdNow.toFixed(2), withClaudeWeb: '$' + usdClaude.toFixed(2) });
  lines.push(`-- ${t.slug}  (vertical: ${t.vertical ?? 'NULL'}, tier ${t.tier}, ${now.length} enabled engine(s))  ${prompts.length} prompt(s)`);
  if (prompts.length === 0) { lines.push('--   (nothing to seed — no name, no vertical, no locations)\n'); continue; }
  if (t.alreadySeeded) {
    lines.push('--   (already seeded by hand — counted in the cost total, not re-inserted)\n');
    continue;
  }
  lines.push(`insert into ai_authority_prompts (tenant_id, prompt_text, active)`);
  lines.push(`select t.id, v.prompt_text, true from tenants t,`);
  lines.push(`  (values`);
  lines.push(prompts.map((p) => `    ('${p.replace(/'/g, "''")}')`).join(',\n'));
  lines.push(`  ) as v(prompt_text)`);
  lines.push(`where t.slug = '${t.slug}'`);
  lines.push(`  and t.id <> public.operator_tenant_id()   -- belt-and-braces: the generator already excluded it`);
  lines.push(`  and not exists (select 1 from ai_authority_prompts x where x.tenant_id = t.id);\n`);
}

console.table(summary);
// dang already has its ten prompts; they are counted in REAL above but are not
// NEW, so the "new prompts" figure excludes them.
const dang = summary.find((r) => r.slug === 'dang');
console.log(`\nNew prompts to insert: ${totalPrompts}`);
console.log(`Cron is MONTHLY (0 4 1 * *), so calls-per-run == calls-per-month.`);
console.log(`REAL-CLIENT COST, all ${REAL.length}, per month:`);
console.log(`  today (perplexity + openai):      $${totalUsdNow.toFixed(2)}`);
console.log(`  once claude_web is enabled:       $${totalUsdClaude.toFixed(2)}`);
console.log(`  dang alone today:                 ${dang ? dang.usdPerMonth : 'n/a'}`);
// What exclusion actually saves, run through the SAME generator and cost model
// rather than estimated — so the figure cannot drift from the tenant rows above.
const costOf = (t) => {
  const n = generateAuthorityPrompts({
    businessName: t.name, city: t.city, state: t.state,
    serviceAreas: t.areas, serviceSlugs: slugsFor(t.vertical),
  }).length;
  const eng = billable(t.tier, false);
  return { prompts: n, calls: n * eng.length, usd: n * eng.reduce((a, e) => a + ENGINE[e].usd, 0) };
};
const sumCost = (rows) => rows.map(costOf).reduce(
  (a, c) => ({ prompts: a.prompts + c.prompts, calls: a.calls + c.calls, usd: a.usd + c.usd }),
  { prompts: 0, calls: 0, usd: 0 });
const demoCost = sumCost(EXCLUDED);
const opCost = sumCost(OPERATOR);
console.log(`Excluded ${EXCLUDED.length} demo tenants:  $${demoCost.usd.toFixed(2)}/month, ${demoCost.calls} calls, ${demoCost.prompts} prompts not seeded.`);
console.log(`Excluded operator tenant:   $${opCost.usd.toFixed(2)}/month, ${opCost.calls} calls, ${opCost.prompts} prompts not seeded.`);
console.log(`Total avoided:              $${(demoCost.usd + opCost.usd).toFixed(2)}/month.`);

writeFileSync('docs/audits/s289-authority-prompt-backfill.sql',
  `-- S289 — AI Authority prompt backfill. GENERATED, NOT APPLIED.\n` +
  `-- Review, then apply via MCP. Idempotent: each insert is guarded by\n` +
  `-- "not exists (… where x.tenant_id = t.id)", so re-running is a no-op and\n` +
  `-- a tenant that already has prompts (dang) is never touched.\n` +
  `-- Generated from a live-data snapshot read 2026-08-24.\n` +
  `--\n` +
  `-- DEMO TENANTS EXCLUDED (${EXCLUDED.map((t) => t.slug).join(', ')}).\n` +
  `-- They are invented businesses with no domain; searching the live web for\n` +
  `-- them costs money and writes confirmed-zero rows that would skew any\n` +
  `-- cross-tenant average.\n` +
  `--\n` +
  `-- OPERATOR TENANT EXCLUDED (${OPERATOR.map((t) => t.slug).join(', ')}).\n` +
  `-- Not a demo (demo_mode.active is false) and not a client either: it is the\n` +
  `-- PestFlow Pro product itself, carrying pest demo scaffolding it never used.\n` +
  `-- The predicate is "the tenant public.operator_tenant_id() names" — the S273\n` +
  `-- resolver that already gates provisioning_status RLS — so every tenant it\n` +
  `-- does not name is a client and a new client needs no list update.\n` +
  `--\n` +
  `-- BOTH FILTERS LIVE IN scripts/generate-authority-backfill.ts, not in this\n` +
  `-- file: hand-editing the output would leave the next regeneration silently\n` +
  `-- wrong. Each insert additionally carries an operator_tenant_id() guard, so\n` +
  `-- the applied SQL is correct even if this snapshot has gone stale.\n\n` +
  lines.join('\n') + '\n');
