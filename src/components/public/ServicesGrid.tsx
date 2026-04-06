import { Link } from 'react-router-dom'

const PEST_SERVICES = [
  { name: 'Pest Control',          route: '/pest-control',          img: '/images/pests/pest_control.jpg'       },
  { name: 'Termite Control',       route: '/termite-control',       img: '/images/pests/termite_control.jpg'    },
  { name: 'Termite Inspections',   route: '/termite-inspections',   img: '/images/pests/termite_inspection.jpg' },
  { name: 'Mosquito Control',      route: '/mosquito-control',      img: '/images/pests/Mosquito.jpg'           },
  { name: 'Roach Control',         route: '/roach-control',         img: '/images/pests/roach.jpg'              },
  { name: 'Ant Control',           route: '/ant-control',           img: '/images/pests/ant.jpg'                },
  { name: 'Spider Control',        route: '/spider-control',        img: '/images/pests/spider.jpg'             },
  { name: 'Scorpion Control',      route: '/scorpion-control',      img: '/images/pests/scorpion.jpg'           },
  { name: 'Rodent Control',        route: '/rodent-control',        img: '/images/pests/rodent.jpg'             },
  { name: 'Flea & Tick Control',   route: '/flea-tick-control',     img: '/images/pests/flea_tik.jpg'           },
  { name: 'Bed Bug Control',       route: '/bed-bug-control',       img: '/images/pests/bed_bug.jpg'            },
  { name: 'Wasp & Hornet Control', route: '/wasp-hornet-control',   img: '/images/pests/wasp_hornet.jpg'        },
]

interface Props {
  ctaText?: string
}

export default function ServicesGrid({ ctaText = 'Get a Free Quote' }: Props) {
  return (
    <section style={{ backgroundColor: 'var(--color-bg-section)' }} className="py-14">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="font-oswald text-4xl tracking-wide mb-2" style={{ color: 'var(--color-heading)' }}>
            Our Services
          </h2>
          <p className="text-gray-500 text-sm">Professional pest control for every situation.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {PEST_SERVICES.map((s) => (
            <Link
              key={s.route}
              to={s.route}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-gray-200 hover:border-emerald-400 hover:shadow-md transition group"
            >
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={s.img}
                  alt={`${s.name} services`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <span className="text-gray-800 font-semibold text-xs text-center leading-tight">{s.name}</span>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/quote"
            style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
            className="inline-block font-bold px-8 py-3 rounded-lg transition hover:opacity-90"
          >
            {ctaText}
          </Link>
        </div>
      </div>
    </section>
  )
}
