import { formatPhone } from '../../../../../shared/lib/formatPhone';
import { ContactForm } from '../../_components/forms/ContactForm';

interface Props {
  heroTitle: string;
  heroSub: string;
  tenantId: string;
  bizName: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  facebook?: string;
  instagram?: string;
  google?: string;
  ownerSmsNumber?: string;
  shellTemplate?: string;
}

const SERIF: React.CSSProperties = { fontFamily: "'Source Serif Pro', Georgia, serif" };
const BODY: React.CSSProperties = { fontFamily: 'Inter, sans-serif' };

export function RusticRuggedContactPage({ heroTitle, heroSub, tenantId, bizName, phone, email, address, hours, facebook, instagram, google, ownerSmsNumber, shellTemplate }: Props) {
  return (
    <div style={{ backgroundColor: '#F5F0E5', color: '#2D2A24' }}>
      <section style={{ padding: '4.5rem 1rem 2.5rem', borderBottom: '1px solid #E0D7C0', textAlign: 'center' }}>
        <div className="max-w-3xl mx-auto">
          <p style={{ ...SERIF, fontStyle: 'italic', fontSize: 16, color: '#B85C38', marginBottom: '0.5rem' }}>front porch hours, all year</p>
          <h1 style={{ ...SERIF, fontSize: 'clamp(40px,6vw,64px)', fontWeight: 600, color: '#2D4A2B', marginBottom: '1rem', lineHeight: 1.1 }}>{heroTitle}</h1>
          <p style={{ ...BODY, fontSize: 17, color: '#5A554A', lineHeight: 1.7, maxWidth: '52ch', margin: '0 auto' }}>{heroSub}</p>
        </div>
      </section>

      {/* Stop By card */}
      <section style={{ padding: '3rem 1rem' }}>
        <div className="max-w-4xl mx-auto" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          <style>{`@media(min-width:768px){.rr-contact-grid{grid-template-columns:1fr 1.4fr !important}}`}</style>
          <div className="rr-contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
            {/* Stop by card */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #E0D7C0', borderRadius: 8, padding: '1.75rem', boxShadow: '0 4px 14px rgba(45,74,43,0.08)' }}>
              <p style={{ ...SERIF, fontStyle: 'italic', fontSize: 14, color: '#B85C38', marginBottom: '0.5rem' }}>stop by</p>
              <h2 style={{ ...SERIF, fontSize: 22, fontWeight: 600, color: '#2D4A2B', marginBottom: '1rem' }}>{bizName}</h2>
              {address && <p style={{ ...BODY, fontSize: 14, color: '#3D3A33', lineHeight: 1.6, marginBottom: '0.75rem' }}>{address}</p>}
              {hours && (
                <>
                  <p style={{ ...SERIF, fontStyle: 'italic', fontSize: 13, color: '#B85C38', marginTop: '0.75rem', marginBottom: '0.25rem' }}>hours</p>
                  <p style={{ ...BODY, fontSize: 14, color: '#3D3A33', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{hours}</p>
                </>
              )}
              {phone && (
                <>
                  <p style={{ ...SERIF, fontStyle: 'italic', fontSize: 13, color: '#B85C38', marginTop: '0.75rem', marginBottom: '0.25rem' }}>or just call</p>
                  <a href={`tel:${phone.replace(/\D/g,'')}`} style={{ ...SERIF, fontSize: 22, fontWeight: 600, color: '#2D4A2B', textDecoration: 'none' }}>{formatPhone(phone)}</a>
                </>
              )}
              {email && (
                <>
                  <p style={{ ...SERIF, fontStyle: 'italic', fontSize: 13, color: '#B85C38', marginTop: '0.75rem', marginBottom: '0.25rem' }}>email</p>
                  <a href={`mailto:${email}`} style={{ ...BODY, fontSize: 14, color: '#2D4A2B', wordBreak: 'break-all' }}>{email}</a>
                </>
              )}
            </div>

            {/* Form panel */}
            <div style={{ backgroundColor: '#EDE5D2', border: '1px solid #E0D7C0', borderRadius: 8, padding: '1.75rem' }}>
              <p style={{ ...SERIF, fontStyle: 'italic', fontSize: 14, color: '#B85C38', marginBottom: '0.5rem' }}>send us a note</p>
              <h2 style={{ ...SERIF, fontSize: 22, fontWeight: 600, color: '#2D4A2B', marginBottom: '1.25rem' }}>Drop us a line</h2>
              <ContactForm
                tenantId={tenantId}
                bizName={bizName}
                phone={phone}
                email={email}
                address={address}
                hours={hours}
                facebook={facebook ?? ''}
                instagram={instagram ?? ''}
                google={google ?? ''}
                ownerSmsNumber={ownerSmsNumber ?? ''}
                shellTemplate={shellTemplate}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
