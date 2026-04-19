import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getServerSupabase, getServerSupabaseForISR } from '../../../../shared/lib/supabase/server';
import { cacheTags } from '../../../_lib/cacheTags';

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
  (tenantId: string) =>
    unstable_cache(
      async () => {
        const supabase = getServerSupabase();
        const { data } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('tenant_id', tenantId)
          .not('published_at', 'is', null)
          .order('published_at', { ascending: false });
        return data ?? [];
      },
      ['all_blog_posts', tenantId],
      { tags: [cacheTags.blog(tenantId)], revalidate: 3600 }
    )()
);

export const getBlogPost = cache(
  (tenantId: string, postSlug: string) =>
    unstable_cache(
      async () => {
        const supabase = getServerSupabase();
        const { data } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('slug', postSlug)
          .maybeSingle();
        return data;
      },
      ['blog_post', tenantId, postSlug],
      { tags: [cacheTags.blog(tenantId)], revalidate: 3600 }
    )()
);

export const getAllLocations = cache(
  (tenantId: string) =>
    unstable_cache(
      async () => {
        const supabase = getServerSupabase();
        const { data } = await supabase
          .from('location_data')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_live', true)
          .order('city');
        return data ?? [];
      },
      ['all_locations', tenantId],
      { tags: [cacheTags.locations(tenantId)], revalidate: 3600 }
    )()
);

export const getLocation = cache(
  (tenantId: string, locationSlug: string) =>
    unstable_cache(
      async () => {
        const supabase = getServerSupabase();
        const { data } = await supabase
          .from('location_data')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('slug', locationSlug)
          .maybeSingle();
        return data;
      },
      ['location', tenantId, locationSlug],
      { tags: [cacheTags.locations(tenantId)], revalidate: 3600 }
    )()
);

export const getTestimonials = cache(
  (tenantId: string) =>
    unstable_cache(
      async () => {
        const supabase = getServerSupabase();
        const { data } = await supabase
          .from('testimonials')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });
        return data ?? [];
      },
      ['testimonials', tenantId],
      { tags: [cacheTags.testimonials(tenantId)], revalidate: 3600 }
    )()
);

export const getAllServicePages = cache(
  (tenantId: string) =>
    unstable_cache(
      async () => {
        const EXCLUDE = ['home', 'about', 'contact', 'faq', 'quote'];
        const supabase = getServerSupabase();
        const { data } = await supabase
          .from('page_content')
          .select('page_slug, title, subtitle, image_url')
          .eq('tenant_id', tenantId)
          .not('page_slug', 'in', `(${EXCLUDE.map((s) => `"${s}"`).join(',')})`);
        return data ?? [];
      },
      ['all_service_pages', tenantId],
      {
        tags: [cacheTags.allPages(tenantId)],
        revalidate: 3600,
      }
    )()
);

export const getSocialLinks = cache(
  (tenantId: string) =>
    unstable_cache(
      async () => {
        const supabase = getServerSupabase();
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('tenant_id', tenantId)
          .eq('key', 'social_links')
          .maybeSingle();
        return (data?.value ?? {}) as { facebook?: string; instagram?: string; youtube?: string; google?: string };
      },
      ['settings_social_links', tenantId],
      { tags: [cacheTags.settings(tenantId)], revalidate: 3600 }
    )()
);

export const getFaqItems = cache(
  (tenantId: string) =>
    unstable_cache(
      async () => {
        const supabase = getServerSupabase();
        const { data } = await supabase
          .from('faq_items')
          .select('id, question, answer, sort_order')
          .eq('tenant_id', tenantId)
          .order('sort_order');
        return data ?? [];
      },
      ['faq_items', tenantId],
      { tags: [cacheTags.faq(tenantId)], revalidate: 3600 }
    )()
);

export const getTeamMembers = cache(
  (tenantId: string) =>
    unstable_cache(
      async () => {
        const supabase = getServerSupabase();
        const { data } = await supabase
          .from('team_members')
          .select('id, name, title, bio, photo_url')
          .eq('tenant_id', tenantId)
          .order('display_order');
        return data ?? [];
      },
      ['team_members', tenantId],
      { tags: [cacheTags.team(tenantId)], revalidate: 3600 }
    )()
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
  (tenantId: string) =>
    unstable_cache(
      async () => {
        const supabase = getServerSupabase();
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('tenant_id', tenantId)
          .eq('key', 'integrations')
          .maybeSingle();
        return (data?.value ?? {}) as Record<string, string | null>;
      },
      ['settings_integrations', tenantId],
      { tags: [cacheTags.settings(tenantId)], revalidate: 3600 }
    )()
);
