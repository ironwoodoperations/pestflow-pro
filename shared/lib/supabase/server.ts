import { createClient } from '@supabase/supabase-js';

function getEnv() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required for server-side Supabase');
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side Supabase');
  return { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY };
}

/**
 * For use INSIDE unstable_cache callbacks only.
 * cache: 'no-store' ensures tag invalidation always fetches fresh DB data
 * rather than hitting Next.js Data Cache with stale results.
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
 * For use OUTSIDE unstable_cache (e.g. resolveTenantBySlug step 1).
 * No custom fetch — allows Next.js ISR route caching via export const revalidate.
 * Only use for queries whose data is either immutable or wrapped in unstable_cache.
 */
export function getServerSupabaseForISR() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getEnv();
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
