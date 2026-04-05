// AI generation and scheduling limits per subscription tier
// Tier: 1=Starter, 2=Grow, 3=Pro, 4=Elite

export const AI_DAILY_LIMITS: Record<number, number> = {
  1: 2,        // Starter: 2 generations/day
  2: 5,        // Grow: 5 generations/day
  3: Infinity, // Pro: unlimited
  4: Infinity, // Elite: unlimited
}

export const POSTS_PER_GENERATION: Record<number, number> = {
  1: 1, // Starter: 1 post per click
  2: 2, // Grow: 2 variations per click
  3: 3, // Pro: 3 captions per click
  4: 3, // Elite: 3 captions per click
}

export const MAX_SCHEDULED_PER_DAY: Record<number, number> = {
  1: 2,        // Starter
  2: 5,        // Grow
  3: Infinity, // Pro
  4: Infinity, // Elite
}

export const SCHEDULING_DAY_CAP: Record<number, number> = {
  1: 0,  // Starter: today only
  2: 0,  // Grow: today only
  3: 5,  // Pro: up to 5 days ahead
  4: 30, // Elite: up to 30 days ahead
}
