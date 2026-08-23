import type { Metadata } from 'next';
import { resolveVertical, type Vertical } from '../../../src/shells/_shared/serviceEntry';
import { getVerticalCopy } from '../../../src/shells/_shared/verticalCopy';
import { resolveTenantBySlug } from '../../../shared/lib/tenant/resolve';
import { resolveSiteUrl } from '../../../shared/lib/resolveSiteUrl';
import { buildPageMetadata } from '../../../shared/lib/buildPageMetadata';
import { JsonLdScript } from './_components/JsonLdScripts';
import { generateWebsiteSchema } from '../../../shared/lib/seoSchema';

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}
import { getPageContent, getTestimonials, getAllBlogPosts, getHeroMedia, getAllLocations, getSeoMeta, getIntegrations, getAllServicePages } from './_lib/queries';
import { resolveHeroImage } from './_lib/heroImage';
import { MetroHero } from './_components/MetroHero';
import { ServicesGrid } from './_components/sections/ServicesGrid';
import { WhyChooseUs } from './_components/sections/WhyChooseUs';
import { Process } from './_components/sections/Process';
import { FaqTabs } from './_components/sections/FaqTabs';
import { Reviews } from './_components/sections/Reviews';
import { CtaBanner } from './_components/sections/CtaBanner';
import { BlogCarousel } from './_components/sections/BlogCarousel';
import { ModernProHero } from './_shells/modern-pro/ModernProHero';
import { ModernProTrustBar } from './_shells/modern-pro/ModernProTrustBar';
import { ModernProServicesGrid } from './_shells/modern-pro/ModernProServicesGrid';
import { ModernProAboutStrip } from './_shells/modern-pro/ModernProAboutStrip';
import { ModernProWhyChooseUs } from './_shells/modern-pro/ModernProWhyChooseUs';
import { ModernProTestimonials, type Testimonial } from './_shells/modern-pro/ModernProTestimonials';
import { ModernProCtaBanner } from './_shells/modern-pro/ModernProCtaBanner';
import { CleanFriendlyHero } from './_shells/clean-friendly/CleanFriendlyHero';
import { CleanFriendlyHowItWorks } from './_shells/clean-friendly/CleanFriendlyHowItWorks';
import { CleanFriendlyServicesGrid } from './_shells/clean-friendly/CleanFriendlyServicesGrid';
import { CleanFriendlyCoverageChips } from './_shells/clean-friendly/CleanFriendlyCoverageChips';
import { CleanFriendlyTestimonials } from './_shells/clean-friendly/CleanFriendlyTestimonials';
import { CleanFriendlyFaqStrip } from './_shells/clean-friendly/CleanFriendlyFaqStrip';
import { CleanFriendlyCtaBanner } from './_shells/clean-friendly/CleanFriendlyCtaBanner';
import { BoldLocalHero } from './_shells/bold-local/BoldLocalHero';
import { BoldLocalTrustBar } from './_shells/bold-local/BoldLocalTrustBar';
import { BoldLocalWhyUs } from './_shells/bold-local/BoldLocalWhyUs';
import { BoldLocalServicesGrid } from './_shells/bold-local/BoldLocalServicesGrid';
import { BoldLocalHowItWorks } from './_shells/bold-local/BoldLocalHowItWorks';
import { BoldLocalAboutStrip } from './_shells/bold-local/BoldLocalAboutStrip';
import { BoldLocalTrustCards } from './_shells/bold-local/BoldLocalTrustCards';
import { BoldLocalTestimonials } from './_shells/bold-local/BoldLocalTestimonials';
import { BoldLocalCtaBanner } from './_shells/bold-local/BoldLocalCtaBanner';
import { RusticRuggedHero } from './_shells/rustic-rugged/RusticRuggedHero';
import { RusticRuggedServiceStrips } from './_shells/rustic-rugged/RusticRuggedServiceStrips';
import { RusticRuggedAboutTimeline } from './_shells/rustic-rugged/RusticRuggedAboutTimeline';
import { RusticRuggedServicesGrid } from './_shells/rustic-rugged/RusticRuggedServicesGrid';
import { RusticRuggedStatsBanner } from './_shells/rustic-rugged/RusticRuggedStatsBanner';
import { RusticRuggedResComFac } from './_shells/rustic-rugged/RusticRuggedResComFac';
import { RusticRuggedTestimonials } from './_shells/rustic-rugged/RusticRuggedTestimonials';
import { RusticRuggedCtaBanner } from './_shells/rustic-rugged/RusticRuggedCtaBanner';
import { DangComicHome } from './_shells/dang/DangComicHome';
import { VitaGlowHome } from './_shells/vita-glow/VitaGlowHome';

