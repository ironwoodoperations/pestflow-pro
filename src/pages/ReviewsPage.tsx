import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import StructuredData from '../components/StructuredData'

interface Review { id: string; author_name: string; content: string; rating: number; source?: string }

const PLACEHOLDER_REVIEWS: Review[] = [
  { id: '1', author_name: 'Sarah M.', content: 'They showed up same day and solved our ant problem completely. Best pest company in Tyler!', rating: 5, source: 'Google' },
  { id: '2', author_name: 'James R.', content: 'Professional, on time, and effective. Our mosquito problem is gone. Highly recommend!', rating: 5, source: 'Google' },
  { id: '3', author_name: 'Linda K.', content: 'We had a serious roach issue and they knocked it out in one treatment. Amazing service.', rating: 5, source: 'Google' },
  { id: '4', author_name: 'Mike T.', content: 'Great experience from start to finish. Technician was knowledgeable and thorough. No more spiders!', rating: 5, source: 'Facebook' },
  { id: '5', author_name: 'Jennifer W.', content: 'Affordable, effective, and friendly. They treat my home quarterly and I haven\'t seen a single pest.', rating: 5, source: 'Google' },
  { id: '6', author_name: 'David L.', content: 'Found scorpions in our new home. They came out the next day and solved it. Excellent service!', rating: 5, source: 'Yelp' },
]

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>(PLACEHOLDER_REVIEWS)

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const { data } = await supabase.from('testimonials').select('id, author_name, content, rating, source').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(12)
      if (data && data.length > 0) setReviews(data)
    })
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <StructuredData type="WebPage" pageSlug="reviews" />
      <Navbar />

      <section className="py-20 md:py-28" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-bangers tracking-wide text-white text-5xl md:text-7xl mb-4">What Our Customers Say</h1>
          <p className="text-gray-300 text-xl">Real reviews from real East Texas customers.</p>
        </div>
      </section>

      <section className="py-6 bg-[#1e293b]">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap justify-center gap-8 text-center">
          <div><span className="text-emerald-400 text-2xl font-bold">4.9</span> <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 inline" /><span className="text-gray-400 text-sm ml-1">Google Rating</span></div>
          <div><span className="text-emerald-400 text-2xl font-bold">200+</span><span className="text-gray-400 text-sm ml-2">Reviews</span></div>
          <div><span className="text-emerald-400 text-2xl font-bold">#1</span><span className="text-gray-400 text-sm ml-2">East Texas&apos;s Most Trusted</span></div>
        </div>
      </section>

      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="text-yellow-500 mb-3">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                <p className="text-gray-700 mb-4 italic">"{r.content}"</p>
                <div className="flex justify-between items-center">
                  <p className="text-gray-900 font-bold">— {r.author_name}</p>
                  {r.source && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">{r.source}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-bangers tracking-wide text-4xl md:text-5xl text-white mb-4">Love Our Service?</h2>
          <p className="text-gray-300 text-lg mb-8">Leave us a review on Google — we appreciate your feedback!</p>
          <Link to="/quote" className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-10 py-4 text-lg transition">Get a Free Quote</Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
