const reasons = [
  { icon: '/why-professional.webp', title: 'Professional, Licensed & Highly Trained Technicians', description: "Our technicians bring years of expertise and know-how to deliver results you can trust. As proud members of the National Pest Management Association (NPMA) and Texas Pest Control Association (TPCA), we hold ourselves to the highest industry standards." },
  { icon: '/why-family.webp', title: 'Family & Pet Friendly', description: 'Our environmentally-aware practices and products prioritize your loved ones, offering peace of mind with every service.' },
  { icon: '/why-custom.webp', title: 'Custom Plans for Lasting Results', description: "We take an Integrated Pest Management approach, considering the factors contributing to the problem. Each plan is tailored to your home's specific needs." },
  { icon: '/why-superpowered.webp', title: 'Super Powered Guarantee', description: "If pests persist between regularly scheduled visits, we'll return to re-treat your property free of charge. That's our commitment to your satisfaction." },
  { icon: '/why-referral.webp', title: 'How to Get Free Pest Service!', description: "Want to save money on the cost of your pest control service? For every person you refer that signs up for our general pest control service, you'll get your next month free!" },
]

const CARD_BG = 'hsl(30,20%,93%)'
const DARK = 'hsl(20,40%,12%)'
const MUTED = 'hsl(20,20%,40%)'

function WhyCard({ reason }: { reason: typeof reasons[0] }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: CARD_BG }}>
      <img src={reason.icon} alt={reason.title} className="w-20 h-20 object-contain mb-4" />
      <h3 className="dang-text-comic text-base mb-3 uppercase" style={{ color: DARK }}>{reason.title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{reason.description}</p>
    </div>
  )
}

export default function WhyChooseUs() {
  return (
    <section className="py-16" style={{ background: '#ffffff', backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      <div className="mx-auto px-8" style={{ maxWidth: '1100px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: '8px' }}>
            <p className="dang-text-comic text-sm italic mb-2" style={{ color: 'hsl(28,100%,50%)' }}>WHY CHOOSE US</p>
            <h2 className="dang-text-comic mb-4 leading-tight" style={{ color: DARK, fontSize: 'clamp(28px,3vw,42px)' }}>Why Choose Dang Pest Control?</h2>
            <p className="text-sm leading-relaxed" style={{ color: MUTED }}>We know you have options when it comes to pest control, but here's what sets us apart.</p>
          </div>
          <WhyCard reason={reasons[0]} />
          <WhyCard reason={reasons[1]} />
          <WhyCard reason={reasons[4]} />
          <WhyCard reason={reasons[2]} />
          <WhyCard reason={reasons[3]} />
        </div>
      </div>
    </section>
  )
}
