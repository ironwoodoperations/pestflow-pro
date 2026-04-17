import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../shared/lib/tenant/resolve';
import { TenantProvider } from './TenantProvider';

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

  const cssVars =
    `:root{` +
    `--color-primary:${tenant.primary_color};` +
    `--color-accent:${tenant.accent_color};` +
    `}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      <TenantProvider tenant={tenant}>{children}</TenantProvider>
    </>
  );
}
