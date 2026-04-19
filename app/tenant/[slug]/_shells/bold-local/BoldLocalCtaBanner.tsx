import Link from 'next/link';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

interface Props { phone?: string; ctaText?: string }

export function BoldLocalCtaBanner({ phone, ctaText = 'Get a free quote' }: Props) {
  return (
    <section style={{ backgroundColor: 'var(--bl-surface-2)', borderTop: '2px solid var(--bl-accent)', padding: '4rem 1rem', textAlign: 'center' }}>
      <div className="max-w-2xl mx-auto">
        <h2 style={{ fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)", fontSize: 'clamp(28px,5vw,48px)', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--bl-text)', marginBottom: '0.75rem', lineHeight: 1.08 }}>
          Ready to get rid of the problem?
        </h2>
        <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 16, color: 'var(--bl-text-secondary)', marginBottom: '2rem', lineHeight: 1.5 }}>
          Same-day and next-day appointments available. No contracts required.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
          <Link href="/quote" style={{ display: 'inline-block', backgroundColor: 'var(--bl-accent)', color: '#0F1216', fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)", fontWeight: 700, fontSize: 18, letterSpacing: '0.02em', padding: '0.9rem 2.25rem', borderRadius: 0, textDecoration: 'none' }}>
            {ctaText}
          </Link>
          {phone && (
            <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ display: 'inline-block', border: '2px solid var(--bl-accent)', color: 'var(--bl-text)', fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 16, padding: '0.9rem 2.25rem', borderRadius: 0, textDecoration: 'none' }}>
              {formatPhone(phone)}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
