import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// PR C / DEFECT 1 — the blog index rendered three invented, dated articles for
// any tenant with an empty blog_posts table. Both pls and apex-protect were
// showing the identical fabricated posts on live sites.
//
// These are source-scan assertions rather than render assertions because the
// page is an async server component with DB calls. They lock the thing that
// actually matters: no invented article can live in this source again.

const here = dirname(fileURLToPath(import.meta.url));
const blogIndex = readFileSync(join(here, 'page.tsx'), 'utf8');
const blogPost = readFileSync(join(here, '[post]', 'page.tsx'), 'utf8');

const FABRICATED_TITLES = [
  '5 Signs You Have a Termite Problem',
  'How to Prevent Mosquitoes in Your Yard',
  'Are Brown Recluse Spiders in Your Area?',
];

const FABRICATED_SUPPORTING = [
  '5-signs-termite-problem',
  'prevent-mosquitoes-yard',
  'brown-recluse-spiders',
  'Learn the early warning signs of termite damage',
  'Simple steps to reduce mosquito breeding grounds',
  '2026-03-15', '2026-03-10', '2026-03-05',
];

describe('the fabricated post array is GONE, not relocated', () => {
  for (const title of FABRICATED_TITLES) {
    it(`does not contain "${title}"`, () => {
      expect(blogIndex).not.toContain(title);
    });
  }

  it('contains none of the supporting slugs, excerpts or invented dates', () => {
    for (const fragment of FABRICATED_SUPPORTING) {
      expect(blogIndex).not.toContain(fragment);
    }
  });

  it('has no placeholder array left under any name', () => {
    expect(blogIndex).not.toMatch(/PLACEHOLDER_POSTS|FALLBACK_POSTS|DEFAULT_POSTS|SAMPLE_POSTS/);
  });

  it('was not replaced with irrigation-flavoured invented posts either', () => {
    // The rule is trade-agnostic: inventing articles attributed to a client is
    // wrong for every vertical, so there must be no post literal at all.
    expect(blogIndex).not.toMatch(/sprinkler.{0,40}(problem|guide|tips)/i);
    expect(blogIndex).not.toMatch(/published_at:\s*'20\d\d-/);
  });

  it('renders posts straight from the DB query with no fallback branch', () => {
    expect(blogIndex).toMatch(/const posts: BlogPost\[\] = rawPosts as BlogPost\[\];/);
    expect(blogIndex).not.toMatch(/rawPosts\.length > 0 \?/);
  });
});

describe('empty state', () => {
  it('renders a single honest line and no cards when there are no posts', () => {
    expect(blogIndex).toMatch(/posts\.length === 0 \?/);
    expect(blogIndex).toContain('No posts published yet.');
  });

  it('the card grid is inside the non-empty branch, so zero posts renders zero cards', () => {
    const emptyBranch = blogIndex.indexOf('posts.length === 0 ?');
    const grid = blogIndex.indexOf('posts.map(post');
    expect(emptyBranch).toBeGreaterThan(-1);
    expect(grid).toBeGreaterThan(emptyBranch);
  });

  it('invents no date, no author and no excerpt for the empty case', () => {
    const empty = blogIndex.slice(
      blogIndex.indexOf('posts.length === 0 ?'),
      blogIndex.indexOf(') : ('),
    );
    expect(empty).not.toMatch(/toLocaleDateString|excerpt|Read More/);
  });
});

describe('card imagery resolves per vertical or not at all', () => {
  it('the index no longer hardcodes the pest photo', () => {
    expect(blogIndex).not.toContain('/images/pests/pest_control.jpg');
    expect(blogIndex).toContain('copy.blogCardFallbackImage');
  });

  it('the post page no longer hardcodes it either', () => {
    expect(blogPost).not.toContain('/images/pests/pest_control.jpg');
    expect(blogPost).toContain('blogCardFallbackImage');
  });

  it('both guard the <img> so a null fallback renders nothing', () => {
    expect(blogIndex).toMatch(/\{cardImage && \(/);
    expect(blogPost).toMatch(/\{postImage && \(/);
  });
});
