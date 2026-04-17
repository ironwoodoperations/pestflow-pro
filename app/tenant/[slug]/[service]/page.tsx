import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';
import { getPageContent } from '../_lib/queries';
import { SERVICE_DATA, PEST_IMAGES, SERVICE_SLUGS } from '../_lib/serviceData';
import { ServiceTabs } from '../_components/service/ServiceTabs';

const GUARANTEES = [
  'Satisfaction guaranteed on all service plans',
  'Free callbacks between scheduled services',
  'Licensed and insured technicians',
  'Environmentally responsible products',
  'Transparent pricing — no hidden fees',
];

type Params = { params: { slug: string; service: string } };

export default async function ServicePage({ params }: Params) {
  if (!SERVICE_SLUGS.has(params.service)) notFound();

  const svc = SERVICE_DATA[params.service];
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const content = await getPageContent(tenant.id, params.service);

  const heroTitle = (content as { title?: string } | null)?.title || svc.heroTitle;
  const heroSubtitle = (content as { subtitle?: string } | null)?.subtitle || svc.heroSubtitle;
  const introP1 = (content as { intro?: string } | null)?.intro || svc.introP1;
  const pestImg = PEST_IMAGES[params.service] || '/images/pests/pest_control.jpg';
  const phone = tenant.phone ?? '';
  const bizName = tenant.business_name ?? '';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>

      <section className="py-16 md:py-20 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--color-bg-hero, #0a1628) 0%, var(--color-bg-hero-end, var(--color-primary)) 100%)' }}>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-3">{heroTitle}</h1>
          <p className="text-white/70 text-lg">{heroSubtitle}</p>
        </div>
      </section>

      <nav className="py-3 shadow-sm" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 text-sm text-white/80">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <ChevronRight className="w-4 h-4 opacity-50" />
          <Link href="/pest-control" className="hover:text-white transition">Services</Link>
          <ChevronRight className="w-4 h-4 opacity-50" />
          <span className="text-white font-medium">{svc.heroHighlight}</span>
        </div>
      </nav>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="rounded-xl overflow-hidden relative" style={{ minHeight: '280px', backgroundImage: `url(${pestImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} />
            <div className="relative z-10 h-full min-h-[280px] flex items-center justify-center">
              <span className="text-white text-xl font-semibold">{svc.heroHighlight}</span>
            </div>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>{svc.introHeading}</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">{introP1}</p>
            <p className="text-gray-600 mb-6 leading-relaxed">{svc.introP2}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/quote" className="font-semibold px-6 py-3 rounded-lg text-white text-center transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
                Schedule Inspection
              </Link>
              {phone && (
                <a href={`tel:${phone.replace(/\D/g, '')}`} className="font-semibold px-6 py-3 rounded-lg text-center transition hover:bg-gray-50" style={{ border: '2px solid var(--color-primary)', color: 'var(--color-primary)' }}>
                  Call {phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-hero, #0a1628)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10">How Our {svc.heroHighlight} Process Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {svc.steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4" style={{ backgroundColor: 'var(--color-accent)' }}>
                  {i + 1}
                </div>
                <h3 className="font-bold text-white mb-2">{step.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ServiceTabs serviceName={svc.heroHighlight} faqs={svc.faqs} />

      <section className="py-12" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-white text-center mb-6">Year-Round Protection — What&apos;s Included</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {GUARANTEES.map((g, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-white/90">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                {g}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-cta, #0a1628)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Get Started Today</h2>
          <p className="text-white/70 mb-8">
            {bizName ? `${bizName} is ready to help with your ${svc.heroHighlight.toLowerCase()} problem.` : 'Our team is ready to help.'} Same-day appointments available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/quote" className="font-semibold px-8 py-3.5 rounded-lg text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
              Schedule Inspection
            </Link>
            {phone && (
              <a href={`tel:${phone.replace(/\D/g, '')}`} className="font-semibold px-8 py-3.5 rounded-lg transition hover:bg-white/20 text-white" style={{ border: '2px solid rgba(255,255,255,0.4)' }}>
                Call Now
              </a>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
