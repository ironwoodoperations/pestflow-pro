import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';
import { JsonLdScript } from '../_components/JsonLdScripts';
import { generateAboutSchema, type BusinessInfo, type SeoSettings } from '../../../../shared/lib/seoSchema';

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}
import { getPageContent, getTeamMembers, getHeroMedia } from '../_lib/queries';
import { resolveHeroImage } from '../_lib/heroImage';
import { CleanFriendlyAboutPage } from '../_shells/clean-friendly/CleanFriendlyAboutPage';
import { BoldLocalAboutPage } from '../_shells/bold-local/BoldLocalAboutPage';
import { DefaultAboutPage } from '../_components/DefaultAboutPage';

const FALLBACK_INTRO_PARAGRAPHS = [
  'Our company was founded by a local professional who saw an opportunity to do things differently — with better products, honest pricing, and genuine commitment to every customer.',
  "What started as a small operation has grown into one of the area's most trusted pest control companies, employing licensed technicians who serve homes and businesses across the region.",
  'We are fully licensed, bonded, and insured. Every technician is EPA-certified and trained in the latest integrated pest management techniques.',
];

type Params = { params: { slug: string } };

type TeamMember = { id: string; name: string; title?: string; bio?: string; photo_url?: string };

export default async function AboutPage({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const [content, team, heroMedia] = await Promise.all([
    getPageContent(tenant.id, 'about'),
    getTeamMembers(tenant.id),
    getHeroMedia(tenant.id),
  ]);

  const c = content as { title?: string; subtitle?: string; intro?: string; image_1_url?: string; image_urls?: string[] } | null;
  const heroTitle  = c?.title    || 'About Us';
  const heroSub    = c?.subtitle || 'Family-owned. Science-backed.';
  const aboutImage = c?.image_1_url || c?.image_urls?.[0] || '/images/pests/team.jpg';
  const heroImageUrl = resolveHeroImage(content, heroMedia);
  const introTrimmed = c?.intro?.trim();
  const introParagraphs = introTrimmed
    ? introTrimmed.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    : FALLBACK_INTRO_PARAGRAPHS;
  const siteUrl = `https://${tenant.subdomain ?? tenant.slug}.pestflowpro.com`;
  const aboutBizInfo: BusinessInfo = { name: tenant.business_name ?? '', phone: tenant.phone ?? '', email: tenant.email ?? '', address: tenant.address ?? '' };
  const aboutSeoInfo: SeoSettings = { meta_description: tenant.meta_description ?? '', service_areas: [], certifications: [], founded_year: '', owner_name: tenant.owner_name ?? '' };
  const aboutSchema = generateAboutSchema(aboutBizInfo, aboutSeoInfo, siteUrl);
  const businessName = tenant.business_name || tenant.name;
  const foundedYear = tenant.founded_year ? String(tenant.founded_year) : undefined;
  const teamTyped = team as TeamMember[];

  if (tenant.template === 'clean-friendly') {
    return (
      <>
        <JsonLdScript schema={aboutSchema} id="ld-about" />
        <CleanFriendlyAboutPage
          heroTitle={heroTitle}
          heroSub={heroSub}
          heroImageUrl={heroImageUrl}
          aboutImage={aboutImage}
          team={teamTyped}
          foundedYear={foundedYear}
          businessName={businessName}
          introParagraphs={introParagraphs}
        />
      </>
    );
  }

  if (tenant.template === 'bold-local') {
    return (
      <>
        <JsonLdScript schema={aboutSchema} id="ld-about" />
        <BoldLocalAboutPage
          heroTitle={heroTitle}
          heroSub={heroSub}
          heroImageUrl={heroImageUrl}
          aboutImage={aboutImage}
          team={teamTyped}
          foundedYear={foundedYear}
          businessName={businessName}
          licenseNumber={tenant.license_number || undefined}
          introParagraphs={introParagraphs}
        />
      </>
    );
  }

  return (
    <DefaultAboutPage
      heroTitle={heroTitle}
      heroSub={heroSub}
      heroImageUrl={heroImageUrl}
      aboutImage={aboutImage}
      team={teamTyped}
      introParagraphs={introParagraphs}
      aboutSchema={aboutSchema}
    />
  );
}
