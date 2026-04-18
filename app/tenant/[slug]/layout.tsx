import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../shared/lib/tenant/resolve';
import { getAllServicePages, getSocialLinks } from './_lib/queries';
import { TenantProvider } from './TenantProvider';
import { MetroNavbar } from './_components/MetroNavbar';
import { MetroFooter } from './_components/MetroFooter';
import { ModernProNavbar } from './_shells/modern-pro/ModernProNavbar';
import { ModernProFooter } from './_shells/modern-pro/ModernProFooter';

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

  const cssVars =
    `:root{` +
    `--color-primary:${tenant.primary_color};` +
    `--color-accent:${tenant.accent_color};` +
    `}`;

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

  return (
    <main style={{ padding: '4rem 2rem' }}>
      <h1>Shell not yet ported: {tenant.template}</h1>
      <p>Metro-pro and modern-pro shells are live. Other shells ship in S146+.</p>
    </main>
  );
}
