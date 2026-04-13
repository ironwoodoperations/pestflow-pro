// ─── MOSQUITO CONTROL — extracted section sub-components ─────────────────────
import { useState, useRef } from 'react'
import { Play } from 'lucide-react'

const IN2CARE_VIDEO_URL = "https://www.dangpestcontrol.com/wp-content/uploads/2025/05/In2Care_V1_Dang-Pest-Control-WEBSITE.mp4"
const IN2CARE_POSTER = "https://www.dangpestcontrol.com/wp-content/uploads/2025/06/Picture1-e1749056859859.png"

export function MosquitoIn2CareSection() {
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handlePlay = () => {
    setIsPlaying(true)
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.src = IN2CARE_VIDEO_URL
        videoRef.current.play()
      }
    }, 100)
  }

  return (
    <section className="px-4 md:px-10" style={{ paddingTop: '70px', paddingBottom: '0', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center" style={{ marginBottom: '60px' }}>
        <div>
          <h2 style={{ fontWeight: '800', fontSize: 'clamp(22px, 2.5vw, 34px)', marginBottom: '18px', marginTop: 0 }}>
            In2Care Stations Mosquito Treatments
          </h2>
          <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '16px', color: '#444', marginTop: 0 }}>
            Our In2Care mosquito stations provide an innovative and eco-friendly solution for long-term mosquito
            control. These strategically placed stations attract egg-laying mosquitos, which become carriers of a
            special bio-active treatment. As they move between breeding sites, they spread the treatment,
            effectively contaminating and eliminating larvae before they can develop into biting adults.
          </p>
          <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#444', marginTop: 0, marginBottom: 0 }}>
            The In2Care system also targets adult mosquitos, reducing their ability to spread diseases like West
            Nile virus and Zika. Proven friendly for people, pets, and beneficial insects, this low-maintenance
            solution offers continuous protection, making it a powerful defense against mosquito infestations on
            your home.
          </p>
        </div>

        <div style={{
          border: '4px solid hsl(185, 100%, 45%)',
          borderRadius: '6px',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0, 180, 200, 0.25)',
          position: 'relative',
        }}>
          {!isPlaying ? (
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={handlePlay}>
              <img
                src={IN2CARE_POSTER}
                alt="In2Care mosquito treatment video"
                style={{ width: '100%', display: 'block' }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.1)',
              }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.85)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Play style={{ width: '28px', height: '28px', color: '#333', marginLeft: '4px' }} />
                </div>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              controls
              autoPlay
              playsInline
              preload="none"
              poster={IN2CARE_POSTER}
              style={{ width: '100%', display: 'block' }}
            />
          )}
        </div>
      </div>

      {/* ── MISTING — image left, text right ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center" style={{ marginBottom: '50px' }}>
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
            src="https://www.dangpestcontrol.com/wp-content/uploads/2025/06/MosquitoMist1-rotated-e1751059236354.jpg"
            alt="Mosquito Misting Treatments in Tyler TX"
            style={{ width: '100%', display: 'block' }}
          />
        </div>

        <div>
          <h2 style={{ fontWeight: '800', fontSize: 'clamp(22px, 2.5vw, 34px)', marginBottom: '18px', marginTop: 0 }}>
            Mosquito Fogging/Misting Treatments
          </h2>
          <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '16px', color: '#444', marginTop: 0 }}>
            Using a professional-grade fogger, we disperse a fine mist of EPA-approved insecticide onto foliage,
            where mosquitos rest during the day. This treatment provides immediate knockdown of adult mosquitos,
            making it an ideal solution for quick relief before outdoor events or during peak mosquito season.
            The fog penetrates dense vegetation and hard-to-reach areas, ensuring maximum coverage.
          </p>
          <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#444', marginTop: 0, marginBottom: 0 }}>
            Environmentally, family and pet friendly when applied by our trained technicians, fogging helps
            create a more comfortable, bite-free environment for you and your family. Rest assured we will
            evaluate every property and take all reasonable steps to protect our valuable pollinators.
          </p>
        </div>
      </div>

      {/* Centered CTA button */}
      <div style={{ textAlign: 'center', paddingBottom: '70px' }}>
        <a
          href="/quote"
          style={{
            display: 'inline-block',
            padding: '16px 52px',
            background: 'hsl(28, 100%, 50%)',
            borderRadius: '50px',
            fontWeight: '700',
            color: '#fff',
            textDecoration: 'none',
            fontSize: '16px',
          }}
        >
          Get Your Quote
        </a>
      </div>
    </section>
  );
}

