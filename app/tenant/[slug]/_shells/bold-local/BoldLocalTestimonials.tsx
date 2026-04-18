const PLACEHOLDERS = [
  { author: 'Sarah M.', text: 'Absolutely amazing service! They were on time, professional, and our mosquito problem is completely gone. Highly recommend to anyone in the area.' },
  { author: 'James R.', text: "Called them for a roach problem that had gotten out of hand. They came out the next day and explained everything clearly. Haven't seen a single roach since." },
  { author: 'Linda K.', text: 'Very professional and knowledgeable. They answered all my questions and gave me a customized plan. The technician was friendly and thorough. 5 stars!' },
];

interface Testimonial { id: string; author_name: string; review_text: string; rating: number }
interface Props { testimonials: Testimonial[] }

export function BoldLocalTestimonials({ testimonials }: Props) {
  const cards = testimonials.length > 0
    ? testimonials.map((t) => ({ author: t.author_name, text: t.review_text }))
    : PLACEHOLDERS;

  return (
    <section className="py-16 px-4" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-2" style={{ color: '#1a1a1a' }}>
          What Our Customers Say
        </h2>
        <div className="mx-auto mb-10" style={{ width: '40px', height: '3px', backgroundColor: 'var(--color-primary)' }} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-md flex flex-col">
              <div className="mb-3" style={{ color: '#f59e0b', fontSize: '18px' }}>⭐⭐⭐⭐⭐</div>
              <p className="text-gray-700 italic text-sm leading-relaxed flex-1 mb-4">
                &ldquo;{card.text.slice(0, 160)}{card.text.length > 160 ? '…' : ''}&rdquo;
              </p>
              <p className="text-sm font-bold" style={{ color: '#1a1a1a' }}>— {card.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
