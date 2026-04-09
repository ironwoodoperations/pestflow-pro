const reasons = [
  {
    icon: "/dang/why-professional.webp",
    title: "Professional, Licensed & Highly Trained Technicians",
    description: "Our technicians bring years of expertise and know-how to deliver results you can trust. As proud members of the National Pest Management Association (NPMA) and Texas Pest Control Association (TPCA), we hold ourselves to the highest industry standards.",
  },
  {
    icon: "/dang/why-family.webp",
    title: "Family & Pet Friendly",
    description: "Our environmentally-aware practices and products prioritize your loved ones, offering peace of mind with every service.",
  },
  {
    icon: "/dang/why-custom.webp",
    title: "Custom Plans for Lasting Results",
    description: "We take an Integrated Pest Management approach, considering the factors contributing to the problem. Each plan is tailored to your home's specific needs, focusing on eradicating pests and preventing future infestations.",
  },
  {
    icon: "/dang/why-superpowered.webp",
    title: "Super Powered Guarantee",
    description: "If pests persist between regularly scheduled visits, we'll return to re-treat your property free of charge. That's our commitment to your satisfaction.",
  },
  {
    icon: "/dang/why-referral.webp",
    title: "How to Get Free Pest Service!",
    description: "Want to save money on the cost of your pest control service? For every person you refer to Dang Pest Control that signs up for our general pest control service, you'll get your next month free! There are no limits on referral credits, so you could potentially get free services for life!",
  },
];

const WhyChooseUs = () => {
  return (
    <section
      className="py-16"
      style={{
        background: '#ffffff',
        backgroundImage: `radial-gradient(circle, #d0d0d0 1px, transparent 1px), url('/why-bg.webp')`,
        backgroundSize: '24px 24px, cover',
        backgroundPosition: 'center, center',
      }}
    >
      <div className="mx-auto px-8" style={{ maxWidth: '1100px' }}>

        {/* 3-column grid, 2 rows */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* LEFT COL ROW 1 — Title text */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              paddingTop: '8px',
            }}
          >
            <p className="text-comic text-sm italic mb-2" style={{ color: 'hsl(28, 100%, 50%)' }}>WHY CHOOSE US</p>
            <h2
              className="text-comic mb-4 leading-tight"
              style={{ color: 'hsl(20, 40%, 12%)', fontSize: 'clamp(28px, 3vw, 42px)' }}
            >
              Why Choose Dang Pest Control?
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(20, 20%, 40%)' }}>
              We know you have options when it comes to pest control, but here's what sets us apart.
            </p>
          </div>

          {/* MIDDLE COL ROW 1 — Professional card */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'hsl(30, 20%, 93%)',
            }}
          >
            <img src={reasons[0].icon} alt={reasons[0].title} className="w-20 h-20 object-contain mb-4" />
            <h3 className="text-comic text-base mb-3 uppercase" style={{ color: 'hsl(20, 40%, 12%)' }}>{reasons[0].title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(20, 20%, 40%)' }}>{reasons[0].description}</p>
          </div>

          {/* RIGHT COL ROW 1 — Family & Pet card */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'hsl(30, 20%, 93%)',
            }}
          >
            <img src={reasons[1].icon} alt={reasons[1].title} className="w-20 h-20 object-contain mb-4" />
            <h3 className="text-comic text-base mb-3 uppercase" style={{ color: 'hsl(20, 40%, 12%)' }}>{reasons[1].title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(20, 20%, 40%)' }}>{reasons[1].description}</p>
          </div>

          {/* LEFT COL ROW 2 — How to Get Free Pest Service card */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'hsl(30, 20%, 93%)',
            }}
          >
            <img src={reasons[4].icon} alt={reasons[4].title} className="w-20 h-20 object-contain mb-4" />
            <h3 className="text-comic text-base mb-3 uppercase" style={{ color: 'hsl(20, 40%, 12%)' }}>{reasons[4].title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(20, 20%, 40%)' }}>{reasons[4].description}</p>
          </div>

          {/* MIDDLE COL ROW 2 — Custom Plans card */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'hsl(30, 20%, 93%)',
            }}
          >
            <img src={reasons[2].icon} alt={reasons[2].title} className="w-20 h-20 object-contain mb-4" />
            <h3 className="text-comic text-base mb-3 uppercase" style={{ color: 'hsl(20, 40%, 12%)' }}>{reasons[2].title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(20, 20%, 40%)' }}>{reasons[2].description}</p>
          </div>

          {/* RIGHT COL ROW 2 — Super Powered card */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'hsl(30, 20%, 93%)',
            }}
          >
            <img src={reasons[3].icon} alt={reasons[3].title} className="w-20 h-20 object-contain mb-4" />
            <h3 className="text-comic text-base mb-3 uppercase" style={{ color: 'hsl(20, 40%, 12%)' }}>{reasons[3].title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(20, 20%, 40%)' }}>{reasons[3].description}</p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
