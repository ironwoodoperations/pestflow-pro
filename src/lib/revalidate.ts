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
    // In production: slug.pestflowpro.com → subdomain is the tenant slug
    return window.location.hostname.split('.')[0];
  } catch {
    return '';
  }
}

export async function triggerRevalidate(
  payload: Payload,
  accessToken: string
): Promise<void> {
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
      console.warn(`[revalidate] non-ok ${res.status} — falling back to TTL`);
    }
  } catch (err) {
    // Non-fatal: DB write already succeeded. 3600s fallback TTL catches up.
    console.warn('[revalidate] call failed, falling back to TTL:', err);
  }
}
