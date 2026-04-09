import { useState, useEffect } from 'react';
import Navbar from '../ShellNavbar';
import Footer from '../ShellFooter';
import SEO from '../SEO';
import { StructuredData } from '../StructuredData';
import { supabase } from '../../../lib/supabase';
import { VideoImage } from '../VideoImage';
import { STEP_COLORS, steps, whyCards, faqs } from './data/BedBugControlData';

const BedBugControl = () => {
  const [pageVideo, setPageVideo] = useState<{ video_url: string | null; video_type: string | null } | null>(null);

  useEffect(() => {
    supabase
      .from('page_content')
      .select('video_url, video_type')
      .eq('tenant_id', '1282b822-825b-4713-9dc9-6d14a2094d06')
      .eq('slug', 'bed-bug-control')
      .maybeSingle()
      .then(({ data }) => { if (data) setPageVideo(data); });
  }, []);

  return (
    <div style={{ fontFamily: "'Open Sans', sans-serif", color: 'hsl(20, 40%, 12%)', overflowX: 'hidden' }}>
      <SEO
        title="Bed Bug Control in Tyler, TX"
        description="Professional bed bug control in Tyler, TX. Thorough bed bug elimination and prevention. Licensed technicians with a Super Powered Guarantee. Call (903) 871-0550."
        canonical="/bed-bug-control"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Bed Bug Control",
          provider: { "@type": "LocalBusiness", name: "Dang Pest Control", telephone: "+19038710550" },
          areaServed: { "@type": "City", name: "Tyler", addressRegion: "TX" },
          description: "Professional bed bug control services including thorough elimination and prevention.",
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
      <section style={{ position: 'relative', background: `url(/moblie_banner.webp) center/cover no-repeat, hsl(28, 100%, 50%)`, paddingTop: '80px', paddingBottom: '200px', minHeight: '420px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.18) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '0 20px 30px' }}>
          <h1 style={{ fontFamily: '"Bangers", cursive', fontSize: 'clamp(56px, 9vw, 100px)', color: 'hsl(45, 95%, 60%)', fontStyle: 'italic', letterSpacing: '0.05em', WebkitTextStroke: '3px #000000', textShadow: '3px 3px 0 #000000', margin: 0, lineHeight: 1 }}>BED BUG CONTROL</h1>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 1 }}>
          <img fetchPriority="high" width={1200} height={50} src="/banner-img.png" alt="" style={{ width: '100%', display: 'block' }} />
        </div>
      </section>

      <section className="px-4 md:px-10" style={{ paddingTop: '80px', paddingBottom: '60px', maxWidth: '1200px', margin: '0 auto', background: '#ffffff', backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div style={{ border: '4px solid rgb(255, 213, 39)', borderRadius: '6px', overflow: 'hidden', boxShadow: '8px 8px 0 rgba(0,0,0,0.1)' }}>
            <VideoImage src="https://www.dangpestcontrol.com/wp-content/uploads/2025/05/bed-bug-1.jpg" alt="Bed Bug Pest Control Service in Tyler TX" className="" videoUrl={pageVideo?.video_url} videoType={pageVideo?.video_type} />
          </div>
          <div>
            <p style={{ fontFamily: '"Bangers", cursive', color: 'hsl(28, 100%, 50%)', fontSize: '18px', letterSpacing: '0.12em', fontStyle: 'italic', marginBottom: '6px', marginTop: 0 }}>BED BUGS</p>
            <h2 style={{ fontSize: 'clamp(26px, 2.8vw, 38px)', fontWeight: '800', marginBottom: '18px', marginTop: 0 }}>Bed Bug Control Services</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.75, marginBottom: '28px', color: '#444', marginTop: 0 }}>
              When it comes to bed bug infestations, you need a reliable partner to restore your peace of mind—and your home. At{' '}
              <a href="/" style={{ color: '#000', textDecoration: 'underline' }}>Dang Pest Control</a>, we specialize in effective, professional bed bug control services that eliminate bed bugs at every stage of their life cycle. Our expert technicians are ready to help you reclaim your home or property with advanced, eco-friendly treatments that deliver long-term results. We serve Tyler, TX, and the surrounding areas. Call us today at{' '}
              <a href="tel:(903) 871-0550" style={{ color: '#000', fontWeight: '700' }}>(903) 871-0550</a>{' '}and{' '}
              <a href="/quote" style={{ color: '#000', textDecoration: 'underline' }}>get your quote</a>.
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
          <h2 style={{ textAlign: 'center', fontWeight: '800', fontSize: 'clamp(26px, 3vw, 40px)', marginBottom: '10px', marginTop: 0 }}>Our Bed Bug Control Process</h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '50px', marginTop: 0 }}>Our bed bug pest control services follow a proven process to ensure your space is protected and pest-free.</p>
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

      <section className="px-4 md:px-10" style={{ paddingTop: '70px', paddingBottom: '70px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontWeight: '800', fontSize: 'clamp(26px, 3vw, 38px)', marginBottom: '36px', marginTop: 0 }}>Why Choose Us?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyCards.map((card, i) => (
            <div key={i} style={{ background: '#f3f3f1', borderRadius: '8px', padding: '28px 20px' }}>
              <img loading="lazy" width={56} height={56} src={card.icon} alt={card.title} style={{ width: '56px', height: '56px', objectFit: 'contain', marginBottom: '14px', display: 'block' }} />
              <h3 style={{ fontWeight: '800', fontSize: '16px', marginBottom: '10px', marginTop: 0 }}>{card.title}</h3>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#555', margin: 0 }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 md:px-10" style={{ paddingTop: '0px', paddingBottom: '60px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontWeight: '800', fontSize: 'clamp(22px, 2.5vw, 34px)', marginBottom: '18px', marginTop: 0 }}>Facts About Bed Bugs</h2>
        <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '16px', color: '#444', marginTop: 0 }}>Bed bugs are a common problem across the United States, impacting approximately 20% of homes and hotels each year. Studies show that one in five Americans has experienced a bed bug infestation or knows someone who has. Understanding these persistent pests is key to effective prevention and treatment. Learn more by reading our frequently asked questions below.</p>
        <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#444', marginTop: 0, marginBottom: 0 }}>Our specialized bed bug extermination service includes a thorough inspection by highly trained technicians, followed by a targeted treatment plan that eliminates bed bugs at all stages of life—including eggs, larvae, and adults. With minimal preparation required on your part, our treatments are designed to provide long-lasting relief.</p>
      </section>

      <section className="px-4 md:px-10" style={{ paddingTop: '0px', paddingBottom: '80px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <h2 style={{ fontWeight: '800', fontSize: 'clamp(26px, 3vw, 38px)', marginBottom: '20px', marginTop: 0 }}>Get Your Free Quote</h2>
            <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '28px', color: '#444', marginTop: 0 }}>
              Don't allow bed bugs to disrupt your life. Act now with Dang Pest Control's proven and effective bed bug control services. Located in Tyler, TX, we proudly serve{' '}
              <a href="/longview-tx" style={{ color: '#000', textDecoration: 'underline' }}>Longview</a>,{' '}
              <a href="/jacksonville-tx" style={{ color: '#000', textDecoration: 'underline' }}>Jacksonville</a>,{' '}
              <a href="/lindale-tx" style={{ color: '#000', textDecoration: 'underline' }}>Lindale</a>,{' '}
              <a href="/bullard-tx" style={{ color: '#000', textDecoration: 'underline' }}>Bullard</a>,{' '}
              <a href="/whitehouse-tx" style={{ color: '#000', textDecoration: 'underline' }}>Whitehouse</a>, and surrounding areas. Call us today at{' '}
              <a href="tel:(903) 871-0550" style={{ color: '#000', fontWeight: '700' }}>(903) 871-0550</a>{' '}and{' '}
              <a href="/quote" style={{ color: '#000', textDecoration: 'underline' }}>get your quote</a>.
            </p>
            <a href="/quote" style={{ display: 'inline-block', padding: '14px 40px', background: 'hsl(28, 100%, 50%)', borderRadius: '50px', fontWeight: '700', color: '#fff', textDecoration: 'none', fontSize: '16px' }}>Get Your Quote</a>
          </div>
          <div style={{ position: 'relative', padding: '20px' }}>
            <div style={{ position: 'absolute', inset: 0, background: '#fff', backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)', backgroundSize: '22px 22px', borderRadius: '8px', zIndex: 0 }} />
            <div style={{ position: 'relative', zIndex: 1, border: '4px solid rgb(255, 213, 39)', borderRadius: '6px', overflow: 'hidden', boxShadow: '8px 8px 0 rgba(0,0,0,0.1)' }}>
              <img loading="lazy" width={600} height={400} src="https://www.dangpestcontrol.com/wp-content/uploads/2025/05/bed-bug-2.jpg" alt="Bed Bug Control Services in Tyler TX" style={{ width: '100%', display: 'block' }} />
            </div>
          </div>
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

      <section style={{ position: 'relative', background: 'hsl(48, 100%, 50%)', padding: '100px 40px 90px', clipPath: 'polygon(0 9%, 100% 0, 100% 100%, 0 100%)', marginTop: '-30px', overflow: 'hidden' }}>
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

export default BedBugControl;
