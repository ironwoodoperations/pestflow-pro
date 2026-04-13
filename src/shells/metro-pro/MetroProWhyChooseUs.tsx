interface Props { businessName: string }

const FEATURES = [
  { title: 'Custom Treatment Plans', desc: 'Every property is different. We tailor our approach to your specific pest pressures and property layout.' },
  { title: 'Family & Pet-Friendly Products', desc: 'EPA-approved, low-impact formulations that are safe for your children and pets when applied correctly.' },
  { title: 'Unlimited Callbacks', desc: 'If pests return between scheduled services, we come back at no additional cost — guaranteed.' },
  { title: 'Fast & Reliable', desc: 'Same-day and next-day appointments available. We show up on time, every time.' },
  { title: 'Local Experts', desc: 'We know the local pest pressures in your area and have treated thousands of properties just like yours.' },
  { title: 'You Come First', desc: 'Our technicians take time to explain treatments, answer questions, and ensure your complete satisfaction.' },
]

export default function MetroProWhyChooseUs({ businessName }: Props) {
  return (
    <section className="py-16 relative overflow-hidden" style={{ backgroundColor: 'var(--color-primary)' }}>
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <div className="relative max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Our Promise</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Why Choose {businessName || 'Us'}?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-4 p-5 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent)' }}>
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">{f.title}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
