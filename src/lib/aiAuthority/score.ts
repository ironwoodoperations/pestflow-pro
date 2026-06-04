// S253 / A1 — per-engine AI Authority scorer. PURE (no imports) so it is unit-
// testable with vitest and shared by the hook/tile.
//
// Validator-settled rules baked in here:
//  - NO blended composite — caller scores each engine independently.
//  - Denominator = scheduled measurement attempts (jobs done+error), supplied as
//    `denom` by the RPC. NEVER snapshot count.
//  - Headline score = ONE aggregate over the trailing 56-day window (sum the weekly
//    counts, then divide) — not an average-of-averages.
//  - Calibrating until >= 40 completed runs.
//  - EWMA (alpha 0.3) smooths the weekly trendline, per engine.

export interface WeeklyAgg {
  week_index: number;   // 0 = current week ... 7 = oldest
  week_start: string;   // ISO date
  denom: number;        // done + error jobs (rate denominator)
  completed: number;    // done jobs (calibration threshold)
  snapshots: number;
  cited: number;
  mentioned: number;
  position_sum: number;
  position_n: number;
  sov_sum: number;
  sov_n: number;
}

export interface TrendPoint { week_start: string; score: number | null; }

export interface EngineScore {
  score: number | null;          // 0-100, null while calibrating
  calibrating: boolean;
  completedTotal: number;        // for "Calibrating (X/40)"
  threshold: number;
  trend: TrendPoint[];           // oldest → newest, EWMA-smoothed
  delta: number | null;          // newest EWMA − oldest EWMA (trend arrow)
}

export const MIN_SAMPLE = 40;
export const EWMA_ALPHA = 0.3;
export const WEIGHTS = { citation: 0.45, mention: 0.25, position: 0.15, sov: 0.15 } as const;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// Map an average citation position (1 = best) to 0..1. pos 1 → 1.0, pos 11+ → 0.
function positionScore(positionSum: number, positionN: number): number {
  if (positionN <= 0) return 0;
  const avg = positionSum / positionN;
  return clamp01((11 - avg) / 10);
}

// 0-100 score from a set of summed counts. Returns null when there were no
// measurement attempts (denom 0) — nothing to score.
function scoreFromCounts(c: {
  denom: number; cited: number; mentioned: number;
  position_sum: number; position_n: number; sov_sum: number; sov_n: number;
}): number | null {
  if (c.denom <= 0) return null;
  const citationRate = clamp01(c.cited / c.denom);
  const mentionRate = clamp01(c.mentioned / c.denom);
  const posScore = positionScore(c.position_sum, c.position_n);
  const sovScore = c.sov_n > 0 ? clamp01(c.sov_sum / c.sov_n) : 0;
  const raw =
    WEIGHTS.citation * citationRate +
    WEIGHTS.mention * mentionRate +
    WEIGHTS.position * posScore +
    WEIGHTS.sov * sovScore;
  return Math.round(clamp01(raw) * 100);
}

function sum(weeks: WeeklyAgg[], k: keyof WeeklyAgg): number {
  return weeks.reduce((acc, w) => acc + (Number(w[k]) || 0), 0);
}

// EWMA over a series that may contain nulls (weeks with no attempts). Nulls are
// gaps: they neither reset nor contribute; once a value appears it seeds the EWMA.
function ewma(series: (number | null)[], alpha: number): (number | null)[] {
  let prev: number | null = null;
  return series.map((v) => {
    if (v === null) return prev;            // carry forward through a gap
    prev = prev === null ? v : alpha * v + (1 - alpha) * prev;
    return Math.round(prev);
  });
}

export function scoreEngine(weeksInput: WeeklyAgg[]): EngineScore {
  // Oldest → newest for the trendline (week_index 7 → 0).
  const weeks = [...weeksInput].sort((a, b) => b.week_index - a.week_index);

  const completedTotal = sum(weeks, 'completed');
  const calibrating = completedTotal < MIN_SAMPLE;

  const headline = scoreFromCounts({
    denom: sum(weeks, 'denom'),
    cited: sum(weeks, 'cited'),
    mentioned: sum(weeks, 'mentioned'),
    position_sum: sum(weeks, 'position_sum'),
    position_n: sum(weeks, 'position_n'),
    sov_sum: sum(weeks, 'sov_sum'),
    sov_n: sum(weeks, 'sov_n'),
  });

  const rawWeekly = weeks.map((w) =>
    scoreFromCounts({
      denom: w.denom, cited: w.cited, mentioned: w.mentioned,
      position_sum: w.position_sum, position_n: w.position_n,
      sov_sum: w.sov_sum, sov_n: w.sov_n,
    }),
  );
  const smoothed = ewma(rawWeekly, EWMA_ALPHA);
  const trend: TrendPoint[] = weeks.map((w, i) => ({ week_start: w.week_start, score: smoothed[i] }));

  const present = smoothed.filter((s): s is number => s !== null);
  const delta = present.length >= 2 ? present[present.length - 1] - present[0] : null;

  return {
    score: calibrating ? null : headline,
    calibrating,
    completedTotal,
    threshold: MIN_SAMPLE,
    trend,
    delta,
  };
}
