import SEO from '../SEO';
import { VideoImage } from '../VideoImage';
import { STEP_COLORS, steps, whyCards } from './data/PestControlPageData';
import { usePageContent } from '../../../hooks/usePageContent';

const PestControlPage = () => {
  const { content } = usePageContent('pest-control');

  return (
    <div style={{ fontFamily: "'Open Sans', sans-serif", color: 'hsl(20, 40%, 12%)', overflowX: 'hidden' }}>
      <SEO
        title="Pest Control Services in Tyler, TX"
        description="Professional pest control services in Tyler, TX. Comprehensive pest management for homes and businesses. Licensed technicians with a Super Powered Guarantee. Call (903) 871-0550."
        canonical="/pest-control"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Pest Control Services",
          provider: { "@type": "LocalBusiness", name: "Dang Pest Control", telephone: "+19038710550" },
          areaServed: { "@type": "City", name: "Tyler", addressRegion: "TX" },
          description: "Professional pest control services for residential and commercial properties.",
        }}
      />

      <div>
      <section style={{ position: 'relative', background: `url(/dang/moblie_banner.webp) center/cover no-repeat, hsl(28, 100%, 50%)`, paddingTop: '80px', paddingBottom: '200px', minHeight: '420px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.18) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '0 20px 30px' }}>
          <h1 style={{ fontFamily: '"Bangers", cursive', fontSize: 'clamp(56px, 9vw, 100px)', color: 'hsl(45, 95%, 60%)', fontStyle: 'italic', letterSpacing: '0.05em', WebkitTextStroke: '3px #000000', textShadow: '3px 3px 0 #000000', margin: 0, lineHeight: 1 }}>{content?.title ?? 'PEST CONTROL SERVICES'}</h1>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 1 }}>
          <img fetchPriority="high" width={1200} height={50} src="/dang/banner-img.png" alt="" style={{ width: '100%', display: 'block' }} />
        </div>
      </section>

      <section className="px-4 md:px-10" style={{ paddingTop: '80px', paddingBottom: '60px', maxWidth: '1200px', margin: '0 auto', background: '#ffffff', backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div style={{ border: '4px solid rgb(255, 213, 39)', borderRadius: '6px', overflow: 'hidden', boxShadow: '8px 8px 0 rgba(0,0,0,0.1)' }}>
            <VideoImage src="https://www.dangpestcontrol.com/wp-content/uploads/2025/05/Interior-Pantry-Spraying-scaled-e1746211834244.jpg" alt="Technician Providing Pest Control Services in Tyler TX" className="" videoUrl={content?.video_url ?? null} videoType={(content?.video_type as string) ?? null} />
          </div>
          <div>
            <p style={{ fontFamily: '"Bangers", cursive', color: 'hsl(28, 100%, 50%)', fontSize: '18px', letterSpacing: '0.12em', fontStyle: 'italic', marginBottom: '6px', marginTop: 0 }}>{content?.subtitle ?? 'PEST CONTROL'}</p>
            <h2 style={{ fontSize: 'clamp(26px, 2.8vw, 38px)', fontWeight: '800', marginBottom: '18px', marginTop: 0 }}>{content?.title ?? 'Comprehensive General Pest Control Services'}</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.75, marginBottom: '28px', color: '#444', marginTop: 0 }}>{content?.intro ?? 'Your home or property deserves year-round protection from pests. At{\' \'} Dang Pest Control, we deliver general pest control services tailored to the unique challenges of the East Texas environment. Count on our team of skilled technicians to protect your home from unwanted invaders with precision and professionalism. We serve Tyler, TX, and the surrounding areas. Call us today at{\' \'} (903) 871-0550{\' \'}and{\' \'} get your quote.'}</p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a href="tel:(903) 871-0550" style={{ padding: '13px 28px', border: '2px solid hsl(20, 40%, 12%)', borderRadius: '50px', fontWeight: '700', color: 'hsl(20, 40%, 12%)', textDecoration: 'none', fontSize: '15px', whiteSpace: 'nowrap' }}>(903) 871-0550</a>
              <a href="/quote" style={{ padding: '13px 28px', background: 'hsl(28, 100%, 50%)', borderRadius: '50px', fontWeight: '700', color: '#fff', textDecoration: 'none', fontSize: '15px', whiteSpace: 'nowrap' }}>Get Your Quote</a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-10" style={{ background: '#f1f1ef', paddingTop: '70px', paddingBottom: '70px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontWeight: '800', fontSize: 'clamp(26px, 3vw, 40px)', marginBottom: '10px', marginTop: 0 }}>Our Pest Control Process</h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '50px', marginTop: 0 }}>Here's what you can expect from our pest control services:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {steps.map((step, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: '"Bangers", cursive', color: STEP_COLORS[i], fontSize: '15px', letterSpacing: '0.12em', fontStyle: 'italic', margin: '0 0 4px 0' }}>{step.num}</p>
                    <h3 style={{ fontWeight: '800', fontSize: '17px', margin: 0 }}>{step.title}</h3>
                  </div>
                  <img loading="lazy" width={58} height={58} src={step.icon} alt={step.title} style={{ width: '58px', height: '58px', objectFit: 'contain', background: STEP_COLORS[i], borderRadius: '6px', padding: '8px', flexShrink: 0 }} />
                </div>
                <div style={{ flex: 1, borderLeft: `4px solid ${STEP_COLORS[i]}`, margin: '16px 24px 0 24px', paddingLeft: '14px', paddingBottom: '24px' }}>
                  {step.desc ? (
                    <p style={{ fontSize: '14px', lineHeight: 1.75, color: '#555', margin: 0 }}>{step.desc}</p>
                  ) : (
                    <div style={{ fontSize: '14px', lineHeight: 1.75, color: '#555' }}>
                      <p style={{ fontWeight: '700', marginBottom: '4px', marginTop: 0 }}>Interior & Exterior Inspection</p>
                      <p style={{ marginBottom: '12px', marginTop: 0 }}>Our technicians will conduct a comprehensive inspection of your property to identify pests, evidence of activity, entry points, and harborage areas.</p>
                      <p style={{ fontWeight: '700', marginBottom: '4px', marginTop: 0 }}>Targeted Treatments</p>
                      <p style={{ marginBottom: '12px', marginTop: 0 }}>We'll provide both interior and exterior treatments to address pests already inside while preventing new ones from entering. This includes spraying in the kitchen, bathrooms, wall penetrations and selected interior areas as well as spraying exterior foundations, around windows and doors, and the eaves (up to 20 feet high).</p>
                      <p style={{ fontWeight: '700', marginBottom: '4px', marginTop: 0 }}>Pest Prevention</p>
                      <p style={{ marginBottom: '12px', marginTop: 0 }}>We treat up to 10 feet out from your foundation in addition to sweeping away spider webs, and treat entry points to fortify your property against a wide range of pests, including <strong>cockroaches</strong>, <strong>ants</strong>, <strong>scorpions</strong>, <strong>spiders</strong>, silverfish, centipedes, millipedes, and many more.</p>
                      <p style={{ fontStyle: 'italic', marginTop: 0, marginBottom: 0 }}>Note: Specialized treatment plans for pests like <strong>bed bugs</strong>, <strong>fleas and ticks</strong>, <strong>German cockroaches</strong>, and <strong>termites</strong> are available as stand-alone services.</p>
                    </div>
                  )}
                </div>
                <div style={{ height: '5px', background: STEP_COLORS[i], marginTop: 'auto' }} />
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', paddingTop: '50px' }}>
            <a href="/quote" style={{ display: 'inline-block', padding: '16px 52px', background: 'hsl(28, 100%, 50%)', borderRadius: '50px', fontWeight: '700', color: '#fff', textDecoration: 'none', fontSize: '16px' }}>Get Your Quote</a>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-10" style={{ paddingTop: '70px', paddingBottom: '70px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontWeight: '800', fontSize: 'clamp(26px, 3vw, 38px)', marginBottom: '36px', marginTop: 0 }}>Why Choose Us?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyCards.map((card, i) => (
            <div key={i} style={{ background: '#f3f3f1', borderRadius: '8px', padding: '28px 20px' }}>
              <img loading="lazy" width={56} height={56} src={card.icon} alt={card.title} style={{ width: '56px', height: '56px', objectFit: 'contain', marginBottom: '14px', display: 'block' }} />
              <h3 style={{ fontWeight: '800', fontSize: '16px', marginBottom: '10px', marginTop: 0 }}>{card.title}</h3>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#555', margin: 0 }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 md:px-10" style={{ paddingTop: '0', paddingBottom: '80px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <h2 style={{ fontWeight: '800', fontSize: 'clamp(26px, 3vw, 38px)', marginBottom: '20px', marginTop: 0 }}>Additional Services</h2>
            <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '16px', color: '#444', marginTop: 0 }}>While our general pest control treatments cover the most common pests in East Texas, we also provide specialized services, including:</p>
            <p style={{ fontSize: '15px', lineHeight: 2, color: '#444', marginTop: 0, marginBottom: '28px' }}>
              <a href="/ant-control" style={{ color: '#000', textDecoration: 'underline' }}>Ant Control</a> &nbsp;·&nbsp; 
              <a href="/spider-control" style={{ color: '#000', textDecoration: 'underline' }}>Spider Control</a> &nbsp;·&nbsp; 
              <a href="/wasp-hornet-control" style={{ color: '#000', textDecoration: 'underline' }}>Wasp & Hornet Control</a> &nbsp;·&nbsp; 
              <a href="/scorpion-control" style={{ color: '#000', textDecoration: 'underline' }}>Scorpion Control</a> &nbsp;·&nbsp; 
              <a href="/rodent-control" style={{ color: '#000', textDecoration: 'underline' }}>Rodent Control</a> &nbsp;·&nbsp; 
              <a href="/mosquito-control" style={{ color: '#000', textDecoration: 'underline' }}>Mosquito Control</a> &nbsp;·&nbsp; 
              <a href="/flea-tick-control" style={{ color: '#000', textDecoration: 'underline' }}>Flea & Tick Control</a> &nbsp;·&nbsp; 
              <a href="/roach-control" style={{ color: '#000', textDecoration: 'underline' }}>Roach Control</a> &nbsp;·&nbsp; 
              <a href="/bed-bug-control" style={{ color: '#000', textDecoration: 'underline' }}>Bed Bug Control</a> &nbsp;·&nbsp; 
              <a href="/termite-control" style={{ color: '#000', textDecoration: 'underline' }}>Termite Control</a> &nbsp;·&nbsp; 
              <a href="/termite-inspections" style={{ color: '#000', textDecoration: 'underline' }}>Termite Inspections</a>
            </p>
            <a href="/quote" style={{ display: 'inline-block', padding: '14px 40px', background: 'hsl(28, 100%, 50%)', borderRadius: '50px', fontWeight: '700', color: '#fff', textDecoration: 'none', fontSize: '16px' }}>Get Your Quote</a>
          </div>
          <div style={{ position: 'relative', padding: '20px' }}>
            <div style={{ position: 'absolute', inset: 0, background: '#fff', backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)', backgroundSize: '22px 22px', borderRadius: '8px', zIndex: 0 }} />
            <div style={{ position: 'relative', zIndex: 1, border: '4px solid rgb(255, 213, 39)', borderRadius: '6px', overflow: 'hidden', boxShadow: '8px 8px 0 rgba(0,0,0,0.1)' }}>
              <img loading="lazy" width={600} height={400} src="https://www.dangpestcontrol.com/wp-content/uploads/2025/05/Exterior-Fence-scaled-e1746211948229.jpg" alt="Exterior General Pest Control Services in Tyler TX" style={{ width: '100%', display: 'block' }} />
            </div>
          </div>
        </div>
      </section>

      <style>{`.pest-cta-phone { background: hsl(28,100%,50%) !important; color: #fff !important; border: 2px solid hsl(28,100%,50%) !important; } .pest-cta-phone:hover { background: #fff !important; color: hsl(20,40%,12%) !important; } .pest-cta-quote { background: #fff !important; color: hsl(28,100%,50%) !important; border: 2px solid #fff !important; } .pest-cta-quote:hover { background: hsl(45,95%,52%) !important; color: #fff !important; }`}</style>
      <section className="px-4 md:px-10" style={{ position: 'relative', background: 'hsl(28, 100%, 50%)', paddingTop: '100px', paddingBottom: '260px', clipPath: 'polygon(0 0, 100% 8%, 100% 100%, 0 100%)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.12) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: '"Bangers", cursive', fontSize: 'clamp(36px, 5vw, 60px)', fontStyle: 'italic', color: 'hsl(45, 95%, 60%)', letterSpacing: '0.04em', marginBottom: '20px', marginTop: 0, lineHeight: 1.1, WebkitTextStroke: '3px #000000', textShadow: '3px 3px 0 #000000' }}>PROTECT YOUR PROPERTY TODAY</h2>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'rgba(0,0,0,0.72)', marginBottom: '28px', marginTop: 0 }}>
            Don't wait for pests to invade your home—act now. With Dang Pest Control, you'll enjoy expert service, tailored solutions, and peace of mind knowing your property is in good hands. Located in Tyler, TX, we proudly serve surrounding communities including 
            <a href="/longview-tx" style={{ color: '#000' }}>Longview</a>, 
            <a href="/jacksonville-tx" style={{ color: '#000' }}>Jacksonville</a>, 
            <a href="/lindale-tx" style={{ color: '#000' }}>Lindale</a>, 
            <a href="/bullard-tx" style={{ color: '#000' }}>Bullard</a>, and 
            <a href="/whitehouse-tx" style={{ color: '#000' }}>Whitehouse</a>. Call us today at 
            <a href="tel:(903) 871-0550" style={{ color: '#000', fontWeight: '700' }}>(903) 871-0550</a> and <a href="/quote" style={{ color: '#000' }}>get your quote</a>.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="tel:(903) 871-0550" className="pest-cta-phone" style={{ padding: '13px 28px', borderRadius: '50px', fontWeight: '700', textDecoration: 'none', fontSize: '15px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>(903) 871-0550</a>
            <a href="/quote" className="pest-cta-quote" style={{ padding: '13px 28px', borderRadius: '50px', fontWeight: '700', textDecoration: 'none', fontSize: '15px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>Get Your Quote</a>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 1 }}>
          <img loading="lazy" width={1200} height={50} src="/dang/banner-img.png" alt="" style={{ width: '100%', display: 'block' }} />
        </div>
      </section>

      <section className="px-4 md:px-10" style={{ position: 'relative', background: 'hsl(48, 100%, 50%)', paddingTop: '100px', paddingBottom: '90px', clipPath: 'polygon(0 9%, 100% 0, 100% 100%, 0 100%)', marginTop: '-30px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.12) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '820px', margin: '0 auto', paddingTop: '20px' }}>
          <h2 style={{ fontFamily: '"Bangers", cursive', fontSize: 'clamp(42px, 6vw, 76px)', fontStyle: 'italic', color: 'hsl(20, 40%, 12%)', letterSpacing: '0.04em', marginBottom: '24px', marginTop: 0, lineHeight: 1.1, textShadow: '2px 2px 0 rgba(0,0,0,0.15)' }}>PROTECT YOUR EAST TEXAS<br />HOME TODAY</h2>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'rgba(0,0,0,0.72)', marginBottom: '12px', marginTop: 0 }}>East Texas heat, humidity, and piney woods conditions create the perfect environment for pests year-round. Don't wait until a small problem becomes a major infestation.</p>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'rgba(0,0,0,0.72)', margin: 0 }}>Dang Pest Control provides safe, effective, and recurring protection for homes across Tyler, Whitehouse, Bullard, Lindale, Flint, and surrounding communities.</p>
        </div>
      </section>
      </div>

    </div>
  );
};

export default PestControlPage;
