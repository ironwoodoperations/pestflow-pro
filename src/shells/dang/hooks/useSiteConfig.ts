import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

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
 * Fetches site_config for public-facing pages.
 * Reads SEO from dedicated seo_title / seo_description columns on per-page rows (key = "seo:{slug}").
 * Pass a slug to fetch SEO for a specific page; defaults to "/" (homepage).
 */
export const useSiteConfig = (slug: string = "/"): SiteConfig => {
  const [config, setConfig] = useState<SiteConfig>({
    seoTitle: "",
    seoDescription: "",
    heroVideoUrl: "",
    heroVideoType: "youtube",
    heroVideoStart: "",
    heroVideoEnd: "",
    meetKirkYoutubeId: "",
    loading: true,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchConfig = async () => {
        const seoKey = `seo:${slug}`;
        const { data } = await supabase
          .from("site_config")
          .select("key, value, seo_title, seo_description")
          .in("key", ["hero_media", seoKey]);

        if (!data) { setConfig((c) => ({ ...c, loading: false })); return; }

        let heroVideoUrl = "";
        let heroVideoType = "youtube";
        let heroVideoStart = "";
        let heroVideoEnd = "";
        let meetKirkYoutubeId = "";
        let seoTitle = "";
        let seoDescription = "";

        for (const row of data) {
          if (row.key === "hero_media") {
            const val = row.value as Record<string, unknown>;
            heroVideoUrl = (val.hero_video_url as string) || "";
            heroVideoType = (val.hero_video_type as string) || "youtube";
            heroVideoStart = (val.hero_video_start as string) || "";
            heroVideoEnd = (val.hero_video_end as string) || "";
            meetKirkYoutubeId = (val.meet_kirk_youtube_id as string) || "";
          }
          if (row.key === seoKey) {
            seoTitle = row.seo_title || "";
            seoDescription = row.seo_description || "";
          }
        }

        setConfig({ heroVideoUrl, heroVideoType, heroVideoStart, heroVideoEnd, meetKirkYoutubeId, seoTitle, seoDescription, loading: false });
      };
      fetchConfig();
    }, 0);
    return () => clearTimeout(timer);
  }, [slug]);

  return config;
};
