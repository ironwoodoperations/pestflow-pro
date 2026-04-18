import { resolveTenantBySlug } from '../../../shared/lib/tenant/resolve';
import { getPageContent, getTestimonials, getAllBlogPosts, getHeroMedia } from './_lib/queries';
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
