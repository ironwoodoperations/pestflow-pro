export const revalidate = 300;

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { resolveTenantBySlug } from '../../../shared/lib/tenant/resolve';
import { resolveSiteUrl } from '../../../shared/lib/resolveSiteUrl';
import { tenantSeoMetadata } from '../../../shared/lib/tenantSeoMetadata';
import { getAllServicePages, getSocialLinks, getSeoSettings, getBusinessInfo, getIntegrations, getAllBlogPosts } from './_lib/queries';
import { JsonLdScript } from './_components/JsonLdScripts';
import { generateLocalBusinessSchema, getSchemaVocabulary, type BusinessInfo, type SeoSettings, type SocialLinks } from '../../../shared/lib/seoSchema';
import { resolveVertical } from '../../../shared/lib/verticals';
import { getVerticalCopy } from '../../../src/shells/_shared/verticalCopy';
import { mapBusinessInfoJsonb } from '../../../shared/lib/seoSchema.jsonb';
import { TenantProvider } from './TenantProvider';
import { MetroNavbar } from './_components/MetroNavbar';
import { MetroFooter } from './_components/MetroFooter';
import { ModernProNavbar } from './_shells/modern-pro/ModernProNavbar';
import { ModernProFooter } from './_shells/modern-pro/ModernProFooter';
import { CleanFriendlyNavbar } from './_shells/clean-friendly/CleanFriendlyNavbar';
import { CleanFriendlyFooter } from './_shells/clean-friendly/CleanFriendlyFooter';
import { BoldLocalNavbar } from './_shells/bold-local/BoldLocalNavbar';
import { BoldLocalFooter } from './_shells/bold-local/BoldLocalFooter';
import { barlowFont, interFont as blInterFont, BL_TOKENS } from './_shells/bold-local/BoldLocalFonts';
import { interFont as cfInterFont, CF_TOKENS } from './_shells/clean-friendly/CleanFriendlyFonts';
import { RusticRuggedNavbar } from './_shells/rustic-rugged/RusticRuggedNavbar';
import { RusticRuggedFooter } from './_shells/rustic-rugged/RusticRuggedFooter';
import { DangComicNavbar } from './_shells/dang/DangComicNavbar';
import { DangComicFooter } from './_shells/dang/DangComicFooter';
import { DANG_TOKENS, bangersFont, openSansFont } from './_shells/dang/DangComicFonts';
import { VitaGlowNavbar } from './_shells/vita-glow/VitaGlowNavbar';
import { VitaGlowFooter } from './_shells/vita-glow/VitaGlowFooter';
import { VITA_GLOW_TOKENS, cormorantFont, jostFont } from './_shells/vita-glow/VitaGlowFonts';
import { computeShellCssVars, shellCssVarsString } from '../../../shared/lib/shellCssVars';

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) return {};
  const businessName = tenant.business_name || tenant.name;
  const title = tenant.meta_title || businessName;
  // generateMetadata resolves the tenant independently of TenantLayout (Next
  // calls them separately), so the vertical is resolved here too rather than
  // shared. For pest tenants getVerticalCopy returns the identical string this
  // line used to hardcode — em dash and spacing unchanged.
  const description =
    tenant.meta_description ||
    `${businessName} — ${getVerticalCopy(resolveVertical(tenant)).metadataFallbackDesc}`;
  return {
    title,
    description,
    // Pre-launch indexing gate (S-PLS-4). Emitted at the LAYOUT so it inherits
    // into every child route — pages never set `robots` (consult's static
    // noindex points the same way), so this one key covers the whole tenant.
    // tenant.noindex is true only when settings.seo.noindex === true
    // (validated in resolveSettings); absent, the key is not emitted and the
    // metadata object is unchanged for every existing tenant.
    ...(tenant.noindex === true ? { robots: { index: false, follow: false } } : {}),
    icons: tenant.favicon_url
      ? { icon: [{ url: tenant.favicon_url }] }
      : undefined,
    ...tenantSeoMetadata(tenant, { title, description }),
  };
}

