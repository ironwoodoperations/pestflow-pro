import Link from 'next/link';

// PR C: copy is prop-driven per vertical. Previously this banner rendered a
// hardcoded capacity promise for every tenant and hardcoded the pest CTA label.
// PR D: that promise is retired platform-wide, so DEFAULT_STRAPLINE now tracks
// the pest preset's conduct claim rather than the string it replaced. The
// defaults exist so a caller that passes nothing still matches the pest preset.
const DEFAULT_GENERIC_INTRO = 'Professional pest control, on your schedule.';
const DEFAULT_STRAPLINE = 'Every visit starts with an inspection.';
const DEFAULT_PRIMARY_LABEL = 'Schedule Inspection';

interface Props {
  phone?: string | null;
  businessName?: string | null;
  genericIntro?: string;
  strapline?: string;
  primaryLabel?: string;
}

export function CtaBanner({
  phone,
  businessName,
  genericIntro = DEFAULT_GENERIC_INTRO,
  strapline = DEFAULT_STRAPLINE,
  primaryLabel = DEFAULT_PRIMARY_LABEL,
}: Props) {
  return (
    <section className="py-20 relative overflow-hidden" style={{ backgroundColor: 'var(--color-bg-cta)' }}>
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(45deg, white 25%, transparent 25%), linear-gradient(-45deg, white 25%, transparent 25%)', backgroundSize: '8px 8px' }} />
      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-accent)' }}>Ready to Get Started?</p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Get Started Today</h2>
        <p className="text-white/70 text-lg mb-10">
          {businessName ? `${businessName} is ready to help.` : genericIntro} {strapline}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/quote" className="font-semibold px-8 py-3.5 rounded-lg text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
            {primaryLabel}
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
