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
