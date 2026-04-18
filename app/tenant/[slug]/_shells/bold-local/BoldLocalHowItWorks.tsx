import Link from 'next/link';

const STEPS = [
  {
    num: '1',
    icon: '📞',
    title: 'Contact',
    desc: "Schedule your free inspection. We'll discuss your concerns and what you hope to gain from our services.",
  },
  {
    num: '2',
    icon: '🔍',
    title: 'Inspection',
    desc: "We'll use the information we gather to develop your personalized treatment plan.",
  },
  {
    num: '3',
    icon: '🛡️',
    title: 'Protection',
    desc: 'Long-term prevention keeps pests out for good. We stand behind every treatment.',
  },
];

export function BoldLocalHowItWorks() {
  return (
    <section className="py-16 px-4" style={{ backgroundColor: '#f8f8f8' }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-2" style={{ color: '#1a1a1a' }}>
          Starting Is Easy
        </h2>
        <div className="mx-auto mb-10" style={{ width: '40px', height: '3px', backgroundColor: 'var(--color-primary)' }} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 items-start">
          {STEPS.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center relative">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-4 shadow"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}>
                <span aria-hidden="true">{step.icon}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-7 left-[calc(50%+40px)] w-[calc(100%-80px)] h-0.5"
                  style={{ backgroundColor: 'var(--color-primary)', opacity: 0.3 }} aria-hidden="true" />
              )}
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-primary)' }}>
                Step {step.num}
              </p>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#1a1a1a' }}>{step.title}</h3>
              <p className="text-sm text-gray-600 max-w-[220px] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/contact" className="inline-block font-bold rounded-full px-8 py-3 transition hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}>
            Contact Us Today
          </Link>
        </div>
      </div>
    </section>
  );
}
