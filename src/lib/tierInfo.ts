// s247 — single source of truth for tier display name + price used by the
// pre-emptive upgrade prompt. Backend-aligned names ("Grow", not "Growth") so
// the on-screen prompt matches what notify-upgrade emails to sales.
// Do NOT scatter tier-name/price literals across components — read from here.
export interface TierInfo {
  tier: number
  name: string
  price: number
}

const TIERS: Record<number, TierInfo> = {
  1: { tier: 1, name: 'Starter', price: 149 },
  2: { tier: 2, name: 'Grow',    price: 249 },
  3: { tier: 3, name: 'Pro',     price: 349 },
  4: { tier: 4, name: 'Elite',   price: 499 },
}

export function tierInfo(tier: number): TierInfo {
  return TIERS[tier] ?? TIERS[1]
}
