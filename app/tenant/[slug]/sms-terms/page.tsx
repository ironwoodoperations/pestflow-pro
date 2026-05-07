import type { Metadata } from 'next';
import Link from 'next/link';
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
  const title = `SMS Terms & Conditions | ${name}`;
  const description = `SMS Terms & Conditions for ${name}. Learn about our text messaging program, message frequency, opt-out, and privacy.`;
  return {
    title,
    description,
    ...(tenant ? tenantSeoMetadata(tenant, { title, description, pathname: '/sms-terms' }) : {}),
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

export default async function SmsTermsPage({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const updated = new Date().toISOString().split('T')[0];

  // Prefer DB-stored content; fall back to hardcoded boilerplate. See terms/page.tsx.
  const pageContent = await getPageContent(tenant.id, 'sms-terms') as
    | { title?: string; intro?: string } | null;
  if (pageContent?.intro) {
    return (
      <LegalPageLayout title={pageContent.title || 'SMS Terms & Conditions'} lastUpdated={updated}>
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
    <LegalPageLayout title="SMS Terms & Conditions" lastUpdated={updated}>
      <P>These SMS Terms &amp; Conditions ("SMS Terms") govern your use of the text messaging service (the "SMS Program") provided by <strong>{name}</strong> ("we," "us," or "our"). By providing your mobile phone number and submitting a quote request, service inquiry, or contact form on our website — or by texting us directly — you agree to these SMS Terms.</P>

      <H2>1. Program Description</H2>
      <P>The SMS Program allows <strong>{name}</strong> to communicate with you via text message about pest control services and related matters you have requested. Messages you may receive include:</P>
      <UL>
        <LI>Service quotes and estimates in response to your inquiry.</LI>
        <LI>Appointment scheduling, confirmation, and reminder notifications.</LI>
        <LI>Service completion notifications and follow-up.</LI>
        <LI>Responses to questions you send us by text.</LI>
        <LI>Service-related administrative messages (for example, technician arrival updates).</LI>
      </UL>
      <P><strong>We will not send you promotional or marketing SMS messages under this SMS Program unless you have separately and expressly opted in to receive them.</strong></P>
      <P>All messages sent under the SMS Program will identify <strong>{name}</strong> as the sender.</P>

      <H2>2. How You Join the SMS Program</H2>
      <P>You join the SMS Program by:</P>
      <UL>
        <LI>Submitting a form on our website that includes your mobile phone number, or</LI>
        <LI>Texting us directly from your mobile phone, or</LI>
        <LI>Providing your mobile phone number during a phone call and expressly consenting to receive SMS messages.</LI>
      </UL>
      <P>Consent to receive SMS messages is not a condition of purchasing any goods or services. By enrolling, you consent to the use of automated technology to send SMS messages to the mobile number you provide. The SMS Program is available only to individuals located in the United States using a U.S. mobile phone number. We may retain records of your SMS opt-in, including the date, time, and method of consent.</P>

      <H2>3. Message Frequency</H2>
      <P>Message frequency varies based on your service request and ongoing communications. A typical service interaction involves between one (1) and ten (10) messages. Complex or multi-visit service requests may involve additional messages.</P>

      <H2>4. Message and Data Rates</H2>
      <P>Message and data rates may apply. Any charges apply per message sent or received and come from your mobile carrier, not from <strong>{name}</strong>. Please consult your mobile service plan for details.</P>

      <H2>5. Cancel (STOP)</H2>
      <P>You may cancel the SMS Program at any time by replying <strong>STOP</strong>, <strong>END</strong>, <strong>CANCEL</strong>, <strong>UNSUBSCRIBE</strong>, or <strong>QUIT</strong> to any message we send. After replying, you will receive a single confirmation message indicating that you have been unsubscribed, and we will honor your opt-out request promptly. You will receive no further SMS messages from the SMS Program after that confirmation. If you want to rejoin the SMS Program, text <strong>START</strong> to the same number or submit a new request on our website.</P>

      <H2>6. Help (HELP)</H2>
      <P>For assistance with the SMS Program, reply <strong>HELP</strong> to any message we send. You will receive a response containing our business name, a brief description of the SMS Program, our contact information, and a link to these SMS Terms. For additional support, you may also contact us directly at{' '}
        <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ color: 'var(--color-primary,#0ea5e9)' }}>{formatPhone(phone)}</a>
        {' '}or{' '}
        <a href={`mailto:${email}`} style={{ color: 'var(--color-primary,#0ea5e9)' }}>{email}</a>.
      </P>

      <H2>7. Supported Carriers</H2>
      <P>The SMS Program is supported by major U.S. wireless carriers, including AT&amp;T, T-Mobile, Verizon, and U.S. Cellular, among others. Mobile carriers are not liable for delayed or undelivered messages. Message delivery may not be available on all carriers or in all areas.</P>

      <H2>8. No Guarantee of Delivery</H2>
      <P>We use commercially reasonable efforts to deliver SMS messages, but delivery is not guaranteed. We are not liable for any delays in delivery, failures to deliver, or any damages arising from delayed, failed, or misdirected messages.</P>

      <H2>9. Privacy</H2>
      <P>Your mobile phone number and SMS communications are handled in accordance with our <Link href="/privacy" style={{ color: 'var(--color-primary,#0ea5e9)' }} className="underline">Privacy Policy</Link>. We do not sell your phone number or messaging content to third parties. We share SMS-related information only with service providers that help us operate the SMS Program (for example, our SMS delivery platform) and as otherwise described in our Privacy Policy.</P>

      <H2>10. Eligibility</H2>
      <P>You must be at least eighteen (18) years old and the account holder of the mobile phone number you provide — or have the account holder's express permission — to enroll in the SMS Program. By enrolling, you represent and warrant that you meet these requirements.</P>

      <H2>11. Changes to the SMS Program</H2>
      <P>We may modify these SMS Terms or the SMS Program at any time. When we do, we will post the updated SMS Terms on our website and update the "Last Updated" date at the top of this page. Continued participation in the SMS Program after changes become effective constitutes your acceptance of the updated SMS Terms. If you do not agree to the changes, reply STOP to cancel.</P>

      <H2>12. Contact Us</H2>
      <P>Questions about the SMS Program? Contact us at:</P>
      <P>
        <strong>{name}</strong><br />
        {address}<br />
        Phone: <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ color: 'var(--color-primary,#0ea5e9)' }}>{formatPhone(phone)}</a><br />
        Email: <a href={`mailto:${email}`} style={{ color: 'var(--color-primary,#0ea5e9)' }}>{email}</a>
      </P>
    </LegalPageLayout>
  );
}
