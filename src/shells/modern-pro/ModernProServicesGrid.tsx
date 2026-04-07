import { Link } from 'react-router-dom'

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
}

interface Service { name: string; slug: string }
interface Props { services: Service[] }

export default function ModernProServicesGrid({ services }: Props) {
  return (
    <section style={{ background: 'var(--color-bg-section)' }} className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest mb-2"
             style={{ color: 'var(--color-primary)' }}>
            WHAT WE TREAT
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3"
              style={{ color: 'var(--color-heading)' }}>
            Our Pest Control Services
          </h2>
          <p className="text-base" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
            Professional treatments for every pest problem
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {services.map((s) => {
            const img = PEST_IMAGES[s.slug]
            return (
              <Link
                key={s.slug}
                to={`/${s.slug}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer group"
              >
                {img ? (
                  <img
                    src={img}
                    alt={s.name}
                    loading="lazy"
                    className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div
                    className="w-full h-36 flex items-center justify-center"
                    style={{ background: 'var(--color-bg-section)' }}
                  >
                    <span className="text-4xl">🐛</span>
                  </div>
                )}
                <div className="p-3 text-center">
                  <span className="font-semibold text-sm" style={{ color: 'var(--color-heading)' }}>
                    {s.name}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
