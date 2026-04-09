const CIRCLE_STYLE: React.CSSProperties = {
  width: '160px', height: '160px', borderRadius: '50%',
  overflow: 'hidden', border: '4px solid var(--color-primary)',
  flexShrink: 0,
}

const CirclePair = ({ a, b }: { a: string; b: string }) => (
  <div className="flex gap-4 justify-center items-end">
    <div style={CIRCLE_STYLE}><img src={a} alt="" className="w-full h-full object-cover" loading="lazy" /></div>
    <div style={{ ...CIRCLE_STYLE, marginBottom: '-24px' }}><img src={b} alt="" className="w-full h-full object-cover" loading="lazy" /></div>
  </div>
)

const SECTIONS = [
  {
    title: 'Residential Pest Control',
    body: 'Protect your family and home with our comprehensive residential pest management plans. We handle everything from ants and roaches to rodents and termites.',
    photos: ['https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=400', 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=400'],
    imageLeft: true,
  },
  {
    title: 'Commercial Pest Control',
    body: 'Keep your business pest-free with discreet, scheduled treatments. We work around your hours to minimize disruption while delivering maximum results.',
    photos: ['https://images.pexels.com/photos/269077/pexels-photo-269077.jpeg?auto=compress&cs=tinysrgb&w=400', 'https://images.pexels.com/photos/1015568/pexels-photo-1015568.jpeg?auto=compress&cs=tinysrgb&w=400'],
    imageLeft: false,
  },
  {
    title: 'Facility Pest Control',
    body: 'Industrial and facility pest control requires specialized expertise. Our team delivers tailored programs for warehouses, food processing, and large-scale facilities.',
    photos: ['https://images.pexels.com/photos/1267338/pexels-photo-1267338.jpeg?auto=compress&cs=tinysrgb&w=400', 'https://images.pexels.com/photos/257816/pexels-photo-257816.jpeg?auto=compress&cs=tinysrgb&w=400'],
    imageLeft: true,
  },
]

export default function RusticRuggedResComFac() {
  return (
    <div style={{ backgroundColor: '#ffffff' }}>
      {SECTIONS.map((s, i) => (
        <section key={i} className={`py-14 px-4 ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
          <div className={`max-w-5xl mx-auto flex flex-col ${s.imageLeft ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 items-center`}>
            <div className="shrink-0"><CirclePair a={s.photos[0]} b={s.photos[1]} /></div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: '#1a1a1a' }}>{s.title}</h2>
              <div className="mb-4" style={{ width: '40px', height: '3px', backgroundColor: 'var(--color-primary)' }} />
              <p className="text-gray-600 leading-relaxed mb-6">{s.body}</p>
              <a href="/contact" className="inline-block font-bold rounded px-6 py-2.5 text-white text-sm transition hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                Get Started
              </a>
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}
