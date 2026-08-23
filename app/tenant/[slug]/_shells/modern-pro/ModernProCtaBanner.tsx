import { formatPhone } from '../../../../../shared/lib/formatPhone';

// 5b: heading/subheading are props from page.tsx — no default banner copy here.
interface Props {
  heading: string;
  subheading: string;
  phone: string;
  ctaText: string;
}

export function ModernProCtaBanner({ heading, subheading, phone, ctaText }: Props) {
  return (
    <section style={{ background: 'var(--color-primary)' }} className="py-14 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl font-bold" style={{ color: '#ffffff' }}>
          {heading}
        </h2>
        <p className="text-lg mt-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
          {subheading}
        </p>
        <div className="flex flex-wrap gap-4 justify-center mt-8">
          {phone && (
            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              className="px-8 py-4 rounded-lg font-bold text-lg"
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                border: '2px solid rgba(255,255,255,0.5)',
              }}
            >
              {formatPhone(phone)}
            </a>
          )}
          <a
            href="/quote"
            className="px-8 py-4 rounded-lg font-bold text-lg"
            style={{ background: '#ffffff', color: 'var(--color-primary)' }}
          >
            {ctaText || 'Get a Free Quote'}
          </a>
        </div>
      </div>
    </section>
  );
}
