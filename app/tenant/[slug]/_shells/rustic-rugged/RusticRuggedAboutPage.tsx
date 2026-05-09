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

const SERIF: React.CSSProperties = { fontFamily: "'Source Serif Pro', Georgia, serif" };
const BODY: React.CSSProperties = { fontFamily: "Inter, sans-serif" };

const FALLBACK = [
  'We were raised on these roads. Our crew is your neighbor — kids in the same schools, dog at the same vet, truck at the same gas station.',
  'Local-owned, locally licensed, and committed to treating your home like our own front porch.',
];

export function RusticRuggedAboutPage({ heroTitle, heroSub, aboutImage, team, foundedYear, businessName, introParagraphs, phone = '' }: Props) {
  const paragraphs = introParagraphs && introParagraphs.length > 0 ? introParagraphs : FALLBACK;
  const since = foundedYear ? foundedYear : '';

  return (
    <div style={{ backgroundColor: '#F5F0E5', color: '#2D2A24' }}>
      {/* Cream hero with serif */}
      <section style={{ padding: '5rem 1rem 3rem', borderBottom: '1px solid #E0D7C0', textAlign: 'center' }}>
        <div className="max-w-3xl mx-auto">
          {since && <p style={{ ...SERIF, fontStyle: 'italic', fontSize: 18, color: '#B85C38', marginBottom: '0.75rem' }}>est. {since}</p>}
          <h1 style={{ ...SERIF, fontSize: 'clamp(40px,6vw,72px)', fontWeight: 600, color: '#2D4A2B', marginBottom: '1rem', lineHeight: 1.1 }}>{heroTitle}</h1>
          <p style={{ ...BODY, fontSize: 18, color: '#5A554A', lineHeight: 1.7, maxWidth: '55ch', margin: '0 auto' }}>{heroSub}</p>
          <div style={{ display: 'inline-block', marginTop: '1.25rem', padding: '0.5rem 1rem', borderRadius: 999, backgroundColor: '#2D4A2B', color: '#F5F0E5', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Locally Owned &amp; Operated</div>
        </div>
      </section>

      {/* Photo card + Our Story */}
      <section style={{ padding: '4rem 1rem' }}>
        <div className="max-w-5xl mx-auto" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
          <style>{`@media(min-width:768px){.rr-about-grid{grid-template-columns:0.9fr 1.1fr !important}}`}</style>
          <div className="rr-about-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem', alignItems: 'center' }}>
            {aboutImage && (
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 4px 18px rgba(45,74,43,0.15)', aspectRatio: '4/5', maxHeight: 520 }}>
                <img src={aboutImage} alt="Our team" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div>
              <p style={{ ...SERIF, fontStyle: 'italic', fontSize: 14, color: '#B85C38', marginBottom: '0.5rem' }}>our story</p>
              <h2 style={{ ...SERIF, fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 600, color: '#2D4A2B', marginBottom: '1.25rem', lineHeight: 1.2 }}>Neighbor to neighbor</h2>
              {paragraphs.map((p, i) => (
                <p key={i} style={{ ...BODY, fontSize: 16, color: '#3D3A33', lineHeight: 1.75, marginBottom: i < paragraphs.length - 1 ? '1rem' : 0 }}>{p}</p>
              ))}
              <p style={{ ...SERIF, fontStyle: 'italic', fontSize: 18, color: '#2D4A2B', marginTop: '1.5rem', borderLeft: '3px solid #B85C38', paddingLeft: '1rem', lineHeight: 1.5 }}>
                &ldquo;{businessName}: we treat your home like ours.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      {team.length > 0 && (
        <section style={{ padding: '3.5rem 1rem', backgroundColor: '#EDE5D2', borderTop: '1px solid #E0D7C0', borderBottom: '1px solid #E0D7C0' }}>
          <div className="max-w-5xl mx-auto">
            <p style={{ ...SERIF, fontStyle: 'italic', fontSize: 14, color: '#B85C38', textAlign: 'center', marginBottom: '0.5rem' }}>the folks doing the work</p>
            <h2 style={{ ...SERIF, fontSize: 'clamp(26px,3vw,36px)', fontWeight: 600, color: '#2D4A2B', textAlign: 'center', marginBottom: '2rem' }}>Meet the team</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1.25rem' }}>
              {team.map((m) => (
                <div key={m.id} style={{ backgroundColor: '#fff', border: '1px solid #E0D7C0', borderRadius: 8, padding: '1.25rem', textAlign: 'center' }}>
                  <h3 style={{ ...SERIF, fontSize: 18, fontWeight: 600, color: '#2D4A2B', marginBottom: 4 }}>{m.name}</h3>
                  {m.title && <p style={{ ...SERIF, fontStyle: 'italic', fontSize: 13, color: '#B85C38', marginBottom: '0.5rem' }}>{m.title}</p>}
                  {m.bio && <p style={{ ...BODY, fontSize: 13, color: '#5A554A', lineHeight: 1.6 }}>{m.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ padding: '3.5rem 1rem', textAlign: 'center', backgroundColor: '#2D4A2B' }}>
        <h2 style={{ ...SERIF, fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 600, color: '#F5F0E5', marginBottom: '1rem' }}>Ready when you are</h2>
        <p style={{ ...BODY, fontSize: 16, color: '#D4CDB8', marginBottom: '1.5rem' }}>Get a free quote — same-day service available.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
          <Link href="/quote" style={{ ...BODY, display: 'inline-block', backgroundColor: '#B85C38', color: '#F5F0E5', fontWeight: 600, fontSize: 15, padding: '0.85rem 2rem', borderRadius: 999, textDecoration: 'none' }}>Get Your Quote</Link>
          {phone && <a href={`tel:${phone.replace(/\D/g,'')}`} style={{ ...BODY, display: 'inline-block', border: '2px solid #F5F0E5', color: '#F5F0E5', fontWeight: 500, fontSize: 15, padding: '0.85rem 2rem', borderRadius: 999, textDecoration: 'none' }}>Call {formatPhone(phone)}</a>}
        </div>
      </section>
    </div>
  );
}
