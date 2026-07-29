import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';
import { getPageContent, getSocialLinks, getIntegrations } from '../_lib/queries';
import { VitaGlowContactPage } from '../_shells/vita-glow/VitaGlowContactPage';

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

type Params = { params: { slug: string } };

// Unlisted consult-link route (brief §5). NOT in nav — meant for direct
// doctor hand-off links. Vita-glow only; every other template 404s here so the
// route is invisible to the rest of the platform. noindex so it stays unlisted
// in search as well. Renders the Book-a-Consult experience, honoring the same
// config-driven Square booking URL (blank → in-page consult form).
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ConsultPage({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();
  if (tenant.template !== 'vita-glow') notFound();

  const [content, social, integrations] = await Promise.all([
    getPageContent(tenant.id, 'consult'),
    getSocialLinks(tenant.id),
    getIntegrations(tenant.id),
  ]);

  const c = content as { title?: string; subtitle?: string } | null;
  const contactContent = c ?? (await getPageContent(tenant.id, 'contact')) as { title?: string; subtitle?: string } | null;

  return (
    <VitaGlowContactPage
      heroTitle={contactContent?.title || 'Book a Consult'}
      heroSub={contactContent?.subtitle || ''}
      tenantId={tenant.id}
      bizName={tenant.business_name ?? tenant.name}
      phone={tenant.phone ?? ''}
      email={tenant.email ?? ''}
      address={tenant.address ?? ''}
      hours={tenant.hours ?? ''}
      facebook={social.facebook ?? ''}
      instagram={social.instagram ?? ''}
      google={social.google ?? ''}
      ownerSmsNumber={integrations.owner_sms_number ?? ''}
      shellTemplate={tenant.template}
      bookingUrl={integrations.square_booking_url ?? null}
    />
  );
}
