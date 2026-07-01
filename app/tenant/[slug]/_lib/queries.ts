import { cache } from 'react';
import { getServerSupabaseForISR } from '../../../../shared/lib/supabase/server';
import { CUSTOM_PAGE_SLUGS, NON_SERVICE_SLUGS } from './navConfig';
import { SLUG_TO_FAQ_CATEGORY } from './faqCategoryMap';

export const getPageContent = cache(
  async (tenantId: string, pageSlug: string) => {
    const supabase = getServerSupabaseForISR();
    const { data, error } = await supabase
      .from('page_content')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('page_slug', pageSlug)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data;
  }
);

export const getAllBlogPosts = cache(
  async (tenantId: string) => {
    const supabase = getServerSupabaseForISR();
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('tenant_id', tenantId)
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false });
    if (error) {
      console.error('[getAllBlogPosts] error', { tenantId, code: error.code, message: error.message });
      return [];
    }
    return data ?? [];
  }
);

export const getBlogPost = cache(
  async (tenantId: string, postSlug: string) => {
    const supabase = getServerSupabaseForISR();
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('slug', postSlug)
      .maybeSingle();
    if (error) {
      console.error('[getBlogPost] error', { tenantId, postSlug, code: error.code, message: error.message });
      return null;
    }
    return data;
  }
);

export const getAllLocations = cache(
  async (tenantId: string) => {
    const supabase = getServerSupabaseForISR();
    const { data, error } = await supabase
      .from('location_data')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_live', true)
      .order('city');
    if (error) {
      console.error('[getAllLocations] error', { tenantId, code: error.code, message: error.message });
      return [];
    }
    return data ?? [];
  }
);

export const getLocation = cache(
  async (tenantId: string, locationSlug: string) => {
    const supabase = getServerSupabaseForISR();
    const { data, error } = await supabase
      .from('location_data')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('slug', locationSlug)
      .maybeSingle();
    if (error) {
      console.error('[getLocation] error', { tenantId, locationSlug, code: error.code, message: error.message });
      return null;
    }
    return data;
  }
);

export const getTestimonials = cache(
  async (tenantId: string) => {
    const supabase = getServerSupabaseForISR();
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[getTestimonials] error', { tenantId, code: error.code, message: error.message });
      return [];
    }
    return data ?? [];
  }
);

export const getAllServicePages = cache(
  async (tenantId: string) => {
    const EXCLUDE = [...NON_SERVICE_SLUGS, ...CUSTOM_PAGE_SLUGS];
    const supabase = getServerSupabaseForISR();
    const { data, error } = await supabase
      .from('page_content')
      .select('page_slug, title, subtitle, image_url')
      .eq('tenant_id', tenantId)
      .not('page_slug', 'in', `(${EXCLUDE.map((s) => `"${s}"`).join(',')})`);
    if (error) {
      console.error('[getAllServicePages] error', { tenantId, code: error.code, message: error.message });
      return [];
    }
    return data ?? [];
  }
);

export const getSocialLinks = cache(
  async (tenantId: string) => {
    const supabase = getServerSupabaseForISR();
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('tenant_id', tenantId)
      .eq('key', 'social_links')
      .maybeSingle();
    if (error) {
      console.error('[getSocialLinks] error', { tenantId, code: error.code, message: error.message });
      return {} as { facebook?: string; instagram?: string; youtube?: string; google?: string };
    }
    return (data?.value ?? {}) as { facebook?: string; instagram?: string; youtube?: string; google?: string };
  }
);

export const getTeamMembers = cache(
  async (tenantId: string) => {
    const supabase = getServerSupabaseForISR();
    const { data, error } = await supabase
      .from('team_members')
      .select('id, name, title, bio, photo_url')
      .eq('tenant_id', tenantId)
      .order('display_order');
    if (error) {
      console.error('[getTeamMembers] error', { tenantId, code: error.code, message: error.message });
      return [];
    }
    return data ?? [];
  }
);

export const getHeroMedia = cache(
  async (tenantId: string) => {
    const supabase = getServerSupabaseForISR();
    const [heroRes, brandingRes] = await Promise.all([
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'hero_media').maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
    ]);
    if (heroRes.error) {
      console.error('[getHeroMedia] hero_media error', { tenantId, code: heroRes.error.code, message: heroRes.error.message });
      return null;
    }
    if (brandingRes.error) {
      console.error('[getHeroMedia] branding error', { tenantId, code: brandingRes.error.code, message: brandingRes.error.message });
    }
    const hero = (heroRes.data?.value ?? null) as {
      master_hero_image_url?: string;
      image_url?: string;
      video_url?: string;
      youtube_id?: string;
      mode?: string;
    } | null;
    const applyToAll = (brandingRes.data?.value as { apply_hero_to_all_pages?: boolean } | null)?.apply_hero_to_all_pages ?? false;
    if (!hero && !applyToAll) return null;
    return { ...(hero ?? {}), apply_hero_to_all_pages: applyToAll } as typeof hero & { apply_hero_to_all_pages: boolean };
  }
);

