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

const PEST_IMAGES: Record<string, string> = {
  'pest-control':        'https://images.unsplash.com/photo-1632163190024-f34e99c47a58?w=600&q=80',
  'roach-control':       'https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?w=600&q=80',
  'rodent-control':      'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=600&q=80',
  'mosquito-control':    'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=600&q=80',
  'termite-control':     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'ant-control':         'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
  'spider-control':      'https://images.unsplash.com/photo-1559963110-71b394e7494d?w=600&q=80',
  'bed-bug-control':     'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
  'wasp-hornet-control': 'https://images.unsplash.com/photo-1471086569966-db3eebc25a59?w=600&q=80',
  'scorpion-control':    'https://images.unsplash.com/photo-1590418606746-018840f9cd0f?w=600&q=80',
  'flea-tick-control':   'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80',
}

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
          {SERVICES.map((svc) => (
            <Link
              key={svc.slug}
              to={`/${svc.slug}`}
              className="rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group border border-gray-100"
            >
              {/* Pest image with dark overlay */}
              <div
                className="h-32 relative overflow-hidden flex items-center justify-center"
                style={{
                  backgroundImage: `url(${PEST_IMAGES[svc.slug] || 'https://images.unsplash.com/photo-1632163190024-f34e99c47a58?w=600&q=80'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} />
                <span className="relative z-10 text-white font-semibold text-sm text-center px-3">{svc.name}</span>
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
