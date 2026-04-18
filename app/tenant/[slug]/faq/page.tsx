import Link from 'next/link';
import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';

export async function generateStaticParams() {
  return [];
}
import { getPageContent, getFaqItems, getHeroMedia } from '../_lib/queries';
import { resolveHeroImage } from '../_lib/heroImage';

const FAQ_FALLBACK = [
  {
    title: 'General',
    faqs: [
      { q: 'What pests do you treat?', a: 'We treat all common pests including mosquitoes, spiders, ants, wasps, cockroaches, fleas, ticks, rodents, scorpions, bed bugs, and termites.' },
      { q: 'Are you licensed and insured?', a: 'Yes. We are fully licensed, bonded, and insured. All technicians hold current pest control licenses.' },
      { q: 'Do you offer free estimates?', a: 'Yes. We provide free inspections and estimates for all pest control services.' },
    ],
  },
  {
    title: 'Treatments',
    faqs: [
      { q: 'Are your treatments safe for kids and pets?', a: 'Yes. All products are EPA-approved and applied by licensed technicians. Treatments are safe once dry, typically within 30–60 minutes.' },
      { q: 'How long do treatments take?', a: 'Most treatments take 45–90 minutes depending on the size of your home and the type of pest being treated.' },
      { q: 'How soon will I see results?', a: 'Many pests are eliminated within 24–48 hours. Some treatments take 1–2 weeks to fully eliminate a colony.' },
    ],
  },
  {
    title: 'Pricing',
    faqs: [
      { q: 'Do you offer service plans?', a: 'Yes. We offer monthly, quarterly, and annual plans that include scheduled treatments plus free re-treatments if pests return.' },
      { q: 'Do you offer a guarantee?', a: 'Yes. All services are backed by our satisfaction guarantee. If pests return between scheduled treatments, we will retreat at no additional cost.' },
    ],
  },
];

type Params = { params: { slug: string } };

export default async function FaqPage({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const [content, items, heroMedia] = await Promise.all([
    getPageContent(tenant.id, 'faq'),
    getFaqItems(tenant.id),
    getHeroMedia(tenant.id),
  ]);

  const c = content as { title?: string; subtitle?: string } | null;
  const heroTitle = c?.title    || 'Frequently Asked Questions';
  const heroSub   = c?.subtitle || 'Everything you need to know about our pest control services.';
  const heroImageUrl = resolveHeroImage(content, heroMedia);
  const phone = tenant.phone ?? '';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>

      <section className="relative py-20 md:py-28" style={heroImageUrl
        ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, var(--color-bg-hero, #0a1628) 0%, var(--color-bg-hero-end, var(--color-primary)) 100%)' }}>
        {heroImageUrl && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 0, pointerEvents: 'none' }} />}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-white">{heroTitle}</h1>
          <p className="text-xl text-white/75">{heroSub}</p>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-4xl mx-auto px-4">
          {items.length > 0 ? (
            <div className="space-y-6">
              {items.map(item => (
                <div key={item.id}>
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-heading, #1a1a1a)' }}>{item.question}</h3>
                  <p className="text-gray-600">{item.answer}</p>
                </div>
              ))}
            </div>
          ) : (
            FAQ_FALLBACK.map(cat => (
              <div key={cat.title} className="mb-12">
                <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-primary)' }}>{cat.title}</h2>
                <div className="space-y-6">
                  {cat.faqs.map((faq, i) => (
                    <div key={i}>
                      <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-heading, #1a1a1a)' }}>{faq.q}</h3>
                      <p className="text-gray-600">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-cta, #0a1628)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Still Have Questions?</h2>
          <p className="mb-8 text-white/75">We&apos;re here to help. Call us or request a quote online.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {phone && <a href={`tel:${phone}`} className="border-2 font-bold rounded-lg px-8 py-4 text-lg transition hover:opacity-90 text-white" style={{ borderColor: 'var(--color-accent)' }}>Call Us Now</a>}
            <Link href="/quote" className="font-bold rounded-lg px-8 py-4 text-lg transition hover:opacity-90 text-white" style={{ backgroundColor: 'var(--color-accent)' }}>Get a Free Quote</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
