// ─── SHARED SERVICE PAGE SECTIONS ────────────────────────────────────────────

interface FaqItem { q: string; a: string; }
interface WhyCard { icon: string; title: string; desc: string; }

export function ServiceFaqSection({ faqs }: { faqs: FaqItem[] }) {
  return (
    <section className="px-4 md:px-10" style={{ paddingTop: '70px', paddingBottom: '80px', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ fontWeight: '800', fontSize: 'clamp(26px, 3vw, 38px)', marginBottom: '36px', marginTop: 0 }}>Frequently Asked Questions</h2>
      {faqs.map((faq, i) => (
        <div key={i} style={{ marginBottom: '28px' }}>
          <h3 style={{ fontWeight: '700', fontSize: '18px', marginBottom: '8px', marginTop: 0 }}>{faq.q}</h3>
          <p style={{ fontSize: '15px', lineHeight: 1.75, color: '#444', margin: 0 }}>{faq.a}</p>
        </div>
      ))}
    </section>
  );
}

export function EastTexasCtaSection() {
  return (
    <section className="px-4 md:px-10" style={{ position: 'relative', background: 'hsl(48, 100%, 50%)', paddingTop: '100px', paddingBottom: '90px', clipPath: 'polygon(0 9%, 100% 0, 100% 100%, 0 100%)', marginTop: '-30px', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.12) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '820px', margin: '0 auto', paddingTop: '20px' }}>
        <h2 style={{ fontFamily: '"Bangers", cursive', fontSize: 'clamp(42px, 6vw, 76px)', fontStyle: 'italic', color: 'hsl(20, 40%, 12%)', letterSpacing: '0.04em', marginBottom: '24px', marginTop: 0, lineHeight: 1.1, textShadow: '2px 2px 0 rgba(0,0,0,0.15)' }}>
          PROTECT YOUR EAST TEXAS<br />HOME TODAY
        </h2>
        <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'rgba(0,0,0,0.72)', marginBottom: '12px', marginTop: 0 }}>
          East Texas heat, humidity, and piney woods conditions create the perfect environment for pests year-round. Don't wait until a small problem becomes a major infestation.
        </p>
        <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'rgba(0,0,0,0.72)', margin: 0 }}>
          Dang Pest Control provides safe, effective, and recurring protection for homes across Tyler, Whitehouse, Bullard, Lindale, Flint, and surrounding communities.
        </p>
      </div>
    </section>
  );
}

export function WhyChooseUsCards({ cards }: { cards: WhyCard[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <div key={i} style={{ background: '#f3f3f1', borderRadius: '8px', padding: '28px 20px' }}>
          <img loading="lazy" width={56} height={56} src={card.icon} alt={card.title} style={{ width: '56px', height: '56px', objectFit: 'contain', marginBottom: '14px', display: 'block' }} />
          <h3 style={{ fontWeight: '800', fontSize: '16px', marginBottom: '10px', marginTop: 0 }}>{card.title}</h3>
          <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#555', margin: 0 }}>{card.desc}</p>
        </div>
      ))}
    </div>
  );
}
