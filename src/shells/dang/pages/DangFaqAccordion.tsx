import { useState } from 'react'

export interface FaqEntry {
  id: string
  question: string
  answer: string
  category: string
  sort_order: number
}

interface Props {
  faqs: FaqEntry[]
}

function AccordionItem({ faq }: { faq: FaqEntry }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid #f0ece8', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', padding: '16px 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: "'Open Sans', sans-serif",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '15px', color: 'hsl(20, 40%, 12%)', lineHeight: 1.4, paddingRight: '12px' }}>
          {faq.question}
        </span>
        <span style={{
          flexShrink: 0, width: '22px', height: '22px', borderRadius: '50%',
          background: open ? '#F97316' : 'transparent',
          border: `2px solid ${open ? '#F97316' : '#ccc'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', color: open ? '#fff' : '#999',
          transition: 'all 0.2s',
        }}>
          {open ? '−' : '+'}
        </span>
      </button>
      <div style={{
        maxHeight: open ? '600px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease',
      }}>
        <p style={{ margin: '0 0 16px', fontSize: '15px', lineHeight: 1.75, color: '#555', paddingRight: '34px' }}>
          {faq.answer}
        </p>
      </div>
    </div>
  )
}

export default function DangFaqAccordion({ faqs }: Props) {
  return (
    <div>
      {faqs.map(faq => <AccordionItem key={faq.id} faq={faq} />)}
    </div>
  )
}
