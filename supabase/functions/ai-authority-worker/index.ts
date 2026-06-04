// Edge Function: ai-authority-worker — S253/A1.
// Processes ONE ai_authority_jobs row: claims it, resolves tenant context, calls
// the matching per-engine sibling proxy, parses the response deterministically,
// writes a snapshot (parsed_result + raw_response), and marks the job done/error.
// Fire-and-forget: nothing collects the return value — the worker persists its own
// result. The dispatch/drain cron (operator-applied via MCP) invokes this per job.
//
// AUTH (verify_jwt:false): X-Internal-Secret == AI_AUTHORITY_INTERNAL_SECRET
// (the Edge-Function-Secret mirror of vault `ai_authority_internal_secret`).
//
// DB: uses the supabase-js REST client (PostgREST → Supavisor pooler). It NEVER
// opens a direct postgres:// session connection, so a burst of worker write-backs
// cannot exhaust a session pool and take down the web app (validator flag).
//
// Engines: only WIRED + adapter_enabled engines run. claude_web and google_aio are
// deferred/dormant — the worker skips them safely even if a job is enqueued.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AI_AUTHORITY_INTERNAL_SECRET.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { constantTimeEq } from '../_shared/aiProxyShared.ts';
import { parseByEngine } from '../_shared/aiAuthority/parsers.ts';
import { normalizeHostname } from '../_shared/aiAuthority/match.ts';
import type { EngineId, TenantContext } from '../_shared/aiAuthority/types.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const INTERNAL_SECRET = Deno.env.get('AI_AUTHORITY_INTERNAL_SECRET') || '';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Engines with a real, wired sibling proxy. claude_web/google_aio intentionally
// absent → skipped (CLAUDE.md #3: no new direct Anthropic callers; Google has no API).
const PROXY_FN: Partial<Record<EngineId, string>> = {
  perplexity_sonar: 'ai-authority-perplexity',
  openai_web: 'ai-authority-openai',
};

interface JobRow {
  id: string; tenant_id: string; prompt_id: string; engine: EngineId;
  tier_slug: number; status: string; attempts: number; batch_id: string;
}

async function resolveTenantContext(svc: SupabaseClient, tenantId: string): Promise<TenantContext> {
  const { data: tenant } = await svc.from('tenants')
    .select('name, slug, subdomain, custom_domain').eq('id', tenantId).maybeSingle();

  const ownerHosts: string[] = [];
  const addHost = (raw?: string | null) => {
    if (!raw) return;
    const h = normalizeHostname(raw.includes('://') ? new URL(raw).hostname : raw.split('/')[0]);
    if (h) ownerHosts.push(h);
  };
  addHost(tenant?.custom_domain);
  if (tenant?.subdomain) addHost(tenant.subdomain.includes('.') ? tenant.subdomain : `${tenant.subdomain}.pestflowpro.ai`);
  if (tenant?.slug) addHost(`${tenant.slug}.pestflowpro.ai`);

  const { data: biz } = await svc.from('settings')
    .select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle();
  const businessName = (biz?.value as { name?: string } | null)?.name || tenant?.name || '';

  // Optional per-tenant tracked listing URLs (Yelp/Angi/GBP), settings key
  // 'ai_authority' → { tracked_urls: string[] }. Absent → owner hosts only.
  const { data: aa } = await svc.from('settings')
    .select('value').eq('tenant_id', tenantId).eq('key', 'ai_authority').maybeSingle();
  const trackedRaw = (aa?.value as { tracked_urls?: unknown } | null)?.tracked_urls;
  const trackedUrls = Array.isArray(trackedRaw) ? trackedRaw.filter((u): u is string => typeof u === 'string') : [];

  return { tenantId, businessName, ownerHosts: [...new Set(ownerHosts)], trackedUrls };
}

