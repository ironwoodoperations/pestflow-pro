import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { resolveTenantId } from '../../../lib/tenant'

interface Review { id: string; author_name: string; review_text: string; rating: number; source?: string }

const PLACEHOLDER: Review[] = [
  { id: '1', author_name: 'Sarah M.', review_text: 'They showed up same day and solved our ant problem completely. Best pest company in Tyler!', rating: 5, source: 'Google' },
  { id: '2', author_name: 'James R.', review_text: 'Professional, on time, and effective. Our mosquito problem is gone. Highly recommend!', rating: 5, source: 'Google' },
  { id: '3', author_name: 'Linda K.', review_text: 'We had a serious roach issue and they knocked it out in one treatment. Amazing service.', rating: 5, source: 'Google' },
  { id: '4', author_name: 'Mike T.', review_text: 'Great experience from start to finish. Technician was knowledgeable and thorough. No more spiders!', rating: 5, source: 'Facebook' },
  { id: '5', author_name: 'Jennifer W.', review_text: "Affordable, effective, and friendly. They treat my home quarterly and I haven't seen a single pest.", rating: 5, source: 'Google' },
  { id: '6', author_name: 'David L.', review_text: 'Found scorpions in our new home. They came out the next day and solved it. Excellent service!', rating: 5, source: 'Yelp' },
]

export default function DangReviews() {
  const [reviews, setReviews] = useState<Review[]>(PLACEHOLDER)

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const { data } = await supabase
        .from('testimonials')
        .select('id, author_name, review_text, rating, source')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(12)
      if (data && data.length > 0) setReviews(data)
    })
  }, [])

  return (
    <div style={{ background: '#faf7f4', minHeight: '100vh' }}>
      {/* HERO with cloud border */}
      <section style={{
        position: 'relative',
        background: `url(/dang/moblie_banner.webp) center/cover no-repeat, hsl(28, 100%, 50%)`,
        paddingTop: '80px', paddingBottom: '200px', minHeight: '420px', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.18) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '0 20px 30px' }}>
          <h1 style={{
            fontFamily: '"Bangers", cursive',
            fontSize: 'clamp(42px, 7vw, 88px)',
            color: 'hsl(45, 95%, 60%)',
            fontStyle: 'italic', letterSpacing: '0.05em',
            WebkitTextStroke: '3px #000000', textShadow: '3px 3px 0 #000000',
            margin: 0, lineHeight: 1.05,
          }}>
            WHAT OUR CUSTOMERS SAY
          </h1>
          <p style={{ color: '#fff', fontSize: '1.1rem', marginTop: '12px', textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>
            Real reviews from real East Texas customers.
          </p>
        </div>
        {/* Cloud border */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 1 }}>
          <img fetchPriority="high" width={1200} height={50} src="/dang/banner-img.png" alt="" style={{ width: '100%', display: 'block' }} />
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ background: '#fff', padding: '24px 20px', borderBottom: '1px solid #f0ece8' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap', textAlign: 'center' }}>
          <div><span style={{ fontSize: '2rem', fontWeight: 700, color: 'hsl(28,100%,50%)' }}>4.9</span> <span style={{ color: '#f59e0b', fontSize: '1.2rem' }}>★</span><span style={{ fontSize: '0.9rem', color: '#666', marginLeft: '4px' }}>Google Rating</span></div>
          <div><span style={{ fontSize: '2rem', fontWeight: 700, color: 'hsl(28,100%,50%)' }}>200+</span><span style={{ fontSize: '0.9rem', color: '#666', marginLeft: '6px' }}>Reviews</span></div>
          <div><span style={{ fontSize: '2rem', fontWeight: 700, color: 'hsl(28,100%,50%)' }}>#1</span><span style={{ fontSize: '0.9rem', color: '#666', marginLeft: '6px' }}>East Texas&apos;s Most Trusted</span></div>
        </div>
      </section>

      {/* Reviews grid */}
      <section style={{ padding: '60px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {reviews.map(r => (
            <div key={r.id} style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #f0ece8' }}>
              <div style={{ color: '#f59e0b', fontSize: '1.1rem', marginBottom: '12px' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
              <p style={{ color: '#444', fontStyle: 'italic', marginBottom: '16px', lineHeight: 1.6 }}>"{r.review_text}"</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontWeight: 700, color: '#1a1a1a' }}>— {r.author_name}</p>
                {r.source && <span style={{ fontSize: '0.75rem', background: '#f5f0eb', color: '#888', padding: '2px 8px', borderRadius: '4px' }}>{r.source}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA section with cloud */}
      <section style={{ position: 'relative', background: 'hsl(28, 100%, 50%)', padding: '80px 20px', marginTop: '20px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.12) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: '"Bangers", cursive', fontSize: 'clamp(32px, 5vw, 60px)', color: 'hsl(45, 95%, 60%)', fontStyle: 'italic', letterSpacing: '0.05em', WebkitTextStroke: '2px #000', textShadow: '2px 2px 0 #000', marginBottom: '16px' }}>
            LOVE OUR SERVICE?
          </h2>
          <p style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '28px', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
            Leave us a review on Google — we appreciate your feedback!
          </p>
          <Link to="/quote" style={{ display: 'inline-block', background: 'hsl(48,100%,50%)', color: '#000', fontWeight: 700, fontSize: '1.1rem', padding: '14px 40px', borderRadius: '8px', textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>
            Get a Free Quote
          </Link>
        </div>
      </section>
    </div>
  )
}
