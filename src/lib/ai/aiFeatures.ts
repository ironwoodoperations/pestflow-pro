// Mirror of the AiFeature union in supabase/functions/_shared/aiAuth.ts.
// The edge function is the source of truth for the feature→tier map; this is
// only the client-side type so callAi() call sites are checked at compile time.
// Keep the two unions in sync when adding/removing AI surfaces.
export type AiFeature =
  | 'content_page'
  | 'composer_captions'
  | 'composer_schedule'
  | 'content_queue_schedule'
  | 'seo_metadata'
  | 'blog_draft'
  | 'blog_seo'
  | 'seo_keywords'
  | 'campaign_generation'
  | 'redirect_map'
