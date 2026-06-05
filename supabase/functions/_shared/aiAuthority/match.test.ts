// Run scoped (deno is not required — these are pure modules):
//   npx vitest run supabase/functions/_shared/aiAuthority
import { describe, it, expect } from 'vitest'
import {
  normalizeHostname, hostnameOf, citationMatchesTenant,
  detectMention, firstPosition, shareOfVoice, computeSignals,
} from './match.ts'
import { getRegistrableDomain, isSharedPlatformHost } from './registrableDomain.ts'
import type { TenantContext } from './types.ts'

const ctx: TenantContext = {
  tenantId: 't1',
  businessName: 'Acme Pest Control',
  ownerHosts: ['acmepest.com', 'acme-pest.pestflowpro.ai'],
  ownerDomains: ['acmepest.com'],
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

// ── A1 fix — registrable-domain reducer (eTLD+1) ─────────────────────────────
describe('getRegistrableDomain', () => {
  it('collapses owned subdomains to the apex (admin./www./deep host)', () => {
    expect(getRegistrableDomain('admin.dangpestcontrol.com')).toBe('dangpestcontrol.com')
    expect(getRegistrableDomain('www.dangpestcontrol.com')).toBe('dangpestcontrol.com')
    expect(getRegistrableDomain('blog.dangpestcontrol.com')).toBe('dangpestcontrol.com')
    expect(getRegistrableDomain('dangpestcontrol.com')).toBe('dangpestcontrol.com')
  })
  it('does NOT over-collapse multi-part public suffixes', () => {
    expect(getRegistrableDomain('shop.example.co.uk')).toBe('example.co.uk')
    expect(getRegistrableDomain('www.example.com.au')).toBe('example.com.au')
  })
  it('keeps US two-letter-locality structure (tenant-isolation guard)', () => {
    // last-3, NOT 'tx.us' — else two tenants on *.tx.us would collapse together.
    expect(getRegistrableDomain('pestcontrol.austin.tx.us')).toBe('austin.tx.us')
    expect(getRegistrableDomain('austin.tx.us')).toBe('austin.tx.us')
  })
  it('lowercases and tolerates stray dots / 2-label inputs', () => {
    expect(getRegistrableDomain('ADMIN.DangPestControl.COM')).toBe('dangpestcontrol.com')
    expect(getRegistrableDomain('dangpestcontrol.com.')).toBe('dangpestcontrol.com')
  })
})

// ── A1 fix — owner registrable-domain matching + tracking-param stripping ─────
describe('citationMatchesTenant — registrable-domain owner match (A1 fix)', () => {
  // Dang's real resolved context: custom_domain is the ADMIN host, but the engine
  // cited the PUBLIC apex (www.) with a ?utm_source=openai tracking param.
  const dang: TenantContext = {
    tenantId: 'dang',
    businessName: 'Dang Pest Control',
    ownerHosts: ['admin.dangpestcontrol.com', 'dang.pestflowpro.ai'],
    ownerDomains: ['dangpestcontrol.com'],
    trackedUrls: [],
  }
  it('matches the cited www. host (collapsed to the owned registrable domain)', () => {
    expect(citationMatchesTenant('https://www.dangpestcontrol.com/termite-control/?utm_source=openai', dang)).toBe(true)
  })
  it('matches whether the owner signal is the admin host OR the apex', () => {
    const adminOnly: TenantContext = { ...dang, ownerHosts: ['admin.dangpestcontrol.com'], ownerDomains: ['dangpestcontrol.com'] }
    const apexOnly: TenantContext = { ...dang, ownerHosts: ['dangpestcontrol.com'], ownerDomains: ['dangpestcontrol.com'] }
    expect(citationMatchesTenant('https://www.dangpestcontrol.com/x?utm_source=openai', adminOnly)).toBe(true)
    expect(citationMatchesTenant('https://www.dangpestcontrol.com/x?utm_source=openai', apexOnly)).toBe(true)
  })
  it('strips tracking params + fragments before matching', () => {
    expect(citationMatchesTenant('https://dangpestcontrol.com/?fbclid=abc#hero', dang)).toBe(true)
  })
  it('does NOT match a competitor sharing no registrable domain', () => {
    expect(citationMatchesTenant('https://dangpestpros.com', dang)).toBe(false)
    expect(citationMatchesTenant('https://notdangpestcontrol.com', dang)).toBe(false)
  })
})

// ── A1 fix REQUIRED 3 — shared-platform hosts stay EXACT (no collapse) ────────
describe('shared-platform guard', () => {
  it('flags known multi-tenant platforms', () => {
    expect(isSharedPlatformHost('dang.pestflowpro.ai')).toBe(true)
    expect(isSharedPlatformHost('dang.pestpages.com')).toBe(true)
    expect(isSharedPlatformHost('dangpestcontrol.com')).toBe(false)
  })
  it('a *.pestflowpro.ai owner host matches exactly but never collapses', () => {
    // dang.pestflowpro.ai is exact-only (ownerHosts), NOT in ownerDomains.
    const t: TenantContext = {
      tenantId: 'dang', businessName: 'Dang Pest Control',
      ownerHosts: ['dang.pestflowpro.ai'], ownerDomains: [], trackedUrls: [],
    }
    expect(citationMatchesTenant('https://dang.pestflowpro.ai/services', t)).toBe(true)
    // another tenant's subdomain on the SAME platform must NOT match.
    expect(citationMatchesTenant('https://acme.pestflowpro.ai/services', t)).toBe(false)
  })
})
