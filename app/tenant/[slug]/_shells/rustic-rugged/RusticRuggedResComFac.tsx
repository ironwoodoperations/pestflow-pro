import { Home, Bug, Building2, ShieldCheck, Factory, Warehouse, type LucideIcon } from 'lucide-react';

const CIRCLE_STYLE: React.CSSProperties = {
  width: '160px', height: '160px', borderRadius: '50%',
  border: '4px solid var(--color-primary)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backgroundColor: 'var(--color-bg-section, #f8f7f2)',
  flexShrink: 0,
};

const CirclePair = ({ A, B }: { A: LucideIcon; B: LucideIcon }) => (
  <div className="flex gap-4 justify-center items-end">
    <div style={CIRCLE_STYLE}><A aria-hidden="true" width={72} height={72} stroke="var(--color-primary)" strokeWidth={1.5} /></div>
    <div style={{ ...CIRCLE_STYLE, marginBottom: '-24px' }}><B aria-hidden="true" width={72} height={72} stroke="var(--color-primary)" strokeWidth={1.5} /></div>
  </div>
);

const SECTIONS = [
  {
    title: 'Residential Pest Control',
    body: 'Protect your family and home with our comprehensive residential pest management plans. We handle everything from ants and roaches to rodents and termites.',
    icons: [Home, Bug] as [LucideIcon, LucideIcon],
    imageLeft: true,
  },
  {
    title: 'Commercial Pest Control',
    body: 'Keep your business pest-free with discreet, scheduled treatments. We work around your hours to minimize disruption while delivering maximum results.',
    icons: [Building2, ShieldCheck] as [LucideIcon, LucideIcon],
    imageLeft: false,
  },
  {
    title: 'Facility Pest Control',
    body: 'Industrial and facility pest control requires specialized expertise. Our team delivers tailored programs for warehouses, food processing, and large-scale facilities.',
    icons: [Factory, Warehouse] as [LucideIcon, LucideIcon],
    imageLeft: true,
  },
];

export function RusticRuggedResComFac() {
  return (
    <div style={{ backgroundColor: '#ffffff' }}>
      {SECTIONS.map((s, i) => (
        <section key={i} className={`py-14 px-4 ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
          <div className={`max-w-5xl mx-auto flex flex-col ${s.imageLeft ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 items-center`}>
            <div className="shrink-0"><CirclePair A={s.icons[0]} B={s.icons[1]} /></div>
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
  );
}
