const STEPS = [
  { num: 1, title: 'Inspection', desc: 'Thorough checks of all key entry points, harborage areas, and pest activity indicators.' },
  { num: 2, title: 'Identification', desc: 'Precise pest identification to develop targeted, pest-specific treatment strategies.' },
  { num: 3, title: 'Monitoring', desc: 'Installation of monitoring devices to track pest activity and treatment effectiveness.' },
  { num: 4, title: 'Implementation', desc: 'Targeted, safe applications using the right products at the right concentration levels.' },
  { num: 5, title: 'Evaluation', desc: 'Follow-up assessments to ensure lasting results and adjust strategies as needed.' },
]

export default function MetroProProcess() {
  return (
    <section className="py-16" style={{ backgroundColor: 'var(--color-bg-hero)' }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Our Approach</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            How Our Pest Control Process Works
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {STEPS.map((step, i) => (
            <div key={step.num} className="relative flex flex-col items-center text-center px-3 py-6">
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-[2.6rem] left-1/2 w-full h-0.5 bg-white/10" style={{ transform: 'translateX(50%)' }} />
              )}
              {/* Step number */}
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-4 relative z-10" style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}>
                {step.num}
              </div>
              <h3 className="font-bold text-white mb-2">{step.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
