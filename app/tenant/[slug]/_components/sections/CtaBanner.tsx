import Link from 'next/link';

// PR C made this banner's copy prop-driven per vertical; PR D retired the
// capacity promise it used to hardcode.
//
// PR E removes the three pest defaults that were left behind —
// DEFAULT_GENERIC_INTRO, DEFAULT_STRAPLINE, DEFAULT_PRIMARY_LABEL. Both callers
// now pass explicit props, so they were unreachable; and a pest default on a
// multi-vertical component is a claim by accident the moment a caller forgets.
// Same treatment as the two shell banners: optional, no default, every render
// site guarded. Nothing true to say -> render nothing.

interface Props {
  phone?: string | null;
  businessName?: string | null;
  genericIntro?: string;
  strapline?: string;
  primaryLabel?: string;
}

export function CtaBanner({ phone, businessName, genericIntro, strapline, primaryLabel }: Props) {
  const intro = businessName ? `${businessName} is ready to help.` : genericIntro;
  // Joined rather than interpolated so a missing half cannot leave a stray
  // space, and an empty line renders no paragraph at all.
  const introLine = [intro, strapline].filter(Boolean).join(' ');

  return (
    <section className="py-20 relative overflow-hidden" style={{ backgroundColor: 'var(--color-bg-cta)' }}>
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(45deg, white 25%, transparent 25%), linear-gradient(-45deg, white 25%, transparent 25%)', backgroundSize: '8px 8px' }} />
      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-accent)' }}>Ready to Get Started?</p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Get Started Today</h2>
        {introLine && <p className="text-white/70 text-lg mb-10">{introLine}</p>}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {primaryLabel && (
            <Link href="/quote" className="font-semibold px-8 py-3.5 rounded-lg text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
              {primaryLabel}
            </Link>
          )}
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
