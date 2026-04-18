import Link from 'next/link';

interface Props {
  businessName: string;
  intro?: string;
  photoUrl?: string;
}

export function BoldLocalAboutStrip({ businessName, intro, photoUrl }: Props) {
  const body1 = intro || "We're a locally owned and operated pest control company committed to protecting homes and businesses in our community. Our team of licensed technicians brings years of experience and a personal touch to every job.";
  const body2 = "From routine prevention to emergency treatments, we offer customized pest management solutions backed by a satisfaction guarantee. We treat your property like it's our own.";

  return (
    <section className="py-0" style={{ backgroundColor: '#f8f5f0' }}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2">
        <div className="h-72 md:h-auto overflow-hidden">
          {photoUrl ? (
            <img src={photoUrl} alt={`${businessName} team`} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full min-h-[288px] flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--color-bg-hero, #2d1a00) 0%, var(--color-primary) 100%)' }}>
              <span className="text-white/40 text-lg font-semibold">{businessName}</span>
            </div>
          )}
        </div>
        <div className="px-8 py-14 flex flex-col justify-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#1a1a1a' }}>
            Experience The Difference With {businessName}
          </h2>
          <div className="mb-5" style={{ width: '40px', height: '3px', backgroundColor: 'var(--color-primary)' }} />
          <p className="text-gray-600 leading-relaxed mb-4 text-sm">{body1}</p>
          <p className="text-gray-600 leading-relaxed mb-7 text-sm">{body2}</p>
          <Link href="/contact" className="inline-block self-start font-bold rounded-full px-7 py-3 text-sm transition hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}>
            Contact Us Today
          </Link>
        </div>
      </div>
    </section>
  );
}
