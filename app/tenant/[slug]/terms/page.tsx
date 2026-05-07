import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';
import { tenantSeoMetadata } from '../../../../shared/lib/tenantSeoMetadata';
import { formatPhone } from '../../../../shared/lib/formatPhone';
import { getPageContent } from '../_lib/queries';
import LegalPageLayout from '../_components/LegalPageLayout';

export const revalidate = 300;
export async function generateStaticParams() { return []; }

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const tenant = await resolveTenantBySlug(params.slug);
  const name = tenant?.business_name || tenant?.name || '';
  const title = `Terms of Service | ${name}`;
  const description = `Terms of Service for ${name}.`;
  return {
    title,
    description,
    ...(tenant ? tenantSeoMetadata(tenant, { title, description, pathname: '/terms' }) : {}),
  };
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-2xl font-semibold mt-8 mb-3">{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-4">{children}</p>
);
const UL = ({ children }: { children: React.ReactNode }) => (
  <ul className="list-disc pl-6 my-4 space-y-1">{children}</ul>
);
const LI = ({ children }: { children: React.ReactNode }) => (
  <li>{children}</li>
);

export default async function TermsPage({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const updated = new Date().toISOString().split('T')[0];

  // Prefer DB-stored content (provision-tenant Step 9g seeds these from the
  // master template, substituting per-tenant business_info). Fall back to the
  // hardcoded boilerplate below if the row is missing — never blank-page.
  const pageContent = await getPageContent(tenant.id, 'terms') as
    | { title?: string; intro?: string } | null;
  if (pageContent?.intro) {
    return (
      <LegalPageLayout title={pageContent.title || 'Terms of Service'} lastUpdated={updated}>
        <div className="whitespace-pre-wrap">{pageContent.intro}</div>
      </LegalPageLayout>
    );
  }

  const name = tenant.business_name || tenant.name;
  const phone = tenant.phone ?? '';
  const email = tenant.email ?? '';
  const address = tenant.address ?? '';

  if (!name || !phone || !email || !address) {
    return (
      <LegalPageLayout title="Page Under Construction" lastUpdated={updated}>
        <P>This page is currently being configured. For assistance, please contact the site administrator.</P>
      </LegalPageLayout>
    );
  }

  return (
    <LegalPageLayout title="Terms of Service" lastUpdated={updated}>
      <P>These Terms of Service ("Terms") govern your use of the website and services provided by <strong>{name}</strong> ("we," "us," or "our"). By accessing our website or requesting services, you agree to these Terms. If you do not agree, do not use our website or services.</P>

      <H2>1. Use of Our Website</H2>
      <P>You may use our website for lawful purposes only. You agree not to:</P>
      <UL>
        <LI>Use the website in any way that violates applicable law.</LI>
        <LI>Attempt to gain unauthorized access to any part of the website or our systems.</LI>
        <LI>Transmit any harmful code, viruses, or malicious content.</LI>
        <LI>Use automated tools to scrape or extract data from the website.</LI>
      </UL>

      <H2>2. Service Estimates</H2>
      <P>Quotes and estimates provided on our website or via communication with our team are preliminary and based on the information you provide. Final pricing may vary based on actual property conditions, service requirements, and other factors identified at the time of service. No quote constitutes a binding contract until a written service agreement is signed by both parties.</P>

      <H2>3. Scheduling and Cancellation</H2>
      <P>Scheduled services may be rescheduled or cancelled in accordance with our current scheduling policies, communicated to you at the time of booking. We reserve the right to reschedule services due to weather, safety concerns, or other circumstances beyond our reasonable control.</P>

      <H2>4. Payment</H2>
      <P>Payment terms are set forth in the written service agreement for each service. Invoices are due upon receipt unless otherwise specified. Overdue balances may be subject to late fees and interest as permitted by applicable law.</P>

      <H2>5. Service Warranty</H2>
      <P>Any service-specific warranties or guarantees are described in the written service agreement for each service. Except as expressly stated in writing, services are provided "as-is" without any express or implied warranties.</P>

      <H2>6. Limitation of Liability</H2>
      <P>To the maximum extent permitted by law, <strong>{name}</strong> shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of our website or services. Our total liability for any claim arising from our services shall not exceed the amount you paid for the specific service giving rise to the claim.</P>

      <H2>7. Indemnification</H2>
      <P>You agree to indemnify and hold harmless <strong>{name}</strong>, its officers, employees, and agents from any claims, damages, or expenses (including reasonable attorneys' fees) arising from your violation of these Terms or misuse of our services.</P>

      <H2>8. Intellectual Property</H2>
      <P>All content on our website — including text, images, logos, and design elements — is the property of <strong>{name}</strong> or its licensors and is protected by copyright and trademark laws. You may not reproduce, distribute, or create derivative works from our content without written permission.</P>

      <H2>9. Governing Law</H2>
      <P>These Terms are governed by the laws of the state in which <strong>{name}</strong> operates, without regard to conflict of law principles. Any disputes arising from these Terms or our services shall be resolved in the state or federal courts located in that jurisdiction.</P>

      <H2>10. Changes to These Terms</H2>
      <P>We may update these Terms from time to time. When we do, we will update the "Last Updated" date at the top of this page. Continued use of our website or services after changes constitutes acceptance of the updated Terms.</P>

      <H2>11. Severability</H2>
      <P>If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.</P>

      <H2>12. Contact Us</H2>
      <P>Questions about these Terms? Contact us at:</P>
      <P>
        <strong>{name}</strong><br />
        {address}<br />
        Phone: <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ color: 'var(--color-primary,#0ea5e9)' }}>{formatPhone(phone)}</a><br />
        Email: <a href={`mailto:${email}`} style={{ color: 'var(--color-primary,#0ea5e9)' }}>{email}</a>
      </P>
    </LegalPageLayout>
  );
}
