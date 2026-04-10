import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'

interface Testimonial {
  id: string
  author_name: string
  review_text: string
  rating: number
}

const FALLBACK: Testimonial[] = [
  { id: '1', author_name: 'Jennifer A.', review_text: 'Extremely professional and thorough. They explained exactly what they were using and why, and I haven\'t had a single pest issue since. My family feels safe and that means everything.', rating: 5 },
  { id: '2', author_name: 'Marcus T.',   review_text: 'Called with a bad ant problem on a Wednesday. They were out Thursday morning and fixed it completely. Friendly technician, fair price. We signed up for the quarterly plan on the spot.', rating: 5 },
  { id: '3', author_name: 'Patricia W.', review_text: "Been with them for over a year now. They always call ahead, show up on time, and my house has never been pest-free like this. Couldn't recommend them more highly.", rating: 5 },
]

export default function CleanFriendlyTestimonials() {
  const [reviews, setReviews] = useState<Testimonial[]>(FALLBACK)

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const { data } = await supabase
        .from('testimonials')
        .select('id,author_name,review_text,rating')
        .eq('tenant_id', tenantId)
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(3)
      if (data && data.length > 0) setReviews(data as Testimonial[])
    })
  }, [])

  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2"
             style={{ color: 'var(--color-primary)' }}>TESTIMONIALS</p>
          <h2 className="text-3xl font-bold" style={{ color: 'var(--color-heading)' }}>
            What Our Customers Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map(r => (
            <div key={r.id}
                 className="rounded-2xl p-6 border border-gray-100"
                 style={{ background: 'var(--color-bg-section)' }}>
              <div className="text-lg mb-3" style={{ color: 'var(--color-accent)' }}>
                {'★'.repeat(Math.min(r.rating, 5))}
              </div>
              <p className="text-sm italic leading-relaxed mb-4 text-gray-600">
                "{r.review_text}"
              </p>
              <p className="font-semibold text-sm" style={{ color: 'var(--color-heading)' }}>{r.author_name}</p>
              <p className="text-xs text-gray-400 mt-0.5">Verified Customer</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
