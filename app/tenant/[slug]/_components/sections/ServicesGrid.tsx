import Link from 'next/link';

const SERVICES = [
  { name: 'General Pest Control', slug: 'pest-control', desc: 'Comprehensive treatments for ants, roaches, silverfish, and common household pests that keep your home protected year-round.' },
  { name: 'Termite Control', slug: 'termite-control', desc: 'Advanced termite detection and elimination using industry-proven baiting systems and liquid treatments.' },
  { name: 'Rodent Control', slug: 'rodent-control', desc: 'Fast, discreet rodent removal with entry-point sealing and ongoing monitoring to prevent re-infestation.' },
  { name: 'Mosquito Treatment', slug: 'mosquito-control', desc: 'Barrier spray treatments and larvicide programs that dramatically reduce mosquito populations on your property.' },
  { name: 'Bed Bug Treatment', slug: 'bed-bug-control', desc: 'Heat and chemical treatment protocols that eliminate bed bugs at all life stages — guaranteed.' },
  { name: 'Spider Control', slug: 'spider-control', desc: 'Targeted treatments for dangerous and nuisance spiders, including web removal and residual barrier applications.' },
  { name: 'Ant Control', slug: 'ant-control', desc: 'Colony-elimination strategies that target the source — not just the ants you see on the surface.' },
  { name: 'Wasp & Hornet Control', slug: 'wasp-hornet-control', desc: 'Safe removal of wasp nests, yellow jacket colonies, and hornets by licensed technicians with protective equipment.' },
];

const PEST_IMAGES: Record<string, string> = {
  'pest-control': '/images/pests/pest_control.jpg',
  'roach-control': '/images/pests/roach.jpg',
  'rodent-control': '/images/pests/rodent.jpg',
  'mosquito-control': '/images/pests/Mosquito.jpg',
  'termite-control': '/images/pests/termite_control.jpg',
  'termite-inspections': '/images/pests/termite_inspection.jpg',
  'ant-control': '/images/pests/ant.jpg',
  'spider-control': '/images/pests/spider.jpg',
  'bed-bug-control': '/images/pests/bed_bug.jpg',
  'wasp-hornet-control': '/images/pests/wasp_hornet.jpg',
  'scorpion-control': '/images/pests/scorpion.jpg',
  'flea-tick-control': '/images/pests/flea_tik.jpg',
};

export function ServicesGrid() {
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
            <Link key={svc.slug} href={`/${svc.slug}`} className="rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group border border-gray-100">
              <div
                className="h-32 relative overflow-hidden flex items-center justify-center"
                style={{ backgroundImage: `url(${PEST_IMAGES[svc.slug] || '/images/pests/pest_control.jpg'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              >
                <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} />
                <span className="relative z-10 text-white font-semibold text-sm text-center px-3">{svc.name}</span>
              </div>
              <div className="p-4 bg-white">
                <h3 className="font-bold text-sm mb-1.5 group-hover:text-[color:var(--color-primary)] transition" style={{ color: 'var(--color-heading)' }}>{svc.name}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{svc.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
