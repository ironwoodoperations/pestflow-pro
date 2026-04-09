import Navbar from '../ShellNavbar';
import Footer from '../ShellFooter';
import SEO from '../SEO';
import { StructuredData } from '../StructuredData';
import { VideoImage } from '../VideoImage';
import { STEP_COLORS, steps, whyCards, faqs } from './AntControlData';
import { ServiceFaqSection, EastTexasCtaSection, WhyChooseUsCards } from './SharedServiceSections';
import { usePageContent } from '../../../hooks/usePageContent';

// ─── COMPONENT ───────────────────────────────────────────────────────────────

const AntControl = () => {
  const { content } = usePageContent('ant-control');

  return (
    <div style={{ fontFamily: "'Open Sans', sans-serif", color: 'hsl(20, 40%, 12%)', overflowX: 'hidden' }}>
      <SEO
        title="Ant Control in Tyler, TX"
        description="Professional ant control in Tyler, TX. Fire ant, carpenter ant & common ant removal. Licensed technicians with a Super Powered Guarantee. Call (903) 871-0550."
        canonical="/ant-control"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Ant Control",
          provider: { "@type": "LocalBusiness", name: "Dang Pest Control", telephone: "+19038710550" },
          areaServed: { "@type": "City", name: "Tyler", addressRegion: "TX" },
          description: "Professional ant control services including fire ant and carpenter ant removal.",
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

      {/* HERO BANNER */}
      <section style={{ position: 'relative', background: `url(/dang/moblie_banner.webp) center/cover no-repeat, hsl(28, 100%, 50%)`, paddingTop: '80px', paddingBottom: '200px', minHeight: '420px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.18) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '0 20px 30px' }}>
          <h1 style={{ fontFamily: '"Bangers", cursive', fontSize: 'clamp(56px, 9vw, 100px)', color: 'hsl(45, 95%, 60%)', fontStyle: 'italic', letterSpacing: '0.05em', WebkitTextStroke: '3px #000000', textShadow: '3px 3px 0 #000000', margin: 0, lineHeight: 1 }}>
            {content?.title ?? 'ANT CONTROL'}
          </h1>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 1 }}>
          <img fetchPriority="high" width={1200} height={50} src="/dang/banner-img.png" alt="" style={{ width: '100%', display: 'block' }} />
        </div>
      </section>

      {/* INTRO */}
      <section className="px-4 md:px-10" style={{ paddingTop: '80px', paddingBottom: '60px', maxWidth: '1200px', margin: '0 auto', background: '#ffffff', backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div style={{ border: '4px solid rgb(255, 213, 39)', borderRadius: '6px', overflow: 'hidden', boxShadow: '8px 8px 0 rgba(0,0,0,0.1)' }}>
            <VideoImage src="https://www.dangpestcontrol.com/wp-content/uploads/2025/05/carpenter-ant.jpg" alt="Carpenter Ant Control Services Tyler TX" className="" videoUrl={content?.video_url ?? null} videoType={(content?.video_type as string) ?? null} />
          </div>
          <div>
            <p style={{ fontFamily: '"Bangers", cursive', color: 'hsl(28, 100%, 50%)', fontSize: '18px', letterSpacing: '0.12em', fontStyle: 'italic', marginBottom: '6px', marginTop: 0 }}>ANTS</p>
            <h2 style={{ fontSize: 'clamp(26px, 2.8vw, 38px)', fontWeight: '800', marginBottom: '18px', marginTop: 0 }}>Ant Control Services</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.75, marginBottom: '28px', color: '#444', marginTop: 0 }}>
              Ant infestations can disrupt your daily life and damage your property. Don't let them take over your home or yard. At <a href="/" style={{ color: '#000', textDecoration: 'underline' }}>Dang Pest Control</a>, we specialize in identifying, treating, and preventing ant infestations—giving you back your peace of mind. We serve Tyler, TX, and the surrounding areas. Call us today at <a href="tel:(903) 871-0550" style={{ color: '#000', fontWeight: '700' }}>(903) 871-0550</a> and <a href="/quote" style={{ color: '#000', textDecoration: 'underline' }}>get your quote</a>.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a href="tel:(903) 871-0550" style={{ padding: '13px 28px', border: '2px solid hsl(20, 40%, 12%)', borderRadius: '50px', fontWeight: '700', color: 'hsl(20, 40%, 12%)', textDecoration: 'none', fontSize: '15px', whiteSpace: 'nowrap' }}>(903) 871-0550</a>
              <a href="/quote" style={{ padding: '13px 28px', background: 'hsl(28, 100%, 50%)', borderRadius: '50px', fontWeight: '700', color: '#fff', textDecoration: 'none', fontSize: '15px', whiteSpace: 'nowrap' }}>Get Your Quote</a>
            </div>
          </div>
        </div>
      </section>

      {/* TREATMENT PROCESS */}
      <section className="px-4 md:px-10" style={{ background: '#f1f1ef', paddingTop: '70px', paddingBottom: '70px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontWeight: '800', fontSize: 'clamp(26px, 3vw, 40px)', marginBottom: '10px', marginTop: 0 }}>Our Ant Control Process</h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '50px', marginTop: 0 }}>Here's what you can expect from our ant pest control services:</p>
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
                  <p style={{ fontSize: '14px', lineHeight: 1.75, color: '#555', margin: 0 }}>{step.desc}</p>
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

      {/* FIRE ANT TREATMENT & PREVENTION */}
      <section className="px-4 md:px-10" style={{ background: 'white', paddingTop: '70px', paddingBottom: '70px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontWeight: '800', fontSize: 'clamp(24px, 3vw, 36px)', marginBottom: '20px', marginTop: 0 }}>Fire Ant Treatment &amp; Prevention</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#444', marginBottom: '16px', marginTop: 0 }}>At Dang Pest Control, we understand the dangers and disruptions fire ants can bring to your home and outdoor spaces. Their bites and stings can cause significant pain, itching, swelling, and even allergic reactions, such as dizziness, nausea, or difficulty breathing. If you experience an allergic reaction from a fire ant bite, seek emergency medical care immediately.</p>
          <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#444', marginBottom: '16px', marginTop: 0 }}>Beyond their bites, fire ants can pose serious risks to your home. They are notorious for moving into walls, roofs, and floors, often causing electrical malfunctions by invading air conditioners, telephone wiring, and other machinery. These malfunctions increase the risk of financial damage and even potential fire hazards.</p>
          <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#444', marginBottom: '16px', marginTop: 0 }}>With Dang Pest Control's professional ant control treatments, you'll regain your home and yard as a safe space, free from fire ants. Our advanced treatments target nests as well as problem areas. We apply solutions strategically, allowing ants to carry the product back to their colonies. This process eradicates the entire population, providing a far more effective solution than spot treatments or DIY methods that only address visible issues. Choosing Dang Pest Control means partnering with experienced professionals who save your time and energy, allowing you to fully enjoy your outdoor space without worrying about pests.</p>
          <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#444', marginBottom: '16px', marginTop: 0 }}>Our pest management strategies are tailored to each client's specific needs, backed by our commitment to environmentally responsible practices. Our technicians specialize in Integrated Pest Management (IPM), which addresses root causes of pest issues, not just surface-level problems.</p>
          <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#444', marginBottom: '32px', marginTop: 0 }}>Don't wait for fire ants to take over your property. Trust our ant-free guarantee and regain your peace of mind. Get your quote from Dang Pest Control today and protect your home, family, and outdoor spaces.</p>
          <div style={{ textAlign: 'center' }}>
            <a href="/quote" style={{ display: 'inline-block', padding: '16px 52px', background: 'hsl(28, 100%, 50%)', borderRadius: '50px', fontWeight: '700', color: '#fff', textDecoration: 'none', fontSize: '16px' }}>Get Your Quote</a>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="px-4 md:px-10" style={{ paddingTop: '70px', paddingBottom: '70px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontWeight: '800', fontSize: 'clamp(26px, 3vw, 38px)', marginBottom: '36px', marginTop: 0 }}>Why Choose Us?</h2>
        <WhyChooseUsCards cards={whyCards} />
      </section>

      {/* MORE THAN ANT CONTROL */}
      <section className="px-4 md:px-10" style={{ paddingTop: '0px', paddingBottom: '80px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <h2 style={{ fontWeight: '800', fontSize: 'clamp(26px, 3vw, 38px)', marginBottom: '20px', marginTop: 0 }}>More Than Just Ant Control</h2>
            <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '28px', color: '#444', marginTop: 0 }}>
              At Dang Pest Control, we also offer services to treat <a href="/spider-control" style={{ color: '#000', textDecoration: 'underline' }}>spiders</a>, <a href="/wasp-hornet-control" style={{ color: '#000', textDecoration: 'underline' }}>wasps and hornets</a>, <a href="/scorpion-control" style={{ color: '#000', textDecoration: 'underline' }}>scorpions</a>, <a href="/rodent-control" style={{ color: '#000', textDecoration: 'underline' }}>rodents</a>, <a href="/mosquito-control" style={{ color: '#000', textDecoration: 'underline' }}>mosquitos</a>, <a href="/flea-tick-control" style={{ color: '#000', textDecoration: 'underline' }}>fleas and ticks</a>, <a href="/roach-control" style={{ color: '#000', textDecoration: 'underline' }}>cockroaches</a>, <a href="/bed-bug-control" style={{ color: '#000', textDecoration: 'underline' }}>bed bugs</a>, and more. We even provide <a href="/termite-inspections" style={{ color: '#000', textDecoration: 'underline' }}>termite inspections</a> and <a href="/termite-control" style={{ color: '#000', textDecoration: 'underline' }}>termite treatments</a>.
            </p>
            <a href="/quote" style={{ display: 'inline-block', padding: '14px 40px', background: 'hsl(28, 100%, 50%)', borderRadius: '50px', fontWeight: '700', color: '#fff', textDecoration: 'none', fontSize: '16px' }}>Get Your Quote</a>
          </div>
          <div style={{ position: 'relative', padding: '20px' }}>
            <div style={{ position: 'absolute', inset: 0, background: '#fff', backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)', backgroundSize: '22px 22px', borderRadius: '8px', zIndex: 0 }} />
            <div style={{ position: 'relative', zIndex: 1, border: '4px solid rgb(255, 213, 39)', borderRadius: '6px', overflow: 'hidden', boxShadow: '8px 8px 0 rgba(0,0,0,0.1)' }}>
              <img loading="lazy" width={600} height={400} src="https://www.dangpestcontrol.com/wp-content/uploads/2025/05/fire-ants.jpg" alt="Fire Ant Control Services in Tyler TX" style={{ width: '100%', display: 'block' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ANT-FREE CTA */}
      <style>{`
        .ant-cta-phone { background: hsl(28,100%,50%) !important; color: #fff !important; border: 2px solid hsl(28,100%,50%) !important; }
        .ant-cta-phone:hover { background: #fff !important; color: hsl(20,40%,12%) !important; }
        .ant-cta-quote { background: #fff !important; color: hsl(28,100%,50%) !important; border: 2px solid #fff !important; }
        .ant-cta-quote:hover { background: hsl(45,95%,52%) !important; color: #fff !important; }
      `}</style>
      <section style={{ position: 'relative', background: 'hsl(28, 100%, 50%)', padding: '100px 40px 260px', clipPath: 'polygon(0 0, 100% 8%, 100% 100%, 0 100%)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.12) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: '"Bangers", cursive', fontSize: 'clamp(36px, 5vw, 60px)', fontStyle: 'italic', color: 'hsl(45, 95%, 60%)', letterSpacing: '0.04em', marginBottom: '20px', marginTop: 0, lineHeight: 1.1, WebkitTextStroke: '3px #000000', textShadow: '3px 3px 0 #000000' }}>
            ANT-FREE LIVING STARTS HERE
          </h2>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'rgba(0,0,0,0.72)', marginBottom: '28px', marginTop: 0 }}>
            Don't wait—restore comfort and peace to your home with professional ant control services from Dang Pest Control. Located in Tyler, TX, we proudly serve the surrounding areas, including <a href="/longview-tx" style={{ color: '#000' }}>Longview</a>, <a href="/jacksonville-tx" style={{ color: '#000' }}>Jacksonville</a>, <a href="/lindale-tx" style={{ color: '#000' }}>Lindale</a>, <a href="/bullard-tx" style={{ color: '#000' }}>Bullard</a>, <a href="/whitehouse-tx" style={{ color: '#000' }}>Whitehouse</a>, and more. Call us today at <a href="tel:(903) 871-0550" style={{ color: '#000', fontWeight: '700' }}>(903) 871-0550</a> and <a href="/quote" style={{ color: '#000' }}>get your quote</a>.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="tel:(903) 871-0550" className="ant-cta-phone" style={{ padding: '13px 28px', borderRadius: '50px', fontWeight: '700', textDecoration: 'none', fontSize: '15px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>(903) 871-0550</a>
            <a href="/quote" className="ant-cta-quote" style={{ padding: '13px 28px', borderRadius: '50px', fontWeight: '700', textDecoration: 'none', fontSize: '15px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>Get Your Quote</a>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 1 }}>
          <img loading="lazy" width={1200} height={50} src="/dang/banner-img.png" alt="" style={{ width: '100%', display: 'block' }} />
        </div>
      </section>

      <ServiceFaqSection faqs={faqs} />
      <EastTexasCtaSection />

      </main>
      <Footer />
    </div>
  );
};

export default AntControl;
