export function resolveHeroImage(
  heroMedia: Record<string, unknown> | null | undefined
): string | null {
  if (!heroMedia) return null;
  if (heroMedia.mode === 'video') return null;

  const candidates = [
    heroMedia.image_url,
    heroMedia.url,
    heroMedia.thumbnail_url,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string' && candidate.trim() !== '') {
      return candidate.trim();
    }
  }

  return null;
}
