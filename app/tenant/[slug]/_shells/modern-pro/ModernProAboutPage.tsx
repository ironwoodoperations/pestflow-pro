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
}

const FALLBACK = [
  'Engineered for measurable outcomes — every protocol benchmarked, every visit documented.',
  'A licensed team operating to enterprise quality standards, with same-day response and a 100% guarantee.',
];

export function ModernProAboutPage({ heroTitle, heroSub, heroImageUrl, aboutImage, team, foundedYear, businessName, introParagraphs, phone = '' }: Props) {
  const paragraphs = introParagraphs && introParagraphs.length > 0 ? introParagraphs : FALLBACK;
  const yearsInBiz = foundedYear ? new Date().getFullYear() - Number(foundedYear) : null;

  return (
    <div style={{ backgroundColor: '#0B1220', color: '#E5E7EB', fontFamily: 'Inter, sans-serif' }}>
      {/* Hero — minimal, tech */}
      <section style={{ padding: '5rem 1rem 3rem', borderBottom: '1px solid rgba(63, 184, 175, 0.2)', backgroundImage: heroImageUrl ? `linear-gradient(rgba(11,18,32,0.85),rgba(11,18,32,0.85)),url(${heroImageUrl})` : 'linear-gradient(135deg,#1B2A4E,#0B1220)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="max-w-5xl mx-auto" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3FB8AF', marginBottom: '0.75rem' }}>Our Mission</p>
          <h1 style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 700, color: '#fff', marginBottom: '1rem', lineHeight: 1.15 }}>{heroTitle}</h1>
          <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.6, maxWidth: '60ch', margin: '0 auto' }}>{heroSub}</p>
        </div>
      </section>

      {/* Stats blocks */}
      <section style={{ borderBottom: '1px solid rgba(63,184,175,0.15)', padding: '2.5rem 1rem' }}>
        <div className="max-w-6xl mx-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '1.5rem' }}>
          {[
            yearsInBiz ? { num: `${yearsInBiz}+`, label: 'Years operating' } : { num: '15+', label: 'Years operating' },
            { num: '5,000+', label: 'Properties protected' },
            { num: '100%', label: 'Guarantee' },
            { num: '24/7', label: 'Response window' },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '1.5rem', border: '1px solid rgba(63,184,175,0.2)', borderRadius: 8, backgroundColor: 'rgba(27,42,78,0.4)' }}>
              <div style={{ fontSize: 'clamp(28px,3.5vw,40px)', fontWeight: 700, color: '#3FB8AF', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8', marginTop: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section style={{ padding: '4rem 1rem' }}>
        <div className="max-w-5xl mx-auto" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
          <style>{`@media(min-width:768px){.mp-about-grid{grid-template-columns:1fr 1.2fr !important}}`}</style>
          <div className="mp-about-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem', alignItems: 'center' }}>
            {aboutImage && (
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(63,184,175,0.25)', aspectRatio: '4/3' }}>
                <img src={aboutImage} alt="Our team" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3FB8AF', marginBottom: '0.75rem' }}>The Standard</p>
              <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: '#fff', marginBottom: '1.25rem', lineHeight: 1.2 }}>Engineered for {businessName}</h2>
              {paragraphs.map((p, i) => (
                <p key={i} style={{ fontSize: 15, color: '#CBD5E1', lineHeight: 1.7, marginBottom: i < paragraphs.length - 1 ? '1rem' : 0 }}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      {team.length > 0 && (
        <section style={{ padding: '3rem 1rem', borderTop: '1px solid rgba(63,184,175,0.15)' }}>
          <div className="max-w-6xl mx-auto">
            <h2 style={{ fontSize: 'clamp(22px,2.5vw,30px)', fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: '2rem' }}>The team</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem' }}>
              {team.map((m) => (
                <div key={m.id} style={{ backgroundColor: 'rgba(27,42,78,0.4)', border: '1px solid rgba(63,184,175,0.15)', borderRadius: 8, padding: '1.25rem' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{m.name}</h3>
                  {m.title && <p style={{ fontSize: 12, color: '#3FB8AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{m.title}</p>}
                  {m.bio && <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>{m.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ padding: '3.5rem 1rem', textAlign: 'center', backgroundColor: '#1B2A4E' }}>
        <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: '#fff', marginBottom: '1.5rem' }}>Request a Quote</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
          <Link href="/quote" style={{ display: 'inline-block', backgroundColor: '#3FB8AF', color: '#0B1220', fontWeight: 600, fontSize: 15, padding: '0.85rem 2rem', borderRadius: 8, textDecoration: 'none' }}>Request a Quote</Link>
          {phone && <a href={`tel:${phone.replace(/\D/g,'')}`} style={{ display: 'inline-block', border: '1px solid #3FB8AF', color: '#3FB8AF', fontWeight: 500, fontSize: 15, padding: '0.85rem 2rem', borderRadius: 8, textDecoration: 'none' }}>Call {formatPhone(phone)}</a>}
        </div>
      </section>
    </div>
  );
}
