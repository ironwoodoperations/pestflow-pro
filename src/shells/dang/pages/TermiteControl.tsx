import Navbar from '../ShellNavbar';
import Footer from '../ShellFooter';
import SEO from '../SEO';
import { StructuredData } from '../StructuredData';
import { VideoImage } from '../VideoImage';
import { STEP_COLORS, steps, whyCards, faqs } from './data/TermiteControlData';
import { usePageContent } from '../../../hooks/usePageContent';

const TermiteControl = () => {
  const { content } = usePageContent('termite-control');

  return (
    <div style={{ fontFamily: "'Open Sans', sans-serif", color: 'hsl(20, 40%, 12%)', overflowX: 'hidden' }}>
      <SEO
        title="Termite Control in Tyler, TX"
        description="Professional termite control in Tyler, TX. Subterranean and drywood termite treatment. Licensed technicians with a Super Powered Guarantee. Call (903) 871-0550."
        canonical="/termite-control"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Termite Control",
          provider: { "@type": "LocalBusiness", name: "Dang Pest Control", telephone: "+19038710550" },
          areaServed: { "@type": "City", name: "Tyler", addressRegion: "TX" },
          description: "Professional termite control services including subterranean and drywood termite treatment.",
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
          <h1 style={{ fontFamily: '"Bangers", cursive', fontSize: 'clamp(56px, 9vw, 100px)', color: 'hsl(45, 95%, 60%)', fontStyle: 'italic', letterSpacing: '0.05em', WebkitTextStroke: '3px #000000', textShadow: '3px 3px 0 #000000', margin: 0, lineHeight: 1 }}>{content?.title ?? 'TERMITE CONTROL'}</h1>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 1 }}>
          <img fetchPriority="high" width={1200} height={50} src="/dang/banner-img.png" alt="" style={{ width: '100%', display: 'block' }} />
        </div>
      </section>

      <section className="px-4 md:px-10" style={{ paddingTop: '80px', paddingBottom: '60px', maxWidth: '1200px', margin: '0 auto', background: '#ffffff', backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div style={{ border: '4px solid rgb(255, 213, 39)', borderRadius: '6px', overflow: 'hidden', boxShadow: '8px 8px 0 rgba(0,0,0,0.1)' }}>
            <VideoImage src="https://www.dangpestcontrol.com/wp-content/uploads/2025/05/Interior-Bathroom-scaled-e1747162320401.jpg" alt="Termite Control Treatment Specialists in Tyler TX" className="" videoUrl={content?.video_url ?? null} videoType={(content?.video_type as string) ?? null} />
          </div>
          <div>
            <p style={{ fontFamily: '"Bangers", cursive', color: 'hsl(28, 100%, 50%)', fontSize: '18px', letterSpacing: '0.12em', fontStyle: 'italic', marginBottom: '6px', marginTop: 0 }}>TERMITE CONTROL</p>
            <h2 style={{ fontSize: 'clamp(26px, 2.8vw, 38px)', fontWeight: '800', marginBottom: '18px', marginTop: 0 }}>Termite Control Services</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.75, marginBottom: '16px', color: '#444', marginTop: 0 }}>
              Termites are silent destroyers, capable of causing costly damage to your home or property before you notice a single sign of their presence. At <a href="/" style={{ color: '#000', textDecoration: 'underline' }}>Dang Pest Control</a>, we specialize in eliminating and preventing termite infestations to protect your home and give you peace of mind. Serving Tyler, TX, and the surrounding areas, give us a call at <a href="tel:(903) 871-0550" style={{ color: '#000', fontWeight: '700' }}>(903) 871-0550</a> today and <a href="/quote" style={{ color: '#000', textDecoration: 'underline' }}>get your quote</a>.
            </p>
            <p style={{ fontSize: '16px', lineHeight: 1.75, marginBottom: '28px', color: '#444', marginTop: 0 }}>
              Not yet sure if termites are present at your property? We can perform a <a href="/termite-inspections" style={{ color: '#000', textDecoration: 'underline' }}>thorough termite inspection</a> conducted by our highly trained technicians. We identify the species of termites—whether it's subterranean or drywood—and their colonies, so we can tailor the most effective treatment options for your situation.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a href="tel:(903) 871-0550" style={{ padding: '13px 28px', border: '2px solid hsl(20, 40%, 12%)', borderRadius: '50px', fontWeight: '700', color: 'hsl(20, 40%, 12%)', textDecoration: 'none', fontSize: '15px', whiteSpace: 'nowrap' }}>(903) 871-0550</a>
              <a href="/quote" style={{ padding: '13px 28px', background: 'hsl(28, 100%, 50%)', borderRadius: '50px', fontWeight: '700', color: '#fff', textDecoration: 'none', fontSize: '15px', whiteSpace: 'nowrap' }}>Get Your Quote</a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-10" style={{ background: '#f1f1ef', paddingTop: '70px', paddingBottom: '70px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontWeight: '800', fontSize: 'clamp(26px, 3vw, 40px)', marginBottom: '10px', marginTop: 0 }}>Our Termite Control Process</h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '50px', marginTop: 0 }}>Here's what you can expect from our termite control services:</p>
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

      <section className="px-4 md:px-10" style={{ paddingTop: '70px', paddingBottom: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontWeight: '800', fontSize: 'clamp(22px, 2.5vw, 34px)', marginBottom: '18px', marginTop: 0 }}>More About Termites</h2>
        <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '16px', color: '#444', marginTop: 0 }}>Termites are social insects that live in colonies. These colonies can grow quickly, causing substantial damage to wood structures, flooring, and even wallpaper. Here are the two most common types of termites in Texas that you should know about:</p>
        <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '12px', color: '#444', marginTop: 0 }}><strong>Subterranean Termites:</strong> These live underground and typically return to the soil to nest. Their colonies can contain millions of termites and are responsible for the majority of termite-related damage in the U.S.</p>
        <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '16px', color: '#444', marginTop: 0 }}><strong>Drywood Termites:</strong> These termites live inside the wood they consume. Although their colonies are smaller than subterranean termites, they can still cause significant structural damage over time.</p>
        <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '12px', color: '#444', marginTop: 0 }}>Termites never rest, eating 24 hours a day, seven days a week. Key signs that you may have a termite problem include:</p>
        <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '8px', color: '#444', marginTop: 0 }}><strong>Mud Tubes:</strong> Thin, tunnel-like structures that termites build to travel from their nests to food sources.</p>
        <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '8px', color: '#444', marginTop: 0 }}><strong>Hollow-Sounding Wood:</strong> Tapping on wood may produce a hollow sound if termites are present.</p>
        <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '8px', color: '#444', marginTop: 0 }}><strong>Discarded Wings:</strong> Winged termites shed their wings as they establish new colonies.</p>
        <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '8px', color: '#444', marginTop: 0 }}><strong>Frass:</strong> Termite droppings that resemble wood-colored pellets.</p>
        <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '8px', color: '#444', marginTop: 0 }}><strong>Stuck Windows or Doors:</strong> Exposed wood around windows and doors can swell because of termite damage, making them hard to open or close.</p>
        <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '0', color: '#444', marginTop: '12px' }}>While termites can seem overwhelming, controlling them is a task best left to licensed pest control professionals. At Dang Pest Control, we use an Integrated Pest Management (IPM) approach for termite control.</p>
      </section>

      <section className="px-4 md:px-10" style={{ paddingTop: '40px', paddingBottom: '40px', maxWidth: '1200px', margin: '0 auto' }}>
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

      <section className="px-4 md:px-10" style={{ paddingTop: '0px', paddingBottom: '80px', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ fontWeight: '800', fontSize: 'clamp(26px, 3vw, 38px)', marginBottom: '36px', marginTop: 0 }}>Frequently Asked Questions</h2>
        {faqs.map((faq, i) => (
          <div key={i} style={{ marginBottom: '28px' }}>
            <h3 style={{ fontWeight: '700', fontSize: '18px', marginBottom: '8px', marginTop: 0 }}>{faq.q}</h3>
            <p style={{ fontSize: '15px', lineHeight: 1.75, color: '#444', margin: 0 }}>{faq.a}</p>
          </div>
        ))}
      </section>

      <section className="px-4 md:px-10" style={{ paddingTop: '0px', paddingBottom: '80px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <h2 style={{ fontWeight: '800', fontSize: 'clamp(26px, 3vw, 38px)', marginBottom: '20px', marginTop: 0 }}>More Than Termite Treatments</h2>
            <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '28px', color: '#444', marginTop: 0 }}>
              In addition to termites, our <a href="/pest-control" style={{ color: '#000', textDecoration: 'underline' }}>expert pest control services</a> also cover <a href="/ant-control" style={{ color: '#000', textDecoration: 'underline' }}>ants</a>, <a href="/wasp-hornet-control" style={{ color: '#000', textDecoration: 'underline' }}>wasps and hornets</a>, <a href="/scorpion-control" style={{ color: '#000', textDecoration: 'underline' }}>scorpions</a>, <a href="/rodent-control" style={{ color: '#000', textDecoration: 'underline' }}>rodents</a>, <a href="/mosquito-control" style={{ color: '#000', textDecoration: 'underline' }}>mosquitos</a>, <a href="/flea-tick-control" style={{ color: '#000', textDecoration: 'underline' }}>fleas and ticks</a>, <a href="/roach-control" style={{ color: '#000', textDecoration: 'underline' }}>cockroaches</a>, <a href="/bed-bug-control" style={{ color: '#000', textDecoration: 'underline' }}>bed bugs</a>, and more.
            </p>
            <a href="/quote" style={{ display: 'inline-block', padding: '14px 40px', background: 'hsl(28, 100%, 50%)', borderRadius: '50px', fontWeight: '700', color: '#fff', textDecoration: 'none', fontSize: '16px' }}>Get Your Quote</a>
          </div>
          <div style={{ position: 'relative', padding: '20px' }}>
            <div style={{ position: 'absolute', inset: 0, background: '#fff', backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)', backgroundSize: '22px 22px', borderRadius: '8px', zIndex: 0 }} />
            <div style={{ position: 'relative', zIndex: 1, border: '4px solid rgb(255, 213, 39)', borderRadius: '6px', overflow: 'hidden', boxShadow: '8px 8px 0 rgba(0,0,0,0.1)' }}>
              <img loading="lazy" width={600} height={400} src="https://www.dangpestcontrol.com/wp-content/uploads/2025/05/Interior-Attic-Inspectoin-1-scaled-e1747162404673.jpg" alt="Termite Control Services in Tyler TX" style={{ width: '100%', display: 'block' }} />
            </div>
          </div>
        </div>
      </section>

      <style>{`.termite-cta-phone { background: hsl(28,100%,50%) !important; color: #fff !important; border: 2px solid hsl(28,100%,50%) !important; } .termite-cta-phone:hover { background: #fff !important; color: hsl(20,40%,12%) !important; } .termite-cta-quote { background: #fff !important; color: hsl(28,100%,50%) !important; border: 2px solid #fff !important; } .termite-cta-quote:hover { background: hsl(45,95%,52%) !important; color: #fff !important; }`}</style>
      <section className="px-4 md:px-10" style={{ position: 'relative', background: 'hsl(28, 100%, 50%)', paddingTop: '100px', paddingBottom: '260px', clipPath: 'polygon(0 0, 100% 8%, 100% 100%, 0 100%)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.12) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: '"Bangers", cursive', fontSize: 'clamp(36px, 5vw, 60px)', fontStyle: 'italic', color: 'hsl(45, 95%, 60%)', letterSpacing: '0.04em', marginBottom: '20px', marginTop: 0, lineHeight: 1.1, WebkitTextStroke: '3px #000000', textShadow: '3px 3px 0 #000000' }}>PROTECT YOUR HOME TODAY</h2>
          <p style={{ fontSize: '16px', lineHeight: '1.8', color: 'rgba(0,0,0,0.72)', marginBottom: '28px', marginTop: 0 }}>
            Don't wait until termites cause major damage to your property. Contact Dang Pest Control for professional termite control services tailored to your home or business. Located in Tyler, TX, we proudly serve homeowners and property managers throughout nearby areas, including <a href="/longview-tx" style={{ color: '#000' }}>Longview</a>, <a href="/jacksonville-tx" style={{ color: '#000' }}>Jacksonville</a>, <a href="/lindale-tx" style={{ color: '#000' }}>Lindale</a>, <a href="/bullard-tx" style={{ color: '#000' }}>Bullard</a>, <a href="/whitehouse-tx" style={{ color: '#000' }}>Whitehouse</a>, and more. Call us today at <a href="tel:(903) 871-0550" style={{ color: '#000', fontWeight: '700' }}>(903) 871-0550</a> and <a href="/quote" style={{ color: '#000' }}>get your quote</a>.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="tel:(903) 871-0550" className="termite-cta-phone" style={{ padding: '13px 28px', borderRadius: '50px', fontWeight: '700', textDecoration: 'none', fontSize: '15px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>(903) 871-0550</a>
            <a href="/quote" className="termite-cta-quote" style={{ padding: '13px 28px', borderRadius: '50px', fontWeight: '700', textDecoration: 'none', fontSize: '15px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>Get Your Quote</a>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 1 }}>
          <img loading="lazy" width={1200} height={50} src="/dang/banner-img.png" alt="" style={{ width: '100%', display: 'block' }} />
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
};

export default TermiteControl;
