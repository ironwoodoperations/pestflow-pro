'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const TABS = [
  {
    id: 'general', label: 'General',
    faqs: [
      { q: 'How often should I have my home treated?', a: "We recommend quarterly (every 3 months) treatments for year-round protection. Some clients opt for bi-monthly service if they have ongoing pest pressure. We'll recommend the right frequency for your situation." },
      { q: 'Are your treatments safe for my family and pets?', a: "Yes. We use EPA-registered products applied by licensed technicians following label instructions. We'll provide re-entry times and any specific precautions for your treatment." },
      { q: 'Do I need to leave during treatment?', a: "For most treatments, you and your pets can remain home. For certain services like whole-home bed bug treatment or fumigation, temporary relocation is required. We'll advise in advance." },
      { q: 'What is your service guarantee?', a: "We offer a satisfaction guarantee on all recurring service plans. If pests return between scheduled services, we'll retreat at no additional charge." },
      { q: 'How do I prepare for my service appointment?', a: "Clear clutter from cabinets and baseboards, store food in sealed containers, and make sure pets are secured. We'll send a preparation checklist when you book." },
    ],
  },
  {
    id: 'rodents', label: 'Rodents',
    faqs: [
      { q: 'How do I know if I have a rodent infestation?', a: 'Look for droppings (especially near food sources), gnaw marks on wires or wood, grease marks along walls, or unusual sounds at night. A professional inspection can confirm the extent.' },
      { q: 'How do you get rid of mice without harming pets?', a: 'We use tamper-resistant bait stations in locations inaccessible to pets and children. We also offer snap trap and exclusion-only programs for pet-sensitive households.' },
      { q: 'Can rodents enter a sealed home?', a: 'Mice can squeeze through gaps as small as a dime. Our exclusion service seals entry points using steel wool, caulk, and hardware cloth to close the most common access routes.' },
      { q: 'How long does rodent treatment take?', a: 'Initial setup takes 1-2 hours. We return within 7-14 days for a follow-up inspection to assess activity and refresh bait stations as needed.' },
      { q: 'Will rodents come back after treatment?', a: 'Without exclusion work, re-entry is possible. We recommend pairing bait station service with an entry-point exclusion package for lasting results.' },
    ],
  },
  {
    id: 'mosquitoes', label: 'Mosquitoes',
    faqs: [
      { q: 'How does mosquito barrier spray work?', a: 'Our technicians apply a fine mist treatment to foliage, eaves, and harborage areas. The residual barrier repels and kills mosquitoes for up to 3 weeks, depending on rainfall.' },
      { q: 'When is the best time to start mosquito service?', a: 'We recommend starting in early spring before mosquito season peaks. Service typically runs April through October in most regions.' },
      { q: 'Do you treat standing water?', a: 'Yes. Where accessible, we apply EPA-registered larvicide dunks to standing water (gutters, decorative ponds, birdbaths) that prevent larvae from developing.' },
      { q: 'Is the spray safe for honeybees?', a: 'We apply treatments in the early morning or evening when bees are less active, and avoid direct application to flowering plants. Always inform us of any known hive locations.' },
      { q: 'How soon will I see results?', a: 'Mosquito populations should noticeably drop within 48-72 hours of treatment. Continued service maintains the barrier throughout the season.' },
    ],
  },
  {
    id: 'termites', label: 'Termites',
    faqs: [
      { q: 'How do I know if I have termites?', a: "Warning signs include mud tubes along foundation walls, hollow-sounding wood, discarded wings near windowsills, and visible damage to wood framing. A free inspection confirms activity." },
      { q: 'What types of termite treatment do you offer?', a: "We offer liquid soil treatments (Termidor), bait station systems (Sentricon), and spot treatments for localized damage. We'll recommend the best approach based on your property." },
      { q: 'How long does termite treatment last?', a: 'Liquid treatments like Termidor provide soil protection for 10+ years. Bait systems require quarterly monitoring visits. We document all treatments and provide warranties.' },
      { q: 'Will termite treatment damage my landscaping?', a: 'Liquid treatments require trenching along the foundation, which minimally disturbs landscaping. We take care to restore soil and mulch after treatment.' },
      { q: 'Do I need a termite inspection to sell my home?', a: 'Many lenders require a Wood-Destroying Organism (WDO) inspection as part of the mortgage process. We provide certified inspection reports accepted by lenders and real estate attorneys.' },
    ],
  },
];

function Accordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-gray-100">
      {faqs.map((faq, i) => (
        <div key={i}>
          <button onClick={() => setOpen(open === i ? null : i)} className="w-full text-left flex items-center justify-between py-4 gap-4 group">
            <span className="font-medium text-sm" style={{ color: 'var(--color-heading)' }}>{faq.q}</span>
            <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform text-gray-400 ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && <p className="text-gray-600 text-sm pb-4 leading-relaxed">{faq.a}</p>}
        </div>
      ))}
    </div>
  );
}

interface FaqItem { question: string; answer: string }
interface Props { faqs?: FaqItem[] }

export function FaqTabs({ faqs: dbFaqs }: Props) {
  const [activeTab, setActiveTab] = useState('general');
  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-accent)' }}>Common Questions</p>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--color-heading)' }}>Get Answers to Common Pest Control Questions</h2>
        </div>
        <div className="flex gap-2 mb-8 flex-wrap">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="px-5 py-2 rounded-full text-sm font-medium transition"
              style={activeTab === tab.id ? { backgroundColor: 'var(--color-primary)', color: '#ffffff' } : { backgroundColor: '#f1f3f5', color: '#555' }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="border border-gray-100 rounded-xl px-6 bg-gray-50">
          <Accordion faqs={dbFaqs?.length ? dbFaqs.map((f) => ({ q: f.question, a: f.answer })) : currentTab.faqs} />
        </div>
      </div>
    </section>
  );
}
