import Link from 'next/link';
import { VitaGlowGlyph, GoldDivider, resolveBookingHref, VG_A11Y_CSS } from './VitaGlowGlyph';

// Editorial about page. All prose (heroTitle, heroSub, intro paragraphs, team)
// is resolved from page_content / team_members by the route and passed in — the
// component hardcodes no copy.
interface TeamMember { id: string; name: string; title?: string; bio?: string; photo_url?: string }
interface Props {
  heroTitle: string;
  heroSub: string;
  introParagraphs: string[];
  team: TeamMember[];
  aboutImage?: string;
  businessName: string;
  bookingUrl?: string | null;
}

const display = (size: string): React.CSSProperties => ({
  fontFamily: 'var(--vg-font-display)', fontWeight: 300, fontSize: size,
  letterSpacing: 'var(--vg-tracking-display)', lineHeight: 'var(--vg-line-tight)', margin: 0, color: 'var(--vg-espresso)',
});
const eyebrow: React.CSSProperties = {
  fontFamily: 'var(--vg-font-body)', fontWeight: 500, fontSize: 12.5,
  letterSpacing: 'var(--vg-tracking-wide)', textTransform: 'uppercase', color: 'var(--vg-gold)',
};
const espressoBtn: React.CSSProperties = {
  display: 'inline-block', background: 'var(--vg-espresso)', color: 'var(--vg-on-espresso)',
  fontFamily: 'var(--vg-font-body)', fontWeight: 500, fontSize: 12.5, letterSpacing: 'var(--vg-tracking-wide)',
  textTransform: 'uppercase', padding: '0.9rem 2rem', borderRadius: 'var(--vg-radius)', textDecoration: 'none',
  border: '1px solid var(--vg-espresso)',
};

function BookCta({ bookingUrl }: { bookingUrl?: string | null }) {
  const { href, external } = resolveBookingHref(bookingUrl);
  return external
    ? <a className="vg-btn vg-focus" href={href} target="_blank" rel="noopener noreferrer" style={espressoBtn}>Book a Consult</a>
    : <Link className="vg-btn vg-focus" href={href} style={espressoBtn}>Book a Consult</Link>;
}

export function VitaGlowAboutPage({ heroTitle, heroSub, introParagraphs, team, aboutImage, businessName, bookingUrl }: Props) {
  return (
    <div style={{ background: 'var(--vg-cream)', color: 'var(--vg-text)', fontFamily: 'var(--vg-font-body)' }}>
      <style>{VG_A11Y_CSS}</style>
      {/* HERO */}
      <section style={{ padding: '4.5rem 1.5rem 3.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><VitaGlowGlyph size={44} tone="gold" /></div>
        <p style={{ ...eyebrow, marginTop: '1.25rem' }}>Our Practice</p>
        <h1 style={{ ...display('clamp(40px,6vw,72px)'), marginTop: '0.9rem' }}>{heroTitle}</h1>
        {heroSub && <p style={{ marginTop: '1.5rem', fontFamily: 'var(--vg-font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(19px,2.2vw,24px)', lineHeight: 'var(--vg-line-body)', color: 'var(--vg-taupe)', maxWidth: '52ch', marginInline: 'auto' }}>{heroSub}</p>}
      </section>

      <GoldDivider />

      {/* STORY — asymmetric: image left, prose right */}
      <section style={{ padding: '4.5rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '3rem', alignItems: 'center' }}>
          <div style={{ border: '1px solid var(--vg-hairline-strong)', background: 'var(--vg-cream-2)', minHeight: 340, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {aboutImage
              ? <img src={aboutImage} alt={businessName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <VitaGlowGlyph size={140} tone="gold" />}
          </div>
          <div>
            <p style={eyebrow}>{businessName}</p>
            {introParagraphs.map((p, i) => (
              <p key={i} style={{ marginTop: i === 0 ? '1.25rem' : '1rem', fontWeight: 300, fontSize: 16, lineHeight: 'var(--vg-line-body)', color: 'var(--vg-espresso)' }}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM (optional) */}
      {team.length > 0 && (
        <>
          <GoldDivider />
          <section style={{ padding: '4.5rem 1.5rem' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <p style={{ ...eyebrow, textAlign: 'center' }}>The Team</p>
              <h2 style={{ ...display('clamp(28px,4vw,44px)'), textAlign: 'center', marginTop: '0.75rem' }}>Care, credentialed</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '2rem', marginTop: '3rem' }}>
                {team.map((m) => (
                  <div key={m.id} style={{ textAlign: 'center' }}>
                    <div style={{ width: 120, height: 120, margin: '0 auto', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--vg-hairline-strong)', background: 'var(--vg-cream-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {m.photo_url
                        ? <img src={m.photo_url} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <VitaGlowGlyph size={44} tone="gold" />}
                    </div>
                    <p style={{ ...display('22px'), marginTop: '1rem' }}>{m.name}</p>
                    {m.title && <p style={{ ...eyebrow, color: 'var(--vg-taupe)', marginTop: '0.4rem' }}>{m.title}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <GoldDivider />

      {/* CTA (cream, espresso ink + button — NO dark panel) */}
      <section style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <VitaGlowGlyph size={38} tone="gold" />
        <h2 style={{ ...display('clamp(30px,4.5vw,50px)'), marginTop: '1.25rem' }}>Meet us in person</h2>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <BookCta bookingUrl={bookingUrl} />
        </div>
      </section>
    </div>
  );
}
