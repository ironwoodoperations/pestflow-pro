import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mergeSettingsValue, dropEmptyOverwrites } from './settingsMerge'
import { mergeBusinessInfo } from './businessInfoMerge'

// S336 — the TypeScript half of the SHARED corpus.
//
// The S334 gate (Perplexity 8) requires the TS and PL/pgSQL merges to be tested
// against the SAME cases until the TS path no longer performs persistence
// merges. The other half is supabase/tests/s336_merge_setting_value.pgtap.sql,
// reading THIS file. One corpus, two consumers — two corpora would drift, which
// is the defect the whole arc removes.
//
// A case that passes here and fails there IS THE FINDING.

const here = dirname(fileURLToPath(import.meta.url))
const CORPUS_PATH = join(here, '..', 'fixtures', 'settingsMergeCorpus.json')

interface Case {
  id: string
  description: string
  key: string
  existing: Record<string, unknown> | null
  overlay: Record<string, unknown>
  expected: Record<string, unknown>
}

const corpus: { cases: Case[] } = JSON.parse(readFileSync(CORPUS_PATH, 'utf8'))

/**
 * THE EVALUATION UNDER TEST, and it must match provision-tenant exactly.
 *
 * business_info is NOT routed through the generic path: it composes
 * dropEmptyOverwrites (the empty-overlay rule) with mergeBusinessInfo (the
 * grouped-key rules). That composition is what produces the non-obvious
 * address-quad behaviour the corpus documents — dropEmptyOverwrites removes the
 * blank member, and the group check then drops the incomplete remainder.
 */
function evaluate(c: Case): Record<string, unknown> {
  if (c.key === 'business_info') {
    return mergeBusinessInfo(c.existing, dropEmptyOverwrites(c.existing, c.overlay))
  }
  return mergeSettingsValue(c.existing, c.overlay)
}

describe('settings merge — the SHARED corpus (TypeScript side)', () => {
  it('the corpus loaded and is non-trivial', () => {
    // Anti-vacuity: a per-case loop over an empty array passes silently.
    expect(corpus.cases.length).toBeGreaterThanOrEqual(28)
    const ids = corpus.cases.map((c) => c.id)
    expect(new Set(ids).size, 'duplicate case id').toBe(ids.length)
    expect(corpus.cases.filter((c) => c.key === 'business_info').length).toBeGreaterThan(10)
    expect(corpus.cases.filter((c) => c.key !== 'business_info').length).toBeGreaterThan(10)
  })

  for (const c of corpus.cases) {
    it(`${c.id} — ${c.description}`, () => {
      expect(evaluate(c)).toStrictEqual(c.expected)
    })
  }
})

// ── The cases the brief names, pinned BY ID ─────────────────────────────────
//
// The loop above runs whatever the corpus holds. That is exactly why this block
// exists: deleting a case would make the loop smaller and still green. Each id
// below detects a specific regression, so its ABSENCE must fail too.
describe('the corpus still contains every case that detects a named regression', () => {
  const REQUIRED = [
    'empty-string-does-not-overwrite',
    'empty-string-writes-when-key-absent',
    'empty-string-writes-when-existing-empty',
    'json-null-does-not-overwrite',
    'false-is-a-real-overwrite',
    'zero-is-a-real-overwrite',
    'empty-array-does-not-wipe-populated-list',
    'populated-array-replaces-whole',
    'nested-object-replaces-whole',
    'first-provision-existing-null',
    'quad-partial-dropped',
    'quad-complete-written',
    'quad-blanking-one-member-preserves-whole-old-address',
    'lone-latitude-dropped',
    'lat-lng-pair-written',
    'hours-dropped-without-timezone',
    'hours-written-with-timezone-in-overlay',
    'hours-written-with-timezone-in-existing',
    'year-founded-never-lands',
    'year-founded-stripped-from-existing-too',
    'anti-vacuity-merge-is-not-identity',
  ]

  it('every required case id is present', () => {
    const ids = new Set(corpus.cases.map((c) => c.id))
    const missing = REQUIRED.filter((id) => !ids.has(id))
    expect(missing, `corpus lost a regression case: ${missing.join(', ')}`).toEqual([])
  })
})

// ── The two anti-vacuity bounds, stated directly ────────────────────────────
//
// Every case above is an equality against a literal, so a merge that returned
// `existing` unchanged — or the overlay unchanged — would satisfy a surprising
// number of them. These pin both bounds explicitly rather than relying on the
// corpus to happen to contain a discriminating case.
describe('the merge is neither identity nor replacement', () => {
  it('a non-empty overlay value DOES win', () => {
    expect(mergeSettingsValue({ a: 'old' }, { a: 'new' })).toStrictEqual({ a: 'new' })
    expect(mergeBusinessInfo({ name: 'old' }, { name: 'new' })).toStrictEqual({ name: 'new' })
  })

  it('an unnamed existing key DOES survive', () => {
    expect(mergeSettingsValue({ a: 'keep' }, { b: 'new' })).toStrictEqual({ a: 'keep', b: 'new' })
    expect(mergeBusinessInfo({ a: 'keep' }, { b: 'new' })).toStrictEqual({ a: 'keep', b: 'new' })
  })

  it('at least one corpus case distinguishes each bound', () => {
    const identityWouldFail = corpus.cases.filter(
      (c) => JSON.stringify(c.expected) !== JSON.stringify(c.existing ?? {}),
    )
    const replacementWouldFail = corpus.cases.filter(
      (c) => JSON.stringify(c.expected) !== JSON.stringify(c.overlay),
    )
    expect(identityWouldFail.length, 'no case would catch an identity merge').toBeGreaterThan(5)
    expect(replacementWouldFail.length, 'no case would catch a replacement merge').toBeGreaterThan(5)
  })
})
