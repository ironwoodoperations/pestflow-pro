import Link from 'next/link';

interface Props { businessName: string; intro?: string }

export function BoldLocalWhyUs({ businessName, intro }: Props) {
  return (
    <section className="py-16 px-4" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#1a1a1a' }}>
            Don&apos;t Settle For Any Pest Service
          </h2>
          <div className="mt-1 mb-5" style={{ width: '40px', height: '3px', backgroundColor: 'var(--color-primary)' }} />
          <p className="text-gray-600 leading-relaxed text-base">
            {intro || "Not all pest control is created equal. When pests invade your home or business, you need a team that shows up on time, treats your property with respect, and gets the job done right the first time."}
          </p>
        </div>
        <div>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#1a1a1a' }}>
            {businessName} Can Help
          </h2>
          <div className="mt-1 mb-5" style={{ width: '40px', height: '3px', backgroundColor: 'var(--color-primary)' }} />
          <p className="text-gray-600 leading-relaxed text-base mb-6">
            We&apos;re your local experts — licensed, insured, and committed to long-term pest prevention. From the first call to the final treatment, we provide personalized care that protects your family, home, and peace of mind.
          </p>
          <Link href="/contact" className="inline-block font-bold rounded-full px-7 py-3 transition hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}>
            Contact Us Today
          </Link>
        </div>
      </div>
    </section>
  );
}
