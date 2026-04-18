'use client';

import { useState } from 'react';

const FAQS = [
  {
    q: 'How much does pest control cost?',
    a: "Pricing depends on your home size and the pests you're dealing with. Contact us for a free estimate — we'll give you a clear, honest quote with no surprises.",
  },
  {
    q: 'Are your treatments safe for my family and pets?',
    a: "Yes — we use targeted, eco-conscious treatments that are safe when applied as directed. We'll tell you exactly what we're using and any precautions to take.",
  },
  {
    q: 'How often should I schedule pest control?',
    a: 'Most homes benefit from quarterly service to prevent infestations before they start. We offer flexible plans — monthly, bi-monthly, or quarterly.',
  },
];

export function CleanFriendlyFaqStrip() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section style={{ background: 'var(--color-bg-section)' }} className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-primary)' }}>FAQ</p>
          <h2 className="text-3xl font-bold" style={{ color: 'var(--color-heading)' }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-6 py-4 flex items-center justify-between gap-4"
              >
                <span className="font-semibold text-sm" style={{ color: 'var(--color-heading)' }}>
                  {faq.q}
                </span>
                <span className="flex-shrink-0 text-lg transition-transform duration-200"
                      style={{ color: 'var(--color-primary)', transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                  +
                </span>
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
