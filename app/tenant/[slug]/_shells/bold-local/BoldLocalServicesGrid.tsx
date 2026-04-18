import Link from 'next/link';

const PEST_PAGE_IMG: Record<string, string> = {
  'ant-control':         '/images/pests/ant.jpg',
  'roach-control':       '/images/pests/roach.jpg',
  'termite-control':     '/images/pests/termite_control.jpg',
  'termite-inspections': '/images/pests/termite_inspection.jpg',
  'mosquito-control':    '/images/pests/Mosquito.jpg',
  'rodent-control':      '/images/pests/rodent.jpg',
  'spider-control':      '/images/pests/spider.jpg',
  'bed-bug-control':     '/images/pests/bed_bug.jpg',
  'wasp-hornet-control': '/images/pests/wasp_hornet.jpg',
  'flea-tick-control':   '/images/pests/flea_tik.jpg',
  'scorpion-control':    '/images/pests/scorpion.jpg',
  'pest-control':        '/images/pests/pest_control.jpg',
};

const SERVICES = [
  { slug: 'mosquito-control',    name: 'Mosquito Control',     desc: 'Yard treatments for a bite-free outdoor experience.' },
  { slug: 'ant-control',         name: 'Ant Control',          desc: 'Fire ants, carpenter ants — eliminated at the colony.' },
  { slug: 'roach-control',       name: 'Roach Control',        desc: 'Complete German and American roach elimination.' },
  { slug: 'spider-control',      name: 'Spider Control',       desc: 'Safe, effective spider reduction inside and out.' },
  { slug: 'termite-control',     name: 'Termite Control',      desc: 'Inspections and treatment to protect your structure.' },
  { slug: 'termite-inspections', name: 'Termite Inspections',  desc: 'Thorough inspections with detailed reports.' },
  { slug: 'bed-bug-control',     name: 'Bed Bug Control',      desc: 'Heat and chemical treatments to eliminate infestations.' },
  { slug: 'flea-tick-control',   name: 'Flea & Tick Control',  desc: 'Yard and indoor treatments for flea and tick relief.' },
  { slug: 'rodent-control',      name: 'Rodent Control',       desc: 'Exclusion and elimination for mice and rats.' },
  { slug: 'scorpion-control',    name: 'Scorpion Control',     desc: 'Targeted treatments for scorpion prevention.' },
  { slug: 'wasp-hornet-control', name: 'Wasp & Hornet',        desc: 'Safe nest removal and prevention services.' },
  { slug: 'pest-control',        name: 'General Pest Control', desc: 'Recurring protection plans for year-round peace of mind.' },
];

export function BoldLocalServicesGrid() {
  return (
    <section className="py-16 px-4" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-3" style={{ color: '#1a1a1a' }}>
          Our Pest Control Services
        </h2>
        <div className="mx-auto mb-10" style={{ width: '40px', height: '3px', backgroundColor: 'var(--color-primary)' }} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {SERVICES.map((svc) => (
            <div key={svc.slug} className="flex flex-col items-center text-center p-4 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition">
              <div className="w-20 h-20 rounded-full overflow-hidden mb-3 shrink-0"
                style={{ border: '3px solid var(--color-primary)' }}>
                <img
                  src={PEST_PAGE_IMG[svc.slug] || '/images/pests/pest_control.jpg'}
                  alt={svc.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="font-bold text-sm mb-1" style={{ color: '#1a1a1a' }}>{svc.name}</h3>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{svc.desc}</p>
              <Link href={`/${svc.slug}`} className="text-xs font-bold transition"
                style={{ color: 'var(--color-primary)' }}>
                Learn More →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