export default async function TenantLayout({
  params,
  children,
}: Params & { children: React.ReactNode }) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const [servicePages, social, seoRaw, businessInfoRaw, integrations, blogPosts] = await Promise.all([
    getAllServicePages(tenant.id),
    getSocialLinks(tenant.id),
    getSeoSettings(tenant.id),
    getBusinessInfo(tenant.id),
    getIntegrations(tenant.id),
    getAllBlogPosts(tenant.id),
  ]);

  // PR C: a tenant with no published posts should not advertise a Blog link.
  // The query is React-cache()d, so the blog page's own call in the same request
  // is deduped rather than doubled.
  const showBlog = blogPosts.length > 0;

  const siteUrl = resolveSiteUrl(tenant);
  const businessInfo: BusinessInfo = {
    name: tenant.business_name ?? '',
    phone: tenant.phone ?? '',
    email: tenant.email ?? '',
    address: tenant.address ?? '',
    hours: tenant.hours ?? undefined,
    license_number: tenant.license_number ?? undefined,
    logo_url: tenant.logo_url ?? undefined,
    ...mapBusinessInfoJsonb(businessInfoRaw),
  };
  const seoForSchema: SeoSettings = {
    meta_description: tenant.meta_description ?? '',
    service_areas: seoRaw.service_areas ?? [],
    certifications: typeof tenant.certifications === 'string'
      ? tenant.certifications.split(',').map((s: string) => s.trim()).filter(Boolean)
      : (seoRaw.certifications ?? []),
    founded_year: tenant.founded_year ? String(tenant.founded_year) : (seoRaw.founded_year ?? ''),
    owner_name: tenant.owner_name ?? seoRaw.owner_name ?? '',
  };
  const socialLinks: SocialLinks = {
    facebook: social.facebook,
    instagram: social.instagram,
    google: social.google,
  };
  // JSON-LD vocabulary resolves per vertical. Pest tenants pass
  // PEST_CONTROL_VOCABULARY, which is byte-identical to the previous no-arg
  // default — locked by a test asserting the two schemas deep-equal.
  const localBusinessSchema = generateLocalBusinessSchema(
    businessInfo,
    seoForSchema,
    { aggregate_rating: { value: 0, count: 0 }, service_radius_miles: 0 },
    socialLinks,
    siteUrl,
    getSchemaVocabulary(resolveVertical(tenant)),
  );

  const cssVars = shellCssVarsString(
    computeShellCssVars(tenant.template, tenant.primary_color, tenant.accent_color)
  );

  const theme = tenant.template;

  // vita-glow booking URL (brief §6) — Square link from settings.integrations,
  // ships blank; navbar/footer fall back to the Book-a-Consult route when empty.
  const bookingUrl = integrations.square_booking_url ?? null;

  const ga4IdRaw = integrations.ga4_measurement_id;
  const ga4Id = ga4IdRaw && /^G-[A-Z0-9]+$/i.test(ga4IdRaw) ? ga4IdRaw : null;
  const ga4Scripts = ga4Id ? (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}');`,
        }}
      />
    </>
  ) : null;

  if (theme === 'metro-pro') {
    return (
      <>
        <JsonLdScript schema={localBusinessSchema} id="ld-local-business" />
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        {ga4Scripts}
        <TenantProvider tenant={tenant}>
          <MetroNavbar servicePages={servicePages} showBlog={showBlog} />
          <main id="main-content">{children}</main>
          <MetroFooter tenant={tenant} social={social} showBlog={showBlog} />
        </TenantProvider>
      </>
    );
  }

  if (theme === 'modern-pro') {
    return (
      <>
        <JsonLdScript schema={localBusinessSchema} id="ld-local-business" />
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        {ga4Scripts}
        <TenantProvider tenant={tenant}>
          <ModernProNavbar servicePages={servicePages} showBlog={showBlog} />
          <main id="main-content">{children}</main>
          <ModernProFooter tenant={tenant} social={social} showBlog={showBlog} />
        </TenantProvider>
      </>
    );
  }

  if (theme === 'clean-friendly') {
    return (
      <>
        <JsonLdScript schema={localBusinessSchema} id="ld-local-business" />
        <style dangerouslySetInnerHTML={{ __html: cssVars + `:root{${CF_TOKENS}}` }} />
        {ga4Scripts}
        <TenantProvider tenant={tenant}>
          <div className={cfInterFont.variable} style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", backgroundColor: 'var(--cf-surface)', color: 'var(--cf-ink)' }}>
            <CleanFriendlyNavbar servicePages={servicePages} showBlog={showBlog} />
            <main id="main-content">{children}</main>
            <CleanFriendlyFooter tenant={tenant} social={social} showBlog={showBlog} />
          </div>
        </TenantProvider>
      </>
    );
  }

  if (theme === 'bold-local') {
    return (
      <>
        <JsonLdScript schema={localBusinessSchema} id="ld-local-business" />
        <style dangerouslySetInnerHTML={{ __html: cssVars + `:root{${BL_TOKENS}}` }} />
        {ga4Scripts}
        <TenantProvider tenant={tenant}>
          <div className={`${barlowFont.variable} ${blInterFont.variable}`} style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", backgroundColor: 'var(--bl-surface)', color: 'var(--bl-text)' }}>
            <BoldLocalNavbar servicePages={servicePages} showBlog={showBlog} />
            <main id="main-content">{children}</main>
            <BoldLocalFooter tenant={tenant} social={social} showBlog={showBlog} />
          </div>
        </TenantProvider>
      </>
    );
  }

  if (theme === 'rustic-rugged') {
    return (
      <>
        <JsonLdScript schema={localBusinessSchema} id="ld-local-business" />
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        {ga4Scripts}
        <TenantProvider tenant={tenant}>
          <RusticRuggedNavbar servicePages={servicePages} showBlog={showBlog} />
          <main id="main-content">{children}</main>
          <RusticRuggedFooter tenant={tenant} social={social} showBlog={showBlog} />
        </TenantProvider>
      </>
    );
  }

  // Dang comic shell (PR 3 scaffold). Empty-but-selectable: emits the same
  // universal localBusiness org node + chrome as every other branch, wraps
  // placeholder navbar/footer, and stubs the `--dang-*` token block. Real
  // comic design + per-page schema land in PR 4. Unreachable until a later
  // cutover flips a tenant's branding.theme to 'dang-comic'.
  if (theme === 'dang-comic') {
    return (
      <>
        <JsonLdScript schema={localBusinessSchema} id="ld-local-business" />
        <style dangerouslySetInnerHTML={{ __html: cssVars + `:root{${DANG_TOKENS}}` }} />
        {ga4Scripts}
        <TenantProvider tenant={tenant}>
          <div
            className={`${bangersFont.variable} ${openSansFont.variable}`}
            style={{ backgroundColor: 'var(--dang-surface)', color: 'var(--dang-text)', fontFamily: 'var(--dang-font-body)' }}
          >
            <DangComicNavbar servicePages={servicePages} tenant={tenant} social={social} />
            <main id="main-content">{children}</main>
            <DangComicFooter tenant={tenant} social={social} />
          </div>
        </TenantProvider>
      </>
    );
  }

  // vita-glow shell (S-VG-1). One-off medical-aesthetics shell. Emits the same
  // universal localBusiness org node + chrome as every other branch, injects the
  // hardcoded --vg-* token block, and wraps the cream/gold navbar + ink footer.
  // Booking CTA is config-driven (Square URL from settings.integrations, blank
  // → /contact fallback). Unreachable until a tenant's branding.theme is
  // 'vita-glow' (provisioned via MCP, out of scope for this PR).
  if (theme === 'vita-glow') {
    return (
      <>
        <JsonLdScript schema={localBusinessSchema} id="ld-local-business" />
        <style dangerouslySetInnerHTML={{ __html: cssVars + `:root{${VITA_GLOW_TOKENS}}` }} />
        {ga4Scripts}
        <TenantProvider tenant={tenant}>
          <div
            className={`${cormorantFont.variable} ${jostFont.variable}`}
            style={{ backgroundColor: 'var(--vg-surface)', color: 'var(--vg-text)', fontFamily: 'var(--vg-font-body)' }}
          >
            <VitaGlowNavbar tenant={tenant} bookingUrl={bookingUrl} />
            <main id="main-content">{children}</main>
            <VitaGlowFooter tenant={tenant} social={social} bookingUrl={bookingUrl} />
          </div>
        </TenantProvider>
      </>
    );
  }

  // Default fallback: modern-pro shell. Renders for explicitly chosen
  // 'modern-pro' theme AND any unrecognized theme value (defense in depth
  // against partial-state cutovers like S194 dang theme migration where
  // theme value and dispatcher state may briefly disagree).
  return (
    <>
      <JsonLdScript schema={localBusinessSchema} id="ld-local-business" />
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      {ga4Scripts}
      <TenantProvider tenant={tenant}>
        <ModernProNavbar servicePages={servicePages} showBlog={showBlog} />
        <main id="main-content">{children}</main>
        <ModernProFooter tenant={tenant} social={social} showBlog={showBlog} />
      </TenantProvider>
    </>
  );
}