export function MosquitoProtectSection() {
  return (
    <section className="px-4 md:px-10" style={{ paddingTop: '0', paddingBottom: '60px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontWeight: '800', fontSize: 'clamp(22px, 2.5vw, 34px)', marginBottom: '18px', marginTop: 0 }}>
        Protect Your Home &amp; Family from Mosquitos
      </h2>
      <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '14px', color: '#444', marginTop: 0 }}>
        Mosquitos aren't just a nuisance; they're a serious health threat. With 176 mosquito species in the U.S.
        and over 3,000 worldwide, these pests are responsible for spreading diseases like West Nile virus,
        encephalitis, dengue, and even malaria. Alarming statistics from the Texas Department of Health and Human
        Services reveal 154 cases of West Nile disease and 79 cases of dengue in Texas in 2023 alone.
      </p>
      <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '40px', color: '#444', marginTop: 0 }}>
        Mosquitos are also a primary cause of heartworm in pets, making year-round prevention essential. At Dang
        Pest Control, we're here to help you protect your loved ones and reduce the risks associated with these
        dangerous pests.
      </p>

      <h2 style={{ fontWeight: '800', fontSize: 'clamp(22px, 2.5vw, 34px)', marginBottom: '18px', marginTop: 0 }}>
        Prevention Tips to Reduce Mosquitos
      </h2>
      <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '14px', color: '#444', marginTop: 0 }}>
        While nothing can eliminate mosquitos entirely, adopting effective prevention methods can drastically
        reduce their presence. Here are our top tips to keep mosquitos at bay:
      </p>
      {[
        ['Wear Protective Clothing', 'Cover as much skin as possible by wearing long sleeves and pants to create a physical barrier against mosquito bites.'],
        ['Apply EPA-Approved Repellents', 'Use insect repellents containing DEET, picaridin, oil of lemon eucalyptus, or other recommended ingredients to protect yourself outdoors.'],
        ['Eliminate Standing Water', 'Mosquitos need still water to lay their eggs. Regularly empty items like buckets, trash cans, plant pots, toys, tires, and clogged gutters to deny them breeding grounds.'],
        ["Maintain Your Home's Defenses", 'Ensure your home is mosquito-proof by repairing any damaged window and door screens and keeping outdoor areas free from clutter. Using air conditioning indoors also helps keep mosquitos away.'],
      ].map(([label, body], i) => (
        <p key={i} style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '12px', color: '#444', marginTop: 0 }}>
          <strong>{label}:</strong> {body}
        </p>
      ))}
      <p style={{ fontSize: '15px', lineHeight: 1.8, marginTop: '16px', color: '#444', marginBottom: 0 }}>
        At Dang Pest Control, we understand the challenges you face when dealing with mosquitos. Our expert
        technicians use an Integrated Pest Management (IPM) approach to deliver customized mosquito control
        treatments that are both effective and environmentally responsible. If mosquitos are still causing
        trouble between visits, we'll retreat your property at no additional cost. With Dang Pest Control,
        your satisfaction is our priority.
      </p>
    </section>
  );
}

export function MosquitoGetQuoteSection() {
  return (
    <section className="px-4 md:px-10" style={{ paddingTop: '20px', paddingBottom: '80px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div>
          <h2 style={{ fontWeight: '800', fontSize: 'clamp(26px, 3vw, 38px)', marginBottom: '20px', marginTop: 0 }}>
            Get Your Quote Today
          </h2>
          <p style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '28px', color: '#444', marginTop: 0 }}>
            Mosquitos aren't just an annoyance—they're a threat to your health and well-being. They carry
            diseases like West Nile virus, Zika virus, and dengue fever. Protect your family, pets, and property
            today with expert mosquito pest control services that deliver real results. Serving Tyler, TX, and
            surrounding areas including{' '}
            <a href="/longview-tx" style={{ color: '#000', textDecoration: 'underline' }}>Longview</a>,{' '}
            <a href="/jacksonville-tx" style={{ color: '#000', textDecoration: 'underline' }}>Jacksonville</a>,{' '}
            <a href="/lindale-tx" style={{ color: '#000', textDecoration: 'underline' }}>Lindale</a>,{' '}
            <a href="/bullard-tx" style={{ color: '#000', textDecoration: 'underline' }}>Bullard</a>,{' '}
            <a href="/whitehouse-tx" style={{ color: '#000', textDecoration: 'underline' }}>Whitehouse</a>,
            and more, Dang Pest Control is the trusted name for effective pest management. Call us today at{' '}
            <a href="tel:(903) 871-0550" style={{ color: '#000', fontWeight: '700' }}>(903) 871-0550</a>{' '}
            and{' '}
            <a href="/quote" style={{ color: '#000', textDecoration: 'underline' }}>get your quote</a>.
          </p>
          <a
            href="/quote"
            style={{
              display: 'inline-block',
              padding: '14px 40px',
              background: 'hsl(28, 100%, 50%)',
              borderRadius: '50px',
              fontWeight: '700',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '16px',
            }}
          >
            Get Your Quote
          </a>
        </div>

        <div style={{ position: 'relative', padding: '20px' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: '#fff',
            backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            borderRadius: '8px',
            zIndex: 0,
          }} />
          <div style={{
            position: 'relative',
            zIndex: 1,
            border: '4px solid rgb(255, 213, 39)',
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: '8px 8px 0 rgba(0,0,0,0.1)',
          }}>
            <img
              loading="lazy"
              width={600}
              height={400}
              src="https://www.dangpestcontrol.com/wp-content/uploads/2025/05/culex-mosquito.jpg"
              alt="Culex Mosquito Control Services in Tyler TX"
              style={{ width: '100%', display: 'block' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