// 5b+: modern-pro homepage config. Service TILES always derive from the
// tenant's own page_content service rows (getAllServicePages — the same
// signal the navbar uses). Section/CTA copy resolves per-VERTICAL
// (business_info.vertical via resolveVertical, strictly validated) so future
// irrigation tenants inherit the preset instead of being hand-configured;
// a per-tenant entry carries only what is genuinely tenant-specific: the
// tile order + static images, and optional copy overrides. Resolution:
// per-tenant override → vertical preset → 'pest' (resolveVertical's default).
interface ModernProHomeCopy {
  gridEyebrow: string;
  gridHeading: string;
  gridSubheading?: string;
  // sublabelFromLicense renders the tenant's real license_number column.
  trustItems: { label: string; sublabel?: string; sublabelFromLicense?: boolean }[];
  whyItems: { title: string; body: string }[];
  ctaHeading?: string;
  ctaSubheading?: string;
}

interface ModernProTenantHome {
  tiles?: { slug: string; image?: string }[];
  copy?: Partial<ModernProHomeCopy>;
}

// PR A opened `Vertical` from a closed 'pest' | 'irrigation' union to the
// registry, so this map is no longer total over it. `pest` stays REQUIRED —
// it is the guaranteed default and the reason every existing tenant's copy
// cannot move — while the registered-but-copyless verticals are optional
// until PR B moves this map into the verticalCopy preset registry. No live
// tenant resolves to one of them (only pls sets business_info.vertical).
const MODERN_PRO_VERTICAL: Partial<Record<Vertical, ModernProHomeCopy>> & { pest: ModernProHomeCopy } = {
  pest: {
    gridEyebrow: 'WHAT WE TREAT',
    gridHeading: 'Our Pest Control Services',
    gridSubheading: 'Professional treatments for every pest problem',
    trustItems: [],
    whyItems: [],
  },
  irrigation: {
    gridEyebrow: 'WHAT WE DO',
    gridHeading: 'Irrigation, Drainage, Pumps & Sod',
    gridSubheading: 'Licensed irrigation work across East Texas, documented on every job.',
    trustItems: [
      { label: 'TX Licensed Irrigator', sublabelFromLicense: true },
      { label: 'Licensed since 2017' },
      { label: 'Free 2-year warranty', sublabel: 'Most companies warranty six months' },
      { label: '4.9 on Google', sublabel: '49 reviews' },
    ],
    whyItems: [
      { title: 'Documented on every job', body: 'Static pressure, zone coverage, and as-built maps you keep. You see the test data before we backfill.' },
      { title: 'One trade, done right', body: "Irrigation, drainage, pumps, and sod. We control water, we don't mow — every job moves water where it belongs." },
      { title: 'Free 2-year warranty', body: 'In writing, on every system we install. Most companies in this market warranty six months.' },
    ],
    ctaHeading: "Standing water, dry zones, or a system that won't hold pressure?",
    ctaSubheading: 'We diagnose on site, quote in writing, and put the test data in your hands before the first shovel goes in the ground.',
  },
};

