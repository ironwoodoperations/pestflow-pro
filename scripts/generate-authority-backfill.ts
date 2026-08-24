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
  { demo:false, slug:'pestflow-pro', name:'PestFlow Pro', vertical:'pest', tier:4, city:'Tyler', state:'TX',
    areas:sa('Arp/TX, Bullard/TX, Jacksonville/TX, Lindale/TX, Longview/TX, Nacogdoches/TX, Tyler/TX') },
  { demo:true, slug:'urban-strike', name:'Urban Strike Pest Defense', vertical:'pest', tier:4, city:'Dallas', state:'TX',
    areas:sa('Arlington/TX, Dallas/TX, Fort Worth/TX, Frisco/TX, Plano/TX') },
  { demo:false, slug:'pls', name:'Precision Lawn Systems LLC', vertical:'irrigation', tier:3, city:'Hawkins', state:'TX',
    areas:sa('Hawkins/TX, Holly Lake Ranch/TX, Lindale/TX, Longview/TX, Tyler/TX') },
  // vertical NULL, address NULL, zero service areas — branded query only.
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
// `demo !== true`, NOT `demo === false`: vita-glow's demo_mode row has
// active = NULL. Testing for false would drop a REAL tenant silently — the
// same NULL-handling trap as `vertical`.
const EXCLUDED = TENANTS.filter((t) => t.demo === true);
const REAL = TENANTS.filter((t) => t.demo !== true);
console.log(`Excluded ${EXCLUDED.length} demo tenants: ${EXCLUDED.map((t) => t.slug).join(', ')}`);
console.log(`Real tenants: ${REAL.map((t) => t.slug).join(', ')}\n`);

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
  lines.push(`  and not exists (select 1 from ai_authority_prompts x where x.tenant_id = t.id);\n`);
}

console.table(summary);
// dang already has its ten prompts; they are counted in REAL above but are not
// NEW, so the "new prompts" figure excludes them.
const dang = summary.find((r) => r.slug === 'dang');
console.log(`\nNew prompts to insert: ${totalPrompts}`);
console.log(`Cron is MONTHLY (0 4 1 * *), so calls-per-run == calls-per-month.`);
console.log(`REAL-TENANT COST, all four, per month:`);
console.log(`  today (perplexity + openai):      $${totalUsdNow.toFixed(2)}`);
console.log(`  once claude_web is enabled:       $${totalUsdClaude.toFixed(2)}`);
console.log(`  dang alone today:                 ${dang ? dang.usdPerMonth : 'n/a'}`);
console.log(`Demo tenants excluded would have added ~$${(EXCLUDED.length * 10 * 0.05).toFixed(2)}/month and ~${EXCLUDED.length * 10 * 2} confirmed-zero snapshot rows.`);

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
  `-- cross-tenant average. The filter lives in the generator script, so\n` +
  `-- regenerating this file cannot silently re-include them.\n\n` +
  lines.join('\n') + '\n');
