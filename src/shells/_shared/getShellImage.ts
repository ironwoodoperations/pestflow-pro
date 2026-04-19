interface Args {
  pageContent?: {
    page_hero_image_url?: string | null;
    image_url?: string | null;
    image_1_url?: string | null;
  } | null;
  settings?: {
    hero_media?: { image_url?: string | null; master_hero_image_url?: string | null } | null;
  } | null;
  pestSlug?: string | null;
}

export function getShellImage(args: Args): string | null {
  const pageHero = args.pageContent?.page_hero_image_url?.trim();
  if (pageHero) return pageHero;

  const pageFirst = args.pageContent?.image_1_url?.trim() || args.pageContent?.image_url?.trim();
  if (pageFirst) return pageFirst;

  const tenantMaster = args.settings?.hero_media?.master_hero_image_url?.trim();
  if (tenantMaster) return tenantMaster;

  const tenantHero = args.settings?.hero_media?.image_url?.trim();
  if (tenantHero) return tenantHero;

  return null;
}

export function hasShellImage(args: Args): boolean {
  return getShellImage(args) !== null;
}
