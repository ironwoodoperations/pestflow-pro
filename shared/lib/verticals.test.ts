import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// PR A — layering lock. The registry moved into shared/lib precisely so the
// schema layer could reach it WITHOUT shared/ importing src/. If that ever
// reverses, shared/lib/seoSchema joins a cycle (src/ already imports shared/).
// No madge/dpdm in this repo, so the invariant is asserted directly against
// the source rather than by inspection.

const here = dirname(fileURLToPath(import.meta.url))

function importSpecifiers(source: string): string[] {
  // Covers `import x from '…'`, `import type …`, `export … from '…'`, and
  // dynamic `import('…')`.
  return [...source.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
}

describe('shared/lib must not depend on src/', () => {
  const files = readdirSync(here).filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'))

  it('finds the shared/lib sources it is meant to be checking', () => {
    expect(files).toContain('verticals.ts')
    expect(files).toContain('seoSchema.ts')
    expect(files.length).toBeGreaterThan(5)
  })

  it('no file in shared/lib imports from src/ — the cycle this move exists to avoid', () => {
    const offenders: string[] = []
    for (const file of files) {
      for (const spec of importSpecifiers(readFileSync(join(here, file), 'utf8'))) {
        if (/(^|\/)src\//.test(spec)) offenders.push(`${file} → ${spec}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('seoSchema gets Vertical from the shared/lib-internal registry, not across the tree', () => {
    const specs = importSpecifiers(readFileSync(join(here, 'seoSchema.ts'), 'utf8'))
    expect(specs).toContain('./verticals')
    expect(specs.some((s) => s.includes('shells'))).toBe(false)
  })

  it('verticals.ts is a leaf — it imports nothing internal, so it cannot close a cycle', () => {
    const specs = importSpecifiers(readFileSync(join(here, 'verticals.ts'), 'utf8'))
    const internal = specs.filter((s) => s.startsWith('.') || s.includes('/src/'))
    expect(internal).toEqual([])
  })
})
