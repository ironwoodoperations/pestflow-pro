// S253 / A1 — AI Authority Score: shared types.
// PURE module (no Deno/esm.sh imports) so it is importable by both the Deno edge
// worker and Node/vitest unit tests.

// Mirrors the public.ai_authority_engine ENUM.
export type EngineId =
  | 'perplexity_sonar'
  | 'openai_web'
  | 'claude_web'
  | 'google_aio';

// Normalized adapter output — one per (job → engine run). Written to a snapshot:
// the booleans/numerics land on the typed columns, `raw` → raw_response (operator
// only), the rest of the programmatic parse → parsed_result.
export interface ParsedCitation {
  cited: boolean;             // tenant domain / tracked URL appears in the engine's citation list (DETERMINISTIC)
  mentioned: boolean;         // tenant business name appears in the answer text
  position: number | null;    // 1-based rank of the tenant's first matching citation; null if absent
  share_of_voice: number | null; // tenant citations / total citations, 0..1; null if no citations
  raw: unknown;               // full engine response → raw_response
  engine: EngineId;
  parse_failed: boolean;      // this engine's parse failed; MUST NOT block other engines
}

// Everything the deterministic parser needs about the tenant. Assembled by the
// worker from tenants + settings; passed into the pure parsers.
export interface TenantContext {
  tenantId: string;
  businessName: string;
  // Hostnames the tenant OWNS (matched by exact hostname): custom_domain,
  // <subdomain>.pestflowpro.ai, <slug>.pestflowpro.ai. Normalized (lowercase, no www).
  ownerHosts: string[];
  // Specific directory/listing URLs the tenant controls (Yelp/Angi/GBP profile
  // pages). Matched by normalized full URL (host + path), NOT bare hostname —
  // otherwise every yelp.com citation would count. Optional per-tenant list.
  trackedUrls: string[];
}

// Per-engine answer extracted from an engine response before scoring.
export interface EngineAnswer {
  answerText: string;
  citationUrls: string[]; // ordered as the engine returned them
}
