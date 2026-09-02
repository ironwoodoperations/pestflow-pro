import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildPageMetadata } from '../../../../shared/lib/buildPageMetadata';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';

export const revalidate = 300;

// S322 — canonical self-reference. This route had NO generateMetadata, so in the App Router
// it inherited the tenant LAYOUT's metadata, whose canonical is the bare site URL because it
// describes the SITE rather than a page. Every such page told Google it was a duplicate of
// the homepage and would not be indexed separately.
//
// buildPageMetadata was already correct — `pathname && pathname !== '/' ? siteUrl+pathname :
// siteUrl` — it was simply never called here. S276 wired only four route groups ([service],
// blog, blog/[post], home) and the rest were missed.
//
// The pathname is a LITERAL matching this route's own directory, never derived from a request
// header. Host is an untrusted selector, not a URL source (established in S321 PR B).
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) return {};
  const businessName = tenant.business_name || tenant.name;
  // A seo_meta row supplies the TITLE when one exists; the ROUTE supplies the path. A correct
  // canonical needs no row — that is why this is a code fix and not a per-tenant data fix.
  const seoMeta = await getSeoMeta(tenant.id, 'contact');
  return buildPageMetadata(tenant, {
    pathname: '/contact',
    seoMeta,
    fallback: {
      title: `Contact | ${businessName}`,
      description: `Contact ${businessName} — get in touch about your property.`,
    },
  });
}


export async function generateStaticParams() {
  return [];
}
import { getPageContent, getSocialLinks, getIntegrations, getHeroMedia, getSeoMeta } from '../_lib/queries';
import { resolveHeroImage } from '../_lib/heroImage';
import { ContactForm } from '../_components/forms/ContactForm';
import { ModernProContactPage } from '../_shells/modern-pro/ModernProContactPage';
import { RusticRuggedContactPage } from '../_shells/rustic-rugged/RusticRuggedContactPage';
import { MetroProContactPage } from '../_shells/metro-pro/MetroProContactPage';
import { DangComicContactPage } from '../_shells/dang/DangComicContactPage';
import { VitaGlowContactPage } from '../_shells/vita-glow/VitaGlowContactPage';

type Params = { params: { slug: string } };

export default async function ContactPage({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const [content, social, integrations, heroMedia] = await Promise.all([
    getPageContent(tenant.id, 'contact'),
    getSocialLinks(tenant.id),
    getIntegrations(tenant.id),
    getHeroMedia(tenant.id),
  ]);

  const c = content as { title?: string; subtitle?: string } | null;
  const heroTitle = c?.title || 'Contact Us';
  const heroSub   = c?.subtitle || (tenant.phone ? `Have a question or need service? Call us at ${tenant.phone}` : 'We\'d love to hear from you.');
  const heroImageUrl = resolveHeroImage(content, heroMedia);

  const sharedFormProps = {
    heroTitle,
    heroSub,
    tenantId: tenant.id,
    bizName: tenant.business_name ?? tenant.name,
    phone: tenant.phone ?? '',
    email: tenant.email ?? '',
    address: tenant.address ?? '',
    hours: tenant.hours ?? '',
    facebook: social.facebook ?? '',
    instagram: social.instagram ?? '',
    google: social.google ?? '',
    ownerSmsNumber: integrations.owner_sms_number ?? '',
    shellTemplate: tenant.template ?? undefined,
  };

  if (tenant.template === 'modern-pro') return <ModernProContactPage {...sharedFormProps} />;
  if (tenant.template === 'rustic-rugged') return <RusticRuggedContactPage {...sharedFormProps} />;
  if (tenant.template === 'metro-pro') return <MetroProContactPage {...sharedFormProps} />;
  if (tenant.template === 'dang-comic') return <DangComicContactPage {...sharedFormProps} />;
  // vita-glow shell (S-VG-1). Book-a-Consult page. Config-driven booking CTA
  // (Square URL from settings.integrations, blank ships this route as the
  // fallback). Copy comes from page_content via sharedFormProps hero fields.
  if (tenant.template === 'vita-glow') {
    return <VitaGlowContactPage {...sharedFormProps} bookingUrl={integrations.square_booking_url ?? null} />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>

      <section className="relative py-16" style={heroImageUrl
        ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, var(--color-bg-hero, #0a1628) 0%, var(--color-bg-hero-end, var(--color-primary)) 100%)' }}>
        {heroImageUrl && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 0, pointerEvents: 'none' }} />}
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
          shellTemplate={tenant.template ?? undefined}
        />
      </section>

    </div>
  );
}
