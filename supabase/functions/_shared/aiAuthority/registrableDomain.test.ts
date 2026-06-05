// Run scoped (deno not required — pure modules):
//   npx vitest run supabase/functions/_shared/aiAuthority
import { describe, it, expect } from 'vitest'
import { getRegistrableDomain, isRegistrableCollapseEligible } from './registrableDomain.ts'

describe('getRegistrableDomain — eTLD+1 reducer', () => {
  it('collapses owned subdomains to the apex', () => {
    expect(getRegistrableDomain('admin.dangpestcontrol.com')).toBe('dangpestcontrol.com')
    expect(getRegistrableDomain('www.dangpestcontrol.com')).toBe('dangpestcontrol.com')
    expect(getRegistrableDomain('blog.acme.com')).toBe('acme.com')
  })
  it('returns bare apex / short hosts as-is', () => {
    expect(getRegistrableDomain('dangpestcontrol.com')).toBe('dangpestcontrol.com')
    expect(getRegistrableDomain('acme.com')).toBe('acme.com')
  })
  it('keeps last-3 labels for the .us two-letter locality (tenant isolation)', () => {
    // A strict last-2 reducer would collapse these to 'tx.us' and cross-match
    // two different tenants — must NOT happen.
    expect(getRegistrableDomain('pestcontrol.austin.tx.us')).toBe('austin.tx.us')
    expect(getRegistrableDomain('bugs.dallas.tx.us')).toBe('dallas.tx.us')
    expect(getRegistrableDomain('austin.tx.us')).toBe('austin.tx.us')
  })
  it('keeps last-3 for known multi-part suffixes', () => {
    expect(getRegistrableDomain('shop.bbc.co.uk')).toBe('bbc.co.uk')
    expect(getRegistrableDomain('foo.example.com.au')).toBe('example.com.au')
  })
  it('does NOT treat a normal .com as multi-part', () => {
    expect(getRegistrableDomain('a.b.example.com')).toBe('example.com')
  })
})

describe('isRegistrableCollapseEligible — shared-platform guard', () => {
  it('eligible for bare apex and known-owned subdomains', () => {
    expect(isRegistrableCollapseEligible('dangpestcontrol.com')).toBe(true)
    expect(isRegistrableCollapseEligible('admin.dangpestcontrol.com')).toBe(true)
    expect(isRegistrableCollapseEligible('www.dangpestcontrol.com')).toBe(true)
  })
  it('NOT eligible for tenant-specific subdomains on a shared platform', () => {
    // Collapsing these to the platform apex would bleed every other tenant's
    // citations into this tenant — must stay exact-host.
    expect(isRegistrableCollapseEligible('dang.pestflowpro.ai')).toBe(false)
    expect(isRegistrableCollapseEligible('acme-pest.pestflowpro.ai')).toBe(false)
    expect(isRegistrableCollapseEligible('pestcontrol.austin.tx.us')).toBe(false)
  })
})
