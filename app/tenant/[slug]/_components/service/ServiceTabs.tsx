'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const SERVICE_TABS = ["Service FAQ's", 'Pest Facts', 'Prevention Tips'];

function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-gray-100">
      {items.map((item, i) => (
        <div key={i}>
          <button onClick={() => setOpen(open === i ? null : i)} className="w-full text-left flex items-center justify-between py-4 gap-4">
            <span className="font-medium text-sm" style={{ color: 'var(--color-heading)' }}>{item.q}</span>
            <ChevronDown className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && <p className="text-gray-600 text-sm pb-4 leading-relaxed">{item.a}</p>}
        </div>
      ))}
    </div>
  );
}

interface FaqItem { q: string; a: string }
interface Props {
  serviceName: string;
  faqs: FaqItem[];
}

export function ServiceTabs({ serviceName, faqs }: Props) {
  const [activeTab, setActiveTab] = useState(0);

  const tabFaqs: FaqItem[][] = [
    faqs,
    [
      { q: `What are the most common signs of ${serviceName.toLowerCase()} activity?`, a: `Look for droppings, damage, or other physical evidence specific to ${serviceName.toLowerCase()}. A professional inspection can confirm what you're dealing with.` },
      { q: `How quickly can ${serviceName.toLowerCase()} cause damage?`, a: 'Depending on the pest, damage can escalate quickly. Early detection and treatment is always the most cost-effective approach.' },
      { q: `Are ${serviceName.toLowerCase()} dangerous to my family?`, a: "Some pests pose direct health risks through bites or disease transmission. Others cause structural or property damage. Our technicians will explain the specific risks for your situation." },
      { q: `What time of year is ${serviceName.toLowerCase()} most active?`, a: "Activity varies by species and climate. We'll advise on the best treatment timing for your region and pest pressure." },
    ],
    [
      { q: 'What can I do to prevent future infestations?', a: 'Seal entry points, eliminate food and water sources, reduce clutter, and maintain a regular pest control service schedule.' },
      { q: 'How important is perimeter treatment?', a: 'Treating the exterior of your home creates a barrier that stops pests before they get inside. This is the foundation of any good prevention program.' },
      { q: 'Does landscaping affect pest activity?', a: "Yes. Overgrown vegetation, mulch against foundations, and standing water all create harborage areas and pest pathways. We'll identify these during our inspection." },
      { q: 'How often should I schedule preventive treatments?', a: 'Quarterly service is our most popular option for year-round protection. We also offer monthly and bi-monthly plans for higher-risk properties.' },
    ],
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: 'var(--color-heading)' }}>
          Learn More About {serviceName}
        </h2>
        <div className="flex gap-2 mb-6 flex-wrap">
          {SERVICE_TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className="px-5 py-2 rounded-full text-sm font-medium transition"
              style={activeTab === i ? { backgroundColor: 'var(--color-primary)', color: '#fff' } : { backgroundColor: '#f1f3f5', color: '#555' }}>
              {tab}
            </button>
          ))}
        </div>
        <div className="border border-gray-100 rounded-xl px-6 bg-gray-50">
          <Accordion items={tabFaqs[activeTab] || faqs} />
        </div>
      </div>
    </section>
  );
}
