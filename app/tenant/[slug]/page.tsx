import { resolveTenantBySlug } from '../../../shared/lib/tenant/resolve';

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}
import { getPageContent, getTestimonials, getAllBlogPosts, getHeroMedia, getAllLocations } from './_lib/queries';
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
import { ModernProTestimonials } from './_shells/modern-pro/ModernProTestimonials';
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

const MODERN_PRO_SERVICES = [
  { name: 'Pest Control', slug: 'pest-control' }, { name: 'Termite Control', slug: 'termite-control' },
  { name: 'Termite Inspections', slug: 'termite-inspections' }, { name: 'Mosquito Control', slug: 'mosquito-control' },
  { name: 'Roach Control', slug: 'roach-control' }, { name: 'Ant Control', slug: 'ant-control' },
  { name: 'Spider Control', slug: 'spider-control' }, { name: 'Scorpion Control', slug: 'scorpion-control' },
  { name: 'Rodent Control', slug: 'rodent-control' }, { name: 'Flea & Tick Control', slug: 'flea-tick-control' },
  { name: 'Bed Bug Control', slug: 'bed-bug-control' }, { name: 'Wasp & Hornet Control', slug: 'wasp-hornet-control' },
];

type Params = { params: { slug: string } };

export default async function TenantHome({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) return null;

  const [content, testimonials, blogPosts, heroMedia] = await Promise.all([
    getPageContent(tenant.id, 'home'),
    getTestimonials(tenant.id),
    getAllBlogPosts(tenant.id),
    getHeroMedia(tenant.id),
  ]);

  const heroImageUrl = resolveHeroImage(content, heroMedia);

  if (tenant.template === 'modern-pro') {
    const aboutContent = await getPageContent(tenant.id, 'about');
    const aboutIntro = (aboutContent as { intro?: string } | null)?.intro || '';
    const aboutImage = (aboutContent as { image_url?: string } | null)?.image_url || '';

    return (
      <>
        <ModernProHero tenant={tenant} content={content} heroImageUrl={heroImageUrl} />
        <ModernProTrustBar />
        <ModernProServicesGrid services={MODERN_PRO_SERVICES} />
        <ModernProAboutStrip
          businessName={tenant.business_name || tenant.name}
          intro={aboutIntro}
          foundedYear={tenant.founded_year ? String(tenant.founded_year) : undefined}
          techCount={tenant.num_technicians ? String(tenant.num_technicians) : undefined}
          licenseNumber={tenant.license_number || undefined}
          imageUrl={aboutImage || undefined}
        />
        <ModernProWhyChooseUs businessName={tenant.business_name || tenant.name} />
        <ModernProTestimonials />
        <ModernProCtaBanner phone={tenant.phone || ''} ctaText={tenant.cta_text || 'Get a Free Quote'} />
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
        <BoldLocalHero tenant={tenant} content={content} heroMedia={heroMedia as Record<string, unknown> | null} heroImageUrl={heroImageUrl} />
        <BoldLocalTrustBar tenant={tenant} serviceAreaCount={serviceAreas.length} />
        <BoldLocalServicesGrid />
        <BoldLocalWhyUs businessName={tenant.business_name || tenant.name} intro={aboutIntro} />
        <BoldLocalHowItWorks />
        <BoldLocalAboutStrip businessName={tenant.business_name || tenant.name} intro={aboutIntro} photoUrl={photoUrl} />
        <BoldLocalTrustCards serviceAreas={serviceAreas} />
        <BoldLocalTestimonials testimonials={testimonials as BLTestimonial[]} />
        <BoldLocalCtaBanner phone={tenant.phone || undefined} ctaText={tenant.cta_text || 'Get a free quote'} />
      </>
    );
  }

  if (tenant.template === 'clean-friendly') {
    const locations = await getAllLocations(tenant.id);
    const serviceAreas = (locations as { city: string }[]).map((l) => l.city);
    type CFTestimonial = { id: string; author_name: string; review_text: string; rating: number; author_image_url?: string | null; featured?: boolean };

    return (
      <>
        <CleanFriendlyHero tenant={tenant} content={content} heroMedia={heroMedia as Record<string, unknown> | null} heroImageUrl={heroImageUrl} />
        <CleanFriendlyHowItWorks />
        <CleanFriendlyServicesGrid />
        <CleanFriendlyCoverageChips serviceAreas={serviceAreas} />
        <CleanFriendlyTestimonials testimonials={testimonials as CFTestimonial[]} />
        <CleanFriendlyFaqStrip />
        <CleanFriendlyCtaBanner phone={tenant.phone || undefined} ctaText={tenant.cta_text || 'Get a free quote'} />
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
        <RusticRuggedHero tenant={tenant} content={content} heroImageUrl={heroImageUrl} />
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

  return (
    <>
      <MetroHero tenant={tenant} content={content} heroImageUrl={heroImageUrl} />
      <ServicesGrid />
      <WhyChooseUs businessName={tenant.business_name || tenant.name} />
      <Process />
      <FaqTabs />
      <Reviews testimonials={testimonials as { id: string; name: string; review_text: string; rating?: number }[]} />
      <CtaBanner phone={tenant.phone} businessName={tenant.business_name || tenant.name} />
      <BlogCarousel posts={blogPosts as { id: string; title: string; slug: string; published_at?: string; excerpt?: string }[]} />
    </>
  );
}
