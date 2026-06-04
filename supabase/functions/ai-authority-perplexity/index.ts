// Edge Function: ai-authority-perplexity — S253/A1.
// Sibling proxy (NOT the shared ai-proxy) for the perplexity_sonar authority
// engine. Holds PERPLEXITY_API_KEY server-side; the browser never calls it.
// Thin pass-through: validates the internal secret, rate-limits per tenant, calls
// Perplexity's OpenAI-compatible chat/completions, returns the raw response for the
// worker to parse. Logs to ai_proxy_log via the shared helper.
//
// DEPLOY verify_jwt:false (worker calls with X-Internal-Secret, not a user JWT).
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AI_AUTHORITY_INTERNAL_SECRET,
//      PERPLEXITY_API_KEY.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { constantTimeEq, insertAiProxyLog, checkRateLimit } from '../_shared/aiProxyShared.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const INTERNAL_SECRET = Deno.env.get('AI_AUTHORITY_INTERNAL_SECRET') || '';
const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY') || '';

const MODEL = 'sonar';            // base Sonar (NOT sonar-pro / deep-research)
const MAX_TOKENS = 1200;          // answer-length ceiling
const MAX_PROMPT_CHARS = 2000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!INTERNAL_SECRET || !PERPLEXITY_API_KEY) {
    console.error('[ai-authority-perplexity] missing secret(s)');
    return json(500, { error: 'Server misconfigured' });
  }
  if (!constantTimeEq(INTERNAL_SECRET, req.headers.get('X-Internal-Secret') || '')) {
    return json(401, { error: 'Unauthorized' });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(400, { error: 'Invalid JSON' }); }
  const tenantId = typeof body.tenant_id === 'string' ? body.tenant_id : '';
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!UUID_RE.test(tenantId)) return json(400, { error: 'tenant_id must be a UUID' });
  if (!prompt || prompt.length > MAX_PROMPT_CHARS) return json(400, { error: 'prompt missing or too long' });

  const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const log = (status: number, inTok?: number | null, outTok?: number | null) =>
    insertAiProxyLog(svc, { status, feature: 'authority_perplexity', tenant_id: tenantId, model: MODEL, input_tokens: inTok ?? null, output_tokens: outTok ?? null });

  if (!(await checkRateLimit(svc, `ai-authority-perplexity:${tenantId}`, 300, 120))) {
    await log(429); return json(429, { error: 'Rate limited' });
  }

  try {
    const upstream = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${PERPLEXITY_API_KEY}` },
      body: JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, messages: [{ role: 'user', content: prompt }] }),
    });
    const data = await upstream.json().catch(() => ({}));
    const usage = (data as { usage?: { prompt_tokens?: number; completion_tokens?: number } })?.usage;
    await log(upstream.status, usage?.prompt_tokens ?? null, usage?.completion_tokens ?? null);
    if (!upstream.ok) {
      console.warn(`[ai-authority-perplexity] upstream ${upstream.status} tenant:${tenantId}`);
      return json(upstream.status, { error: 'Perplexity API error', upstream_status: upstream.status, data });
    }
    return json(200, data);
  } catch (e) {
    console.error('[ai-authority-perplexity] error:', (e as Error)?.message);
    await log(500);
    return json(502, { error: 'Upstream call failed' });
  }
});
