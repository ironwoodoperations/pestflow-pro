type Payload =
  | { type: 'page'; tenantId: string; tenantSlug: string; slug: string }
  | { type: 'settings'; tenantId: string; tenantSlug: string };

function getTenantSlug(): string {
  try {
    const raw = localStorage.getItem(`pfp_tenant_boot_v2:${window.location.hostname}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.slug) return parsed.slug as string;
    }
  } catch {
    // ignore
  }
  return '';
}

export async function triggerRevalidate(
  payload: Omit<Payload, 'tenantSlug'>,
  accessToken: string
): Promise<void> {
  const tenantSlug = getTenantSlug();
  const body: Payload = { ...payload, tenantSlug } as Payload;
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
    // Non-fatal: DB write already succeeded. 300s fallback TTL catches up.
    console.warn('[revalidate] call failed, falling back to TTL:', err);
  }
}
