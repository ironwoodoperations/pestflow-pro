import { useState, useEffect } from 'react';
import Navbar from '../ShellNavbar';
import Footer from '../ShellFooter';
import SEO from '../SEO';
import { supabase } from '../../../lib/supabase';
import { VideoImage } from '../VideoImage';
import { whyCards, termiteSigns } from './data/TermiteInspectionsData';

const TermiteInspections = () => {
  const [pageVideo, setPageVideo] = useState<{ video_url: string | null; video_type: string | null } | null>(null);

  useEffect(() => {
    supabase
      .from('page_content')
      .select('video_url, video_type')
      .eq('tenant_id', '1282b822-825b-4713-9dc9-6d14a2094d06')
      .eq('slug', 'termite-inspections')
      .maybeSingle()
      .then(({ data }) => { if (data) setPageVideo(data); });
  }, []);

  return (
    <div style={{ fontFamily: "'Open Sans', sans-serif", color: 'hsl(20, 40%, 12%)', overflowX: 'hidden' }}>
      <SEO
        title="Termite Inspections in Tyler, TX"
        description="Professional termite inspections in Tyler, TX. Thorough property assessments for termite activity. Licensed inspectors. Call (903) 871-0550."
        canonical="/termite-inspections"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Termite Inspections",
          provider: { "@type": "LocalBusiness", name: "Dang Pest Control", telephone: "+19038710550" },
          areaServed: { "@type": "City", name: "Tyler", addressRegion: "TX" },
          description: "Professional termite inspection services for residential and commercial properties.",
        }}
      />
      <Navbar />
      <main>
      <section style={{ position: 'relative', background: `url(/dang/moblie_banner.webp) center/cover no-repeat, hsl(28, 100%, 50%)`, paddingTop: '80px', paddingBottom: '200px', minHeight: '420px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.18) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '0 20px 30px' }}>
          <h1 style={{ fontFamily: '"Bangers", cursive', fontSize: 'clamp(56px, 9vw, 100px)', color: 'hsl(45, 95%, 60%)', fontStyle: 'italic', letterSpacing: '0.05em', WebkitTextStroke: '3px #000000', textShadow: '3px 3px 0 #000000', margin: 0, lineHeight: 1 }}>TERMITE INSPECTIONS</h1>
        </div>
        <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, lineHeight: 0, zIndex: 1 }}>
          <img fetchPriority="high" width={1200} height={50} src="/dang/banner-img.png" alt="" style={{ width: '100%', display: 'block' }} />
        </div>
      </section>

      <section className="px-4 md:px-10" style={{ paddingTop: '80px', paddingBottom: '60px', maxWidth: '1200px', margin: '0 auto', background: '#ffffff', backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div style={{ border: '4px solid rgb(255, 213, 39)', borderRadius: '6px', overflow: 'hidden', boxShadow: '8px 8px 0 rgba(0,0,0,0.1)' }}>
            <VideoImage src="https://www.dangpestcontrol.com/wp-content/uploads/2025/05/subterranean-termite-inspections.jpg" alt="Subterranean Termite Inspections in Tyler TX" className="" videoUrl={pageVideo?.video_url} videoType={pageVideo?.video_type} />
          </div>
          <div>
            <p style={{ fontFamily: '"Bangers", cursive', color: 'hsl(28, 100%, 50%)', fontSize: '18px', letterSpacing: '0.12em', fontStyle: 'italic', marginBottom: '6px', marginTop: 0 }}>TERMITE INSPECTIONS</p>
            <h2 style={{ fontSize: 'clamp(26px, 2.8vw, 38px)', fontWeight: '800', marginBottom: '18px', marginTop: 0 }}>Professional Termite Inspections</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.75, marginBottom: '28px', color: '#444', marginTop: 0 }}>
              Termites cause more than $5 billion in property damage every year—don't be their next victim. At{' '}
              <a href="/" style={{ color: '#000', textDecoration: 'underline' }}>Dang Pest Control</a>, our licensed termite inspectors specialize in protecting your home with thorough termite inspections,{' '}
              <a href="/termite-control" style={{ color: '#000', textDecoration: 'underline' }}>state-of-the-art treatments</a>, and proactive prevention plans. We serve Tyler, TX, and the surrounding areas. Call us today at{' '}
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

      <section className="px-4 md:px-10" style={{ paddingTop: '70px', paddingBottom: '0', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontWeight: '800', fontSize: 'clamp(22px, 2.5vw, 34px)', marginBottom: '18px', marginTop: 0 }}>Comprehensive Termite Inspections</h2>
        <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#444', marginTop: 0, marginBottom: 0 }}>Our licensed termite inspectors conduct an in-depth evaluation of your property, including both the interior and exterior areas. We leave no stone unturned, looking for telltale signs of termites such as mud tubes, hollow wood, discarded wings, bubbling paint, stuck doors, and even head-banging sounds from soldier termites. Whether you're a homeowner, realtor, homebuyer, or home seller, we'll provide a detailed report on any termite structural damage inspection results we uncover, along with customized recommendations for treatment and prevention.</p>
      </section>

      <section className="px-4 md:px-10" style={{ paddingTop: '50px', paddingBottom: '0', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <h2 style={{ fontWeight: '800', fontSize: 'clamp(22px, 2.5vw, 34px)', marginBottom: '18px', marginTop: 0 }}>Identifying Termites</h2>
            <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '16px', color: '#444', marginTop: 0 }}>Termites are small, resilient insects that can cause significant structural damage to homes and businesses. Recognizing the signs of termites early is critical for preventing costly repairs and protecting your property. Termites are often mistaken for other insects, such as flying ants, but several key traits distinguish them:</p>
            <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '10px', color: '#444', marginTop: 0 }}><strong>Antennae:</strong> Termite antennae are straight with bead-like segments, whereas ants have bent, elbow-like antennae.</p>
            <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '10px', color: '#444', marginTop: 0 }}><strong>Body:</strong> Termites have soft, light-colored bodies and a broadly connected abdomen and thorax. Flying ants, on the other hand, are darker and feature a narrow, pinched waist.</p>
            <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '16px', color: '#444', marginTop: 0 }}><strong>Wings:</strong> Winged termites, or swarmers, have front and hind wings that are equal in size, unlike ants, whose forewings are larger than their hindwings.</p>
            <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '10px', color: '#444', marginTop: 0 }}>Termites serve specific roles within a colony, and these roles impact their physical appearance.</p>
            <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '10px', color: '#444', marginTop: 0 }}><strong>Winged Termites (Swarmers):</strong> These are reproductive termites responsible for starting new colonies. Their color ranges from pale yellow to reddish-brown or black, depending on the species.</p>
            <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '10px', color: '#444', marginTop: 0 }}><strong>Worker Termites:</strong> Wingless and white or creamy white in color, they undertake foraging and construction responsibilities within the colony.</p>
            <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '10px', color: '#444', marginTop: 0 }}><strong>Soldier Termites:</strong> Creamy white with a darker, reinforced head and large mandibles, these termites defend the colony.</p>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#444', marginTop: 0, marginBottom: 0 }}><strong>King and Queen Termites:</strong> These are the largest members of a colony. Egg-laying queens can grow to several inches in length, while kings are slightly smaller.</p>
          </div>
          <div style={{ border: '4px solid rgb(255, 213, 39)', borderRadius: '6px', overflow: 'hidden', boxShadow: '8px 8px 0 rgba(0,0,0,0.1)' }}>
            <img loading="lazy" width={600} height={400} src="https://www.dangpestcontrol.com/wp-content/uploads/2025/05/Ants-vs-Termites.png" alt="Identifying Termites in Tyler TX" style={{ width: '100%', display: 'block' }} />
          </div>
        </div>
      </section>

      <section className="px-4 md:px-10" style={{ paddingTop: '50px', paddingBottom: '0', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontWeight: '800', fontSize: 'clamp(22px, 2.5vw, 34px)', marginBottom: '18px', marginTop: 0 }}>Signs of a Termite Infestation</h2>
        <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '16px', color: '#444', marginTop: 0 }}>Termites are often called "silent destroyers" because they can cause severe damage without immediate detection. Look for these common signs of termite activity at your property:</p>
        {termiteSigns.map(([label, body], i) => (
          <p key={i} style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '12px', color: '#444', marginTop: 0 }}>
            <strong>{label}:</strong> {body}
          </p>
        ))}
      </section>

      <section className="px-4 md:px-10" style={{ paddingTop: '50px', paddingBottom: '0', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontWeight: '800', fontSize: 'clamp(22px, 2.5vw, 34px)', marginBottom: '18px', marginTop: 0 }}>Professional Termite Inspections</h2>
        <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '28px', color: '#444', marginTop: 0 }}>It is critical to have termite issues evaluated by a professional. At Dang Pest Control, our licensed technicians will conduct a comprehensive inspection of both exterior and interior areas of your property. Based on the inspection, we'll determine the scope of the infestation and recommend the most effective course of treatment.</p>
        <a href="/quote" style={{ display: 'inline-block', padding: '14px 40px', background: 'hsl(28, 100%, 50%)', borderRadius: '50px', fontWeight: '700', color: '#fff', textDecoration: 'none', fontSize: '16px' }}>Get Your Quote</a>
      </section>

      <section className="px-4 md:px-10" style={{ paddingTop: '70px', paddingBottom: '70px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr]" style={{ gap: '40px', alignItems: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontWeight: '800', fontSize: 'clamp(26px, 3vw, 38px)', margin: 0 }}>Why Choose Us?</h2>
          <p style={{ fontSize: '16px', color: '#444', lineHeight: 1.7, margin: 0 }}>When it comes to termite inspection and treatment, experience matters. Here's why homeowners trust us in a market saturated with pest control options:</p>
        </div>
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
            <h2 style={{ fontWeight: '800', fontSize: 'clamp(26px, 3vw, 38px)', marginBottom: '20px', marginTop: 0 }}>Call Us Today &amp; Protect What Matters</h2>
            <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '28px', color: '#444', marginTop: 0 }}>
              Don't wait until termites cause irreparable damage to your home or property. Whether you're buying, selling, or ensuring your home is termite-free long-term, our expertise makes all the difference. Located in Tyler, TX, we proudly serve customers in{' '}
              <a href="/longview-tx" style={{ color: '#000', textDecoration: 'underline' }}>Longview</a>,{' '}
              <a href="/jacksonville-tx" style={{ color: '#000', textDecoration: 'underline' }}>Jacksonville</a>,{' '}
              <a href="/lindale-tx" style={{ color: '#000', textDecoration: 'underline' }}>Lindale</a>,{' '}
              <a href="/bullard-tx" style={{ color: '#000', textDecoration: 'underline' }}>Bullard</a>,{' '}
              <a href="/whitehouse-tx" style={{ color: '#000', textDecoration: 'underline' }}>Whitehouse</a>, and beyond. Take the first step in protecting your home and loved ones today. Call us today at{' '}
              <a href="tel:(903) 871-0550" style={{ color: '#000', fontWeight: '700' }}>(903) 871-0550</a>{' '}and{' '}
              <a href="/quote" style={{ color: '#000', textDecoration: 'underline' }}>get your quote</a>.
            </p>
            <a href="/quote" style={{ display: 'inline-block', padding: '14px 40px', background: 'hsl(28, 100%, 50%)', borderRadius: '50px', fontWeight: '700', color: '#fff', textDecoration: 'none', fontSize: '16px' }}>Get Your Quote</a>
          </div>
          <div style={{ position: 'relative', padding: '20px' }}>
            <div style={{ position: 'absolute', inset: 0, background: '#fff', backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)', backgroundSize: '22px 22px', borderRadius: '8px', zIndex: 0 }} />
            <div style={{ position: 'relative', zIndex: 1, border: '4px solid rgb(255, 213, 39)', borderRadius: '6px', overflow: 'hidden', boxShadow: '8px 8px 0 rgba(0,0,0,0.1)' }}>
              <img loading="lazy" width={600} height={400} src="https://www.dangpestcontrol.com/wp-content/uploads/2025/05/termites-inspections.jpg" alt="Home Termite Inspection Services in Tyler TX" style={{ width: '100%', display: 'block' }} />
            </div>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
};

export default TermiteInspections;
