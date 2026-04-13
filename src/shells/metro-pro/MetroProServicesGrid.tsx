import { Link } from 'react-router-dom'

const SERVICES = [
  { name: 'General Pest Control', slug: 'pest-control', desc: 'Comprehensive treatments for ants, roaches, silverfish, and common household pests that keep your home protected year-round.' },
  { name: 'Termite Control', slug: 'termite-control', desc: 'Advanced termite detection and elimination using industry-proven baiting systems and liquid treatments.' },
  { name: 'Rodent Control', slug: 'rodent-control', desc: 'Fast, discreet rodent removal with entry-point sealing and ongoing monitoring to prevent re-infestation.' },
  { name: 'Mosquito Treatment', slug: 'mosquito-control', desc: 'Barrier spray treatments and larvicide programs that dramatically reduce mosquito populations on your property.' },
  { name: 'Bed Bug Treatment', slug: 'bed-bug-control', desc: 'Heat and chemical treatment protocols that eliminate bed bugs at all life stages — guaranteed.' },
  { name: 'Spider Control', slug: 'spider-control', desc: 'Targeted treatments for dangerous and nuisance spiders, including web removal and residual barrier applications.' },
  { name: 'Ant Control', slug: 'ant-control', desc: 'Colony-elimination strategies that target the source — not just the ants you see on the surface.' },
  { name: 'Wasp & Hornet Control', slug: 'wasp-hornet-control', desc: 'Safe removal of wasp nests, yellow jacket colonies, and hornets by licensed technicians with protective equipment.' },
]

// Gradient backgrounds for service cards (no images needed)
const CARD_GRADIENTS = [
  'linear-gradient(135deg, #1a4332 0%, #2d6a4f 100%)',
  'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
  'linear-gradient(135deg, #3b1205 0%, #c2410c 100%)',
  'linear-gradient(135deg, #0d2137 0%, #0ea5e9 100%)',
  'linear-gradient(135deg, #1c1c1e 0%, #374151 100%)',
  'linear-gradient(135deg, #4a1942 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #0a2d1a 0%, #15803d 100%)',
  'linear-gradient(135deg, #2d1a00 0%, #d97706 100%)',
]

export default function MetroProServicesGrid() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-accent)' }}>What We Treat</p>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--color-heading)' }}>
            A Wide Range of Pest Control Services
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((svc, i) => (
            <Link
              key={svc.slug}
              to={`/${svc.slug}`}
              className="rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group border border-gray-100"
            >
              {/* Image placeholder */}
              <div
                className="h-32 flex items-center justify-center"
                style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}
              >
                <span className="text-white/90 font-semibold text-sm text-center px-3">{svc.name}</span>
              </div>
              {/* Card body */}
              <div className="p-4 bg-white">
                <h3 className="font-bold text-sm mb-1.5 group-hover:text-[color:var(--color-primary)] transition" style={{ color: 'var(--color-heading)' }}>
                  {svc.name}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">{svc.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
