import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';
import { buildPageMetadata } from '../../../../shared/lib/buildPageMetadata';

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}
import { getPageContent, getLocation, getAllLocations, getHeroMedia, getSeoMeta, getServiceFaqs, getIntegrations, getAboutSettings } from '../_lib/queries';
import { resolveAboutStats } from '../_lib/aboutStats';
import { SERVICE_SLUGS, IRRIGATION_SERVICE_SLUGS } from '../_lib/serviceData';
import { resolveVertical } from '../../../../src/shells/_shared/serviceEntry';
import { getVerticalCopy, withCity } from '../../../../src/shells/_shared/verticalCopy';
import { resolveLocationHeroTitle, resolveLocationIntro } from '../_lib/locationCopy';
import { WhyChooseUs } from '../_components/sections/WhyChooseUs';
import { Process } from '../_components/sections/Process';
import { CtaBanner } from '../_components/sections/CtaBanner';
import { CityFaqAccordion } from '../_components/CityFaqAccordion';
import { formatPhone } from '../../../../shared/lib/formatPhone';
import { CleanFriendlyPestPage } from '../_shells/clean-friendly/CleanFriendlyPestPage';
import { BoldLocalPestPage } from '../_shells/bold-local/BoldLocalPestPage';
import { ModernProPestPage } from '../_shells/modern-pro/ModernProPestPage';
import { RusticRuggedPestPage } from '../_shells/rustic-rugged/RusticRuggedPestPage';
import { MetroProPestPage } from '../_shells/metro-pro/MetroProPestPage';
import { DangComicPestPage } from '../_shells/dang/DangComicPestPage';
import { VitaGlowServicesPage } from '../_shells/vita-glow/VitaGlowServicesPage';
import { DefaultPestPage } from '../_components/DefaultPestPage';

type Params = { params: { slug: string; service: string } };

function titleCase(s: string) { return s.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()); }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) return {};
  const businessName = tenant.business_name || tenant.name;
  // Both service slugs (pest-control) and location slugs (tyler-tx) key on
  // seo_meta.page_slug = params.service.
  const seoMeta = await getSeoMeta(tenant.id, params.service);
  return buildPageMetadata(tenant, {
    pathname: `/${params.service}`,
    seoMeta,
    fallback: {
      title: businessName,
      description: `${businessName} — ${getVerticalCopy(resolveVertical(tenant)).metadataFallbackDesc}`,
    },
  });
}

