import { createClient } from '@supabase/supabase-js';

// Returns a fresh service-role client per call.
// NEVER import this file from client components or anything bundled for the browser.
export function getServerSupabase() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required for server-side Supabase');
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side Supabase');
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      // Next.js 14 Data Cache caches fetch() across requests by default.
      // Supabase JS uses fetch internally — force no-store so every SSR render
      // always reads fresh data instead of a stale cached response.
      fetch: (url: RequestInfo | URL, options: RequestInit = {}) =>
        fetch(url, { ...options, cache: 'no-store' }),
    },
  });
}
