'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface FaqItem { q: string; a: string }

function Row({ q, a }: FaqItem) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="w-full text-left flex items-center justify-between py-4 gap-4">
        <span className="font-medium text-sm" style={{ color: 'var(--color-heading, #1a1a1a)' }}>{q}</span>
        <ChevronRight className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && <p className="text-gray-600 text-sm pb-4 leading-relaxed">{a}</p>}
    </div>
  );
}

export function CityFaqAccordion({ city, faqs }: { city: string; faqs: FaqItem[] }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center" style={{ color: 'var(--color-heading, #1a1a1a)' }}>
          Frequently Asked Questions — {city}
        </h2>
        <div className="border border-gray-100 rounded-xl px-6 bg-gray-50 divide-y divide-gray-100">
          {faqs.map((faq, i) => <Row key={i} q={faq.q} a={faq.a} />)}
        </div>
      </div>
    </section>
  );
}
