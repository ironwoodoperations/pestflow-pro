import Link from 'next/link';

interface Props {
  businessName: string;
  intro?: string;
  photoUrl?: string;
}

export function BoldLocalAboutStrip({ businessName, intro, photoUrl }: Props) {
  const body = intro || `${businessName} is a locally owned pest control company serving this area with licensed technicians and a satisfaction guarantee on every job.`;

  return (
    <section style={{ backgroundColor: 'var(--bl-surface-2)', borderBottom: '1px solid var(--bl-border)' }}>
      <div className="max-w-6xl mx-auto" style={{ display: 'grid', gridTemplateColumns: '1fr', minHeight: 280 }}>
        {photoUrl && (
          <div style={{ overflow: 'hidden', minHeight: 220 }}>
            <img src={photoUrl} alt={`${businessName} team`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 220 }} loading="lazy" />
          </div>
        )}
        <div style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 11, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--bl-accent)', marginBottom: '0.5rem' }}>
            About us
          </p>
          <h2 style={{ fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)", fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--bl-text)', marginBottom: '1rem', lineHeight: 1.1 }}>
            Experience the difference with {businessName}
          </h2>
          <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 15, color: 'var(--bl-text-secondary)', lineHeight: 1.65, marginBottom: '1.5rem', maxWidth: '52ch' }}>
            {body}
          </p>
          <Link href="/about" style={{ display: 'inline-block', border: '1px solid var(--bl-accent)', color: 'var(--bl-accent)', fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 14, padding: '0.6rem 1.25rem', borderRadius: 0, textDecoration: 'none', alignSelf: 'flex-start' }}>
            Learn more about us
          </Link>
        </div>
      </div>
      <style>{`@media(min-width:768px){.bl-about-grid{grid-template-columns:1fr 1fr !important}}`}</style>
    </section>
  );
}
