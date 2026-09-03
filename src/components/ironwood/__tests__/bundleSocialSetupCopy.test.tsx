import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// S326 ITEM 1b / 3b — the operator UI must not recommend a destructive action,
// and must distinguish "not configured" from "not created".
//
// THE DEFECT. BundleSocialSetup rendered:
//   "No Zernio profile — re-provision this client to generate one."
// Re-provisioning called auth.admin.updateUserById on the tenant's existing
// admin, which changes their password and kills their live sessions. So the
// operator UI proposed logging a paying customer out as the remedy for a
// social-media setup task. The S324 report called it the single most dangerous
// sentence in the operator UI.
//
// Comments are stripped: the component now QUOTES the old sentence in a comment
// explaining why it was removed, and a raw scan would flag that record as if it
// were live copy.

const FILE = join(__dirname, '..', 'BundleSocialSetup.tsx')
const CODE = readFileSync(FILE, 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '')

describe('the destructive recommendation is gone', () => {
  it('no longer tells the operator to re-provision to get a profile', () => {
    expect(CODE).not.toMatch(/re-provision this client to generate one/i)
  })

  it('does not recommend re-provisioning as a remedy anywhere in live copy', () => {
    // The word may still appear — the replacement text explicitly says NOT to
    // re-provision — so this asserts the RECOMMENDING shapes, not the token.
    for (const re of [
      /re-provision (this|the) client to/i,
      /try re-provisioning/i,
      /re-provision to (generate|create|fix)/i,
    ]) {
      expect(CODE, `live copy recommends re-provisioning: ${re}`).not.toMatch(re)
    }
  })

  it('the scan is not vacuous — it catches the exact sentence that was removed', () => {
    const OLD = 'No Zernio profile — re-provision this client to generate one.'
    expect(/re-provision this client to generate one/i.test(OLD)).toBe(true)
    expect(/re-provision (this|the) client to/i.test(OLD)).toBe(true)
  })

  it('and the file really was read', () => {
    expect(CODE.length).toBeGreaterThan(1000)
    expect(CODE).toContain('Zernio Profile ID')
  })
})

describe('the two states are distinguishable', () => {
  it('reads the marker provision-tenant writes', () => {
    expect(CODE).toContain('zernio_last_error')
    expect(CODE).toMatch(/setZernioStatus/)
  })

  it('branches on the allowlisted literal, not on truthiness', () => {
    // `zernioStatus ?` would treat any future status value as "not configured".
    expect(CODE).toMatch(/zernioStatus === 'not_configured'/)
  })

  it('names the secret in the not-configured state, so the remedy is findable', () => {
    expect(CODE).toContain('ZERNIO_API_KEY')
  })

  it('says the not-configured case is deployment-wide, not per-tenant', () => {
    // The two states have different owners: a missing platform secret is one
    // fix for every tenant; a missing profile on a configured deployment is not.
    expect(CODE).toMatch(/deployment/i)
  })

  it('the generic state does not claim to know why', () => {
    expect(CODE).toMatch(/No Zernio profile for this tenant yet/)
  })

  it('no button or handler was wired here — lazy creation is a later session', () => {
    const noProfileRegion = CODE.slice(CODE.indexOf('Zernio Profile ID'), CODE.indexOf('Connected Accounts'))
    expect(noProfileRegion).not.toMatch(/<button/)
    expect(noProfileRegion).not.toMatch(/onClick/)
  })
})
