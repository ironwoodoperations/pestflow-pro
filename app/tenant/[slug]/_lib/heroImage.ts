type Content = {
  page_hero_image_url?: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
} | null | undefined;

type HeroMedia = {
  master_hero_image_url?: string;
  image_url?: string;
  apply_hero_to_all_pages?: boolean;
} | null | undefined;

/**
 * Resolves the hero image URL for a tenant page.
 *
 * Precedence:
 *   - apply_hero_to_all_pages=true → always master hero (ignores page hero)
 *   - otherwise: page hero if set, then master hero, then legacy image_url
 *   - null → caller renders gradient (genuine "no hero configured" case)
 */
export function resolveHeroImage(
  content: Content,
  heroMedia: HeroMedia
): string | null {
  const master = heroMedia?.master_hero_image_url;
  const legacyMaster = heroMedia?.image_url;

  if (heroMedia?.apply_hero_to_all_pages) {
    if (typeof master === 'string' && master.trim() !== '') return master;
    if (typeof legacyMaster === 'string' && legacyMaster.trim() !== '') return legacyMaster;
    return null;
  }

  const pageHero = content?.page_hero_image_url;
  if (typeof pageHero === 'string' && pageHero.trim() !== '') return pageHero;

  if (typeof master === 'string' && master.trim() !== '') return master;

  if (typeof legacyMaster === 'string' && legacyMaster.trim() !== '') return legacyMaster;

  return null;
}
