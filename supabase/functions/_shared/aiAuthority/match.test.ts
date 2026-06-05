// Run scoped (deno is not required — these are pure modules):
//   npx vitest run supabase/functions/_shared/aiAuthority
import { describe, it, expect } from 'vitest'
import {
  normalizeHostname, hostnameOf, citationMatchesTenant,
  detectMention, firstPosition, shareOfVoice, computeSignals,
} from './match.ts'
import type { TenantContext } from './types.ts'

const ctx: TenantContext = {
  tenantId: 't1',
  businessName: 'Acme Pest Control',
  ownerHosts: ['acmepest.com', 'acme-pest.pestflowpro.ai'],
  trackedUrls: ['https://www.yelp.com/biz/acme-pest-tyler'],
}

describe('hostname normalization', () => {
  it('strips www + lowercases', () => {
    expect(normalizeHostname('WWW.Acme.com')).toBe('acme.com')
    expect(hostnameOf('https://www.acmepest.com/services')).toBe('acmepest.com')
    expect(hostnameOf('acmepest.com/x')).toBe('acmepest.com') // bare host
    expect(hostnameOf('garbage')).toBe('garbage'.includes('.') ? '' : 'garbage') // no dot → treated as host
  })
})

describe('citationMatchesTenant — exact, not substring', () => {
  it('matches the tenant owner domain (www-insensitive)', () => {
    expect(citationMatchesTenant('https://acmepest.com/termites', ctx)).toBe(true)
    expect(citationMatchesTenant('https://www.acmepest.com', ctx)).toBe(true)
    expect(citationMatchesTenant('https://acme-pest.pestflowpro.ai/services/ants', ctx)).toBe(true)
  })
  it('does NOT match a similar competitor domain (substring guard)', () => {
    expect(citationMatchesTenant('https://acmepestpros.com', ctx)).toBe(false)
    expect(citationMatchesTenant('https://notacmepest.com', ctx)).toBe(false)
  })
  it('matches a tracked listing URL by host+path, not bare host', () => {
    expect(citationMatchesTenant('https://yelp.com/biz/acme-pest-tyler', ctx)).toBe(true)
    expect(citationMatchesTenant('https://www.yelp.com/biz/acme-pest-tyler/', ctx)).toBe(true) // trailing slash normalized
    expect(citationMatchesTenant('https://yelp.com/biz/some-competitor', ctx)).toBe(false)
  })
})

describe('S253/A1 — registrable-domain owner matching', () => {
  // tenants.custom_domain holds the ADMIN host; the engine cites the public apex.
  const dangAdminOnly: TenantContext = {
    tenantId: 'dang', businessName: 'Dang Pest Control',
    ownerHosts: ['admin.dangpestcontrol.com', 'dang.pestflowpro.ai'], trackedUrls: [],
  }
  // tenant_domains supplies the real public apex.
  const dangWithDomain: TenantContext = {
    tenantId: 'dang', businessName: 'Dang Pest Control',
    ownerHosts: ['admin.dangpestcontrol.com', 'dang.pestflowpro.ai', 'dangpestcontrol.com'],
    trackedUrls: [],
  }

  it('matches the cited public apex when only the admin host is owned (the A1 bug)', () => {
    // utm params must not affect the match (host extraction drops the query).
    expect(citationMatchesTenant('https://www.dangpestcontrol.com/termite-control/?utm_source=openai', dangAdminOnly)).toBe(true)
    expect(citationMatchesTenant('https://dangpestcontrol.com/', dangAdminOnly)).toBe(true)
  })
  it('matches when the public apex is present (tenant_domains path)', () => {
    expect(citationMatchesTenant('https://www.dangpestcontrol.com/x?utm_source=openai', dangWithDomain)).toBe(true)
  })
  it('does NOT match a competitor on the same TLD', () => {
    expect(citationMatchesTenant('https://otherpest.com', dangWithDomain)).toBe(false)
    expect(citationMatchesTenant('https://dangpestcontrolpros.com', dangWithDomain)).toBe(false)
  })

  it('shared-platform owner subdomain stays EXACT-host (no cross-tenant collapse)', () => {
    const a: TenantContext = { tenantId: 'a', businessName: 'A', ownerHosts: ['acme-pest.pestflowpro.ai'], trackedUrls: [] }
    expect(citationMatchesTenant('https://acme-pest.pestflowpro.ai/services', a)).toBe(true)
    // a different tenant's subdomain on the SAME platform must not match
    expect(citationMatchesTenant('https://other-pest.pestflowpro.ai/services', a)).toBe(false)
    expect(citationMatchesTenant('https://pestflowpro.ai', a)).toBe(false)
  })

  it('canonical_apex override pins the owned registrable domain', () => {
    const pinned: TenantContext = {
      tenantId: 'p', businessName: 'P', ownerHosts: ['p.pestflowpro.ai'],
      trackedUrls: [], canonicalApex: 'dangpestcontrol.com',
    }
    expect(citationMatchesTenant('https://blog.dangpestcontrol.com/x', pinned)).toBe(true)
    expect(citationMatchesTenant('https://dangpestcontrol.com', pinned)).toBe(true)
    expect(citationMatchesTenant('https://notdangpestcontrol.com', pinned)).toBe(false)
  })
})

describe('detectMention', () => {
  it('detects the business name case/space-insensitively', () => {
    expect(detectMention('I recommend Acme Pest Control for termites.', ctx.businessName)).toBe(true)
    expect(detectMention('try   acme   pest   control today', ctx.businessName)).toBe(true)
    expect(detectMention('call Beta Exterminators instead', ctx.businessName)).toBe(false)
  })
})

describe('position + share of voice', () => {
  const urls = ['https://competitor.com', 'https://acmepest.com', 'https://yelp.com/biz/acme-pest-tyler']
  it('firstPosition is 1-based; null when absent', () => {
    expect(firstPosition(urls, ctx)).toBe(2)
    expect(firstPosition(['https://x.com', 'https://y.com'], ctx)).toBeNull()
  })
  it('share_of_voice = tenant citations / total; null when empty', () => {
    expect(shareOfVoice(urls, ctx)).toBeCloseTo(2 / 3) // acmepest.com + yelp listing
    expect(shareOfVoice([], ctx)).toBeNull()
  })
  it('computeSignals composes the four signals', () => {
    const sig = computeSignals({ answerText: 'Acme Pest Control is top-rated', citationUrls: urls }, ctx)
    expect(sig).toEqual({ cited: true, mentioned: true, position: 2, share_of_voice: 2 / 3 })
  })
})
