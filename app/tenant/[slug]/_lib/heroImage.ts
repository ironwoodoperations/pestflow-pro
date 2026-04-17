type Content = {
  page_hero_image_url?: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
} | null | undefined;

type HeroMedia = {
  master_hero_image_url?: string;
  image_url?: string;
} | null | undefined;

/**
 * Resolves the hero image URL for a tenant page.
 * Chain:
 *   1. page_content.page_hero_image_url  — per-page override
 *   2. hero_media.master_hero_image_url  — site-wide master
 *   3. hero_media.image_url              — legacy transition fallback
 *   4. null                              — caller renders gradient
 */
export function resolveHeroImage(
  content: Content,
  heroMedia: HeroMedia
): string | null {
  const pageHero = content?.page_hero_image_url;
  if (typeof pageHero === 'string' && pageHero.trim() !== '') return pageHero;

  const master = heroMedia?.master_hero_image_url;
  if (typeof master === 'string' && master.trim() !== '') return master;

  const legacyMaster = heroMedia?.image_url;
  if (typeof legacyMaster === 'string' && legacyMaster.trim() !== '') return legacyMaster;

  return null;
}
