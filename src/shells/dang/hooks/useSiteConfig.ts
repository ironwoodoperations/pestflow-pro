interface SiteConfig {
  seoTitle: string;
  seoDescription: string;
  heroVideoUrl: string;
  heroVideoType: string;
  heroVideoStart: string;
  heroVideoEnd: string;
  meetKirkYoutubeId: string;
  loading: boolean;
}

/**
 * Returns static defaults for Dang public pages.
 * The site_config table does not exist — hero media and SEO are managed
 * through the tenant settings system, not a per-shell config table.
 */
export const useSiteConfig = (_slug: string = "/"): SiteConfig => ({
  seoTitle: "",
  seoDescription: "",
  heroVideoUrl: "",
  heroVideoType: "mp4",
  heroVideoStart: "",
  heroVideoEnd: "",
  meetKirkYoutubeId: "",
  loading: false,
});
