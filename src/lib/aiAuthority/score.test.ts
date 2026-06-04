// npx vitest run src/lib/aiAuthority
import { describe, it, expect } from 'vitest'
import { scoreEngine, MIN_SAMPLE, type WeeklyAgg } from './score'

function wk(p: Partial<WeeklyAgg> & { week_index: number }): WeeklyAgg {
  return {
    week_index: p.week_index, week_start: p.week_start ?? `2026-0${(p.week_index % 9) + 1}-01`,
    denom: p.denom ?? 0, completed: p.completed ?? 0, snapshots: p.snapshots ?? 0,
    cited: p.cited ?? 0, mentioned: p.mentioned ?? 0,
    position_sum: p.position_sum ?? 0, position_n: p.position_n ?? 0,
    sov_sum: p.sov_sum ?? 0, sov_n: p.sov_n ?? 0,
  }
}

describe('scoreEngine — calibration', () => {
  it('returns null score + calibrating below 40 completed runs', () => {
    const r = scoreEngine([wk({ week_index: 0, denom: 10, completed: 10, cited: 10 })])
    expect(r.calibrating).toBe(true)
    expect(r.score).toBeNull()
    expect(r.completedTotal).toBe(10)
    expect(r.threshold).toBe(MIN_SAMPLE)
  })
})

describe('scoreEngine — denominator is scheduled jobs, NOT snapshot count', () => {
  it('a missing/errored job lowers the rate instead of inflating it', () => {
    // 50 scheduled (denom), only 40 completed (10 errored, no snapshot), 25 cited.
    // Correct citation-rate = 25/50 = 0.5  → score 100*0.45*0.5 = 22.5 → 23.
    // The WRONG snapshot-based rate would be 25/40 = 0.625 → 28. Assert we use denom.
    const r = scoreEngine([wk({ week_index: 0, denom: 50, completed: 40, snapshots: 40, cited: 25 })])
    expect(r.calibrating).toBe(false)
    expect(r.score).toBe(23)
  })

  it('full weighting: citation+mention+position+sov', () => {
    // denom 100, cited 100 (rate 1), mentioned 100 (rate 1),
    // position avg 1 (sum 100 / n 100 → posScore 1), sov avg 1 → 100.
    const r = scoreEngine([wk({ week_index: 0, denom: 100, completed: 100, cited: 100, mentioned: 100, position_sum: 100, position_n: 100, sov_sum: 100, sov_n: 100 })])
    expect(r.score).toBe(100)
  })

  it('zero denom → null score (nothing measured)', () => {
    const r = scoreEngine([wk({ week_index: 0, denom: 0, completed: 0 })])
    // completedTotal 0 < 40 → calibrating regardless
    expect(r.calibrating).toBe(true)
    expect(r.score).toBeNull()
  })
})

describe('scoreEngine — trend + EWMA', () => {
  it('produces an oldest→newest EWMA trend and a delta', () => {
    const weeks = [
      wk({ week_index: 2, denom: 20, completed: 20, cited: 4 }),   // ~ low
      wk({ week_index: 1, denom: 20, completed: 20, cited: 10 }),  // mid
      wk({ week_index: 0, denom: 20, completed: 20, cited: 18 }),  // high
    ]
    const r = scoreEngine(weeks)
    expect(r.completedTotal).toBe(60)
    expect(r.calibrating).toBe(false)
    // trend ordered oldest (wk2) → newest (wk0)
    expect(r.trend.map((t) => t.week_start)).toEqual([weeks[0].week_start, weeks[1].week_start, weeks[2].week_start])
    expect(r.trend.every((t) => typeof t.score === 'number')).toBe(true)
    expect(r.delta).not.toBeNull()
    expect((r.delta as number) > 0).toBe(true) // citations rose across the window
  })

  it('carries EWMA through weeks with no attempts (null gaps)', () => {
    const r = scoreEngine([
      wk({ week_index: 1, denom: 50, completed: 50, cited: 25 }),
      wk({ week_index: 0, denom: 0, completed: 0 }), // gap week
    ])
    // newest point carries the prior EWMA rather than dropping to 0/null
    expect(r.trend[r.trend.length - 1].score).not.toBeNull()
  })
})
