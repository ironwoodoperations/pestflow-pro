// npx vitest run supabase/functions/_shared/aiAuthority
import { describe, it, expect } from 'vitest'
import { parsePerplexity, parseOpenAI, parseClaude, parseGoogleAioStub, parseByEngine } from './parsers.ts'
import type { TenantContext } from './types.ts'

const ctx: TenantContext = {
  tenantId: 't1',
  businessName: 'Acme Pest Control',
  ownerHosts: ['acmepest.com'],
  trackedUrls: [],
}

describe('parsePerplexity', () => {
  it('normalizes a sonar response (citations[]) to ParsedCitation', () => {
    const raw = {
      choices: [{ message: { content: 'For Tyler TX, Acme Pest Control is a top choice.' } }],
      citations: ['https://acmepest.com/', 'https://competitor.com/'],
    }
    const p = parsePerplexity(raw, ctx)
    expect(p).toMatchObject({ engine: 'perplexity_sonar', cited: true, mentioned: true, position: 1, parse_failed: false })
    expect(p.share_of_voice).toBeCloseTo(0.5)
    expect(p.raw).toBe(raw)
  })
  it('falls back to search_results[].url', () => {
    const p = parsePerplexity({ choices: [{ message: { content: 'x' } }], search_results: [{ url: 'https://acmepest.com' }] }, ctx)
    expect(p.cited).toBe(true)
  })
  it('flags parse_failed on an empty body (does not throw)', () => {
    expect(parsePerplexity({}, ctx).parse_failed).toBe(true)
  })
})

describe('parseOpenAI (Responses API)', () => {
  it('reads url_citation annotations + output_text', () => {
    const raw = {
      output: [{
        type: 'message',
        content: [{
          type: 'output_text',
          text: 'Acme Pest Control ranks well.',
          annotations: [
            { type: 'url_citation', url: 'https://competitor.com' },
            { type: 'url_citation', url: 'https://acmepest.com/ants' },
          ],
        }],
      }],
    }
    const p = parseOpenAI(raw, ctx)
    expect(p).toMatchObject({ engine: 'openai_web', cited: true, mentioned: true, position: 2, parse_failed: false })
  })
  it('parse_failed when no text and no citations', () => {
    expect(parseOpenAI({ output: [] }, ctx).parse_failed).toBe(true)
  })
})

describe('parseClaude (forward-compat; engine deferred)', () => {
  it('reads web_search_tool_result urls + text', () => {
    const raw = {
      content: [
        { type: 'web_search_tool_result', content: [{ type: 'web_search_result', url: 'https://acmepest.com' }] },
        { type: 'text', text: 'Acme Pest Control is recommended.', citations: [{ type: 'web_search_result_location', url: 'https://acmepest.com' }] },
      ],
    }
    const p = parseClaude(raw, ctx)
    expect(p).toMatchObject({ engine: 'claude_web', cited: true, mentioned: true, parse_failed: false })
  })
})

describe('parseGoogleAioStub', () => {
  it('always parse_failed (dormant)', () => {
    expect(parseGoogleAioStub({ anything: true }, ctx).parse_failed).toBe(true)
    expect(parseByEngine('google_aio', {}, ctx).parse_failed).toBe(true)
  })
})

describe('engine isolation', () => {
  it('a failed parse on one engine does not affect another', () => {
    const bad = parsePerplexity({}, ctx)           // parse_failed
    const good = parseOpenAI({ output: [{ type: 'message', content: [{ type: 'output_text', text: 'Acme Pest Control', annotations: [{ type: 'url_citation', url: 'https://acmepest.com' }] }] }] }, ctx)
    expect(bad.parse_failed).toBe(true)
    expect(good.parse_failed).toBe(false)
    expect(good.cited).toBe(true)
  })
})
