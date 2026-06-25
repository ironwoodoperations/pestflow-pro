import { describe, it, expect } from 'vitest';
import { resolveSiteUrl } from './resolveSiteUrl';
import { buildPageMetadata, type SeoMetaRow } from './buildPageMetadata';
import type { Tenant } from './tenant/types';

// A non-Dang tenant on a platform subdomain (mirrors the live `urban-strike`
// row: slug + subdomain 'urban-strike', tenant-level settings.seo empty).
const urbanStrike: Tenant = {
  id: 'b4f9c2d5-3e2a-4b8d-af7c-2a5e8b4d9c3f',
  slug: 'urban-strike',
  subdomain: 'urban-strike',
  name: 'Urban Strike Pest Defense',
  template: 'modern-pro',
  primary_color: '#111111',
  accent_color: '#f97316',
  logo_url: null,
  favicon_url: null,
  cta_text: null,
  business_name: 'Urban Strike Pest Defense',
  phone: null,
  email: null,
  address: null,
  hours: null,
  tagline: null,
  owner_name: null,
  founded_year: null,
  license_number: null,
  certifications: null,
  num_technicians: null,
  // tenant-LEVEL settings.seo — empty for this tenant (the regression floor case)
  meta_title: null,
  meta_description: null,
};

describe('resolveSiteUrl', () => {
  it('maps Dang to its live custom apex domain', () => {
    expect(resolveSiteUrl({ slug: 'dang', subdomain: null })).toBe('https://dangpestcontrol.com');
    expect(resolveSiteUrl({ slug: 'dang-pfp', subdomain: null })).toBe('https://dangpestcontrol.com');
  });

  it('uses the .ai platform host (NOT .com) for subdomain tenants', () => {
    expect(resolveSiteUrl(urbanStrike)).toBe('https://urban-strike.pestflowpro.ai');
  });

  it('falls back to slug when subdomain is absent', () => {
    expect(resolveSiteUrl({ slug: 'coastal-pest', subdomain: null })).toBe('https://coastal-pest.pestflowpro.ai');
  });
});

describe('buildPageMetadata — page WITH a seo_meta row', () => {
  // mirrors the live urban-strike `home` row (og_* populated)
  const homeRow: SeoMetaRow = {
    page_slug: 'home',
    meta_title: 'Dallas TX Pest Control | Urban Strike',
    meta_description: 'Urban Strike Pest Defense protects Dallas, TX homes & businesses from ants, roaches, termites & more.',
    og_title: 'Dallas TX Pest Control | Urban Strike',
    og_description: 'Urban Strike Pest Defense protects Dallas, TX homes & businesses from ants, roaches, termites & more.',
  };

  it('picks up the seo_meta title/description and emits a .ai canonical', () => {
    const m = buildPageMetadata(urbanStrike, { pathname: '/', seoMeta: homeRow, fallback: { title: 'fallback', description: 'fallback' } });
    expect(m.title).toBe('Dallas TX Pest Control | Urban Strike');
    expect(m.description).toBe(homeRow.meta_description);
    expect(m.alternates?.canonical).toBe('https://urban-strike.pestflowpro.ai');
    expect((m.metadataBase as URL).href).toBe('https://urban-strike.pestflowpro.ai/');
    expect((m.openGraph as { title?: string }).title).toBe(homeRow.og_title);
  });

  it('builds a per-path canonical for a service page', () => {
    const row: SeoMetaRow = {
      page_slug: 'pest-control',
      meta_title: 'General Pest Control Dallas TX | Urban Strike',
      meta_description: 'Year-round general pest control.',
      og_title: '',
      og_description: '',
    };
    const m = buildPageMetadata(urbanStrike, { pathname: '/pest-control', seoMeta: row, fallback: { title: 'fallback', description: 'fallback' } });
    expect(m.title).toBe('General Pest Control Dallas TX | Urban Strike');
    expect(m.alternates?.canonical).toBe('https://urban-strike.pestflowpro.ai/pest-control');
  });

  it('OG → meta fallback: empty og_* resolves to the chosen meta title/description', () => {
    const row: SeoMetaRow = {
      page_slug: 'pest-control',
      meta_title: 'General Pest Control Dallas TX | Urban Strike',
      meta_description: 'Year-round general pest control.',
      og_title: '', // dashboard write path leaves these as '' not null
      og_description: '',
    };
    const m = buildPageMetadata(urbanStrike, { pathname: '/pest-control', seoMeta: row, fallback: { title: 'fallback', description: 'fallback' } });
    expect((m.openGraph as { title?: string }).title).toBe('General Pest Control Dallas TX | Urban Strike');
    expect((m.openGraph as { description?: string }).description).toBe('Year-round general pest control.');
  });
});

describe('buildPageMetadata — REGRESSION GATE: page WITHOUT a seo_meta row', () => {
  const fallback = {
    title: 'Urban Strike Pest Defense',
    description: 'Urban Strike Pest Defense — professional pest control services',
  };

  it('with empty tenant settings.seo, output is byte-identical to the prior generic fallback', () => {
    const m = buildPageMetadata(urbanStrike, { pathname: '/', seoMeta: null, fallback });
    // title/description match what layout.generateMetadata produced before this PR:
    //   title = tenant.meta_title || businessName
    //   description = tenant.meta_description || `${businessName} — professional pest control services`
    expect(m.title).toBe('Urban Strike Pest Defense');
    expect(m.description).toBe('Urban Strike Pest Defense — professional pest control services');
    // OG mirrors the resolved title/description (same as tenantSeoMetadata)
    expect((m.openGraph as { title?: string }).title).toBe('Urban Strike Pest Defense');
    expect((m.openGraph as { description?: string }).description).toBe('Urban Strike Pest Defense — professional pest control services');
  });

  it('falls to tenant settings.seo (middle tier) when present — matching prior layout behavior exactly', () => {
    const withTenantSeo: Tenant = { ...urbanStrike, meta_title: 'Tenant-level SEO Title', meta_description: 'Tenant-level SEO description' };
    const m = buildPageMetadata(withTenantSeo, { pathname: '/blog', seoMeta: null, fallback });
    expect(m.title).toBe('Tenant-level SEO Title');
    expect(m.description).toBe('Tenant-level SEO description');
  });

  it('the only intended delta vs prior behavior is the .ai canonical host (PR #228)', () => {
    const m = buildPageMetadata(urbanStrike, { pathname: '/', seoMeta: null, fallback });
    expect(m.alternates?.canonical).toBe('https://urban-strike.pestflowpro.ai');
    expect(m.alternates?.canonical).not.toContain('.pestflowpro.com');
  });
});
