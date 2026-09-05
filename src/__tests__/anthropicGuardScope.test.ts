import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// S345 PARTS B & C — the safety net was narrower than it looked.
//
// S344 mutation-tested the CI guard and found it caught violations in src/ and
// supabase/functions/ but NOT in shared/lib/. That is not academic: shared code
// reaches the shipped client bundle (S344 confirmed PLATFORM_NAME's value in the
// built admin JS), that bundle is served UNAUTHENTICATED at /_admin/assets/*,
// and this whole arc has been moving helpers INTO shared/lib.
//
// The original leak was a P0 for exactly that reason — not "a key in a bundle"
// but "a key fetchable by anonymous visitors".

const ROOT = join(__dirname, '..', '..')
const CI = readFileSync(join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8')

/** The guard's grep line, extracted so assertions cannot drift from the real one. */
const GUARD_LINE = (() => {
  const at = CI.indexOf('Guard — no direct Anthropic calls')
  if (at === -1) throw new Error('the Anthropic guard is gone from ci.yml')
  const line = CI.slice(at).split('\n').find((l) => l.includes('grep -rEn'))
  if (!line) throw new Error('the guard no longer greps')
  return line
})()

describe('S345.B — the guard covers every tree that reaches a bundle', () => {
  it('scans src/, app/, shared/ AND supabase/functions/', () => {
    for (const dir of ['src/', 'app/', 'shared/', 'supabase/functions/']) {
      expect(GUARD_LINE, `the guard no longer scans ${dir}`).toContain(dir)
    }
  })

  it('shared/ is the one S344 found missing — pinned explicitly', () => {
    // Regression marker. If a future edit trims the path list back, this names
    // the exact gap rather than failing generically.
    expect(GUARD_LINE).toContain('shared/')
  })

  it('still matches BOTH forbidden patterns', () => {
    // THE LITERALS ARE ASSEMBLED FROM FRAGMENTS ON PURPOSE. Written out whole,
    // this file would itself match the guard it protects — and it did, on the
    // first run: the widened guard failed on a clean tree because of the line
    // below. The guard greps src/, and this test lives in src/.
    const HOST = ['api', 'anthropic', 'com'].join('\\.')
    const ENVVAR = ['VITE', 'ANTHROPIC'].join('_')
    expect(GUARD_LINE).toContain(HOST)
    expect(GUARD_LINE).toContain(ENVVAR)
  })

  it('still EXCLUDES ai-proxy — that one is allowed to call Anthropic', () => {
    // Without this the guard fails on the proxy itself and someone "fixes" it
    // by deleting the guard.
    expect(GUARD_LINE).toContain('--exclude-dir=ai-proxy')
  })

  it('and still fails the build rather than only warning', () => {
    const block = CI.slice(CI.indexOf('Guard — no direct Anthropic calls'))
      .slice(0, 700)
    expect(block).toContain('exit 1')
  })
})

describe('S345.C — the docs no longer teach the vulnerability', () => {
  const SKILL = readFileSync(join(ROOT, 'SKILL.md'), 'utf8')
  const CLAUDE = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8')

  /** Fenced/indented code only — both files legitimately DESCRIBE the old pattern. */
  const skillCodeish = SKILL.split('\n')
    .filter((l) => /^\s*(fetch\(|headers|'x-api-key'|'anthropic-|body: JSON)/.test(l))
    .join('\n')

  it('SKILL.md no longer presents a browser-direct call as the pattern to copy', () => {
    // A code block that works is what gets copied — a warning above it is not
    // enough. CLAUDE.md tells every session to read SKILL.md BEFORE writing
    // code, so this file briefing the forbidden pattern is a live path to
    // reintroducing it.
    const HOST = ['api', 'anthropic', 'com'].join('.')
    expect(skillCodeish).not.toContain("'x-api-key'")
    expect(skillCodeish).not.toContain(['anthropic', 'dangerous', 'direct', 'browser', 'access'].join('-'))
    expect(skillCodeish).not.toContain(`fetch('https://${HOST}`)
  })

  it('SKILL.md teaches callAi instead, with the real signature', () => {
    expect(SKILL).toContain('callAi(')
    expect(SKILL).toContain('ai-proxy')
    // Anti-vacuity: the section exists rather than having been deleted wholesale.
    expect(SKILL).toMatch(/##\s*AI PATTERN/)
  })

  it('SKILL.md still explains WHY, so the next reader does not re-derive it', () => {
    expect(SKILL).toMatch(/unauthenticated|_admin\/assets/)
  })

  it('CLAUDE.md no longer claims scrape-prospect calls Anthropic directly', () => {
    // It does not: scrape-prospect/index.ts now fails closed with no direct
    // fallback, fixed in cc934ba (#132).
    expect(CLAUDE).not.toMatch(/scrape-prospect` still calls Anthropic directly/)
  })

  it('…and the code backs that up', () => {
    const sp = readFileSync(
      join(ROOT, 'supabase', 'functions', 'scrape-prospect', 'index.ts'), 'utf8')
    expect(sp).toContain(`Fail closed — no direct ${['api', 'anthropic', 'com'].join('.')} fallback`)
  })
})
