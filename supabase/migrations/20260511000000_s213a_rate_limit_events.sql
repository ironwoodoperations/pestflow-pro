-- S213a: rate_limit_events table for C1 gate on api-quote.
-- Stores per-IP submission events; cleanup cron prunes rows older than 1 hour.

CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rate_limit_events_key_time_idx
  ON public.rate_limit_events (key, created_at DESC);

-- Cleanup old rows hourly (events older than 1 hour are outside any rate window)
SELECT cron.schedule(
  'rate-limit-cleanup',
  '0 * * * *',
  $$ DELETE FROM public.rate_limit_events WHERE created_at < NOW() - INTERVAL '1 hour' $$
);

-- RLS: service_role only — no tenant-side access needed
ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;
