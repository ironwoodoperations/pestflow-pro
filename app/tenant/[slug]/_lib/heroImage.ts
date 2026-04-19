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

// Resolution order:
// 1. If heroMedia.apply_hero_to_all_pages === true AND heroMedia.master_hero_image_url truthy: return master
// 2. If content.page_hero_image_url truthy: return page hero
// 3. If heroMedia.master_hero_image_url truthy: return master (fallback)
// 4. If content.image_url truthy (legacy): return legacy page image
// 5. Return null
export function resolveHeroImage(
  content: Content,
  heroMedia: HeroMedia
): string | null {
  const master = heroMedia?.master_hero_image_url;

  if (heroMedia?.apply_hero_to_all_pages) {
    if (typeof master === 'string' && master.trim() !== '') return master;
    return null;
  }

  const pageHero = content?.page_hero_image_url;
  if (typeof pageHero === 'string' && pageHero.trim() !== '') return pageHero;

  if (typeof master === 'string' && master.trim() !== '') return master;

  const legacyPage = content?.image_url;
  if (typeof legacyPage === 'string' && legacyPage.trim() !== '') return legacyPage;

  return null;
}