const MODERN_PRO_TENANT: Record<string, ModernProTenantHome> = {
  pls: {
    tiles: [
      { slug: 'sprinkler-systems', image: '/images/pls/sprinkler-systems.jpg' },
      { slug: 'drainage',          image: '/images/pls/drainage.jpg' },
      { slug: 'pump-systems',      image: '/images/pls/pump-systems.jpg' },
      { slug: 'retaining-walls',   image: '/images/pls/retaining-walls.jpg' },
      { slug: 'sod-dirt-work',     image: '/images/pls/sod-dirt-work.jpg' },
    ],
  },
};

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) return {};
  const businessName = tenant.business_name || tenant.name;
  const seoMeta = await getSeoMeta(tenant.id, 'home');
  return buildPageMetadata(tenant, {
    pathname: '/',
    seoMeta,
    fallback: {
      title: businessName,
      description: `${businessName} — ${getVerticalCopy(resolveVertical(tenant)).metadataFallbackDesc}`,
    },
  });
}

export default async function TenantHome({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) return null;

  // Resolved once for the whole component; the shared CtaBanner in the default
  // branch at the bottom of this file is outside the modern-pro `homeCopy` scope.
  const homeCtaCopy = getVerticalCopy(resolveVertical(tenant));

  const [content, testimonials, blogPosts, heroMedia] = await Promise.all([
    getPageContent(tenant.id, 'home'),
    getTestimonials(tenant.id),
    getAllBlogPosts(tenant.id),
    getHeroMedia(tenant.id),
  ]);

  const heroImageUrl = resolveHeroImage(content, heroMedia);
  const siteUrl = resolveSiteUrl(tenant);
  const websiteSchema = generateWebsiteSchema(tenant.business_name ?? tenant.name, siteUrl);

  if (tenant.template === 'modern-pro') {
    const [aboutContent, servicePages] = await Promise.all([
      getPageContent(tenant.id, 'about'),
      getAllServicePages(tenant.id),
    ]);
    const aboutIntro = (aboutContent as { intro?: string } | null)?.intro || '';
    const aboutImage = (aboutContent as { image_url?: string } | null)?.image_url || '';

    const tenantHome = MODERN_PRO_TENANT[tenant.slug];
    const homeCopy: ModernProHomeCopy = {
      ...(MODERN_PRO_VERTICAL[resolveVertical(tenant)] ?? MODERN_PRO_VERTICAL.pest),
      ...(tenantHome?.copy ?? {}),
    };
    const pages = servicePages as { page_slug: string; title: string | null; image_url?: string | null }[];
    const titleBySlug = new Map(pages.map((p) => [p.page_slug, p.title]));
    // Tile names always come from the tenant's own page_content titles; the
    // config (when present) only fixes order and supplies static images.
    const serviceTiles = tenantHome?.tiles
      ? tenantHome.tiles
          .filter((t) => titleBySlug.has(t.slug))
          .map((t) => ({ slug: t.slug, image: t.image, name: titleBySlug.get(t.slug) || t.slug }))
      : [...pages]
          .sort((a, b) => a.page_slug.localeCompare(b.page_slug))
          .map((p) => ({ name: p.title || p.page_slug, slug: p.page_slug, image: p.image_url || undefined }));
    const trustItems = homeCopy.trustItems.map(({ sublabelFromLicense, ...it }) =>
      sublabelFromLicense ? { ...it, sublabel: tenant.license_number || undefined } : it
    );

    return (
      <>
        <JsonLdScript schema={websiteSchema} id="ld-website" />
        <ModernProHero tenant={tenant} content={content} heroMedia={heroMedia as Record<string, unknown> | null} heroImageUrl={heroImageUrl} />
        <ModernProTrustBar items={trustItems} />
        <ModernProServicesGrid
          services={serviceTiles}
          eyebrow={homeCopy.gridEyebrow}
          heading={homeCopy.gridHeading}
          subheading={homeCopy.gridSubheading}
        />
        <ModernProAboutStrip
          businessName={tenant.business_name || tenant.name}
          intro={aboutIntro}
          foundedYear={tenant.founded_year ? String(tenant.founded_year) : undefined}
          techCount={tenant.num_technicians ? String(tenant.num_technicians) : undefined}
          licenseNumber={tenant.license_number || undefined}
          imageUrl={aboutImage || undefined}
        />
        <ModernProWhyChooseUs businessName={tenant.business_name || tenant.name} items={homeCopy.whyItems} />
        <ModernProTestimonials testimonials={testimonials as Testimonial[]} />
        {homeCopy.ctaHeading && homeCopy.ctaSubheading && (
          <ModernProCtaBanner
            heading={homeCopy.ctaHeading}
            subheading={homeCopy.ctaSubheading}
            phone={tenant.phone || ''}
            ctaText={tenant.cta_text || 'Get a Free Quote'}
          />
        )}
      </>
    );
  }

  if (tenant.template === 'bold-local') {
    const [aboutContent, locations] = await Promise.all([
      getPageContent(tenant.id, 'about'),
      getAllLocations(tenant.id),
    ]);
    const aboutIntro = (aboutContent as { intro?: string } | null)?.intro || '';
    const photoUrl = (heroMedia as { thumbnail_url?: string } | null)?.thumbnail_url || undefined;
    const serviceAreas = (locations as { city: string }[]).map((l) => l.city);
    type BLTestimonial = { id: string; author_name: string; review_text: string; rating: number; author_image_url?: string | null; featured?: boolean };

    return (
      <>
        <JsonLdScript schema={websiteSchema} id="ld-website" />
        <BoldLocalHero tenant={tenant} content={content} heroMedia={heroMedia as Record<string, unknown> | null} heroImageUrl={heroImageUrl} />
        <BoldLocalTrustBar tenant={tenant} serviceAreaCount={serviceAreas.length} />
        <BoldLocalServicesGrid />
        <BoldLocalWhyUs businessName={tenant.business_name || tenant.name} intro={aboutIntro} />
        <BoldLocalHowItWorks />
        <BoldLocalAboutStrip businessName={tenant.business_name || tenant.name} intro={aboutIntro} photoUrl={photoUrl} />
        <BoldLocalTrustCards serviceAreas={serviceAreas} />
        <BoldLocalTestimonials testimonials={testimonials as BLTestimonial[]} />
        <BoldLocalCtaBanner phone={tenant.phone || undefined} ctaText={tenant.cta_text || 'Get a free quote'} strapline={homeCtaCopy.ctaStrapline} />
      </>
    );
  }

  if (tenant.template === 'clean-friendly') {
    const locations = await getAllLocations(tenant.id);
    const serviceAreas = (locations as { city: string }[]).map((l) => l.city);
    type CFTestimonial = { id: string; author_name: string; review_text: string; rating: number; author_image_url?: string | null; featured?: boolean };

    return (
      <>
        <JsonLdScript schema={websiteSchema} id="ld-website" />
        <CleanFriendlyHero tenant={tenant} content={content} heroMedia={heroMedia as Record<string, unknown> | null} heroImageUrl={heroImageUrl} />
        <CleanFriendlyHowItWorks />
        <CleanFriendlyServicesGrid />
        <CleanFriendlyCoverageChips serviceAreas={serviceAreas} />
        <CleanFriendlyTestimonials testimonials={testimonials as CFTestimonial[]} />
        <CleanFriendlyFaqStrip />
        <CleanFriendlyCtaBanner phone={tenant.phone || undefined} ctaText={tenant.cta_text || 'Get a free quote'} strapline={homeCtaCopy.ctaStrapline} />
      </>
    );
  }

  if (tenant.template === 'rustic-rugged') {
    const aboutContent = await getPageContent(tenant.id, 'about');
    const aboutIntro = (aboutContent as { intro?: string } | null)?.intro || '';
    const featuredTestimonial = (testimonials as { id: string; author_name: string; review_text: string; rating: number }[])[0] ?? null;
    const address = (tenant as { address?: string }).address || '';
    const city = address ? address.split(',')[0].trim() : undefined;

    return (
      <>
        <JsonLdScript schema={websiteSchema} id="ld-website" />
        <RusticRuggedHero tenant={tenant} content={content} heroMedia={heroMedia as Record<string, unknown> | null} heroImageUrl={heroImageUrl} />
        <RusticRuggedServiceStrips />
        <RusticRuggedAboutTimeline intro={aboutIntro} />
        <RusticRuggedServicesGrid tenantSlug={tenant.slug} />
        <RusticRuggedStatsBanner foundedYear={tenant.founded_year ? String(tenant.founded_year) : undefined} city={city} />
        <RusticRuggedResComFac />
        <RusticRuggedTestimonials testimonial={featuredTestimonial} />
        <RusticRuggedCtaBanner phone={tenant.phone || undefined} tenantSlug={tenant.slug} ctaText={tenant.cta_text || 'Get a Free Quote'} />
      </>
    );
  }

  // Dang comic shell (PR 4). Emits websiteSchema (restored — every home branch
  // emits it) + the real comic home. Unreachable until a tenant's
  // branding.theme is flipped to 'dang-comic'.
  if (tenant.template === 'dang-comic') {
    const [aboutContent, locations] = await Promise.all([
      getPageContent(tenant.id, 'about'),
      getAllLocations(tenant.id),
    ]);
    const aboutIntro = (aboutContent as { intro?: string } | null)?.intro || '';
    const serviceAreas = (locations as { city: string }[]).map((l) => l.city);
    type DangTestimonial = { id: string; author_name: string; review_text: string; rating: number; author_image_url?: string | null };
    return (
      <>
        <JsonLdScript schema={websiteSchema} id="ld-website" />
        <DangComicHome
          tenant={tenant}
          content={content}
          heroImageUrl={heroImageUrl}
          aboutIntro={aboutIntro}
          serviceAreas={serviceAreas}
          testimonials={testimonials as DangTestimonial[]}
        />
      </>
    );
  }

  // vita-glow shell (S-VG-1). Content-driven medical-aesthetics home. Emits
  // websiteSchema like every home branch. Services derive their names/hrefs from
  // structural categories; blurbs/prices come from page_content when present
  // (never hardcoded). Booking CTA config-driven via settings.integrations.
  if (tenant.template === 'vita-glow') {
    const integrations = await getIntegrations(tenant.id);
    const bookingUrl = integrations.square_booking_url ?? null;
    const VG_CATEGORIES = [
      { name: 'IV Infusions', href: '/iv-infusions' },
      { name: 'Injectables & Aesthetics', href: '/injectables' },
      { name: 'Weight & Wellness', href: '/weight-wellness' },
    ];
    const rawServices = Array.isArray((content as { services?: unknown } | null)?.services)
      ? ((content as { services: { name?: string; href?: string; blurb?: string; price?: string }[] }).services)
      : [];
    const services = VG_CATEGORIES.map((cat, i) => ({
      name: rawServices[i]?.name || cat.name,
      href: rawServices[i]?.href || cat.href,
      blurb: rawServices[i]?.blurb,
      price: rawServices[i]?.price,
    }));
    return (
      <>
        <JsonLdScript schema={websiteSchema} id="ld-website" />
        <VitaGlowHome tenant={tenant} content={content} services={services} bookingUrl={bookingUrl} />
      </>
    );
  }

  return (
    <>
      <JsonLdScript schema={websiteSchema} id="ld-website" />
      <MetroHero tenant={tenant} content={content} heroMedia={heroMedia as Record<string, unknown> | null} heroImageUrl={heroImageUrl} />
      <ServicesGrid />
      <WhyChooseUs businessName={tenant.business_name || tenant.name} />
      <Process />
      <FaqTabs />
      <Reviews testimonials={testimonials as { id: string; name: string; review_text: string; rating?: number }[]} />
      <CtaBanner phone={tenant.phone} businessName={tenant.business_name || tenant.name} genericIntro={homeCtaCopy.ctaGenericIntro} strapline={homeCtaCopy.ctaStrapline} primaryLabel={homeCtaCopy.ctaPrimaryLabel} />
      <BlogCarousel posts={blogPosts as { id: string; title: string; slug: string; published_at?: string; excerpt?: string }[]} />
    </>
  );
}
