'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface FaqItem { q: string; a: string }

// S267: `isBoldLocal` gates dark-surface styling. Every other theme keeps its
// exact prior light markup (white panel, gray body text) — no Dang change.
function Row({ q, a, isBoldLocal }: FaqItem & { isBoldLocal: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="w-full text-left flex items-center justify-between py-4 gap-4">
        <span className="font-medium text-sm" style={{ color: 'var(--color-heading, #1a1a1a)' }}>{q}</span>
        <ChevronRight className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <p
          className={isBoldLocal ? 'text-sm pb-4 leading-relaxed' : 'text-gray-600 text-sm pb-4 leading-relaxed'}
          style={isBoldLocal ? { color: 'var(--color-body-text)' } : undefined}
        >
          {a}
        </p>
      )}
    </div>
  );
}

export function CityFaqAccordion({ city, faqs, isBoldLocal = false }: { city: string; faqs: FaqItem[]; isBoldLocal?: boolean }) {
  return (
    <section className="py-16" style={{ backgroundColor: isBoldLocal ? 'var(--color-bg-section)' : '#ffffff' }}>
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center" style={{ color: 'var(--color-heading, #1a1a1a)' }}>
          Frequently Asked Questions — {city}
        </h2>
        <div
          className={`rounded-xl px-6 divide-y ${isBoldLocal ? 'border divide-[#2A3038]' : 'border border-gray-100 bg-gray-50 divide-gray-100'}`}
          style={isBoldLocal ? { backgroundColor: 'var(--color-primary-light)', borderColor: 'var(--color-border)' } : undefined}
        >
          {faqs.map((faq, i) => <Row key={i} q={faq.q} a={faq.a} isBoldLocal={isBoldLocal} />)}
        </div>
      </div>
    </section>
  );
}