export default async function ServicePage({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  // vita-glow shell (S-VG-1). Medical-aesthetics category pages (IV Infusions,
  // Injectables & Aesthetics, Weight & Wellness) are content-driven by page slug
  // and route here BEFORE the pest-specific SERVICE_SLUGS / location logic below,
  // which does not apply to this vertical. Any slug without a page_content row
  // 404s, so arbitrary URLs don't render empty pages.
  if (tenant.template === 'vita-glow') {
    const [vgContent, integrations] = await Promise.all([
      getPageContent(tenant.id, params.service),
      getIntegrations(tenant.id),
    ]);
    if (!vgContent) notFound();
    return (
      <VitaGlowServicesPage
        tenant={tenant}
        pageSlug={params.service}
        content={vgContent}
        bookingUrl={integrations.square_booking_url ?? null}
      />
    );
  }

  // Vertical-resolved ACTIVE slug set (S-PLS-5 / D1), selected BEFORE the
  // location-page fallback. A union selection by vertical — SERVICE_SLUGS is
  // never mutated: pest tenants (industry lacks "irrigation") get the exact
  // historical set and route as before; irrigation tenants get the four
  // irrigation slugs so /sprinkler-systems etc. no longer fall through to the
  // location branch and 404.
  const vertical = resolveVertical(tenant);
  const activeServiceSlugs = vertical === 'irrigation' ? IRRIGATION_SERVICE_SLUGS : SERVICE_SLUGS;
  // One preset read for the whole request. Every string below that used to be a
  // pest literal now comes from here; DB values still win over all of it.
  const copy = getVerticalCopy(vertical);

  // Service area page branch
  if (!activeServiceSlugs.has(params.service)) {
    const [serviceAreaData, allLocs] = await Promise.all([
      getLocation(tenant.id, params.service),
      getAllLocations(tenant.id),
    ]);
    if (!serviceAreaData) notFound();

    const loc = serviceAreaData as { city?: string; hero_title?: string; intro?: string; address?: string; hours?: string };
    const city      = loc.city       || titleCase(params.service);
    const heroTitle = resolveLocationHeroTitle(loc, city, copy);
    // DB intro wins outright; otherwise the preset's city-tokenized paragraphs.
    const intro = resolveLocationIntro(loc, city, copy);
    const phone     = tenant.phone ?? '';
    const bizName   = tenant.business_name ?? '';
    // S267: dark-surface styling is gated to bold-local; every other theme
    // (incl. Dang / modern-pro) keeps its exact prior light markup.
    const isBoldLocal = tenant.template === 'bold-local';
    type LocItem = { slug: string; city: string };
    const others = (allLocs as LocItem[]).filter((l) => l.slug !== params.service);

    // {city} is substituted at render; the preset stores the token so the copy
    // stays a plain data string.
    const cityFaqs = copy.cityFaqs.map((f) => ({ q: withCity(f.q, city), a: withCity(f.a, city) }));

    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <section className="py-16 md:py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--color-bg-hero, #0a1628) 0%, var(--color-bg-hero-end, var(--color-primary)) 100%)' }}>
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <span className="inline-block text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-white/30 text-white/90 bg-white/10">{city} Service Area</span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{heroTitle}</h1>
            <p className="text-white/70 text-lg mb-10">{bizName ? `${bizName} serves` : copy.locationSubtitleGeneric} {city} and surrounding communities.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/quote" className="font-semibold px-8 py-3.5 rounded-lg text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-accent)' }}>{copy.locationPrimaryCta}</Link>
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

        <section className="py-16" style={{ backgroundColor: isBoldLocal ? 'var(--color-bg-section)' : '#ffffff' }}>
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-xl overflow-hidden" style={{ minHeight: '280px', background: 'linear-gradient(135deg, var(--color-bg-hero, #0a1628) 0%, var(--color-primary) 100%)' }}>
              <div className="h-full min-h-[280px] flex items-center justify-center">
                <span className="text-white/60 text-xl font-semibold">{city} {copy.locationHeroSuffix}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-accent)' }}>Local Service</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>{bizName || copy.locationH2Generic} in {city}</h2>
              {intro.paragraphs.map((para, i) => {
                // Preserves the original spacing exactly: a DB intro was mb-4,
                // and only the LAST preset paragraph was mb-6.
                const spacing = !intro.fromDb && i === intro.paragraphs.length - 1 ? 'mb-6' : 'mb-4';
                return (
                  <p
                    key={para.slice(0, 32)}
                    className={isBoldLocal ? `${spacing} leading-relaxed` : `text-gray-600 ${spacing} leading-relaxed`}
                    style={isBoldLocal ? { color: 'var(--color-body-text)' } : undefined}
                  >{para}</p>
                );
              })}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/quote" className="font-semibold px-6 py-3 rounded-lg text-white text-center transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>Get Free Quote</Link>
                <Link href="/service-area" className={`font-semibold px-6 py-3 rounded-lg text-center transition ${isBoldLocal ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`} style={{ border: '2px solid var(--color-primary)', color: 'var(--color-primary)' }}>View Service Area</Link>
              </div>
            </div>
          </div>
        </section>

        <WhyChooseUs businessName={bizName} isBoldLocal={isBoldLocal} features={copy.whyChooseFeatures} />
        <Process heading={copy.processHeading} steps={copy.processSteps} />
        <CityFaqAccordion city={city} faqs={cityFaqs} isBoldLocal={isBoldLocal} />

        {others.length >= 2 && (
          <section className="py-12" style={{ backgroundColor: isBoldLocal ? 'var(--color-bg-section)' : '#ffffff' }}>
            <div className="max-w-6xl mx-auto px-4 text-center">
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-heading, #1a1a1a)' }}>We Also Serve</h2>
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                {others.slice(0, 6).map(loc => (
                  <Link key={loc.slug} href={`/${loc.slug}`} className="px-4 py-2 rounded-full border text-sm font-medium transition hover:opacity-80" style={{ backgroundColor: isBoldLocal ? 'var(--color-primary-light)' : '#ffffff', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                    {loc.city} {copy.locationHeroSuffix}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <CtaBanner phone={phone} businessName={bizName} genericIntro={copy.ctaGenericIntro} strapline={copy.ctaStrapline} primaryLabel={copy.ctaPrimaryLabel} />
      </div>
    );
  }

  const [content, heroMedia] = await Promise.all([
    getPageContent(tenant.id, params.service),
    getHeroMedia(tenant.id),
  ]);

  // Theme-specific pest page branches
  if (tenant.template === 'clean-friendly') {
    return <CleanFriendlyPestPage tenant={tenant} pestSlug={params.service} content={content} />;
  }
  if (tenant.template === 'bold-local') {
    // PR F: this shell's stat banner used to be hardcoded ('100% Guarantee',
    // '15+ Years on the job'). The guarantee was a claim and is deleted; the
    // years figure now comes from settings.about through the same resolver the
    // about page uses. This is the one shell whose stats are NOT on the
    // about-page caller path, so the read happens here — scoped to this branch
    // so no other template pays for a query it does not render.
    const boldLocalStats = resolveAboutStats(
      (await getAboutSettings(tenant.id)).stats,
      tenant.founded_year ? String(tenant.founded_year) : undefined,
      new Date().getFullYear(),
    );
    return <BoldLocalPestPage tenant={tenant} pestSlug={params.service} content={content} stats={boldLocalStats} />;
  }
  if (tenant.template === 'modern-pro') {
    return <ModernProPestPage tenant={tenant} pestSlug={params.service} content={content} />;
  }
  if (tenant.template === 'rustic-rugged') {
    return <RusticRuggedPestPage tenant={tenant} pestSlug={params.service} content={content} />;
  }
  if (tenant.template === 'metro-pro') {
    return <MetroProPestPage tenant={tenant} pestSlug={params.service} content={content} />;
  }
  // Dang comic shell (PR 3 scaffold). Placeholder pest page — real comic
  // service page + FAQ/service schema is PR 4. Unreachable until a tenant's
  // branding.theme is flipped to 'dang-comic'.
  // Dang comic shell (PR 4). Fetch DB faqs here (keeps the component pure) and
  // pass down; the component renders the SAME array it emits as FAQPage schema
  // (debt-c: schema matches visible content). Slugs mapping to no category
  // resolve to [] → no FAQ block, no schema. Unreachable until cutover.
  if (tenant.template === 'dang-comic') {
    const faqs = await getServiceFaqs(tenant.id, params.service);
    return <DangComicPestPage tenant={tenant} pestSlug={params.service} content={content} faqs={faqs} />;
  }

  return <DefaultPestPage tenant={tenant} pestSlug={params.service} content={content} heroMedia={heroMedia} />;
}
