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

export function ModernProContactPage({ heroTitle, heroSub, tenantId, bizName, phone, email, address, hours, facebook, instagram, google, ownerSmsNumber, shellTemplate }: Props) {
  return (
    <div style={{ backgroundColor: '#0B1220', color: '#E5E7EB', fontFamily: 'Inter, sans-serif' }}>
      <section style={{ padding: '4.5rem 1rem 2rem', borderBottom: '1px solid rgba(63,184,175,0.2)', background: 'linear-gradient(135deg,#1B2A4E,#0B1220)' }}>
        <div className="max-w-5xl mx-auto" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3FB8AF', marginBottom: '0.75rem' }}>Get in touch</p>
          <h1 style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 700, color: '#fff', marginBottom: '0.75rem', lineHeight: 1.15 }}>{heroTitle}</h1>
          <p style={{ fontSize: 16, color: '#94A3B8', lineHeight: 1.6, maxWidth: '60ch', margin: '0 auto' }}>{heroSub}</p>
        </div>
      </section>

      {/* Channels grid — Call / Email / Form distinct */}
      <section style={{ padding: '3rem 1rem' }}>
        <div className="max-w-6xl mx-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {phone && (
            <div style={{ padding: '1.5rem', backgroundColor: 'rgba(27,42,78,0.4)', border: '1px solid rgba(63,184,175,0.2)', borderRadius: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3FB8AF', marginBottom: '0.5rem' }}>Call</p>
              <a href={`tel:${phone.replace(/\D/g,'')}`} style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 18, color: '#fff', textDecoration: 'none', display: 'block' }}>{formatPhone(phone)}</a>
              {hours && <p style={{ fontSize: 12, color: '#94A3B8', marginTop: '0.5rem' }}>{hours}</p>}
            </div>
          )}
          {email && (
            <div style={{ padding: '1.5rem', backgroundColor: 'rgba(27,42,78,0.4)', border: '1px solid rgba(63,184,175,0.2)', borderRadius: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3FB8AF', marginBottom: '0.5rem' }}>Email</p>
              <a href={`mailto:${email}`} style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 14, color: '#fff', textDecoration: 'none', wordBreak: 'break-all' }}>{email}</a>
            </div>
          )}
          {address && (
            <div style={{ padding: '1.5rem', backgroundColor: 'rgba(27,42,78,0.4)', border: '1px solid rgba(63,184,175,0.2)', borderRadius: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3FB8AF', marginBottom: '0.5rem' }}>Office</p>
              <p style={{ fontSize: 14, color: '#fff', lineHeight: 1.5 }}>{address}</p>
            </div>
          )}
        </div>

        {/* Form section */}
        <div className="max-w-4xl mx-auto" style={{ padding: '2rem', backgroundColor: 'rgba(27,42,78,0.3)', border: '1px solid rgba(63,184,175,0.2)', borderRadius: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3FB8AF', marginBottom: '0.5rem' }}>Send a message</p>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: '1.5rem' }}>Quote &amp; consult</h2>
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
      </section>
    </div>
  );
}
