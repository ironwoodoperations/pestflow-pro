interface Testimonial { id: string; author_name: string; review_text: string; rating: number }
interface Props { testimonial: Testimonial | null }

const PLACEHOLDER = {
  review_text: "From start to finish, the service was outstanding. The technician was professional, explained everything clearly, and our pest problem was completely resolved. I wouldn't trust anyone else.",
  author_name: 'A Happy Customer',
}

export default function RusticRuggedTestimonials({ testimonial }: Props) {
  const item = testimonial ?? PLACEHOLDER

  return (
    <section className="py-20 px-4 relative overflow-hidden" style={{ backgroundColor: '#1f2937' }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 select-none pointer-events-none"
        style={{ fontSize: '240px', lineHeight: 1, color: 'var(--color-primary)', opacity: 0.12, fontFamily: 'Georgia, serif' }}>
        "
      </div>
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <p className="text-xl md:text-2xl italic text-white leading-relaxed mb-6" style={{ fontFamily: 'Georgia, serif' }}>
          "{item.review_text.slice(0, 200)}{item.review_text.length > 200 ? '…' : ''}"
        </p>
        <p className="text-gray-400 uppercase tracking-widest text-sm mb-8">— {item.author_name}</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="/reviews" className="px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 rounded"
            style={{ border: '1px solid #ffffff' }}>
            See More Reviews
          </a>
          <a href="https://g.page/r/write-review" target="_blank" rel="noopener noreferrer"
            className="px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 rounded"
            style={{ border: '1px solid #ffffff' }}>
            Leave A Review
          </a>
        </div>
      </div>
    </section>
  )
}
