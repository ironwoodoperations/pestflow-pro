type Payload =
  | { type: 'page'; tenantId: string; slug: string }
  | { type: 'settings'; tenantId: string }
  | { type: 'testimonials'; tenantId: string }
  | { type: 'blog'; tenantId: string }
  | { type: 'locations'; tenantId: string }
  | { type: 'team'; tenantId: string }
  | { type: 'faq'; tenantId: string };

function getTenantSlug(): string {
  try {
    return window.location.hostname.split('.')[0];
  } catch {
    return '';
  }
}

/**
 * Returns true on success, false on failure.
 * Callers should show a warning toast on false — DB write already succeeded
 * but the CDN edge cache will serve stale content until the TTL expires.
 */
export async function triggerRevalidate(
  payload: Payload,
  accessToken: string
): Promise<boolean> {
  const body = { ...payload, tenantSlug: getTenantSlug() };
  try {
    const res = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`[revalidate] non-ok ${res.status}`, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (err) {
    console.error('[revalidate] call failed:', err);
    return false;
  }
}
