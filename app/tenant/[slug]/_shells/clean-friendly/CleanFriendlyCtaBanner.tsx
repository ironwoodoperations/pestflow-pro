import Link from 'next/link';
import { formatPhone } from '../../../../../shared/lib/formatPhone';


// PR D: `strapline` is optional with NO default and the paragraph is guarded.
// The former hardcoded line — "Same-day and next-day appointments available.
// No contracts required." — was a capacity promise plus a business-terms
// promise, neither verified for any tenant. It cannot be the default (that
// reintroduces the defect), and a pest claim cannot be the default either on a
// shell that may serve any vertical. So: nothing true to say -> render nothing.
interface Props { phone?: string; ctaText?: string; strapline?: string }

export function CleanFriendlyCtaBanner({ phone, ctaText = 'Get a free quote', strapline }: Props) {
  return (
    <section style={{ backgroundColor: 'var(--cf-bg-sky)', borderTop: '1px solid var(--cf-divider)', padding: '4rem 1rem', textAlign: 'center' }}>
      <div className="max-w-2xl mx-auto">
        <p style={{ fontFamily: "Georgia,'Source Serif Pro',serif", fontStyle: 'italic', fontSize: 14, color: 'var(--cf-ink-secondary)', marginBottom: '0.75rem' }}>
          ready when you are
        </p>
        <h2 style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 'clamp(24px,4vw,42px)', color: 'var(--cf-ink)', marginBottom: '0.75rem', lineHeight: 1.2 }}>
          A quieter, safer home starts with one call
        </h2>
        {strapline && (
          <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 400, fontSize: 16, color: 'var(--cf-ink-secondary)', marginBottom: '2rem', lineHeight: 1.65 }}>
            {strapline}
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
          <Link href="/quote" style={{ display: 'inline-block', backgroundColor: 'var(--cf-ink)', color: 'var(--cf-surface)', fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 16, padding: '0.85rem 2rem', borderRadius: 28, textDecoration: 'none' }}>
            {ctaText}
          </Link>
          {phone && (
            <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ display: 'inline-block', border: '1px solid var(--cf-ink)', color: 'var(--cf-ink)', fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 16, padding: '0.85rem 2rem', borderRadius: 28, textDecoration: 'none', backgroundColor: 'transparent' }}>
              {formatPhone(phone)}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
