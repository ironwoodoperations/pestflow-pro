// S253 / A1 — per-engine response parsers.
// PURE module. Each parser owns its engine's citation/answer shape, extracts an
// EngineAnswer, then runs the shared deterministic matcher. A parse failure on one
// engine returns parse_failed=true for THAT engine only (never throws) so it can
// never corrupt or block other engines (validator rule).

import type { EngineAnswer, EngineId, ParsedCitation, TenantContext } from './types.ts';
import { computeSignals } from './match.ts';

type Raw = Record<string, unknown>;

function uniqStrings(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of arr) {
    if (typeof x === 'string' && x.trim() && !seen.has(x)) { seen.add(x); out.push(x); }
  }
  return out;
}

function finalize(engine: EngineId, answer: EngineAnswer, ctx: TenantContext, raw: unknown): ParsedCitation {
  const sig = computeSignals(answer, ctx);
  return { ...sig, raw, engine, parse_failed: false };
}

function failed(engine: EngineId, raw: unknown): ParsedCitation {
  return { cited: false, mentioned: false, position: null, share_of_voice: null, raw, engine, parse_failed: true };
}

// ── Perplexity Sonar — OpenAI-compatible chat completions ────────────────────
// Answer: choices[0].message.content. Citations: top-level `citations` (string[])
// and/or `search_results[].url` (newer field), ordered.
export function parsePerplexity(raw: Raw, ctx: TenantContext): ParsedCitation {
  try {
    const choices = raw.choices as Array<{ message?: { content?: unknown } }> | undefined;
    const answerText = typeof choices?.[0]?.message?.content === 'string'
      ? (choices[0].message!.content as string) : '';
    const fromCitations = uniqStrings(raw.citations);
    const fromSearch = Array.isArray(raw.search_results)
      ? uniqStrings((raw.search_results as Array<{ url?: unknown }>).map((s) => s?.url))
      : [];
    const citationUrls = fromCitations.length ? fromCitations : fromSearch;
    if (!answerText && citationUrls.length === 0) return failed('perplexity_sonar', raw);
    return finalize('perplexity_sonar', { answerText, citationUrls }, ctx, raw);
  } catch {
    return failed('perplexity_sonar', raw);
  }
}

// ── OpenAI web_search (Responses API) ────────────────────────────────────────
// Answer: output_text (or assembled from output[].content[type=output_text].text).
// Citations: annotations of type 'url_citation' (.url), in document order.
export function parseOpenAI(raw: Raw, ctx: TenantContext): ParsedCitation {
  try {
    const output = Array.isArray(raw.output) ? (raw.output as Array<Record<string, unknown>>) : [];
    let answerText = typeof raw.output_text === 'string' ? (raw.output_text as string) : '';
    const citationUrls: string[] = [];
    const seen = new Set<string>();
    for (const item of output) {
      const content = Array.isArray(item.content) ? (item.content as Array<Record<string, unknown>>) : [];
      for (const c of content) {
        if (c.type === 'output_text') {
          if (!answerText && typeof c.text === 'string') answerText += c.text;
          const annotations = Array.isArray(c.annotations) ? (c.annotations as Array<Record<string, unknown>>) : [];
          for (const a of annotations) {
            if (a.type === 'url_citation' && typeof a.url === 'string' && !seen.has(a.url)) {
              seen.add(a.url); citationUrls.push(a.url);
            }
          }
        }
      }
    }
    if (!answerText && citationUrls.length === 0) return failed('openai_web', raw);
    return finalize('openai_web', { answerText, citationUrls }, ctx, raw);
  } catch {
    return failed('openai_web', raw);
  }
}

// ── Claude web_search (messages API) ─────────────────────────────────────────
// DEFERRED: the worker does NOT invoke this adapter yet (CLAUDE.md #3 — no new
// direct Anthropic callers). Parser is implemented to the interface for
// forward-compat + tests. Answer: concatenated text blocks. Citations:
// web_search_tool_result result urls, then text-block citation urls.
export function parseClaude(raw: Raw, ctx: TenantContext): ParsedCitation {
  try {
    const content = Array.isArray(raw.content) ? (raw.content as Array<Record<string, unknown>>) : [];
    let answerText = '';
    const citationUrls: string[] = [];
    const seen = new Set<string>();
    const pushUrl = (u: unknown) => {
      if (typeof u === 'string' && u.trim() && !seen.has(u)) { seen.add(u); citationUrls.push(u); }
    };
    // First pass: server-tool search result blocks (authoritative source order).
    for (const block of content) {
      if (block.type === 'web_search_tool_result') {
        const results = Array.isArray(block.content) ? (block.content as Array<Record<string, unknown>>) : [];
        for (const r of results) if (r.type === 'web_search_result') pushUrl(r.url);
      }
    }
    // Second pass: text blocks + inline citations.
    for (const block of content) {
      if (block.type === 'text') {
        if (typeof block.text === 'string') answerText += block.text;
        const cites = Array.isArray(block.citations) ? (block.citations as Array<Record<string, unknown>>) : [];
        for (const c of cites) pushUrl(c.url);
      }
    }
    if (!answerText && citationUrls.length === 0) return failed('claude_web', raw);
    return finalize('claude_web', { answerText, citationUrls }, ctx, raw);
  } catch {
    return failed('claude_web', raw);
  }
}

// ── Google AIO — DORMANT STUB ────────────────────────────────────────────────
// TODO(S253+): no official Google AIO API. Future path is a SERP scraper, deferred
// until ~30-60 tenants. adapter_enabled=false in ai_authority_engine_cost_config;
// the worker refuses to run it. This parser must never be reached.
export function parseGoogleAioStub(raw: Raw, _ctx: TenantContext): ParsedCitation {
  return failed('google_aio', raw);
}

export function parseByEngine(engine: EngineId, raw: Raw, ctx: TenantContext): ParsedCitation {
  switch (engine) {
    case 'perplexity_sonar': return parsePerplexity(raw, ctx);
    case 'openai_web': return parseOpenAI(raw, ctx);
    case 'claude_web': return parseClaude(raw, ctx);
    case 'google_aio': return parseGoogleAioStub(raw, ctx);
    default: return failed(engine, raw);
  }
}
