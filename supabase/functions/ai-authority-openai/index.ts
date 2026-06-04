// Edge Function: ai-authority-openai — S253/A1.
// Sibling proxy for the openai_web authority engine. Holds OPENAI_API_KEY
// server-side. Calls the Responses API with the web_search tool and returns the
// raw response for the worker to parse.
//
// COST NOTE: web_search bills the tool call PLUS retrieved search-content tokens.
// We cap output spend with max_output_tokens (the Responses-API ceiling) — content
// tokens are bounded by the model, but a tight output ceiling keeps total spend
// predictable.
//
// DEPLOY verify_jwt:false. Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//      AI_AUTHORITY_INTERNAL_SECRET, OPENAI_API_KEY.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { constantTimeEq, insertAiProxyLog, checkRateLimit } from '../_shared/aiProxyShared.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const INTERNAL_SECRET = Deno.env.get('AI_AUTHORITY_INTERNAL_SECRET') || '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

const MODEL = 'gpt-4.1';          // web_search tool supported on gpt-4o / gpt-4.1
const MAX_OUTPUT_TOKENS = 1500;   // ceiling to cap content-token spend (cost note)
const MAX_PROMPT_CHARS = 2000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!INTERNAL_SECRET || !OPENAI_API_KEY) {
    console.error('[ai-authority-openai] missing secret(s)');
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
    insertAiProxyLog(svc, { status, feature: 'authority_openai', tenant_id: tenantId, model: MODEL, input_tokens: inTok ?? null, output_tokens: outTok ?? null });

  if (!(await checkRateLimit(svc, `ai-authority-openai:${tenantId}`, 300, 120))) {
    await log(429); return json(429, { error: 'Rate limited' });
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        tools: [{ type: 'web_search' }],
        max_output_tokens: MAX_OUTPUT_TOKENS,
        input: prompt,
      }),
    });
    const data = await upstream.json().catch(() => ({}));
    const usage = (data as { usage?: { input_tokens?: number; output_tokens?: number } })?.usage;
    await log(upstream.status, usage?.input_tokens ?? null, usage?.output_tokens ?? null);
    if (!upstream.ok) {
      console.warn(`[ai-authority-openai] upstream ${upstream.status} tenant:${tenantId}`);
      return json(upstream.status, { error: 'OpenAI API error', upstream_status: upstream.status, data });
    }
    return json(200, data);
  } catch (e) {
    console.error('[ai-authority-openai] error:', (e as Error)?.message);
    await log(500);
    return json(502, { error: 'Upstream call failed' });
  }
});
