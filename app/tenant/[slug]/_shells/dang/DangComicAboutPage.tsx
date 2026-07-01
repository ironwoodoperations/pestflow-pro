import Link from 'next/link';
import { CloudBottom, halftoneStyle } from './DangComicDevices';

interface TeamMember { id: string; name: string; title?: string; bio?: string; photo_url?: string }
interface Props {
  heroTitle: string;
  heroSub: string;
  heroImageUrl?: string | null;
  aboutImage: string;
  team: TeamMember[];
  foundedYear?: string;
  businessName: string;
  licenseNumber?: string;
  introParagraphs: string[];
}

const comicH = (size: string): React.CSSProperties => ({
  fontFamily: 'var(--dang-font-display)', textTransform: 'uppercase', letterSpacing: '0.02em',
  lineHeight: 'var(--dang-line-height-tight)', fontSize: size, margin: 0,
});
const orangePill: React.CSSProperties = {
  display: 'inline-block', background: 'var(--dang-orange)', color: 'var(--dang-white)', border: 'var(--dang-outline)',
  fontFamily: 'var(--dang-font-display)', textTransform: 'uppercase', letterSpacing: '0.03em',
  padding: '0.7rem 1.5rem', borderRadius: 'var(--dang-radius-pill)', textDecoration: 'none', boxShadow: 'var(--dang-shadow-comic)',
};

export function DangComicAboutPage({ heroTitle, heroSub, aboutImage, team, foundedYear, businessName, introParagraphs }: Props) {
  return (
    <div style={{ fontFamily: 'var(--dang-font-body)', color: 'var(--dang-text)' }}>
      {/* HERO */}
      <section style={{ position: 'relative', background: 'var(--dang-orange)', color: 'var(--dang-white)', padding: '3.5rem 1.25rem 4rem', textAlign: 'center' }}>
        <h1 style={{ ...comicH('clamp(34px,6vw,64px)'), color: 'var(--dang-yellow)', WebkitTextStroke: '2px var(--dang-ink)' }}>{(heroTitle || 'About Us').toUpperCase()}</h1>
        {heroSub && <p style={{ marginTop: '1rem', fontSize: 18, maxWidth: '48ch', marginInline: 'auto' }}>{heroSub}</p>}
        <CloudBottom />
      </section>

      {/* FAMILY-OWNED */}
      <section style={{ ...halftoneStyle(), background: 'var(--dang-white)', padding: '3.5rem 1.25rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '2rem', alignItems: 'center' }}>
          <div style={{ border: '4px solid var(--dang-yellow)', borderRadius: 'var(--dang-radius)', overflow: 'hidden', minHeight: 260 }}>
            <img src={aboutImage} alt={`${businessName} owners`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h2 style={{ ...comicH('clamp(26px,4vw,42px)'), color: 'var(--dang-ink)' }}>Family-Owned, Community-Driven</h2>
            {introParagraphs.map((p, i) => (
              <p key={i} style={{ marginTop: i === 0 ? '1rem' : '0.75rem', lineHeight: 'var(--dang-line-height-body)', color: 'var(--dang-text-muted)' }}>{p}</p>
            ))}
            {foundedYear && <p style={{ marginTop: '1rem', ...comicH('18px'), color: 'var(--dang-orange)' }}>Serving East Texas since {foundedYear}</p>}
          </div>
        </div>
      </section>

      {/* TEAM (optional) */}
      {team.length > 0 && (
        <section style={{ background: 'var(--dang-surface-alt)', padding: '3rem 1.25rem' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ ...comicH('clamp(24px,4vw,36px)'), color: 'var(--dang-ink)', textAlign: 'center' }}>Meet the Team</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem', marginTop: '2rem' }}>
              {team.map((m) => (
                <div key={m.id} style={{ border: 'var(--dang-outline)', borderRadius: 'var(--dang-radius)', padding: '1rem', background: 'var(--dang-white)', textAlign: 'center' }}>
                  {m.photo_url && (
                    <img src={m.photo_url} alt={m.name} style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: 'var(--dang-outline)', margin: '0 auto' }} />
                  )}
                  <p style={{ ...comicH('18px'), color: 'var(--dang-ink)', marginTop: '0.5rem' }}>{m.name}</p>
                  {m.title && <p style={{ fontSize: 13, color: 'var(--dang-orange)' }}>{m.title}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* EXPERTISE (orange + cloud edges + dual CTA) */}
      <section style={{ position: 'relative', background: 'var(--dang-orange)', color: 'var(--dang-white)', padding: '4rem 1.25rem 4.5rem', textAlign: 'center' }}>
        <h2 style={{ ...comicH('clamp(26px,4vw,44px)'), color: 'var(--dang-yellow)', WebkitTextStroke: '2px var(--dang-ink)' }}>Expertise &amp; Proven Results</h2>
        <p style={{ marginTop: '1rem', maxWidth: '52ch', marginInline: 'auto', fontSize: 16 }}>
          Backed by real training, real guarantees, and a super hero response team {businessName} has become East Texas&apos;s trusted name in pest control.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          <Link href="/quote" style={{ ...orangePill, background: 'var(--dang-white)', color: 'var(--dang-ink)' }}>Get Your Quote</Link>
          <Link href="/contact" style={{ ...orangePill, background: 'var(--dang-cyan)', color: 'var(--dang-ink)' }}>Contact Us</Link>
        </div>
        <CloudBottom />
      </section>
    </div>
  );
}
