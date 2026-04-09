import { PEST_PAGE_IMG } from '../../data/pestImages'

const SERVICES = [
  { slug: 'mosquito-control', name: 'Mosquito' },
  { slug: 'ant-control', name: 'Ant Control' },
  { slug: 'roach-control', name: 'Roach Control' },
  { slug: 'spider-control', name: 'Spider Control' },
  { slug: 'termite-control', name: 'Termite Control' },
  { slug: 'termite-inspections', name: 'Termite Inspections' },
  { slug: 'bed-bug-control', name: 'Bed Bugs' },
  { slug: 'flea-tick-control', name: 'Flea & Tick' },
  { slug: 'rodent-control', name: 'Rodent Control' },
  { slug: 'scorpion-control', name: 'Scorpion Control' },
  { slug: 'wasp-hornet-control', name: 'Wasp & Hornet' },
  { slug: 'pest-control', name: 'Pest Control' },
]

export default function RusticRuggedServicesGrid() {
  return (
    <section className="py-14 px-4" style={{ backgroundColor: 'var(--color-primary)' }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-10">
          Pest Control &amp; Exterminator Services
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-6 justify-items-center">
          {SERVICES.map(svc => (
            <div key={svc.slug} className="flex flex-col items-center text-center">
              <div className="w-[120px] h-[120px] md:w-[160px] md:h-[160px] rounded-full overflow-hidden mb-3 shrink-0"
                style={{ border: '4px solid #ffffff' }}>
                <img src={PEST_PAGE_IMG[svc.slug] || '/images/pests/pest_control.jpg'} alt={svc.name}
                  className="w-full h-full object-cover" loading="lazy" />
              </div>
              <p className="text-white font-bold text-sm mb-2">{svc.name}</p>
              <a href={`/${svc.slug}`} className="text-xs font-bold px-3 py-1 rounded transition hover:opacity-80 text-white"
                style={{ backgroundColor: '#1a1a1a' }}>
                Learn More
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
