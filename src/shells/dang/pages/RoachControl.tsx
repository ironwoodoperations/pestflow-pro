import Navbar from '../ShellNavbar';
import Footer from '../ShellFooter';
import SEO from '../SEO';
import { StructuredData } from '../StructuredData';
import { VideoImage } from '../VideoImage';
import { STEP_COLORS, steps, whyCards, faqs } from './data/RoachControlData';
import { usePageContent } from '../../../hooks/usePageContent';

const RoachControl = () => {
  const { content } = usePageContent('roach-control');

  return (
    <div style={{ fontFamily: "'Open Sans', sans-serif", color: 'hsl(20, 40%, 12%)', overflowX: 'hidden' }}>
      <SEO
        title="Roach Control in Tyler, TX"
        description="Professional roach control in Tyler, TX. Cockroach elimination and prevention. Licensed technicians with a Super Powered Guarantee. Call (903) 871-0550."
        canonical="/roach-control"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Roach Control",
          provider: { "@type": "LocalBusiness", name: "Dang Pest Control", telephone: "+19038710550" },
          areaServed: { "@type": "City", name: "Tyler", addressRegion: "TX" },
          description: "Professional roach control services including cockroach elimination and prevention.",
        }}
      />
      <StructuredData data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q.replace(/^\d+\.\s*/, ""),
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }} />
      <Navbar />
      <main>
      <section style={{ position: 'relative', background: `url(/dang/moblie_banner.webp) center/cover no-repeat, hsl(28, 100%, 50%)`, paddingTop: '80px', paddingBottom: '200px', minHeight: '420px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.18) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '0 20px 30px' }}>
          <h1 style={{ fontFamily: '"Bangers", cursive', fontSize: 'clamp(56px, 9vw, 100px)', color: 'hsl(45, 95%, 60%)', fontStyle: 'italic', letterSpacing: '0.05em', WebkitTextStroke: '3px #000000', textShadow: '3px 3px 0 #000000', margin: 0, lineHeight: 1 }}>{content?.title ?? 'ROACH CONTROL'}</h1>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 1 }}>
          <img fetchPriority="high" width={1200} height={50} src="/dang/banner-img.png" alt="" style={{ width: '100%', display: 'block' }} />
        </div>
      </section>

      <section className="px-4 md:px-10" style={{ paddingTop: '80px', paddingBottom: '60px', maxWidth: '1200px', margin: '0 auto', background: '#ffffff', backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div style={{ border: '4px solid rgb(255, 213, 39)', borderRadius: '6px', overflow: 'hidden', boxShadow: '8px 8px 0 rgba(0,0,0,0.1)' }}>
            <VideoImage src="https://www.dangpestcontrol.com/wp-content/uploads/2025/05/Interior-Sprayer-Crevice-Stove-scaled-e1746478847941.jpg" alt="Cockroach Pest Control Services in Tyler TX" className="" videoUrl={content?.video_url ?? null} videoType={(content?.video_type as string) ?? null} />
          </div>
          <div>
            <p style={{ fontFamily: '"Bangers", cursive', color: 'hsl(28, 100%, 50%)', fontSize: '18px', letterSpacing: '0.12em', fontStyle: 'italic', marginBottom: '6px', marginTop: 0 }}>{content?.subtitle ?? 'ROACHES'}</p>
            <h2 style={{ fontSize: 'clamp(26px, 2.8vw, 38px)', fontWeight: '800', marginBottom: '18px', marginTop: 0 }}>{content?.title ?? 'Cockroach Pest Control Services'}</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.75, marginBottom: '28px', color: '#444', marginTop: 0 }}>{content?.intro ?? 'A cockroach infestation can quickly turn into a nightmare, disrupting your comfort, damaging your property, and creating health concerns. At{\' \'} Dang Pest Control, we\'re here to provide you with effective, long-term solutions for roach control. We serve Tyler, TX, and the surrounding areas. Call us today at{\' \'} (903) 871-0550{\' \'}and{\' \'} get your quote.'}</p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a href="tel:(903) 871-0550" style={{ padding: '13px 28px', border: '2px solid hsl(20, 40%, 12%)', borderRadius: '50px', fontWeight: '700', color: 'hsl(20, 40%, 12%)', textDecoration: 'none', fontSize: '15px', whiteSpace: 'nowrap' }}>(903) 871-0550</a>
              <a href="/quote" style={{ padding: '13px 28px', background: 'hsl(28, 100%, 50%)', borderRadius: '50px', fontWeight: '700', color: '#fff', textDecoration: 'none', fontSize: '15px', whiteSpace: 'nowrap' }}>Get Your Quote</a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-10" style={{ background: '#f1f1ef', paddingTop: '70px', paddingBottom: '70px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontWeight: '800', fontSize: 'clamp(26px, 3vw, 40px)', marginBottom: '10px', marginTop: 0 }}>Our Expert Cockroach Treatment Process</h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '50px', marginTop: 0 }}>We use a proven process to target even the most stubborn infestations.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" style={{ marginBottom: '28px' }}>
            {steps.slice(0, 4).map((step, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: '"Bangers", cursive', color: STEP_COLORS[i], fontSize: '15px', letterSpacing: '0.12em', fontStyle: 'italic', margin: '0 0 4px 0' }}>{step.num}</p>
                    <h3 style={{ fontWeight: '800', fontSize: '17px', margin: 0 }}>{step.title}</h3>
                  </div>
                  <img loading="lazy" width={58} height={58} src={step.icon} alt={step.title} style={{ width: '58px', height: '58px', objectFit: 'contain', background: STEP_COLORS[i], borderRadius: '6px', padding: '8px', flexShrink: 0 }} />
                </div>
                <div style={{ flex: 1, borderLeft: `4px solid ${STEP_COLORS[i]}`, margin: '16px 24px 0 24px', paddingLeft: '14px', paddingBottom: '24px' }}>
                  <p style={{ fontSize: '14px', lineHeight: 1.75, color: '#555', margin: 0 }}>{step.desc}</p>
                </div>
                <div style={{ height: '5px', background: STEP_COLORS[i], marginTop: 'auto' }} />
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: '"Bangers", cursive', color: STEP_COLORS[4], fontSize: '15px', letterSpacing: '0.12em', fontStyle: 'italic', margin: '0 0 4px 0' }}>{steps[4].num}</p>
                <h3 style={{ fontWeight: '800', fontSize: '17px', margin: 0 }}>{steps[4].title}</h3>
              </div>
              <img loading="lazy" width={58} height={58} src={steps[4].icon} alt={steps[4].title} style={{ width: '58px', height: '58px', objectFit: 'contain', background: STEP_COLORS[4], borderRadius: '6px', padding: '8px', flexShrink: 0 }} />
            </div>
            <div style={{ flex: 1, borderLeft: `4px solid ${STEP_COLORS[4]}`, margin: '16px 24px 0 24px', paddingLeft: '14px', paddingBottom: '24px' }}>
              <p style={{ fontSize: '14px', lineHeight: 1.75, color: '#555', margin: 0 }}>{steps[4].desc}</p>
            </div>
            <div style={{ height: '5px', background: STEP_COLORS[4], marginTop: 'auto' }} />
          </div>
          <p style={{ textAlign: 'center', fontSize: '15px', color: '#444', marginTop: '32px' }}>Whether you're battling a current infestation or looking to prevent one, our cockroach treatment helps you regain peace of mind.</p>
          <div style={{ textAlign: 'center', paddingTop: '24px' }}>
            <a href="/quote" style={{ display: 'inline-block', padding: '16px 52px', background: 'hsl(28, 100%, 50%)', borderRadius: '50px', fontWeight: '700', color: '#fff', textDecoration: 'none', fontSize: '16px' }}>Get Your Quote</a>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-10" style={{ paddingTop: '70px', paddingBottom: '70px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontWeight: '800', fontSize: 'clamp(26px, 3vw, 38px)', marginBottom: '12px', marginTop: 0 }}>Why Choose Us?</h2>
        <p style={{ fontSize: '15px', color: '#444', marginBottom: '36px', marginTop: 0 }}>When it comes to your home or property, you deserve nothing but the best. Here's why Dang Pest Control is the top choice for cockroach pest control in Tyler, TX, and beyond:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: '20px' }}>
          {whyCards.map((card, i) => (
            <div key={i} style={{ background: '#f3f3f1', borderRadius: '8px', padding: '28px 20px' }}>
              <img loading="lazy" width={56} height={56} src={card.icon} alt={card.title} style={{ width: '56px', height: '56px', objectFit: 'contain', marginBottom: '14px', display: 'block' }} />
              <h3 style={{ fontWeight: '800', fontSize: '16px', marginBottom: '10px', marginTop: 0 }}>{card.title}</h3>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#555', margin: 0 }}>{card.desc}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#444', marginTop: '32px', marginBottom: 0 }}>Trusting your property to Dang Pest Control means choosing reliable results, expert care, and unmatched professionalism.</p>
        <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#444', marginTop: '16px', marginBottom: 0 }}>Cockroaches are one of the most persistent, resilient, and unsanitary pests in East Texas, thriving in warm, humid environments and invading homes and businesses in search of food, water, and shelter. The most common species in the region—including the American, German, Smoky Brown, Oriental, and Brown-Banded cockroaches—are known for their rapid reproduction and ability to hide in hard-to-reach areas like kitchens, bathrooms, basements, attics and also in cracks, crevices, drains and even appliances.</p>
        <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#444', marginTop: '16px', marginBottom: 0 }}>Cockroaches pose serious health risks, as they carry bacteria, viruses, and allergens that can contaminate food, trigger asthma and allergy symptoms, and spread diseases such as Salmonella and E. coli. At Dang Pest Control, we specialize in comprehensive cockroach control, using industry-leading treatments to eliminate roaches at every stage of their life cycle and prevent them from returning.</p>
      </section>

      <section className="px-4 md:px-10" style={{ paddingTop: '0px', paddingBottom: '80px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <h2 style={{ fontWeight: '800', fontSize: 'clamp(26px, 3vw, 38px)', marginBottom: '20px', marginTop: 0 }}>Get Started With Your Quote</h2>
            <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '28px', color: '#444', marginTop: 0 }}>
              Dang Pest Control offers solutions designed to protect your home or property from cockroach infestations effectively. Located in Tyler, TX, we proudly serve the surrounding areas including{' '}
              <a href="/longview-tx" style={{ color: '#000', textDecoration: 'underline' }}>Longview</a>,{' '}
              <a href="/jacksonville-tx" style={{ color: '#000', textDecoration: 'underline' }}>Jacksonville</a>,{' '}
              <a href="/lindale-tx" style={{ color: '#000', textDecoration: 'underline' }}>Lindale</a>,{' '}
              <a href="/bullard-tx" style={{ color: '#000', textDecoration: 'underline' }}>Bullard</a>, and{' '}
              <a href="/whitehouse-tx" style={{ color: '#000', textDecoration: 'underline' }}>Whitehouse</a>. Don't wait – restore comfort and enjoyment to your property today. Call us today at{' '}
              <a href="tel:(903) 871-0550" style={{ color: '#000', fontWeight: '700' }}>(903) 871-0550</a> and{' '}
              <a href="/quote" style={{ color: '#000', textDecoration: 'underline' }}>get your quote</a>.
            </p>
            <a href="/quote" style={{ display: 'inline-block', padding: '14px 40px', background: 'hsl(28, 100%, 50%)', borderRadius: '50px', fontWeight: '700', color: '#fff', textDecoration: 'none', fontSize: '16px' }}>Get Your Quote</a>
          </div>
          <div style={{ position: 'relative', padding: '20px' }}>
            <div style={{ position: 'absolute', inset: 0, background: '#fff', backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)', backgroundSize: '22px 22px', borderRadius: '8px', zIndex: 0 }} />
            <div style={{ position: 'relative', zIndex: 1, border: '4px solid rgb(255, 213, 39)', borderRadius: '6px', overflow: 'hidden', boxShadow: '8px 8px 0 rgba(0,0,0,0.1)' }}>
              <img loading="lazy" width={600} height={400} src="https://www.dangpestcontrol.com/wp-content/uploads/2025/05/Interior-Pantry-Flashlight-scaled-e1746214181278.jpg" alt="Cockroach Exterminator in Tyler Texas" style={{ width: '100%', display: 'block' }} />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-10" style={{ paddingTop: '70px', paddingBottom: '80px', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ fontWeight: '800', fontSize: 'clamp(26px, 3vw, 38px)', marginBottom: '36px', marginTop: 0 }}>Frequently Asked Questions</h2>
        {faqs.map((faq, i) => (
          <div key={i} style={{ marginBottom: '28px' }}>
            <h3 style={{ fontWeight: '700', fontSize: '18px', marginBottom: '8px', marginTop: 0 }}>{faq.q}</h3>
            <p style={{ fontSize: '15px', lineHeight: 1.75, color: '#444', margin: 0 }}>{faq.a}</p>
          </div>
        ))}
      </section>

      <section className="px-4 md:px-10" style={{ position: 'relative', background: 'hsl(48, 100%, 50%)', paddingTop: '100px', paddingBottom: '90px', clipPath: 'polygon(0 9%, 100% 0, 100% 100%, 0 100%)', marginTop: '-30px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.12) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '820px', margin: '0 auto', paddingTop: '20px' }}>
          <h2 style={{ fontFamily: '"Bangers", cursive', fontSize: 'clamp(42px, 6vw, 76px)', fontStyle: 'italic', color: 'hsl(20, 40%, 12%)', letterSpacing: '0.04em', marginBottom: '24px', marginTop: 0, lineHeight: 1.1, textShadow: '2px 2px 0 rgba(0,0,0,0.15)' }}>PROTECT YOUR EAST TEXAS<br />HOME TODAY</h2>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'rgba(0,0,0,0.72)', marginBottom: '12px', marginTop: 0 }}>East Texas heat, humidity, and piney woods conditions create the perfect environment for pests year-round. Don't wait until a small problem becomes a major infestation.</p>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'rgba(0,0,0,0.72)', margin: 0 }}>Dang Pest Control provides safe, effective, and recurring protection for homes across Tyler, Whitehouse, Bullard, Lindale, Flint, and surrounding communities.</p>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
};

export default RoachControl;
