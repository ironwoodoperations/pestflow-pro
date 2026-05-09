import Link from 'next/link';

interface TeamMember { id: string; name: string; title?: string; bio?: string; photo_url?: string }

interface Props {
  heroTitle: string;
  heroSub: string;
  heroImageUrl: string | null;
  aboutImage: string;
  team: TeamMember[];
  foundedYear?: string;
  businessName: string;
  licenseNumber?: string;
}

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--bl-font-body)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 'var(--bl-letter-spacing-wide)',
  textTransform: 'uppercase',
  color: 'var(--bl-accent)',
};

const HEAD: React.CSSProperties = {
  fontFamily: 'var(--bl-font-display)',
  fontWeight: 700,
  letterSpacing: 'var(--bl-letter-spacing-tight)',
  color: 'var(--bl-text)',
  textTransform: 'uppercase',
  lineHeight: 'var(--bl-line-height-tight)',
};

const BELIEFS = [
  { num: '01', title: 'Local first', desc: 'Born here. Operate here. Every dollar stays in this community.' },
  { num: '02', title: 'No contracts', desc: 'You hire us because we earn it, not because you signed a 24-month deal.' },
  { num: '03', title: 'Show up fast', desc: 'Same-day strikes. We dispatch within an hour of your call.' },
];

export function BoldLocalAboutPage({ heroTitle, heroSub, heroImageUrl, aboutImage, team, foundedYear, businessName, licenseNumber }: Props) {
  const since = foundedYear ? `Since ${foundedYear}` : 'Established';

  return (
    <div style={{ backgroundColor: 'var(--bl-surface)' }}>

      {/* Stark hero */}
      <section style={{ backgroundColor: 'var(--bl-surface)', borderBottom: '2px solid var(--bl-accent)', padding: 'var(--bl-space-2xl) 1rem' }}>
        <div className="max-w-5xl mx-auto" style={{ textAlign: 'center' }}>
          <p style={{ ...EYEBROW, marginBottom: 'var(--bl-space-md)', fontSize: 13 }}>{since}</p>
          <h1 style={{ ...HEAD, fontSize: 'clamp(40px,7vw,80px)', marginBottom: 'var(--bl-space-md)' }}>
            {heroTitle}
          </h1>
          <p style={{ fontFamily: 'var(--bl-font-body)', fontSize: 17, color: 'var(--bl-text-secondary)', lineHeight: 'var(--bl-line-height-loose)', maxWidth: '60ch', margin: '0 auto' }}>
            {heroSub}
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section style={{ backgroundColor: 'var(--bl-surface-2)' }}>
        <div className="max-w-6xl mx-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {[
            { num: foundedYear ? new Date().getFullYear() - Number(foundedYear) + '+' : '15+', label: 'Years' },
            { num: '4,200+', label: 'Customers' },
            { num: '12,000+', label: 'Treatments' },
            { num: licenseNumber || 'Licensed', label: 'License #' },
          ].map((c, i) => (
            <div key={c.label} style={{ padding: 'var(--bl-space-md)', textAlign: 'center', borderRight: i < 3 ? '1px solid var(--bl-border)' : 'none' }}>
              <span style={{ display: 'block', ...HEAD, fontSize: 'clamp(20px,3vw,28px)', color: 'var(--bl-accent)' }}>{c.num}</span>
              <span style={{ display: 'block', fontFamily: 'var(--bl-font-body)', fontSize: 10, fontWeight: 600, letterSpacing: 'var(--bl-letter-spacing-wide)', textTransform: 'uppercase', color: 'var(--bl-text-muted)', marginTop: 4 }}>{c.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Manifesto / founder */}
      <section style={{ padding: 'var(--bl-space-2xl) 1rem' }}>
        <div className="max-w-6xl mx-auto" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--bl-space-xl)' }}>
          <style>{`@media(min-width:768px){.bl-about-grid{grid-template-columns:1fr 1.2fr !important}}`}</style>
          <div className="bl-about-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--bl-space-xl)', alignItems: 'start' }}>
            {(aboutImage || heroImageUrl) && (
              <div style={{ overflow: 'hidden', border: '2px solid var(--bl-accent)', aspectRatio: '4/5', maxHeight: 540 }}>
                <img src={aboutImage || heroImageUrl || ''} alt="Our crew" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'contrast(1.05) saturate(0.95)' }} />
              </div>
            )}
            <div>
              <p style={{ ...EYEBROW, marginBottom: 'var(--bl-space-md)' }}>Why we built this</p>
              <h2 style={{ ...HEAD, fontSize: 'clamp(28px,4vw,44px)', marginBottom: 'var(--bl-space-md)' }}>
                We built {businessName} because pest control got soft.
              </h2>
              <p style={{ fontFamily: 'var(--bl-font-body)', fontSize: 16, color: 'var(--bl-text-secondary)', lineHeight: 'var(--bl-line-height-loose)', marginBottom: 'var(--bl-space-md)' }}>
                Big-box exterminators care about contracts and call-center scripts. We don&apos;t. We hit the problem hard,
                stand behind the work, and answer our own phones.
              </p>
              <p style={{ fontFamily: 'var(--bl-font-body)', fontSize: 16, color: 'var(--bl-text-secondary)', lineHeight: 'var(--bl-line-height-loose)' }}>
                Every technician on our crew is licensed, insured, and trained the same way: identify the source, neutralize it,
                and don&apos;t leave until it&apos;s done.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What we believe */}
      <section style={{ backgroundColor: 'var(--bl-surface-2)', borderTop: '2px solid var(--bl-accent)', borderBottom: '2px solid var(--bl-accent)', padding: 'var(--bl-space-2xl) 1rem' }}>
        <div className="max-w-6xl mx-auto">
          <p style={{ ...EYEBROW, marginBottom: 'var(--bl-space-sm)', textAlign: 'center' }}>The code we run by</p>
          <h2 style={{ ...HEAD, fontSize: 'clamp(28px,4vw,44px)', textAlign: 'center', marginBottom: 'var(--bl-space-xl)' }}>What we believe</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 0, border: '1px solid var(--bl-border-strong)' }}>
            {BELIEFS.map((b, i) => (
              <div key={b.num} style={{ padding: 'var(--bl-space-lg)', borderRight: '1px solid var(--bl-border-strong)', borderBottom: i < BELIEFS.length - 1 ? '1px solid var(--bl-border-strong)' : 'none' }}>
                <div style={{ ...HEAD, fontSize: 28, color: 'var(--bl-accent)', marginBottom: 'var(--bl-space-sm)' }}>{b.num}</div>
                <h3 style={{ ...HEAD, fontSize: 20, marginBottom: 'var(--bl-space-sm)' }}>{b.title}</h3>
                <p style={{ fontFamily: 'var(--bl-font-body)', fontSize: 14, color: 'var(--bl-text-secondary)', lineHeight: 'var(--bl-line-height-loose)' }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      {team.length > 0 && (
        <section style={{ padding: 'var(--bl-space-2xl) 1rem' }}>
          <div className="max-w-6xl mx-auto">
            <p style={{ ...EYEBROW, marginBottom: 'var(--bl-space-sm)', textAlign: 'center' }}>The crew</p>
            <h2 style={{ ...HEAD, fontSize: 'clamp(28px,4vw,44px)', textAlign: 'center', marginBottom: 'var(--bl-space-xl)' }}>Meet the team</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 0, border: '1px solid var(--bl-border)' }}>
              {team.map((m, i) => (
                <div key={m.id} style={{ padding: 'var(--bl-space-lg)', textAlign: 'left', borderRight: '1px solid var(--bl-border)', borderBottom: i < team.length - 1 ? '1px solid var(--bl-border)' : 'none', backgroundColor: 'var(--bl-surface-2)' }}>
                  <div style={{ width: 80, height: 80, overflow: 'hidden', backgroundColor: 'var(--bl-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--bl-space-md)' }}>
                    {m.photo_url
                      ? <img src={m.photo_url} alt={m.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.4) contrast(1.1)' }} />
                      : <span style={{ ...HEAD, fontSize: 22 }}>{m.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</span>}
                  </div>
                  <h3 style={{ ...HEAD, fontSize: 18, marginBottom: 4 }}>{m.name}</h3>
                  {m.title && <p style={{ ...EYEBROW, fontSize: 11, marginBottom: 'var(--bl-space-sm)' }}>{m.title}</p>}
                  {m.bio && <p style={{ fontFamily: 'var(--bl-font-body)', fontSize: 13, color: 'var(--bl-text-secondary)', lineHeight: 'var(--bl-line-height-loose)' }}>{m.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ backgroundColor: 'var(--bl-accent)', padding: 'var(--bl-space-2xl) 1rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--bl-font-display)', fontWeight: 700, fontSize: 'clamp(28px,4.5vw,48px)', color: 'var(--bl-surface)', textTransform: 'uppercase', letterSpacing: 'var(--bl-letter-spacing-tight)', marginBottom: 'var(--bl-space-md)', lineHeight: 'var(--bl-line-height-tight)' }}>
          Ready to strike back?
        </h2>
        <Link href="/quote" style={{ display: 'inline-block', backgroundColor: 'var(--bl-surface)', color: 'var(--bl-accent)', fontFamily: 'var(--bl-font-display)', fontWeight: 700, fontSize: 18, letterSpacing: 'var(--bl-letter-spacing-wide)', padding: '1rem 2.5rem', textTransform: 'uppercase', textDecoration: 'none' }}>
          Get a Free Quote
        </Link>
      </section>
    </div>
  );
}
