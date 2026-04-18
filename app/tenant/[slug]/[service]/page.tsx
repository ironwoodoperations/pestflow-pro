import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Shield, Leaf, MapPin, Star } from 'lucide-react';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}
import { getPageContent, getLocation, getAllLocations, getHeroMedia } from '../_lib/queries';
import { resolveHeroImage } from '../_lib/heroImage';
import { SERVICE_DATA, PEST_IMAGES, SERVICE_SLUGS } from '../_lib/serviceData';
import { ServiceTabs } from '../_components/service/ServiceTabs';
import { WhyChooseUs } from '../_components/sections/WhyChooseUs';
import { Process } from '../_components/sections/Process';
import { CtaBanner } from '../_components/sections/CtaBanner';
import { CityFaqAccordion } from '../_components/CityFaqAccordion';
import { formatPhone } from '../../../../shared/lib/formatPhone';

const GUARANTEES = [
  'Satisfaction guaranteed on all service plans',
  'Free callbacks between scheduled services',
  'Licensed and insured technicians',
  'Environmentally responsible products',
  'Transparent pricing — no hidden fees',
];

type Params = { params: { slug: string; service: string } };

function titleCase(s: string) { return s.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()); }

export default async function ServicePage({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  // City page branch
  if (!SERVICE_SLUGS.has(params.service)) {
    const [location, allLocs] = await Promise.all([
      getLocation(tenant.id, params.service),
      getAllLocations(tenant.id),
    ]);
    if (!location) notFound();

    const loc = location as { city?: string; hero_title?: string };
    const city      = loc.city       || titleCase(params.service);
    const heroTitle = loc.hero_title || `${city} Pest Control`;
    const phone     = tenant.phone ?? '';
    const bizName   = tenant.business_name ?? '';
    type LocItem = { slug: string; city: string };
    const others = (allLocs as LocItem[]).filter((l) => l.slug !== params.service);

    const cityFaqs = [
      { q: `Do you service the ${city} area?`, a: `Yes! We provide full pest control services throughout ${city} and surrounding communities. Call us today for same-day scheduling.` },
      { q: `What pests are most common in ${city}?`, a: `Common pests in ${city} include ants, roaches, rodents, mosquitoes, and spiders. Our local technicians are familiar with regional pest pressures and seasonal patterns.` },
      { q: `How quickly can you get to my home in ${city}?`, a: `We offer same-day and next-day appointments for ${city} residents. Call us to check current availability.` },
      { q: `Are your services available year-round in ${city}?`, a: `Yes. Many pests remain active year-round in this area. We recommend quarterly service plans for continuous protection.` },
    ];

    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <section className="py-16 md:py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--color-bg-hero, #0a1628) 0%, var(--color-bg-hero-end, var(--color-primary)) 100%)' }}>
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <span className="inline-block text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-white/30 text-white/90 bg-white/10">{city} Service Area</span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{heroTitle}</h1>
            <p className="text-white/70 text-lg mb-10">{bizName ? `${bizName} serves` : 'Professional pest control for'} {city} and surrounding communities.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/quote" className="font-semibold px-8 py-3.5 rounded-lg text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-accent)' }}>Schedule Inspection</Link>
              {phone && <a href={`tel:${phone.replace(/\D/g, '')}`} className="font-semibold px-8 py-3.5 rounded-lg text-white transition hover:bg-white/20" style={{ border: '2px solid rgba(255,255,255,0.4)' }}>Call Now: {formatPhone(phone)}</a>}
            </div>
          </div>
        </section>

        <nav className="py-3 shadow-sm" style={{ backgroundColor: 'var(--color-primary)' }}>
          <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 text-sm text-white/80">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <ChevronRight className="w-4 h-4 opacity-50" />
            <Link href="/service-area" className="hover:text-white transition">Service Areas</Link>
            <ChevronRight className="w-4 h-4 opacity-50" />
            <span className="text-white font-medium">{city}</span>
          </div>
        </nav>

        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-xl overflow-hidden" style={{ minHeight: '280px', background: 'linear-gradient(135deg, var(--color-bg-hero, #0a1628) 0%, var(--color-primary) 100%)' }}>
              <div className="h-full min-h-[280px] flex items-center justify-center">
                <span className="text-white/60 text-xl font-semibold">{city} Pest Control</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-accent)' }}>Local Service</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>{bizName || 'Professional Pest Control'} in {city}</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">Our licensed technicians provide comprehensive pest control services throughout {city}. Whether you&apos;re dealing with ants, roaches, rodents, termites, or mosquitoes, we have the solution.</p>
              <p className="text-gray-600 mb-6 leading-relaxed">We combine local knowledge with professional-grade treatments to deliver lasting results for {city} homeowners and businesses.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/quote" className="font-semibold px-6 py-3 rounded-lg text-white text-center transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>Get Free Quote</Link>
                <Link href="/service-area" className="font-semibold px-6 py-3 rounded-lg text-center transition hover:bg-gray-50" style={{ border: '2px solid var(--color-primary)', color: 'var(--color-primary)' }}>View Service Area</Link>
              </div>
            </div>
          </div>
        </section>

        <WhyChooseUs businessName={bizName} />
        <Process />
        <CityFaqAccordion city={city} faqs={cityFaqs} />

        {others.length >= 2 && (
          <section className="py-12 bg-white">
            <div className="max-w-6xl mx-auto px-4 text-center">
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-heading, #1a1a1a)' }}>We Also Serve</h2>
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                {others.slice(0, 6).map(loc => (
                  <Link key={loc.slug} href={`/${loc.slug}`} className="px-4 py-2 rounded-full border bg-white text-sm font-medium transition hover:opacity-80" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                    {loc.city} Pest Control
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <CtaBanner phone={phone} businessName={bizName} />
      </div>
    );
  }

  const svc = SERVICE_DATA[params.service];
  const [content, heroMedia] = await Promise.all([
    getPageContent(tenant.id, params.service),
    getHeroMedia(tenant.id),
  ]);
  console.log('[ServicePage] render', {
    slug: params.slug,
    service: params.service,
    contentIsNull: content === null,
    contentSubtitle: (content as { subtitle?: string } | null)?.subtitle ?? null,
  });

  const heroImageUrl = resolveHeroImage(content, heroMedia);
  const heroTitle = (content as { title?: string } | null)?.title || svc.heroTitle;
  const heroSubtitle = (content as { subtitle?: string } | null)?.subtitle || svc.heroSubtitle;
  const introP1 = (content as { intro?: string } | null)?.intro || svc.introP1;
  const pestImg = PEST_IMAGES[params.service] || '/images/pests/pest_control.jpg';
  const phone = tenant.phone ?? '';
  const bizName = tenant.business_name ?? '';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>

      <section className="py-16 md:py-20 relative overflow-hidden"
        style={heroImageUrl
          ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: 'linear-gradient(135deg, var(--color-bg-hero, #0a1628) 0%, var(--color-bg-hero-end, var(--color-primary)) 100%)' }}>
        {heroImageUrl && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 0, pointerEvents: 'none' }} />}
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
                  Call {formatPhone(phone)}
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
