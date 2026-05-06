export const revalidate = 300;

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../shared/lib/tenant/resolve';
import { getAllServicePages, getSocialLinks, getSeoSettings, getBusinessInfo } from './_lib/queries';
import { JsonLdScript } from './_components/JsonLdScripts';
import { generateLocalBusinessSchema, type BusinessInfo, type SeoSettings, type SocialLinks } from '../../../shared/lib/seoSchema';
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
import { computeShellCssVars, shellCssVarsString } from '../../../shared/lib/shellCssVars';

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) return {};
  return {
    title: tenant.meta_title || tenant.business_name || tenant.name,
    description: tenant.meta_description || undefined,
    icons: tenant.favicon_url
      ? { icon: [{ url: tenant.favicon_url }] }
      : undefined,
  };
}

export default async function TenantLayout({
  params,
  children,
}: Params & { children: React.ReactNode }) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const [servicePages, social, seoRaw, businessInfoRaw] = await Promise.all([
    getAllServicePages(tenant.id),
    getSocialLinks(tenant.id),
    getSeoSettings(tenant.id),
    getBusinessInfo(tenant.id),
  ]);

  const siteUrl = `https://${tenant.subdomain ?? tenant.slug}.pestflowpro.com`;
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
  const localBusinessSchema = generateLocalBusinessSchema(
    businessInfo,
    seoForSchema,
    { aggregate_rating: { value: 0, count: 0 }, service_radius_miles: 0 },
    socialLinks,
    siteUrl,
  );

  const cssVars = shellCssVarsString(
    computeShellCssVars(tenant.template, tenant.primary_color, tenant.accent_color)
  );

  const theme = tenant.template;

  if (theme === 'metro-pro') {
    return (
      <>
        <JsonLdScript schema={localBusinessSchema} id="ld-local-business" />
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        <TenantProvider tenant={tenant}>
          <MetroNavbar servicePages={servicePages} />
          <main id="main-content">{children}</main>
          <MetroFooter tenant={tenant} social={social} />
        </TenantProvider>
      </>
    );
  }

  if (theme === 'modern-pro') {
    return (
      <>
        <JsonLdScript schema={localBusinessSchema} id="ld-local-business" />
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        <TenantProvider tenant={tenant}>
          <ModernProNavbar servicePages={servicePages} />
          <main id="main-content">{children}</main>
          <ModernProFooter tenant={tenant} social={social} />
        </TenantProvider>
      </>
    );
  }

  if (theme === 'clean-friendly') {
    return (
      <>
        <JsonLdScript schema={localBusinessSchema} id="ld-local-business" />
        <style dangerouslySetInnerHTML={{ __html: cssVars + `:root{${CF_TOKENS}}` }} />
        <TenantProvider tenant={tenant}>
          <div className={cfInterFont.variable} style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", backgroundColor: 'var(--cf-surface)', color: 'var(--cf-ink)' }}>
            <CleanFriendlyNavbar servicePages={servicePages} />
            <main id="main-content">{children}</main>
            <CleanFriendlyFooter tenant={tenant} social={social} />
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
        <TenantProvider tenant={tenant}>
          <div className={`${barlowFont.variable} ${blInterFont.variable}`} style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", backgroundColor: 'var(--bl-surface)', color: 'var(--bl-text)' }}>
            <BoldLocalNavbar servicePages={servicePages} />
            <main id="main-content">{children}</main>
            <BoldLocalFooter tenant={tenant} social={social} />
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
        <TenantProvider tenant={tenant}>
          <RusticRuggedNavbar servicePages={servicePages} />
          <main id="main-content">{children}</main>
          <RusticRuggedFooter tenant={tenant} social={social} />
        </TenantProvider>
      </>
    );
  }

  return (
    <main style={{ padding: '4rem 2rem' }}>
      <h1>Theme not yet ported: {tenant.template}</h1>
    </main>
  );
}
