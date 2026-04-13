// Social limits per subscription tier
// Tier: 1=Starter, 2=Grow, 3=Pro, 4=Elite

export const SOCIAL_LIMITS = {
  1: { // Starter — manual copy/paste only
    postsPerDay: 0,         // no scheduling
    aiGenerationsPerDay: 0, // no AI generation
    captionsPerClick: 0,
    daysAhead: 0,
    canSchedule: false,
    canUseAI: false,
    canUseCampaigns: false,
    provider: 'none',
  },
  2: { // Grow — Late API with hard cap
    postsPerDay: 2,         // HARD CAP 2 posts/day via Late
    aiGenerationsPerDay: 5,
    captionsPerClick: 2,
    daysAhead: 0,           // today only
    canSchedule: true,
    canUseAI: true,
    canUseCampaigns: false,
    provider: 'late',
  },
  3: { // Pro — unlimited Late API
    postsPerDay: 999,
    aiGenerationsPerDay: 999,
    captionsPerClick: 999,
    daysAhead: 5,
    canSchedule: true,
    canUseAI: true,
    canUseCampaigns: true,
    provider: 'late',
  },
  4: { // Elite — unlimited, 30-day window
    postsPerDay: 999,
    aiGenerationsPerDay: 999,
    captionsPerClick: 999,
    daysAhead: 30,
    canSchedule: true,
    canUseAI: true,
    canUseCampaigns: true,
    provider: 'late',
  },
} as const

// Legacy individual exports — derived from SOCIAL_LIMITS for backward compatibility
export const AI_DAILY_LIMITS: Record<number, number> = {
  1: SOCIAL_LIMITS[1].aiGenerationsPerDay,
  2: SOCIAL_LIMITS[2].aiGenerationsPerDay,
  3: Infinity,
  4: Infinity,
}

export const POSTS_PER_GENERATION: Record<number, number> = {
  1: 1,
  2: SOCIAL_LIMITS[2].captionsPerClick,
  3: 3,
  4: 3,
}

export const MAX_SCHEDULED_PER_DAY: Record<number, number> = {
  1: SOCIAL_LIMITS[1].postsPerDay,
  2: SOCIAL_LIMITS[2].postsPerDay,
  3: Infinity,
  4: Infinity,
}

export const SCHEDULING_DAY_CAP: Record<number, number> = {
  1: SOCIAL_LIMITS[1].daysAhead,
  2: SOCIAL_LIMITS[2].daysAhead,
  3: SOCIAL_LIMITS[3].daysAhead,
  4: SOCIAL_LIMITS[4].daysAhead,
}