export const getIntegrations = cache(
  async (tenantId: string) => {
    const supabase = getServerSupabaseForISR();
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('tenant_id', tenantId)
      .eq('key', 'integrations')
      .maybeSingle();
    if (error) {
      console.error('[getIntegrations] error', { tenantId, code: error.code, message: error.message });
      return {} as Record<string, string | null>;
    }
    return (data?.value ?? {}) as Record<string, string | null>;
  }
);

export const getSeoSettings = cache(
  async (tenantId: string): Promise<{ meta_description?: string; service_areas?: string[]; certifications?: string[]; founded_year?: string; owner_name?: string }> => {
    const supabase = getServerSupabaseForISR();
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('tenant_id', tenantId)
      .eq('key', 'seo')
      .maybeSingle();
    if (error) {
      console.error('[getSeoSettings] error', { tenantId, code: error.code, message: error.message });
      return {};
    }
    return (data?.value ?? {}) as { meta_description?: string; service_areas?: string[]; certifications?: string[]; founded_year?: string; owner_name?: string };
  }
);

export const getSeoMeta = cache(
  async (tenantId: string, pageSlug: string) => {
    // Whitelist pageSlug before the PostgREST query. Slugs flow in from
    // Next.js dynamic route segments (params.service / params.post), which
    // Next.js URL-decodes before populating params — same precedent as
    // resolveTenantBySlug's slug guard. Anything outside the clean
    // seo_meta.page_slug charset cannot match a row anyway.
    if (!/^[a-z0-9-]+$/.test(pageSlug)) {
      return null;
    }
    const supabase = getServerSupabaseForISR();
    const { data, error } = await supabase
      .from('seo_meta')
      .select('page_slug, meta_title, meta_description, og_title, og_description')
      .eq('tenant_id', tenantId)
      .eq('page_slug', pageSlug)
      .maybeSingle();
    if (error) {
      console.error('[getSeoMeta] error', { tenantId, pageSlug, code: error.code, message: error.message });
      return null;
    }
    return data;
  }
);

export type FaqRow = { question: string; answer: string; category: string; sort_order: number };

// All FAQs for a tenant, ordered deterministically. sort_order is uniform within
// a category (it orders categories, not rows), so intra-category order is
// otherwise undefined — the (category, sort_order, question) key pins it stable
// across renders. Non-Dang tenants have zero faqs rows today, so this returns [].
export const getAllFaqs = cache(
  async (tenantId: string): Promise<FaqRow[]> => {
    const supabase = getServerSupabaseForISR();
    const { data, error } = await supabase
      .from('faqs')
      .select('question, answer, category, sort_order')
      .eq('tenant_id', tenantId)
      .order('category')
      .order('sort_order')
      .order('question');
    if (error) {
      console.error('[getAllFaqs] error', { tenantId, code: error.code, message: error.message });
      return [];
    }
    return (data ?? []) as FaqRow[];
  }
);

// FAQs for a single service page, resolved by slug → category. No category maps
// (e.g. termite-control / termite-inspections, or an unknown/invalid slug) →
// zero FAQs WITHOUT a DB call. Otherwise filters the single cached getAllFaqs
// fetch in memory (no extra round-trip).
export const getServiceFaqs = cache(
  async (tenantId: string, serviceSlug: string): Promise<FaqRow[]> => {
    // Slug guard mirrors getSeoMeta: reject anything outside the clean slug
    // charset before mapping. serviceSlug flows in from a dynamic route segment.
    if (!/^[a-z0-9-]+$/.test(serviceSlug)) {
      return [];
    }
    const category = SLUG_TO_FAQ_CATEGORY[serviceSlug];
    if (!category) {
      return [];
    }
    const all = await getAllFaqs(tenantId);
    return all.filter((f) => f.category === category);
  }
);

export const getBusinessInfo = cache(
  async (tenantId: string): Promise<unknown> => {
    const supabase = getServerSupabaseForISR();
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('tenant_id', tenantId)
      .eq('key', 'business_info')
      .maybeSingle();
    if (error) {
      console.error('[getBusinessInfo] error', { tenantId, code: error.code, message: error.message });
      return null;
    }
    return data?.value ?? null;
  }
);
