import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Module-level cache — lives for the entire browser session
// key: `${tenantId}:${pageSlug}`
const cache = new Map<string, Record<string, any>>();
const pending = new Set<string>();

export function usePageContent(tenantId: string | null, pageSlug: string = '') {
  const cacheKey = tenantId ? `${tenantId}:${pageSlug}` : null;
  const [content, setContent] = useState<Record<string, any> | null>(
    () => (cacheKey ? cache.get(cacheKey) ?? null : null)
  );
  const [loading, setLoading] = useState(!cacheKey || !cache.has(cacheKey));

  useEffect(() => {
    if (!cacheKey || !tenantId) return;

    // Already cached — use it immediately
    if (cache.has(cacheKey)) {
      setContent(cache.get(cacheKey) ?? null);
      setLoading(false);
      return;
    }

    // Already fetching — wait for it
    if (pending.has(cacheKey)) return;

    pending.add(cacheKey);
    Promise.resolve(
      supabase
        .from('page_content')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('page_slug', pageSlug)
        .maybeSingle()
    ).then(({ data }) => {
      const result = data ?? {};
      cache.set(cacheKey, result);
      pending.delete(cacheKey);
      setContent(result);
      setLoading(false);
    }).catch(() => {
      pending.delete(cacheKey);
      setLoading(false);
    });
  }, [cacheKey, tenantId, pageSlug]);

  return { content, loading };
}

// Call this after admin content saves to invalidate a specific page
export function invalidatePageContent(tenantId: string, pageSlug: string) {
  cache.delete(`${tenantId}:${pageSlug}`);
}

// Pre-warm cache for all pages at once (call from TenantBootProvider)
export async function prefetchAllPageContent(tenantId: string) {
  const { data } = await supabase
    .from('page_content')
    .select('*')
    .eq('tenant_id', tenantId);
  if (data) {
    data.forEach((row) => {
      cache.set(`${tenantId}:${row.page_slug}`, row);
    });
  }
}
