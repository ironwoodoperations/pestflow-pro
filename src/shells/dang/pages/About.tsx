import Navbar from '../ShellNavbar';
import Footer from '../ShellFooter';
import { usePageContent } from '../../../hooks/usePageContent';

// ─── COMPONENT ───────────────────────────────────────────────────────────────

const About = () => {
  const { content } = usePageContent('about');
  return (
    <div style={{ fontFamily: "'Open Sans', sans-serif", color: 'hsl(20, 40%, 12%)', overflowX: 'hidden' }}>
      <Navbar />
      <main>

      {/* ══════════════════════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════════════════════ */}
      <section
        style={{
          position: 'relative',
          background: `url(/dang/moblie_banner.webp) center/cover no-repeat, hsl(28, 100%, 50%)`,
          paddingTop: '80px',
          paddingBottom: '200px',
          minHeight: '420px',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.18) 1.5px, transparent 1.5px)',
          backgroundSize: '18px 18px',
          pointerEvents: 'none',
        }} />

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '0 20px 30px' }}>
          <h1 style={{
            fontFamily: '"Bangers", cursive',
            fontSize: 'clamp(56px, 9vw, 100px)',
            color: 'hsl(45, 95%, 60%)',
            fontStyle: 'italic',
            letterSpacing: '0.05em',
            WebkitTextStroke: '3px #000000',
            textShadow: '3px 3px 0 #000000',
            margin: 0,
            lineHeight: 1,
          }}>
            {content?.title ?? 'About Us'}
          </h1>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 1 }}>
          <img fetchPriority="high" width={1200} height={50} src="/dang/banner-img.png" alt="" style={{ width: '100%', display: 'block' }} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          INTRO — image left, text right
      ══════════════════════════════════════════════════════ */}
      <section className="px-4 md:px-10" style={{
        paddingTop: '80px',
        paddingBottom: '60px',
        maxWidth: '1200px',
        margin: '0 auto',
        background: '#ffffff',
        backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div style={{
            border: '4px solid rgb(255, 213, 39)',
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: '8px 8px 0 rgba(0,0,0,0.1)',
          }}>
            <img
              loading="lazy"
              width={600}
              height={400}
              src="https://www.dangpestcontrol.com/wp-content/uploads/2025/05/Kirk-and-Claire.jpg.webp"
              alt="Kirk and Claire - Owners of Dang Pest Control"
              style={{ width: '100%', display: 'block' }}
            />
          </div>

          <div>
            <p style={{
              fontFamily: '"Bangers", cursive',
              color: 'hsl(28, 100%, 50%)',
              fontSize: '18px',
              letterSpacing: '0.12em',
              fontStyle: 'italic',
              marginBottom: '6px',
              marginTop: 0,
            }}>
              {content?.subtitle ?? 'About Us'}
            </p>
            <h2 style={{
              fontSize: 'clamp(26px, 2.8vw, 38px)',
              fontWeight: '800',
              marginBottom: '18px',
              marginTop: 0,
            }}>
              {content?.title ?? 'Family-Owned, Community-Driven'}
            </h2>
            <p style={{ fontSize: '16px', lineHeight: 1.75, marginBottom: '16px', color: '#444', marginTop: 0 }}>
              {content?.intro ?? 'We have been in the home services industry for over 15 years and love that our contribution to you is to bring peace and security to a place where you should feel the safest. At Dang Pest Control, we are a hands-on, personable, relationship-based, and family-owned company. We live, work, worship, and play in the Tyler community.'}
            </p>
            <p style={{ fontSize: '16px', lineHeight: 1.75, marginBottom: '28px', color: '#444', marginTop: 0 }}>
              Our{' '}
              <a href="/pest-control" style={{ color: '#000', textDecoration: 'underline' }}>innovative pest control practices</a>{' '}
              help us stand out amongst our competitors. Our goal is to be an active part in making our community and the lives of our clients better. We promise fun, enjoyable interactions with clients while providing reliable and professional service every step of the way – from our fast communication practices to our extensive pest control plans. We stand by our work and guarantee satisfaction.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a
                href="tel:(903) 871-0550"
                style={{
                  padding: '13px 28px',
                  border: '2px solid hsl(20, 40%, 12%)',
                  borderRadius: '50px',
                  fontWeight: '700',
                  color: 'hsl(20, 40%, 12%)',
                  textDecoration: 'none',
                  fontSize: '15px',
                  whiteSpace: 'nowrap',
                }}
              >
                (903) 871-0550
              </a>
              <a
                href="/quote"
                style={{
                  padding: '13px 28px',
                  background: 'hsl(28, 100%, 50%)',
                  borderRadius: '50px',
                  fontWeight: '700',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '15px',
                  whiteSpace: 'nowrap',
                }}
              >
                Get Your Quote
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          EXPERTISE & PROVEN RESULTS — orange clipPath CTA
      ══════════════════════════════════════════════════════ */}
      <style>{`
        .about-cta-phone { background: transparent !important; color: #fff !important; border: 2px solid #fff !important; }
        .about-cta-phone:hover { background: #fff !important; color: hsl(20,40%,12%) !important; }
        .about-cta-quote { background: #fff !important; color: hsl(28,100%,50%) !important; border: 2px solid #fff !important; }
        .about-cta-quote:hover { background: hsl(45,95%,52%) !important; color: #fff !important; }
      `}</style>
      <section className="px-4 md:px-10" style={{ position: 'relative', background: 'hsl(28, 100%, 50%)', paddingTop: '100px', paddingBottom: '260px', clipPath: 'polygon(0 0, 100% 8%, 100% 100%, 0 100%)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.12) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: '"Bangers", cursive', fontSize: 'clamp(36px, 5vw, 60px)', fontStyle: 'italic', color: 'hsl(45, 95%, 60%)', letterSpacing: '0.04em', marginBottom: '20px', marginTop: 0, lineHeight: 1.1, WebkitTextStroke: '3px #000000', textShadow: '3px 3px 0 #000000' }}>
            EXPERTISE &amp; PROVEN RESULTS
          </h2>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'rgba(0,0,0,0.80)', marginBottom: '28px', marginTop: 0 }}>
            At Dang Pest Control, we pride ourselves on expertise, proven results, and a customer-first approach. Our trained professionals use the latest Integrated Pest Management methods to protect your home or business while prioritizing your family and pets. With reliable service, fast response times, and a commitment to long-term prevention, we're the trusted choice for pest control in East Texas. When hiring a pest control company, it's important to look for a team that is licensed, experienced, and committed to effective treatments. We offer customized solutions based on your specific pest problem, use environmentally responsible products, and provide clear communication about our process.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="tel:(903) 871-0550" className="about-cta-phone" style={{ padding: '13px 28px', borderRadius: '50px', fontWeight: '700', textDecoration: 'none', fontSize: '15px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>(903) 871-0550</a>
            <a href="/quote" className="about-cta-quote" style={{ padding: '13px 28px', borderRadius: '50px', fontWeight: '700', textDecoration: 'none', fontSize: '15px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>Get Your Quote</a>
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

export default About;
