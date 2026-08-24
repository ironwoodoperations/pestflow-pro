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

// tier -> engines, from ai_authority_tier_engines
const ENGINES = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 3 };

const TENANTS = [
  { slug:'apex-protect', name:'Apex Pest Protection', vertical:'pest', tier:4, city:'Austin', state:'TX',
    areas:sa('Austin/TX, Cedar Park/TX, Georgetown/TX, Pflugerville/TX, Round Rock/TX') },
  { slug:'coastal-pest', name:'Coastal Pest Co.', vertical:'pest', tier:4, city:'Galveston', state:'TX',
    areas:sa('Friendswood/TX, Galveston/TX, League City/TX, Pearland/TX, Texas City/TX') },
  { slug:'heartland-pest', name:'Heartland Pest Co.', vertical:'pest', tier:4, city:'Springfield', state:'MO',
    areas:sa('Branson/MO, Joplin/MO, Nixa/MO, Ozark/MO, Springfield/MO') },
  { slug:'metro-pest-concierge', name:'Metro Pest Concierge', vertical:'pest', tier:4, city:'Houston', state:'TX',
    areas:sa('Bellaire/TX, Houston/TX, Memorial/TX, River Oaks/TX, West University Place/TX') },
  { slug:'pestflow-pro', name:'PestFlow Pro', vertical:'pest', tier:4, city:'Tyler', state:'TX',
    areas:sa('Arp/TX, Bullard/TX, Jacksonville/TX, Lindale/TX, Longview/TX, Nacogdoches/TX, Tyler/TX') },
  { slug:'urban-strike', name:'Urban Strike Pest Defense', vertical:'pest', tier:4, city:'Dallas', state:'TX',
    areas:sa('Arlington/TX, Dallas/TX, Fort Worth/TX, Frisco/TX, Plano/TX') },
  { slug:'pls', name:'Precision Lawn Systems LLC', vertical:'irrigation', tier:3, city:'Hawkins', state:'TX',
    areas:sa('Hawkins/TX, Holly Lake Ranch/TX, Lindale/TX, Longview/TX, Tyler/TX') },
  // vertical NULL, address NULL, zero service areas — branded query only.
  { slug:'vita-glow', name:'Vita Glow Wellness', vertical:null, tier:3, city:'', state:'', areas:[] },
];

const lines = [];
let totalJobs = 0, totalPrompts = 0;
const summary = [];
for (const t of TENANTS) {
  const prompts = generateAuthorityPrompts({
    businessName: t.name, city: t.city, state: t.state,
    serviceAreas: t.areas, serviceSlugs: slugsFor(t.vertical),
  });
  const engines = ENGINES[t.tier] ?? 0;
  const jobs = prompts.length * engines;
  totalPrompts += prompts.length; totalJobs += jobs;
  summary.push({ slug: t.slug, vertical: t.vertical ?? 'NULL', tier: t.tier, engines, prompts: prompts.length, jobsPerRun: jobs });
  lines.push(`-- ${t.slug}  (vertical: ${t.vertical ?? 'NULL'}, tier ${t.tier}, ${engines} engine(s))  ${prompts.length} prompt(s)`);
  if (prompts.length === 0) { lines.push('--   (nothing to seed — no name, no vertical, no locations)\n'); continue; }
  lines.push(`insert into ai_authority_prompts (tenant_id, prompt_text, active)`);
  lines.push(`select t.id, v.prompt_text, true from tenants t,`);
  lines.push(`  (values`);
  lines.push(prompts.map((p) => `    ('${p.replace(/'/g, "''")}')`).join(',\n'));
  lines.push(`  ) as v(prompt_text)`);
  lines.push(`where t.slug = '${t.slug}'`);
  lines.push(`  and not exists (select 1 from ai_authority_prompts x where x.tenant_id = t.id);\n`);
}

console.table(summary);
console.log(`TOTAL new prompts: ${totalPrompts}`);
console.log(`TOTAL jobs per run (new tenants only): ${totalJobs}`);
console.log(`dang today: 10 prompts x 3 engines = 30 jobs per run`);
console.log(`AFTER backfill, platform total: ${totalJobs + 30} jobs per run  (${((totalJobs + 30) / 30).toFixed(1)}x today)`);

writeFileSync('docs/audits/s289-authority-prompt-backfill.sql',
  `-- S289 — AI Authority prompt backfill. GENERATED, NOT APPLIED.\n` +
  `-- Review, then apply via MCP. Idempotent: each insert is guarded by\n` +
  `-- "not exists (… where x.tenant_id = t.id)", so re-running is a no-op and\n` +
  `-- a tenant that already has prompts (dang) is never touched.\n` +
  `-- Generated from a live-data snapshot read 2026-08-24.\n\n` +
  lines.join('\n') + '\n');
