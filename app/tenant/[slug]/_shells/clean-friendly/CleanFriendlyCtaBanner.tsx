import Link from 'next/link';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

interface Props {
  phone: string;
  ctaText: string;
}

export function CleanFriendlyCtaBanner({ phone, ctaText }: Props) {
  return (
    <section style={{ background: 'var(--color-primary)' }} className="py-14 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-on-primary)' }}>
          Ready to Protect Your Home?
        </h2>
        {phone && (
          <p className="text-lg mb-6" style={{ color: 'var(--color-text-on-primary)', opacity: 0.9 }}>
            Call us: {formatPhone(phone)}
          </p>
        )}
        <div className="flex flex-wrap gap-4 justify-center">
          {phone && (
            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              className="px-8 py-4 rounded-lg font-bold text-base border-2"
              style={{ borderColor: 'var(--color-text-on-primary)', color: 'var(--color-text-on-primary)' }}
            >
              {formatPhone(phone)}
            </a>
          )}
          <Link
            href="/quote"
            className="px-8 py-4 rounded-lg font-bold text-base"
            style={{ background: 'var(--color-accent)', color: 'var(--color-heading)' }}
          >
            {ctaText || 'Get a Free Quote'}
          </Link>
        </div>
      </div>
    </section>
  );
}
