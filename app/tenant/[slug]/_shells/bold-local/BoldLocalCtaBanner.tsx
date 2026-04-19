import Link from 'next/link';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

interface Props { phone?: string; ctaText?: string }

export function BoldLocalCtaBanner({ phone, ctaText }: Props) {
  return (
    <section className="py-16 px-4 text-center" style={{ backgroundColor: 'var(--color-primary)' }}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--color-text-on-primary)' }}>
          Ready to Protect Your Home or Business?
        </h2>
        {phone && (
          <a href={`tel:${phone.replace(/\D/g, '')}`}
            className="block text-2xl md:text-3xl font-bold mb-6 transition hover:opacity-80"
            style={{ color: 'var(--color-text-on-primary)' }}>
            {formatPhone(phone)}
          </a>
        )}
        <Link href="/quote" className="inline-block font-bold rounded-full px-10 py-4 text-lg transition hover:opacity-90"
          style={{ backgroundColor: '#ffffff', color: 'var(--color-primary)' }}>
          {ctaText || 'Get a Free Quote'}
        </Link>
      </div>
    </section>
  );
}
