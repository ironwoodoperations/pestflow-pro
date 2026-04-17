import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';
import { getPageContent, getSocialLinks, getIntegrations } from '../_lib/queries';
import { ContactForm } from '../_components/forms/ContactForm';

type Params = { params: { slug: string } };

export default async function ContactPage({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const [content, social, integrations] = await Promise.all([
    getPageContent(tenant.id, 'contact'),
    getSocialLinks(tenant.id),
    getIntegrations(tenant.id),
  ]);

  const c = content as { title?: string; subtitle?: string } | null;
  const heroTitle = c?.title || 'Contact Us';
  const heroSub   = c?.subtitle || (tenant.phone ? `Have a question or need service? Call us at ${tenant.phone}` : 'We\'d love to hear from you.');

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>

      <section className="relative py-16" style={{ background: 'linear-gradient(135deg, var(--color-bg-hero, #0a1628) 0%, var(--color-bg-hero-end, var(--color-primary)) 100%)' }}>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">{heroTitle}</h1>
          <p className="text-lg text-white/75">{heroSub}</p>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <ContactForm
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
        />
      </section>

    </div>
  );
}
