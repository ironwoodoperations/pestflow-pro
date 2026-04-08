import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { resolveTenantId } from '../../../lib/tenant'

const PEST_IMG: Record<string, string> = {
  'ant-control': '/images/pests/ant.jpg',
  'bed-bug-control': '/images/pests/bed_bug.jpg',
  'flea-tick-control': '/images/pests/flea_tik.jpg',
  'mosquito-control': '/images/pests/Mosquito.jpg',
  'pest-control': '/images/pests/pest_control.jpg',
  'roach-control': '/images/pests/roach.jpg',
  'rodent-control': '/images/pests/rodent.jpg',
  'scorpion-control': '/images/pests/scorpion.jpg',
  'spider-control': '/images/pests/spider.jpg',
  'termite-control': '/images/pests/termite_control.jpg',
  'termite-inspections': '/images/pests/termite_inspection.jpg',
  'wasp-hornet-control': '/images/pests/wasp_hornet.jpg',
}

const PEST_EMOJI: Record<string, string> = {
  'ant-control': '🐜', 'bed-bug-control': '🐛', 'flea-tick-control': '🦟',
  'mosquito-control': '🦟', 'pest-control': '🐛', 'roach-control': '🪳',
  'rodent-control': '🐭', 'scorpion-control': '🦂', 'spider-control': '🕷️',
  'termite-control': '🪲', 'termite-inspections': '🔍', 'wasp-hornet-control': '🐝',
}

const SYSTEM_SLUGS = new Set(['home', 'about', 'contact', 'faq', 'quote'])

function slugToName(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

interface Service { slug: string; title: string; intro?: string }
interface ServicesConfig {
  variant?: 'cards' | 'icon-list' | 'large-tiles'
  headline?: string
}
interface Props { section: ServicesConfig }

export default function ServicesGridSection({ section }: Props) {
  const [services, setServices] = useState<Service[]>([])

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const { data } = await supabase
        .from('page_content').select('page_slug, title, intro')
        .eq('tenant_id', tenantId)
      const filtered = (data || [])
        .filter(r => !SYSTEM_SLUGS.has(r.page_slug) && PEST_IMG[r.page_slug])
        .map(r => ({ slug: r.page_slug, title: r.title || slugToName(r.page_slug), intro: r.intro }))
      setServices(filtered.length > 0
        ? filtered
        : Object.keys(PEST_IMG).map(slug => ({ slug, title: slugToName(slug) }))
      )
    })
  }, [])

  const v = section.variant || 'cards'

  return (
    <section style={{ background: 'var(--color-bg-section)' }} className="py-16 px-4">
      {section.headline && (
        <h2 className="text-3xl font-black text-center mb-10"
          style={{ color: 'var(--color-heading)' }}>
          {section.headline}
        </h2>
      )}

      {v === 'cards' && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(s => (
            <Link key={s.slug} to={`/${s.slug}`}
              className="bg-white rounded-xl shadow hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden group">
              <div className="h-44 overflow-hidden">
                <img src={PEST_IMG[s.slug] || '/images/pests/pest_control.jpg'} alt={s.title}
                  loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-base mb-1" style={{ color: 'var(--color-primary)' }}>{s.title}</h3>
                {s.intro && <p className="text-sm text-gray-500 line-clamp-2">{s.intro}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {v === 'icon-list' && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map(s => (
            <Link key={s.slug} to={`/${s.slug}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/60 transition-colors">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-xl flex-shrink-0"
                style={{ background: 'var(--color-accent)' }}>
                {PEST_EMOJI[s.slug] || '🐛'}
              </span>
              <span className="font-semibold text-sm" style={{ color: 'var(--color-heading)' }}>{s.title}</span>
            </Link>
          ))}
        </div>
      )}

      {v === 'large-tiles' && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {services.map(s => (
            <Link key={s.slug} to={`/${s.slug}`}
              className="relative aspect-video rounded-xl overflow-hidden group">
              <img src={PEST_IMG[s.slug] || '/images/pests/pest_control.jpg'} alt={s.title}
                loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
              <span className="absolute inset-0 flex items-center justify-center font-black text-white text-xl text-center px-4 drop-shadow-lg">
                {s.title}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
