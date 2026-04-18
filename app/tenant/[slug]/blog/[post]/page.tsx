import Link from 'next/link';
import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../../../shared/lib/tenant/resolve';

export async function generateStaticParams() {
  return [];
}
import { getBlogPost } from '../../_lib/queries';

type Params = { params: { slug: string; post: string } };

export default async function BlogPostPage({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const post = await getBlogPost(tenant.id, params.post);
  if (!post) notFound();

  const p = post as { title: string; content: string; published_at?: string | null; intro_image?: string | null };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>

      <div className="w-full h-64 md:h-96 overflow-hidden" style={{ backgroundColor: 'var(--color-primary)' }}>
        <img
          src={(p.intro_image) || '/images/pests/pest_control.jpg'}
          alt={p.title}
          className="w-full h-full object-cover opacity-80"
        />
      </div>

      <article className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/blog" className="font-medium hover:underline text-sm mb-6 block" style={{ color: 'var(--color-primary)' }}>← Back to Blog</Link>
        <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-heading, #1a1a1a)' }}>{p.title}</h1>
        {p.published_at && (
          <p className="text-gray-400 text-sm mb-8">
            {new Date(p.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        )}
        <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: p.content || '' }} />
      </article>

      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-heading, #1a1a1a)' }}>Ready to Protect Your Home?</h2>
          <Link href="/quote" className="inline-block font-bold rounded-lg px-8 py-4 text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
            Get a Free Quote
          </Link>
        </div>
      </section>

    </div>
  );
}
