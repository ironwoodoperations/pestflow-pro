import Link from 'next/link';
import type { ResolvedStat } from '../../_lib/aboutStats';

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
  /** PR F: resolved from settings.about. Empty = render no stat block at all. */
  stats?: ResolvedStat[];
}

const SERIF: React.CSSProperties = { fontFamily: 'var(--cf-font-display)', fontStyle: 'italic' };
const BODY: React.CSSProperties = { fontFamily: 'var(--cf-font-body)' };

const VALUES = [
  { title: 'Family-first', desc: 'We treat every home like our own — kid-safe, pet-safe, never an upsell.' },
  { title: 'Science-backed', desc: 'Integrated Pest Management — root-cause solutions, not symptom sprays.' },
  { title: 'Honest pricing', desc: 'You get the quote before we treat. No hidden fees, ever.' },
];

export function CleanFriendlyAboutPage({ stats = [], heroTitle, heroSub, heroImageUrl, aboutImage, team, foundedYear, businessName, introParagraphs }: Props) {
  const sinceLine = foundedYear ? `since ${foundedYear}` : 'family-owned';
  const paragraphs = introParagraphs && introParagraphs.length > 0
    ? introParagraphs
    : [`${businessName} started with one belief: that families deserve pest control that's safe, honest, and effective. We're local, we're licensed, and we treat every home with the same care we'd give our own.`];

  return (
    <div style={{ backgroundColor: 'var(--cf-surface)' }}>

      {/* Soft serif hero */}
      <section style={{ backgroundColor: 'var(--cf-bg-cream)', borderBottom: '1px solid var(--cf-divider)', padding: 'var(--cf-space-2xl) 1rem' }}>
        <div className="max-w-3xl mx-auto" style={{ textAlign: 'center' }}>
          <p style={{ ...SERIF, fontSize: 14, color: 'var(--cf-ink-secondary)', marginBottom: 'var(--cf-space-sm)' }}>{sinceLine}</p>
          <h1 style={{ ...BODY, fontSize: 'clamp(36px,6vw,60px)', fontWeight: 'var(--cf-font-weight-medium)' as React.CSSProperties['fontWeight'], color: 'var(--cf-ink)', marginBottom: 'var(--cf-space-md)', lineHeight: 'var(--cf-line-height-tight)' }}>
            {heroTitle}
          </h1>
          <p style={{ ...SERIF, fontSize: 18, color: 'var(--cf-ink-secondary)', lineHeight: 'var(--cf-line-height-loose)' }}>
            {heroSub}
          </p>
        </div>
      </section>

      {/* Founder photo + pull-quote */}
      <section style={{ padding: 'var(--cf-space-2xl) 1rem' }}>
        <div className="max-w-5xl mx-auto" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--cf-space-xl)', alignItems: 'center' }}>
          <style>{`@media(min-width:768px){.cf-about-grid{grid-template-columns:1fr 1.1fr !important}}`}</style>
          <div className="cf-about-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--cf-space-xl)', alignItems: 'center' }}>
            {(aboutImage || heroImageUrl) && (
              <div style={{ borderRadius: 'var(--cf-radius-lg)', overflow: 'hidden', border: '1px solid var(--cf-divider)', boxShadow: 'var(--cf-shadow-md)', aspectRatio: '4/5', maxHeight: 480 }}>
                <img src={aboutImage || heroImageUrl || ''} alt="Our team" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            )}
            <div>
              <p style={{ ...SERIF, fontSize: 13, color: 'var(--cf-ink-secondary)', marginBottom: 'var(--cf-space-sm)' }}>our story</p>
              <h2 style={{ ...BODY, fontSize: 'clamp(24px,3.2vw,36px)', fontWeight: 500, color: 'var(--cf-ink)', marginBottom: 'var(--cf-space-md)', lineHeight: 'var(--cf-line-height-tight)' }}>
                A neighborhood pest control company you can trust
              </h2>
              {paragraphs.map((p, i) => (
                <p key={i} style={{ ...BODY, fontSize: 16, color: 'var(--cf-ink-secondary)', lineHeight: 'var(--cf-line-height-loose)', marginBottom: 'var(--cf-space-md)' }}>
                  {p}
                </p>
              ))}
              <blockquote style={{ ...SERIF, fontSize: 20, color: 'var(--cf-ink)', borderLeft: '3px solid var(--cf-mint)', paddingLeft: 'var(--cf-space-md)', lineHeight: 1.5 }}>
                &ldquo;Do the job right the first time, treat people like neighbors.&rdquo;
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Values cards */}
      <section style={{ backgroundColor: 'var(--cf-bg-mint)', borderTop: '1px solid var(--cf-divider)', borderBottom: '1px solid var(--cf-divider)', padding: 'var(--cf-space-2xl) 1rem' }}>
        <div className="max-w-5xl mx-auto">
          <div style={{ textAlign: 'center', marginBottom: 'var(--cf-space-xl)' }}>
            <p style={{ ...SERIF, fontSize: 13, color: 'var(--cf-ink-secondary)', marginBottom: 'var(--cf-space-sm)' }}>what we stand for</p>
            <h2 style={{ ...BODY, fontSize: 'clamp(22px,3vw,32px)', fontWeight: 500, color: 'var(--cf-ink)', lineHeight: 'var(--cf-line-height-tight)' }}>Our values</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 'var(--cf-space-md)' }}>
            {VALUES.map((v) => (
              <div key={v.title} style={{ backgroundColor: 'var(--cf-surface-card)', border: '1px solid var(--cf-divider)', borderRadius: 'var(--cf-radius-md)', padding: 'var(--cf-space-lg)', boxShadow: 'var(--cf-shadow-sm)' }}>
                <p style={{ ...SERIF, fontSize: 12, color: 'var(--cf-mint)', marginBottom: 'var(--cf-space-xs)' }}>+</p>
                <h3 style={{ ...BODY, fontSize: 17, fontWeight: 500, color: 'var(--cf-ink)', marginBottom: 'var(--cf-space-sm)' }}>{v.title}</h3>
                <p style={{ ...BODY, fontSize: 14, color: 'var(--cf-ink-secondary)', lineHeight: 'var(--cf-line-height-loose)' }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Soft milestone strip — PR F: DB-driven, and absent entirely when the
          tenant has configured no stats. The three tiles that used to live here
          ('15+ Years experience', '4,200+ Homes protected', '98% Customer
          satisfaction') were invented for every tenant on this shell. */}
      {stats.length > 0 && (
      <section style={{ backgroundColor: 'var(--cf-bg-sky)', padding: 'var(--cf-space-xl) 1rem' }}>
        <div className="max-w-5xl mx-auto">
          {/* PR F: the phantom .cf-stats div is gone. The media query targeted a
              class that sat on an EMPTY display:contents SIBLING inside the grid,
              never on the grid container itself, so it has never applied and the
              strip was 2-up at every width — confirmed in production HTML. The
              container is now responsive directly and derives from the tile
              count, so it is correct for one tile or four. */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 'var(--cf-space-md)' }}>
            {stats.map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ ...BODY, fontSize: 'clamp(20px,2.6vw,28px)', fontWeight: 500, color: 'var(--cf-ink)', lineHeight: 'var(--cf-line-height-tight)' }}>{s.value}</div>
                <div style={{ ...SERIF, fontSize: 12, color: 'var(--cf-ink-secondary)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Team */}
      {team.length > 0 && (
        <section style={{ backgroundColor: 'var(--cf-surface)', borderTop: '1px solid var(--cf-divider)', padding: 'var(--cf-space-2xl) 1rem' }}>
          <div className="max-w-6xl mx-auto">
            <div style={{ textAlign: 'center', marginBottom: 'var(--cf-space-xl)' }}>
              <p style={{ ...SERIF, fontSize: 13, color: 'var(--cf-ink-secondary)', marginBottom: 'var(--cf-space-sm)' }}>the people behind the work</p>
              <h2 style={{ ...BODY, fontSize: 'clamp(22px,3vw,32px)', fontWeight: 500, color: 'var(--cf-ink)', lineHeight: 'var(--cf-line-height-tight)' }}>Meet our team</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 'var(--cf-space-md)' }}>
              {team.map((m) => (
                <div key={m.id} style={{ backgroundColor: 'var(--cf-surface-card)', border: '1px solid var(--cf-divider)', borderRadius: 'var(--cf-radius-md)', padding: 'var(--cf-space-lg)', textAlign: 'center', boxShadow: 'var(--cf-shadow-sm)' }}>
                  <div style={{ width: 96, height: 96, borderRadius: 'var(--cf-radius-pill)', overflow: 'hidden', margin: '0 auto var(--cf-space-md)', backgroundColor: 'var(--cf-bg-sky)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {m.photo_url
                      ? <img src={m.photo_url} alt={m.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ ...BODY, fontWeight: 500, fontSize: 22, color: 'var(--cf-ink)' }}>{m.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</span>}
                  </div>
                  <h3 style={{ ...BODY, fontWeight: 500, fontSize: 16, color: 'var(--cf-ink)', marginBottom: 4 }}>{m.name}</h3>
                  {m.title && <p style={{ ...SERIF, fontSize: 13, color: 'var(--cf-ink-secondary)' }}>{m.title}</p>}
                  {m.bio && <p style={{ ...BODY, fontSize: 13, color: 'var(--cf-ink-muted)', marginTop: 'var(--cf-space-sm)', lineHeight: 'var(--cf-line-height-loose)' }}>{m.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ backgroundColor: 'var(--cf-bg-cream)', borderTop: '1px solid var(--cf-divider)', padding: 'var(--cf-space-2xl) 1rem', textAlign: 'center' }}>
        <div className="max-w-xl mx-auto">
          <p style={{ ...SERIF, fontSize: 14, color: 'var(--cf-ink-secondary)', marginBottom: 'var(--cf-space-sm)' }}>ready when you are</p>
          <h2 style={{ ...BODY, fontSize: 'clamp(22px,3vw,32px)', fontWeight: 500, color: 'var(--cf-ink)', marginBottom: 'var(--cf-space-sm)', lineHeight: 'var(--cf-line-height-tight)' }}>Ready to be pest-free?</h2>
          <p style={{ ...BODY, fontSize: 16, color: 'var(--cf-ink-secondary)', marginBottom: 'var(--cf-space-lg)', lineHeight: 'var(--cf-line-height-loose)' }}>Get your free quote today.</p>
          <Link href="/quote" style={{ display: 'inline-block', backgroundColor: 'var(--cf-ink)', color: 'var(--cf-surface)', ...BODY, fontWeight: 500, fontSize: 16, padding: '0.85rem 2rem', borderRadius: 'var(--cf-radius-pill)', textDecoration: 'none' }}>
            Get a free quote
          </Link>
        </div>
      </section>
    </div>
  );
}
