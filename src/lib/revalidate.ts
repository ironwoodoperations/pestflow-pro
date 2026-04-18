type Payload =
  | { type: 'page'; tenantId: string; slug: string }
  | { type: 'settings'; tenantId: string };

export async function triggerRevalidate(
  payload: Payload,
  accessToken: string
): Promise<void> {
  try {
    const res = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn(`[revalidate] non-ok ${res.status} — falling back to TTL`);
    }
  } catch (err) {
    // Non-fatal: DB write already succeeded. 3600s fallback TTL catches up.
    console.warn('[revalidate] call failed, falling back to TTL:', err);
  }
}