serve(async (req) => {
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!INTERNAL_SECRET) { console.error('[ai-authority-worker] secret not set'); return json(500, { error: 'Server misconfigured' }); }
  if (!constantTimeEq(INTERNAL_SECRET, req.headers.get('X-Internal-Secret') || '')) return json(401, { error: 'Unauthorized' });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(400, { error: 'Invalid JSON' }); }
  const jobId = typeof body.job_id === 'string' ? body.job_id : '';
  if (!UUID_RE.test(jobId)) return json(400, { error: 'job_id must be a UUID' });

  const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ── load + guarded claim (pending|error → running, attempts+1) ──
  const { data: job, error: jobErr } = await svc.from('ai_authority_jobs')
    .select('id, tenant_id, prompt_id, engine, tier_slug, status, attempts, batch_id')
    .eq('id', jobId).maybeSingle();
  if (jobErr) { console.error('[ai-authority-worker] job read error:', jobErr.message); return json(500, { error: 'job read failed' }); }
  if (!job) return json(404, { error: 'job not found' });
  const j = job as JobRow;
  if (!['pending', 'error'].includes(j.status)) return json(200, { skipped: 'not_claimable', status: j.status });

  const { data: claimed } = await svc.from('ai_authority_jobs')
    .update({ status: 'running', attempts: j.attempts + 1, updated_at: new Date().toISOString() })
    .eq('id', j.id).eq('status', j.status).select('id');
  if (!claimed || claimed.length === 0) return json(200, { skipped: 'claim_lost' });

  const setStatus = (status: string) =>
    svc.from('ai_authority_jobs').update({ status, updated_at: new Date().toISOString() }).eq('id', j.id);

  // ── adapter gate: must be wired AND adapter_enabled ──
  const proxyFn = PROXY_FN[j.engine];
  const { data: cfg } = await svc.from('ai_authority_engine_cost_config')
    .select('adapter_enabled').eq('engine', j.engine).maybeSingle();
  if (!proxyFn || !cfg || cfg.adapter_enabled !== true) {
    await setStatus('skipped_cost_cap');
    console.log(`[ai-authority-worker] skip engine=${j.engine} wired=${!!proxyFn} enabled=${cfg?.adapter_enabled}`);
    return json(200, { skipped: 'engine_disabled_or_unwired', engine: j.engine });
  }

  try {
    // ── prompt + tenant context ──
    const { data: promptRow } = await svc.from('ai_authority_prompts')
      .select('prompt_text').eq('id', j.prompt_id).eq('tenant_id', j.tenant_id).maybeSingle();
    const prompt = (promptRow?.prompt_text || '').trim();
    if (!prompt) { await setStatus('error'); return json(200, { error: 'prompt missing', job: j.id }); }

    const ctx = await resolveTenantContext(svc, j.tenant_id);

    // ── call the sibling proxy ──
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${proxyFn}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // gateway routing for verify_jwt:false fns + our internal auth
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'X-Internal-Secret': INTERNAL_SECRET,
      },
      body: JSON.stringify({ tenant_id: j.tenant_id, prompt }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      await setStatus('error');
      console.warn(`[ai-authority-worker] proxy ${proxyFn} ${res.status} job:${j.id}`);
      // No snapshot on engine error — the scorer denominator counts the scheduled
      // job, so the missing run correctly lowers the rate (never inflates it).
      return json(200, { error: 'engine_error', upstream_status: res.status, detail: errBody });
    }
    const raw = await res.json();

    // ── deterministic parse (per-engine; failure isolated to this snapshot) ──
    const parsed = parseByEngine(j.engine, raw as Record<string, unknown>, ctx);

    const { error: snapErr } = await svc.from('ai_authority_snapshots').insert({
      tenant_id: j.tenant_id,
      prompt_id: j.prompt_id,
      engine: j.engine,
      batch_id: j.batch_id,
      cited: parsed.cited,
      mentioned: parsed.mentioned,
      position: parsed.position,
      share_of_voice: parsed.share_of_voice,
      parse_failed: parsed.parse_failed,
      // tenant-readable programmatic signals (raw_response is operator-only)
      parsed_result: {
        cited: parsed.cited,
        mentioned: parsed.mentioned,
        position: parsed.position,
        share_of_voice: parsed.share_of_voice,
        parse_failed: parsed.parse_failed,
      },
      raw_response: parsed.raw ?? null,
    });
    if (snapErr) { await setStatus('error'); console.error('[ai-authority-worker] snapshot insert:', snapErr.message); return json(500, { error: 'snapshot insert failed' }); }

    await setStatus('done');
    return json(200, { ok: true, job: j.id, engine: j.engine, cited: parsed.cited, mentioned: parsed.mentioned, parse_failed: parsed.parse_failed });
  } catch (e) {
    await setStatus('error');
    console.error('[ai-authority-worker] error:', (e as Error)?.message);
    return json(200, { error: 'worker_exception', detail: (e as Error)?.message });
  }
});
