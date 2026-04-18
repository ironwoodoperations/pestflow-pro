import { formatPhone } from '../../../../../shared/lib/formatPhone';

interface Props { phone?: string; tenantSlug: string }

export function RusticRuggedCtaBanner({ phone, tenantSlug }: Props) {
  return (
    <section className="py-14 px-4 text-center" style={{ backgroundColor: 'var(--color-primary)' }}>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Ready to Protect Your Home or Business?
        </h2>
        {phone && (
          <a href={`tel:${phone.replace(/\D/g, '')}`} className="block text-2xl md:text-3xl font-bold text-white mb-6 transition hover:opacity-80">
            {formatPhone(phone)}
          </a>
        )}
        <a href={`/tenant/${tenantSlug}/quote`} className="inline-block font-bold rounded px-10 py-3 text-white transition hover:opacity-90"
          style={{ backgroundColor: '#1a1a1a' }}>
          Free Estimate
        </a>
      </div>
    </section>
  );
}
