'use client';

import { useState } from 'react';

const FAQS = [
  {
    q: 'Are your treatments safe for my kids and pets?',
    a: "Yes — we use targeted, family-safe treatments. We'll tell you exactly what we're applying, how it works, and any simple precautions to take. Most families are back to normal within a few hours.",
  },
  {
    q: 'How much does pest control cost?',
    a: "Pricing depends on your home size and what you're dealing with. We give you a clear, honest quote before we start — no surprises, no upsells.",
  },
  {
    q: 'What if pests come back after my treatment?',
    a: "They're covered. If pests return between scheduled visits, we come back and re-treat at no charge. That's our guarantee.",
  },
  {
    q: 'How soon will I see results?',
    a: "Most clients notice a significant difference within 24–48 hours. Some treatments take a little longer as pests return to treated areas — we'll set honest expectations on your service day.",
  },
];

export function CleanFriendlyFaqStrip() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section style={{ backgroundColor: 'var(--cf-bg-cream)', borderBottom: '1px solid var(--cf-divider)', padding: '4rem 1rem' }}>
      <div className="max-w-3xl mx-auto">
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontFamily: "Georgia,'Source Serif Pro',serif", fontStyle: 'italic', fontSize: 14, color: 'var(--cf-ink-secondary)', marginBottom: '0.5rem' }}>
            common questions
          </p>
          <h2 style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 'clamp(22px,3vw,32px)', color: 'var(--cf-ink)', lineHeight: 1.2 }}>
            Things families usually ask us
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ backgroundColor: 'var(--cf-surface-card)', border: '1px solid var(--cf-divider)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(31,58,77,0.04)' }}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                style={{ width: '100%', textAlign: 'left', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <span style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 15, color: 'var(--cf-ink)', lineHeight: 1.35 }}>
                  {faq.q}
                </span>
                <span style={{ color: 'var(--cf-sky)', fontSize: 22, lineHeight: 1, flexShrink: 0, transform: open === i ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>+</span>
              </button>
              {open === i && (
                <div style={{ padding: '0 1.25rem 1rem' }}>
                  <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 400, fontSize: 14, color: 'var(--cf-ink-secondary)', lineHeight: 1.65 }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
