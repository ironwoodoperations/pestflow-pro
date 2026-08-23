import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';
import { resolveSiteUrl } from '../../../../shared/lib/resolveSiteUrl';
import { JsonLdScript } from '../_components/JsonLdScripts';
import { generateAboutSchema, type BusinessInfo, type SeoSettings } from '../../../../shared/lib/seoSchema';

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}
import { getPageContent, getTeamMembers, getHeroMedia, getIntegrations, getAboutSettings } from '../_lib/queries';
import { resolveAboutStats } from '../_lib/aboutStats';
import { resolveVertical } from '../../../../shared/lib/verticals';
import { getVerticalCopy } from '../../../../src/shells/_shared/verticalCopy';
import { resolveHeroImage } from '../_lib/heroImage';
import { CleanFriendlyAboutPage } from '../_shells/clean-friendly/CleanFriendlyAboutPage';
import { BoldLocalAboutPage } from '../_shells/bold-local/BoldLocalAboutPage';
import { ModernProAboutPage } from '../_shells/modern-pro/ModernProAboutPage';
import { RusticRuggedAboutPage } from '../_shells/rustic-rugged/RusticRuggedAboutPage';
import { MetroProAboutPage } from '../_shells/metro-pro/MetroProAboutPage';
import { DangComicAboutPage } from '../_shells/dang/DangComicAboutPage';
import { VitaGlowAboutPage } from '../_shells/vita-glow/VitaGlowAboutPage';
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

  const [content, team, heroMedia, aboutSettings] = await Promise.all([
    getPageContent(tenant.id, 'about'),
    getTeamMembers(tenant.id),
    getHeroMedia(tenant.id),
      getAboutSettings(tenant.id),
  ]);

  const c = content as { title?: string; subtitle?: string; intro?: string; image_1_url?: string; image_urls?: string[] } | null;
  const heroTitle  = c?.title    || 'About Us';
  const heroSub    = c?.subtitle || 'Family-owned. Science-backed.';
  // PR C: per-vertical, or nothing. The pest team photo was rendering on the
  // irrigation site. Irrigation resolves to null — public/images/pls/ holds only
  // the five service tiles, so there is no irrigation team photo to point at and
  // borrowing the pest one is not an option.
  const aboutImage = c?.image_1_url || c?.image_urls?.[0] || getVerticalCopy(resolveVertical(tenant)).aboutImageFallback || '';
  const heroImageUrl = resolveHeroImage(content, heroMedia);
  const introTrimmed = c?.intro?.trim();
  const introParagraphs = introTrimmed
    ? introTrimmed.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    : FALLBACK_INTRO_PARAGRAPHS;
  const siteUrl = resolveSiteUrl(tenant);
  const aboutBizInfo: BusinessInfo = { name: tenant.business_name ?? '', phone: tenant.phone ?? '', email: tenant.email ?? '', address: tenant.address ?? '' };
  const aboutSeoInfo: SeoSettings = { meta_description: tenant.meta_description ?? '', service_areas: [], certifications: [], founded_year: '', owner_name: tenant.owner_name ?? '' };
  const aboutSchema = generateAboutSchema(aboutBizInfo, aboutSeoInfo, siteUrl);
  const businessName = tenant.business_name || tenant.name;
  const foundedYear = tenant.founded_year ? String(tenant.founded_year) : undefined;
  // WS7: modern-pro's stat tiles come from settings.about. Resolved here (the
  // server component that already holds founded_year) so the shell stays a
  // pure renderer. No stats configured -> empty array -> no block rendered.
  const aboutStats = resolveAboutStats(aboutSettings.stats, foundedYear, new Date().getFullYear());
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

  if (tenant.template === 'modern-pro') {
    return (
      <>
        <JsonLdScript schema={aboutSchema} id="ld-about" />
        <ModernProAboutPage
          heroTitle={heroTitle}
          heroSub={heroSub}
          heroImageUrl={heroImageUrl}
          aboutImage={aboutImage}
          team={teamTyped}
          stats={aboutStats}
          businessName={businessName}
          introParagraphs={introParagraphs}
          phone={tenant.phone ?? ''}
        />
      </>
    );
  }

  if (tenant.template === 'rustic-rugged') {
    return (
      <>
        <JsonLdScript schema={aboutSchema} id="ld-about" />
        <RusticRuggedAboutPage
          heroTitle={heroTitle}
          heroSub={heroSub}
          heroImageUrl={heroImageUrl}
          aboutImage={aboutImage}
          team={teamTyped}
          foundedYear={foundedYear}
          businessName={businessName}
          introParagraphs={introParagraphs}
          phone={tenant.phone ?? ''}
        />
      </>
    );
  }

  if (tenant.template === 'metro-pro') {
    return (
      <>
        <JsonLdScript schema={aboutSchema} id="ld-about" />
        <MetroProAboutPage
          heroTitle={heroTitle}
          heroSub={heroSub}
          heroImageUrl={heroImageUrl}
          aboutImage={aboutImage}
          team={teamTyped}
          foundedYear={foundedYear}
          businessName={businessName}
          introParagraphs={introParagraphs}
          phone={tenant.phone ?? ''}
          licenseNumber={tenant.license_number || undefined}
        />
      </>
    );
  }

  // Dang comic shell (PR 3 scaffold). Placeholder about page — no JSON-LD
  // Dang comic shell (PR 4). Emits aboutSchema (restored — every about branch
  // emits it) + the real comic about page. Unreachable until a tenant's
  // branding.theme is flipped to 'dang-comic'.
  if (tenant.template === 'dang-comic') {
    return (
      <>
        <JsonLdScript schema={aboutSchema} id="ld-about" />
        <DangComicAboutPage
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

  // vita-glow shell (S-VG-1). Editorial about page. Prose comes from
  // page_content / team_members (passed in); nothing hardcoded. Emits aboutSchema
  // like every about branch. Booking CTA config-driven via settings.integrations.
  if (tenant.template === 'vita-glow') {
    const integrations = await getIntegrations(tenant.id);
    return (
      <>
        <JsonLdScript schema={aboutSchema} id="ld-about" />
        <VitaGlowAboutPage
          heroTitle={heroTitle}
          heroSub={heroSub}
          introParagraphs={introParagraphs}
          team={teamTyped}
          aboutImage={aboutImage}
          businessName={businessName}
          bookingUrl={integrations.square_booking_url ?? null}
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
