import Link from 'next/link';

interface Props { phone?: string | null; businessName?: string | null }

export function CtaBanner({ phone, businessName }: Props) {
  return (
    <section className="py-20 relative overflow-hidden" style={{ backgroundColor: 'var(--color-bg-cta)' }}>
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(45deg, white 25%, transparent 25%), linear-gradient(-45deg, white 25%, transparent 25%)', backgroundSize: '8px 8px' }} />
      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-accent)' }}>Ready to Get Started?</p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Get Started Today</h2>
        <p className="text-white/70 text-lg mb-10">
          {businessName ? `${businessName} is ready to help.` : 'Professional pest control, on your schedule.'} Same-day appointments available.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/quote" className="font-semibold px-8 py-3.5 rounded-lg text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
            Schedule Inspection
          </Link>
          {phone && (
            <a href={`tel:${phone.replace(/\D/g, '')}`} className="font-semibold px-8 py-3.5 rounded-lg transition hover:bg-white/20" style={{ border: '2px solid rgba(255,255,255,0.4)', color: '#ffffff' }}>
              Call Now
            </a>
          )}
          <Link href="/quote" className="font-semibold px-8 py-3.5 rounded-lg transition hover:bg-gray-100" style={{ backgroundColor: '#ffffff', color: '#1a1a1a' }}>
            Start Service
          </Link>
        </div>
      </div>
    </section>
  );
}
