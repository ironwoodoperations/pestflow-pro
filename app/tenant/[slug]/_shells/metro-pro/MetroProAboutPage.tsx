import Link from 'next/link';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

interface TeamMember { id: string; name: string; title?: string; bio?: string; photo_url?: string }

interface Props {
  heroTitle: string;
  heroSub: string;
  heroImageUrl: string | null;
  aboutImage: string;
  team: TeamMember[];
  foundedYear?: string;
  businessName: string;
  introParagraphs?: string[];
  phone?: string;
  licenseNumber?: string;
}

const DISPLAY: React.CSSProperties = { fontFamily: "'Barlow Condensed', Inter, sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' };
const BODY: React.CSSProperties = { fontFamily: 'Inter, sans-serif' };

const FALLBACK = [
  'A concierge approach to property pest management — discreet, scheduled, documented.',
  'Every visit logged. Every protocol benchmarked. Every client briefed.',
];

const STANDARDS = [
  { label: 'IPM-compliant', desc: 'Integrated Pest Management protocols' },
  { label: 'EPA-certified', desc: 'Licensed technicians, current certifications' },
  { label: 'Discreet service', desc: 'Marked-vehicle-optional, after-hours available' },
];

export function MetroProAboutPage({ heroTitle, heroSub, aboutImage, team, foundedYear, businessName, introParagraphs, phone = '', licenseNumber }: Props) {
  const paragraphs = introParagraphs && introParagraphs.length > 0 ? introParagraphs : FALLBACK;

  return (
    <div style={{ backgroundColor: '#0F172A', color: '#E2E8F0' }}>
      {/* Hero — diagonal stripe */}
      <section style={{ position: 'relative', padding: '5rem 1rem 3.5rem', borderBottom: '1px solid #14B8A6', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 24px, rgba(20,184,166,0.06) 24px, rgba(20,184,166,0.06) 26px)', pointerEvents: 'none' }} />
        <div className="max-w-5xl mx-auto" style={{ position: 'relative', textAlign: 'center' }}>
          <p style={{ ...BODY, fontSize: 11, fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#14B8A6', marginBottom: '1rem' }}>The Concierge Standard</p>
          <h1 style={{ ...DISPLAY, fontSize: 'clamp(44px,6vw,72px)', fontWeight: 700, color: '#fff', marginBottom: '1rem', lineHeight: 1.05 }}>{heroTitle}</h1>
          <p style={{ ...BODY, fontSize: 17, color: '#94A3B8', lineHeight: 1.6, maxWidth: '60ch', margin: '0 auto' }}>{heroSub}</p>
        </div>
      </section>

      {/* Standards strip */}
      <section style={{ borderBottom: '1px solid rgba(20,184,166,0.2)', backgroundColor: '#1E293B' }}>
        <div className="max-w-6xl mx-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
          {STANDARDS.map((s, i) => (
            <div key={s.label} style={{ padding: '1.5rem', borderRight: i < STANDARDS.length - 1 ? '1px solid rgba(20,184,166,0.15)' : 'none' }}>
              <p style={{ ...DISPLAY, fontSize: 18, fontWeight: 700, color: '#14B8A6', marginBottom: '0.4rem' }}>{s.label}</p>
              <p style={{ ...BODY, fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section style={{ padding: '4rem 1rem' }}>
        <div className="max-w-5xl mx-auto" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
          <style>{`@media(min-width:768px){.mtp-about-grid{grid-template-columns:1fr 1.3fr !important}}`}</style>
          <div className="mtp-about-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem', alignItems: 'center' }}>
            {aboutImage && (
              <div style={{ overflow: 'hidden', border: '2px solid #14B8A6', aspectRatio: '4/5', maxHeight: 540 }}>
                <img src={aboutImage} alt="The team" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.85) contrast(1.05)' }} />
              </div>
            )}
            <div>
              <p style={{ ...BODY, fontSize: 11, fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#14B8A6', marginBottom: '0.5rem' }}>Background</p>
              <h2 style={{ ...DISPLAY, fontSize: 'clamp(32px,4vw,48px)', fontWeight: 700, color: '#fff', marginBottom: '1.25rem', lineHeight: 1.05 }}>{businessName}</h2>
              {foundedYear && <p style={{ ...BODY, fontSize: 13, color: '#94A3B8', marginBottom: '1rem' }}>Established {foundedYear}{licenseNumber ? ` · License #${licenseNumber}` : ''}</p>}
              {paragraphs.map((p, i) => (
                <p key={i} style={{ ...BODY, fontSize: 16, color: '#CBD5E1', lineHeight: 1.7, marginBottom: i < paragraphs.length - 1 ? '1rem' : 0 }}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      {team.length > 0 && (
        <section style={{ padding: '3rem 1rem', borderTop: '1px solid rgba(20,184,166,0.2)' }}>
          <div className="max-w-6xl mx-auto">
            <p style={{ ...BODY, fontSize: 11, fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#14B8A6', textAlign: 'center', marginBottom: '0.5rem' }}>Personnel</p>
            <h2 style={{ ...DISPLAY, fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: '2rem' }}>The desk</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 0, border: '1px solid rgba(20,184,166,0.2)' }}>
              {team.map((m, i) => (
                <div key={m.id} style={{ padding: '1.5rem', borderRight: '1px solid rgba(20,184,166,0.15)', borderBottom: i < team.length - 1 ? '1px solid rgba(20,184,166,0.15)' : 'none', backgroundColor: '#1E293B' }}>
                  <h3 style={{ ...DISPLAY, fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{m.name}</h3>
                  {m.title && <p style={{ ...BODY, fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#14B8A6', marginBottom: '0.5rem' }}>{m.title}</p>}
                  {m.bio && <p style={{ ...BODY, fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>{m.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ padding: '3.5rem 1rem', textAlign: 'center', backgroundColor: '#14B8A6' }}>
        <h2 style={{ ...DISPLAY, fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 700, color: '#0F172A', marginBottom: '1.25rem', lineHeight: 1.1 }}>Book a Consultation</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem' }}>
          <Link href="/quote" style={{ ...DISPLAY, display: 'inline-block', backgroundColor: '#0F172A', color: '#14B8A6', fontWeight: 700, fontSize: 14, padding: '0.95rem 2rem', textDecoration: 'none' }}>Book Consultation</Link>
          {phone && <a href={`tel:${phone.replace(/\D/g,'')}`} style={{ ...DISPLAY, display: 'inline-block', border: '2px solid #0F172A', color: '#0F172A', fontWeight: 700, fontSize: 14, padding: '0.85rem 2rem', textDecoration: 'none' }}>Call {formatPhone(phone)}</a>}
        </div>
      </section>
    </div>
  );
}
