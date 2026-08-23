import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactElement } from 'react';

// PR C / DEFECT 1 — a RENDER assertion, not a source scan: with zero published
// posts the page must produce no post cards and no invented dates.
//
// BlogPage is an async server component, so it is awaited to an element and
// then rendered. Its data dependencies are mocked; nothing here touches a DB.

const tenant = {
  id: 't1', slug: 'pls', name: 'Precision Lawn Systems LLC',
  business_name: 'Precision Lawn Systems LLC', template: 'modern-pro',
  vertical: 'irrigation', industry: 'irrigation and drainage',
};

const mocks = vi.hoisted(() => ({ posts: [] as unknown[] }));

vi.mock('../../../../shared/lib/tenant/resolve', () => ({
  resolveTenantBySlug: async () => tenant,
}));
vi.mock('../_lib/queries', () => ({
  getAllBlogPosts: async () => mocks.posts,
  getPageContent: async () => null,
  getHeroMedia: async () => null,
  getSeoMeta: async () => null,
}));
vi.mock('../_lib/heroImage', () => ({ resolveHeroImage: () => null }));

async function render(posts: unknown[]): Promise<string> {
  mocks.posts = posts;
  const { default: BlogPage } = await import('./page');
  const el = (await BlogPage({ params: { slug: 'pls' } })) as ReactElement;
  return renderToStaticMarkup(el);
}

beforeEach(() => { vi.resetModules(); });

describe('zero published posts', () => {
  it('renders NO post cards', async () => {
    const html = await render([]);
    expect(html).not.toContain('Read More');
    expect(html).not.toContain('href="/blog/');
  });

  it('renders the honest empty state instead', async () => {
    const html = await render([]);
    expect(html).toContain('No posts published yet.');
  });

  it('invents no article title, date or excerpt', async () => {
    const html = await render([]);
    expect(html).not.toContain('Termite Problem');
    expect(html).not.toContain('Mosquitoes');
    expect(html).not.toContain('Brown Recluse');
    // No rendered date of any shape.
    expect(html).not.toMatch(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d\d\b/);
  });

  it('still renders the vertical-correct chrome around the empty state', async () => {
    const html = await render([]);
    expect(html).toContain('Irrigation &amp; Drainage Blog');
    expect(html).not.toContain('Pest Control Blog');
    expect(html).not.toMatch(/pest control/i);
  });
});

describe('with posts, cards render normally', () => {
  const post = { id: 'p1', title: 'Winterizing a backflow preventer', slug: 'winterizing', excerpt: 'What to do before the first freeze.', published_at: '2026-01-05', intro_image: null };

  it('renders the card and drops the empty state', async () => {
    const html = await render([post]);
    expect(html).toContain('Winterizing a backflow preventer');
    expect(html).toContain('Read More');
    expect(html).not.toContain('No posts published yet.');
  });

  it('renders NO image for an irrigation post with no intro_image', async () => {
    // irrigation blogCardFallbackImage is null — no borrowed pest photo, and no
    // <img> pointing at a file that does not exist.
    const html = await render([post]);
    expect(html).not.toContain('/images/pests/');
    expect(html).not.toContain('<img');
  });
});
