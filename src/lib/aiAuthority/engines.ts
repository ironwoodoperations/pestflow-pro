// S253 / A1 — engine display registry for the AI Authority tile.
// Mirrors public.ai_authority_engine. `status` controls how the tile renders an
// engine independent of tier:
//   live        — score card (or Calibrating); locked-upgrade if not in tier
//   coming_soon — placeholder card (data not yet collected; e.g. claude_web deferred)
//   hidden      — never rendered (google_aio dormant — no API)

export type EngineId = 'perplexity_sonar' | 'openai_web' | 'claude_web' | 'google_aio';
export type EngineStatus = 'live' | 'coming_soon' | 'hidden';

export interface EngineMeta {
  id: EngineId;
  label: string;          // human label ("Perplexity", "ChatGPT")
  shortName: string;      // used in the upgrade prompt
  status: EngineStatus;
  minTier: number;        // first tier that includes this engine (for the upsell copy)
  accent: string;         // chart/accent color
}

// Display order = ascending tier availability.
export const ENGINES: EngineMeta[] = [
  { id: 'perplexity_sonar', label: 'Perplexity',  shortName: 'Perplexity', status: 'live',        minTier: 2, accent: '#20808d' },
  { id: 'openai_web',       label: 'ChatGPT',      shortName: 'ChatGPT',    status: 'live',        minTier: 3, accent: '#10a37f' },
  { id: 'claude_web',       label: 'Claude',       shortName: 'Claude',     status: 'coming_soon', minTier: 4, accent: '#d97757' },
  { id: 'google_aio',       label: 'Google AI',    shortName: 'Google AI',  status: 'hidden',      minTier: 99, accent: '#4285f4' },
];

export const TIER_LABEL: Record<number, string> = {
  1: 'Starter', 2: 'Growth', 3: 'Pro', 4: 'Elite',
};
