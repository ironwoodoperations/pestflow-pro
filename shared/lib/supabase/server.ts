import { createClient } from '@supabase/supabase-js';

function getEnv() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required for server-side Supabase');
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side Supabase');
  return { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY };
}

/**
 * Forces cache: 'no-store' on every fetch — bypasses Next.js Data Cache entirely.
 * Reserved for admin write paths or edge cases that must never see cached data.
 */
export function getServerSupabase() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getEnv();
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url: RequestInfo | URL, options: RequestInit = {}) =>
        fetch(url, { ...options, cache: 'no-store' }),
    },
  });
}

/**
 * Standard server client — no custom fetch override.
 * Lets Next.js ISR route caching (export const revalidate) control staleness.
 * Use for all tenant read-path fetchers.
 */
export function getServerSupabaseForISR() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getEnv();
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
