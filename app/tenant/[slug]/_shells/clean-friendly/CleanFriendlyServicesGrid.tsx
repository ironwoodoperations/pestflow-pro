import Link from 'next/link';

const PEST_IMAGES: Record<string, string> = {
  'pest-control':        '/images/pests/pest_control.jpg',
  'termite-control':     '/images/pests/termite_control.jpg',
  'termite-inspections': '/images/pests/termite_inspection.jpg',
  'roach-control':       '/images/pests/roach.jpg',
  'ant-control':         '/images/pests/ant.jpg',
  'mosquito-control':    '/images/pests/Mosquito.jpg',
  'bed-bug-control':     '/images/pests/bed_bug.jpg',
  'flea-tick-control':   '/images/pests/flea_tik.jpg',
  'rodent-control':      '/images/pests/rodent.jpg',
  'scorpion-control':    '/images/pests/scorpion.jpg',
  'spider-control':      '/images/pests/spider.jpg',
  'wasp-hornet-control': '/images/pests/wasp_hornet.jpg',
};

const SERVICES = [
  { name: 'Pest Control',          slug: 'pest-control'        },
  { name: 'Termite Control',       slug: 'termite-control'     },
  { name: 'Termite Inspections',   slug: 'termite-inspections' },
  { name: 'Mosquito Control',      slug: 'mosquito-control'    },
  { name: 'Roach Control',         slug: 'roach-control'       },
  { name: 'Ant Control',           slug: 'ant-control'         },
  { name: 'Spider Control',        slug: 'spider-control'      },
  { name: 'Scorpion Control',      slug: 'scorpion-control'    },
  { name: 'Rodent Control',        slug: 'rodent-control'      },
  { name: 'Flea & Tick Control',   slug: 'flea-tick-control'   },
  { name: 'Bed Bug Control',       slug: 'bed-bug-control'     },
  { name: 'Wasp & Hornet Control', slug: 'wasp-hornet-control' },
];

export function CleanFriendlyServicesGrid() {
  return (
    <section style={{ background: 'var(--color-bg-section)' }} className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-primary)' }}>
            WHAT WE TREAT
          </p>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--color-heading)' }}>
            Services We Offer
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              href={`/${s.slug}`}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group"
            >
              {PEST_IMAGES[s.slug] ? (
                <img
                  src={PEST_IMAGES[s.slug]}
                  alt={s.name}
                  loading="lazy"
                  className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-36 flex items-center justify-center" style={{ background: 'var(--color-bg-section)' }} />
              )}
              <div className="p-3 text-center border-t border-gray-50">
                <span className="font-semibold text-sm" style={{ color: 'var(--color-heading)' }}>
                  {s.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
