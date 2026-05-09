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

const DISPLAY: React.CSSProperties = { fontFamily: "'Barlow Condensed', Inter, sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' };
const BODY: React.CSSProperties = { fontFamily: 'Inter, sans-serif' };

export function MetroProContactPage({ heroTitle, heroSub, tenantId, bizName, phone, email, address, hours, facebook, instagram, google, ownerSmsNumber, shellTemplate }: Props) {
  return (
    <div style={{ backgroundColor: '#0F172A', color: '#E2E8F0' }}>
      <section style={{ position: 'relative', padding: '4.5rem 1rem 2.5rem', borderBottom: '1px solid #14B8A6', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 24px, rgba(20,184,166,0.06) 24px, rgba(20,184,166,0.06) 26px)', pointerEvents: 'none' }} />
        <div className="max-w-5xl mx-auto" style={{ position: 'relative' }}>
          <p style={{ ...BODY, fontSize: 11, fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#14B8A6', marginBottom: '0.75rem' }}>Concierge Desk</p>
          <h1 style={{ ...DISPLAY, fontSize: 'clamp(40px,5.5vw,68px)', fontWeight: 700, color: '#fff', marginBottom: '0.75rem', lineHeight: 1.05 }}>{heroTitle}</h1>
          <p style={{ ...BODY, fontSize: 16, color: '#94A3B8', lineHeight: 1.6, maxWidth: '60ch' }}>{heroSub}</p>
        </div>
      </section>

      <section style={{ padding: '3rem 1rem' }}>
        <div className="max-w-6xl mx-auto" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          <style>{`@media(min-width:768px){.mtp-contact-grid{grid-template-columns:0.85fr 1.15fr !important}}`}</style>
          <div className="mtp-contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
            {/* Business-card style block */}
            <div style={{ backgroundColor: '#1E293B', border: '1px solid #14B8A6', padding: '1.75rem' }}>
              <p style={{ ...BODY, fontSize: 11, fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#14B8A6', marginBottom: '0.5rem' }}>Direct Line</p>
              <h2 style={{ ...DISPLAY, fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: '1.5rem' }}>{bizName}</h2>

              {phone && (
                <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px dashed rgba(20,184,166,0.25)' }}>
                  <p style={{ ...DISPLAY, fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', color: '#14B8A6', marginBottom: '0.25rem' }}>T</p>
                  <a href={`tel:${phone.replace(/\D/g,'')}`} style={{ fontFamily: "'Roboto Mono', monospace", fontSize: 18, color: '#fff', textDecoration: 'none' }}>{formatPhone(phone)}</a>
                </div>
              )}
              {email && (
                <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px dashed rgba(20,184,166,0.25)' }}>
                  <p style={{ ...DISPLAY, fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', color: '#14B8A6', marginBottom: '0.25rem' }}>E</p>
                  <a href={`mailto:${email}`} style={{ fontFamily: "'Roboto Mono', monospace", fontSize: 13, color: '#fff', wordBreak: 'break-all' }}>{email}</a>
                </div>
              )}
              {address && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ ...DISPLAY, fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', color: '#14B8A6', marginBottom: '0.25rem' }}>A</p>
                  <p style={{ ...BODY, fontSize: 13, color: '#CBD5E1', lineHeight: 1.55 }}>{address}</p>
                </div>
              )}
              {hours && (
                <div>
                  <p style={{ ...DISPLAY, fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', color: '#14B8A6', marginBottom: '0.25rem' }}>Hrs</p>
                  <p style={{ ...BODY, fontSize: 13, color: '#CBD5E1', lineHeight: 1.55, whiteSpace: 'pre-line' }}>{hours}</p>
                </div>
              )}
            </div>

            {/* Callback panel */}
            <div style={{ backgroundColor: '#1E293B', border: '1px solid rgba(20,184,166,0.3)', padding: '1.75rem' }}>
              <p style={{ ...BODY, fontSize: 11, fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#14B8A6', marginBottom: '0.5rem' }}>Schedule a Callback</p>
              <h2 style={{ ...DISPLAY, fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: '1.5rem' }}>Send the desk a brief</h2>
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
