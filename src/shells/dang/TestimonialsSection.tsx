import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'

interface Testimonial { id: string; name: string; title: string; text: string; rating: number }

const fallback: Testimonial[] = [
  { id: '1', name: 'Cara D.', title: 'So Helpful!', text: 'Oh my gosh I love Dang so much! Kirk is always so helpful, informative and nice!', rating: 5 },
  { id: '2', name: 'Murray S.', title: 'Professional & Super Friendly', text: 'Dang Pest Control is very professional and super friendly! I love that they always explain what they are doing and follow up after the service. Highly recommend!', rating: 5 },
  { id: '3', name: 'Shelley H.', title: 'Quick Treatment & Suggestions', text: "When we moved into our new Barndominium, we apparently brought German Cockroaches in with our moving boxes. Dang quickly discovered where they were coming from and treated them. We haven't had any issues since!", rating: 5 },
  { id: '4', name: 'Kelley S.', title: 'Friendly & Informative', text: "Dang is so friendly and informative. We recommend everyone use them!", rating: 5 },
]

const ArrowLeft = () => <svg viewBox="0 0 60 40" className="w-16 h-12 drop-shadow-lg" fill="hsl(48,100%,50%)"><polygon points="0,20 25,0 25,12 60,12 60,28 25,28 25,40" /></svg>
const ArrowRight = () => <svg viewBox="0 0 60 40" className="w-16 h-12 drop-shadow-lg" fill="hsl(48,100%,50%)"><polygon points="60,20 35,0 35,12 0,12 0,28 35,28 35,40" /></svg>

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(fallback)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setTimeout(async () => {
      const tenantId = await resolveTenantId()
      if (!tenantId) return
      const { data } = await supabase
        .from('testimonials')
        .select('id, name, title, text, rating')
        .eq('tenant_id', tenantId)
        .eq('is_featured', true)
        .neq('name', 'demo_seed')
        .order('sort_order', { ascending: true })
      if (data && data.length > 0) setTestimonials(data)
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const prev = () => setCurrent((c) => (c === 0 ? testimonials.length - 1 : c - 1))
  const next = () => setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1))
  const t = testimonials[current]

  return (
    <section className="relative overflow-hidden" style={{ background: 'hsl(185,65%,42%)', paddingTop: '64px', paddingBottom: '100px', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 92%)' }}>
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, hsl(185,65%,28%) 2.5px, transparent 2.5px)', backgroundSize: '16px 16px', opacity: 0.6 }} />
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.25 }}>
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24
          const rad = (angle * Math.PI) / 180
          const x2 = 50 + Math.cos(rad) * 120
          const y2 = 50 + Math.sin(rad) * 120
          return <line key={i} x1="50%" y1="50%" x2={`${x2}%`} y2={`${y2}%`} stroke="hsl(185,65%,25%)" strokeWidth="10" />
        })}
      </svg>
      <div className="mx-auto px-8 relative z-10" style={{ maxWidth: '1200px' }}>
        <p className="dang-text-comic text-sm italic text-center mb-2" style={{ color: 'hsl(48,100%,50%)' }}>TESTIMONIALS</p>
        <h2 className="dang-text-comic text-3xl md:text-5xl text-center mb-10" style={{ color: 'hsl(20,40%,12%)' }}>What Our Customers Say</h2>
        <div className="relative flex items-center justify-center">
          <button onClick={prev} aria-label="Previous slide" className="absolute left-0 z-10 transition-all hover:scale-110"><ArrowLeft /></button>
          <div className="bg-white rounded-xl py-10 px-12 w-full shadow-2xl relative" style={{ border: '5px solid #111', marginLeft: '80px', marginRight: '80px' }}>
            <div className="absolute top-2 left-3 font-serif font-black select-none" style={{ fontSize: '6rem', color: '#111', lineHeight: 1 }}>&#8220;</div>
            <div className="absolute bottom-2 right-3 font-serif font-black select-none" style={{ fontSize: '6rem', color: '#111', lineHeight: 1 }}>&#8221;</div>
            <p className="font-bold text-lg text-center mb-0.5 mt-8" style={{ color: '#111' }}>{t.name}</p>
            <p className="text-sm text-center mb-5" style={{ color: 'hsl(20,20%,45%)' }}>{t.title}</p>
            <p className="text-base leading-relaxed italic text-center px-6 mb-6" style={{ color: 'hsl(20,20%,25%)' }}>{t.text}</p>
            <div className="flex gap-1 justify-center">
              {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-6 h-6 fill-current" style={{ color: 'hsl(48,100%,50%)' }} />)}
            </div>
          </div>
          <button onClick={next} aria-label="Next slide" className="absolute right-0 z-10 transition-all hover:scale-110"><ArrowRight /></button>
        </div>
      </div>
    </section>
  )
}
