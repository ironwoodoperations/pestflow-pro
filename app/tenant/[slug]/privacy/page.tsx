import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';
import { tenantSeoMetadata } from '../../../../shared/lib/tenantSeoMetadata';
import { formatPhone } from '../../../../shared/lib/formatPhone';
import LegalPageLayout from '../_components/LegalPageLayout';

export const revalidate = 300;
export async function generateStaticParams() { return []; }

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const tenant = await resolveTenantBySlug(params.slug);
  const name = tenant?.business_name || tenant?.name || '';
  const title = `Privacy Policy | ${name}`;
  const description = `Privacy Policy for ${name}. Learn how we collect, use, and protect your information.`;
  return {
    title,
    description,
    ...(tenant ? tenantSeoMetadata(tenant, { title, description, pathname: '/privacy' }) : {}),
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

export default async function PrivacyPage({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const name = tenant.business_name || tenant.name;
  const phone = tenant.phone ?? '';
  const email = tenant.email ?? '';
  const address = tenant.address ?? '';

  if (!name || !phone || !email || !address) {
    return (
      <LegalPageLayout title="Page Under Construction" lastUpdated={new Date().toISOString().split('T')[0]}>
        <P>This page is currently being configured. For assistance, please contact the site administrator.</P>
      </LegalPageLayout>
    );
  }

  const updated = new Date().toISOString().split('T')[0];

  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated={updated}>
      <P>This Privacy Policy describes how <strong>{name}</strong> ("we," "us," or "our") collects, uses, and shares information when you visit our website or interact with our services. By using our website or services, you agree to the practices described in this Privacy Policy.</P>

      <H2>1. Information We Collect</H2>
      <P><strong>Information You Provide:</strong></P>
      <UL>
        <LI>Contact information (name, phone number, email address, mailing address) when you request a quote, schedule service, or contact us.</LI>
        <LI>Property details (property type, pest concerns, property size) when requesting a service estimate.</LI>
        <LI>Payment information if you pay for services online (processed by a third-party payment processor).</LI>
      </UL>
      <P><strong>Information Collected Automatically:</strong></P>
      <UL>
        <LI>IP address, browser type, device information, and operating system.</LI>
        <LI>Pages visited, time on page, and referring source.</LI>
        <LI>Cookies and similar tracking technologies.</LI>
      </UL>

      <H2>2. How We Use Your Information</H2>
      <P>We use the information we collect to:</P>
      <UL>
        <LI>Provide service estimates and schedule appointments.</LI>
        <LI>Communicate with you via phone, text message, or email about your service request.</LI>
        <LI>Process payments and maintain records of services rendered.</LI>
        <LI>Send service reminders and follow-up communications.</LI>
        <LI>Improve our website, services, and customer experience.</LI>
        <LI>Comply with legal obligations and enforce our terms.</LI>
      </UL>

      <H2>3. How We Share Your Information</H2>
      <P>We share information only as described below. <strong>We do not sell your personal information.</strong></P>
      <UL>
        <LI><strong>Service providers:</strong> We share information with third-party vendors who support our operations, including website hosting, customer relationship management, SMS messaging, email delivery, analytics, and payment processing. These providers are contractually required to use your information only to perform services for us.</LI>
        <LI><strong>Legal requirements:</strong> We may disclose information when required by law, subpoena, or government request, or to protect our rights, property, or safety.</LI>
        <LI><strong>Business transfers:</strong> If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</LI>
      </UL>
      <P><strong>SMS Opt-In Information:</strong> Mobile phone numbers and SMS consent data collected through the SMS Program are not shared with any third parties or affiliates for marketing or promotional purposes. Information you provide to opt in to the SMS Program — including your mobile phone number and the fact that you consented — is excluded from all other information-sharing categories described above and is used only to operate the SMS Program.</P>

      <H2>4. SMS Communications</H2>
      <P>If you provide your mobile phone number, you may receive text messages from us regarding your service request. SMS messaging is governed by our <Link href="/sms-terms" className="underline" style={{ color: 'var(--color-primary,#0ea5e9)' }}>SMS Terms &amp; Conditions</Link>. Standard message and data rates may apply. You may opt out at any time by replying STOP.</P>

      <H2>5. Cookies and Tracking</H2>
      <P>Our website uses cookies and similar technologies to improve functionality and analyze traffic. You can disable cookies through your browser settings, though some website features may not function properly without them.</P>

      <H2>6. Your Rights</H2>
      <P>Depending on your state of residence, you may have the following rights regarding your personal information:</P>
      <UL>
        <LI>The right to know what personal information we collect about you.</LI>
        <LI>The right to request deletion of your personal information.</LI>
        <LI>The right to correct inaccurate information.</LI>
        <LI>The right to opt out of the sale of personal information (we do not sell personal information).</LI>
      </UL>
      <P>To exercise these rights, contact us using the information in Section 10.</P>

      <H2>7. Data Retention</H2>
      <P>We retain personal information for as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements. Typical retention periods range from three (3) to seven (7) years after the last service interaction.</P>

      <H2>8. Data Security</H2>
      <P>We implement reasonable administrative, technical, and physical safeguards to protect your personal information. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.</P>

      <H2>9. Children</H2>
      <P>Our services are not directed to individuals under the age of 13, and we do not knowingly collect personal information from children. If you believe we have collected information from a child under 13, please contact us immediately.</P>

      <H2>10. Contact Us</H2>
      <P>If you have questions about this Privacy Policy or wish to exercise your rights, contact us at:</P>
      <P>
        <strong>{name}</strong><br />
        {address}<br />
        Phone: <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ color: 'var(--color-primary,#0ea5e9)' }}>{formatPhone(phone)}</a><br />
        Email: <a href={`mailto:${email}`} style={{ color: 'var(--color-primary,#0ea5e9)' }}>{email}</a>
      </P>

      <H2>11. Changes to This Policy</H2>
      <P>We may update this Privacy Policy from time to time. When we make changes, we will update the "Last Updated" date at the top of this page. Continued use of our website after changes constitutes acceptance of the updated Policy.</P>
    </LegalPageLayout>
  );
}
