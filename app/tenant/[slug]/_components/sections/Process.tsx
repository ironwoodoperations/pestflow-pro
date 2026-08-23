import type { ProcessStep } from '../../../../../src/shells/_shared/verticalCopy';

// PR B: heading and steps are props. DEFAULTS are the exact pest values this
// component used to own, so a caller that passes nothing renders as before.
// The displayed number is the 1-based position, which is what the old `num`
// field held for all five steps.
const DEFAULT_HEADING = 'How Our Pest Control Process Works';
const DEFAULT_STEPS: ProcessStep[] = [
  { title: 'Inspection', desc: 'Thorough checks of all key entry points, harborage areas, and pest activity indicators.' },
  { title: 'Identification', desc: 'Precise pest identification to develop targeted, pest-specific treatment strategies.' },
  { title: 'Monitoring', desc: 'Installation of monitoring devices to track pest activity and treatment effectiveness.' },
  { title: 'Implementation', desc: 'Targeted, safe applications using the right products at the right concentration levels.' },
  { title: 'Evaluation', desc: 'Follow-up assessments to ensure lasting results and adjust strategies as needed.' },
];
export function Process({ heading = DEFAULT_HEADING, steps = DEFAULT_STEPS }: { heading?: string; steps?: ProcessStep[] }) {
  return (
    <section className="py-16" style={{ backgroundColor: 'var(--color-bg-hero)' }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Our Approach</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">{heading}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {steps.map((step, i) => (
            <div key={step.title} className="relative flex flex-col items-center text-center px-3 py-6">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-[2.6rem] left-1/2 w-full h-0.5 bg-white/10" style={{ transform: 'translateX(50%)' }} />
              )}
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-4 relative z-10" style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}>
                {i + 1}
              </div>
              <h3 className="font-bold text-white mb-2">{step.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
