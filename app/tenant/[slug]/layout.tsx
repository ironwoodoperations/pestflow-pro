export const revalidate = 300;

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../shared/lib/tenant/resolve';
import { getAllServicePages, getSocialLinks } from './_lib/queries';
import { TenantProvider } from './TenantProvider';
import { MetroNavbar } from './_components/MetroNavbar';
import { MetroFooter } from './_components/MetroFooter';
import { ModernProNavbar } from './_shells/modern-pro/ModernProNavbar';
import { ModernProFooter } from './_shells/modern-pro/ModernProFooter';
import { CleanFriendlyNavbar } from './_shells/clean-friendly/CleanFriendlyNavbar';
import { CleanFriendlyFooter } from './_shells/clean-friendly/CleanFriendlyFooter';
import { BoldLocalNavbar } from './_shells/bold-local/BoldLocalNavbar';
import { BoldLocalFooter } from './_shells/bold-local/BoldLocalFooter';
import { barlowFont, interFont, BL_TOKENS } from './_shells/bold-local/BoldLocalFonts';
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

  const [servicePages, social] = await Promise.all([
    getAllServicePages(tenant.id),
    getSocialLinks(tenant.id),
  ]);

  const cssVars = shellCssVarsString(
    computeShellCssVars(tenant.template, tenant.primary_color, tenant.accent_color)
  );

  const shell = tenant.template;

  if (shell === 'metro-pro') {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        <TenantProvider tenant={tenant}>
          <MetroNavbar servicePages={servicePages} />
          <main id="main-content">{children}</main>
          <MetroFooter tenant={tenant} social={social} />
        </TenantProvider>
      </>
    );
  }

  if (shell === 'modern-pro') {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        <TenantProvider tenant={tenant}>
          <ModernProNavbar servicePages={servicePages} />
          <main id="main-content">{children}</main>
          <ModernProFooter tenant={tenant} social={social} />
        </TenantProvider>
      </>
    );
  }

  if (shell === 'clean-friendly') {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        <TenantProvider tenant={tenant}>
          <CleanFriendlyNavbar servicePages={servicePages} />
          <main id="main-content">{children}</main>
          <CleanFriendlyFooter tenant={tenant} social={social} />
        </TenantProvider>
      </>
    );
  }

  if (shell === 'bold-local') {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: cssVars + `:root{${BL_TOKENS}}` }} />
        <TenantProvider tenant={tenant}>
          <div className={`${barlowFont.variable} ${interFont.variable}`} style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", backgroundColor: 'var(--bl-surface)', color: 'var(--bl-text)' }}>
            <BoldLocalNavbar servicePages={servicePages} />
            <main id="main-content">{children}</main>
            <BoldLocalFooter tenant={tenant} social={social} />
          </div>
        </TenantProvider>
      </>
    );
  }

  if (shell === 'rustic-rugged') {
    return (
      <>
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
      <h1>Shell not yet ported: {tenant.template}</h1>
    </main>
  );
}
