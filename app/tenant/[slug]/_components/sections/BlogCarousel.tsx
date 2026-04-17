import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface BlogPost { id: string; title: string; slug: string; published_at?: string; excerpt?: string }

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return dateStr; }
}

export function BlogCarousel({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null;
  const displayPosts = posts.slice(0, 3);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-accent)' }}>Our Blog</p>
            <h2 className="text-3xl font-bold" style={{ color: 'var(--color-heading)' }}>Recent Blog Posts</h2>
          </div>
          <Link href="/blog" className="hidden sm:flex items-center gap-2 text-sm font-semibold transition hover:opacity-80" style={{ color: 'var(--color-primary)' }}>
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayPosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition group">
              <div className="h-40" style={{ background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-primary) 100%)' }} />
              <div className="p-5 bg-white">
                {post.published_at && <p className="text-xs text-gray-400 mb-2">{formatDate(post.published_at)}</p>}
                <h3 className="font-bold mb-2 group-hover:text-[color:var(--color-primary)] transition leading-tight" style={{ color: 'var(--color-heading)' }}>{post.title}</h3>
                {post.excerpt && <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{post.excerpt}</p>}
                <p className="text-xs font-semibold mt-3 transition" style={{ color: 'var(--color-primary)' }}>Read more →</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8 sm:hidden">
          <Link href="/blog" className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>View All Posts →</Link>
        </div>
      </div>
    </section>
  );
}
