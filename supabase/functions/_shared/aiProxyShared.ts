// S253 / A1 — shared proxy primitives extracted so the existing `ai-proxy` and the
// new per-engine AI-Authority sibling proxies share ONE implementation of
// rate-limiting + ai_proxy_log logging (blast-radius isolation: separate proxies,
// shared plumbing). Deno module.

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { timingSafeEqual } from 'node:crypto';

// Constant-time string compare for internal-secret / apikey checks.
export function constantTimeEq(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  return ea.length === eb.length && timingSafeEqual(ea, eb);
}

// Generic ai_proxy_log row. The existing proxy adds S242 actor-chain columns; the
// sibling proxies log status/feature/tenant/model/tokens. All optional besides
// status — extra/absent keys are fine, it's the same wide table.
export interface AiProxyLogRow {
  status: number;
  feature?: string | null;
  tenant_id?: string | null;
  user_id?: string | null;
  model?: string | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  caller?: string | null;
  acting_user?: string | null;
  purpose?: string | null;
  jti?: string | null;
  batch_cardinality?: number | null;
}

// Best-effort log insert — never throws into the request path (mirrors the
// original ai-proxy behavior exactly).
export async function insertAiProxyLog(svc: SupabaseClient, row: AiProxyLogRow): Promise<void> {
  try {
    await svc.from('ai_proxy_log').insert(row);
  } catch (e) {
    console.error('[ai-proxy] log insert failed:', (e as Error)?.message);
  }
}

// Atomic per-key rate limit via the existing check_and_record_rate_limit RPC.
// FAIL-OPEN on infra error (returns true) — identical to the original ai-proxy
// semantics: a rate-limiter outage must not take AI features down.
export async function checkRateLimit(
  svc: SupabaseClient,
  key: string,
  windowSeconds: number,
  maxCount: number,
): Promise<boolean> {
  const { data, error } = await svc.rpc('check_and_record_rate_limit', {
    p_key: key, p_window_seconds: windowSeconds, p_max_count: maxCount,
  });
  if (error) {
    console.error('[ai-proxy] rate-limit rpc error (fail-open):', error.message);
    return true;
  }
  return data === true;
}
