import { Link, useLocation } from 'react-router-dom'

interface CityData {
  name: string
  state: string
  county: string
  miles: number
}

const DANG_CITIES: Record<string, CityData> = {
  'lindale-tx':     { name: 'Lindale',      state: 'TX', county: 'Smith County',    miles: 15 },
  'bullard-tx':     { name: 'Bullard',      state: 'TX', county: 'Smith County',    miles: 12 },
  'whitehouse-tx':  { name: 'Whitehouse',   state: 'TX', county: 'Smith County',    miles: 8  },
  'jacksonville-tx':{ name: 'Jacksonville', state: 'TX', county: 'Cherokee County', miles: 28 },
  'longview-tx':    { name: 'Longview',     state: 'TX', county: 'Gregg County',    miles: 45 },
  'kilgore-tx':     { name: 'Kilgore',      state: 'TX', county: 'Gregg County',    miles: 38 },
  'henderson-tx':   { name: 'Henderson',    state: 'TX', county: 'Rusk County',     miles: 35 },
}

const SERVICES = [
  { icon: '🪲', name: 'General Pest Control', slug: '/pest-control' },
  { icon: '🐜', name: 'Ant Control',          slug: '/ant-control' },
  { icon: '🦟', name: 'Mosquito Control',     slug: '/mosquito-control' },
  { icon: '🪱', name: 'Termite Treatment',    slug: '/termite-control' },
  { icon: '🐭', name: 'Rodent Control',       slug: '/rodent-control' },
  { icon: '🦂', name: 'Scorpion Control',     slug: '/scorpion-control' },
]

export default function DangCityPage() {
  const { pathname } = useLocation()
  const slug = pathname.replace(/^\//, '')
  const city = DANG_CITIES[slug]

  if (!city) return null

  const title = `Pest Control in ${city.name}, ${city.state}`
  const otherCities = Object.entries(DANG_CITIES).filter(([s]) => s !== slug)

  return (
    <div style={{ background: '#faf7f4', minHeight: '100vh' }}>
      {/* HERO with cloud border */}
      <section style={{
        position: 'relative',
        background: `url(/dang/moblie_banner.webp) center/cover no-repeat, hsl(28, 100%, 50%)`,
        paddingTop: '80px', paddingBottom: '200px', minHeight: '420px', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.18) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '0 20px 30px' }}>
          <h1 style={{
            fontFamily: '"Bangers", cursive',
            fontSize: 'clamp(36px, 6vw, 80px)',
            color: 'hsl(45, 95%, 60%)',
            fontStyle: 'italic', letterSpacing: '0.05em',
            WebkitTextStroke: '3px #000', textShadow: '3px 3px 0 #000',
            margin: 0, lineHeight: 1.05,
          }}>
            DANG PEST CONTROL<br />SERVES {city.name.toUpperCase()}, {city.state}
          </h1>
          <p style={{ color: '#fff', fontSize: '1.1rem', marginTop: '14px', textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>
            Professional pest control for {city.county} homes and businesses
          </p>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 1 }}>
          <img fetchPriority="high" width={1200} height={50} src="/dang/banner-img.png" alt="" style={{ width: '100%', display: 'block' }} />
        </div>
      </section>

      {/* Intro */}
      <section style={{ maxWidth: '860px', margin: '0 auto', padding: '60px 24px' }}>
        <h2 style={{ fontFamily: '"Bangers", cursive', fontSize: 'clamp(28px, 4vw, 48px)', color: '#1a1a1a', fontStyle: 'italic', letterSpacing: '0.04em', marginBottom: '20px' }}>
          {title}
        </h2>
        <p style={{ fontSize: '1.05rem', color: '#444', lineHeight: 1.75, marginBottom: '16px' }}>
          Dang Pest Control proudly serves {city.name}, {city.state} and the surrounding {city.county} area.
          Located just {city.miles} miles from our Tyler headquarters, our licensed technicians provide
          fast, effective pest control for homes and businesses throughout {city.name}.
        </p>
        <p style={{ fontSize: '1.05rem', color: '#444', lineHeight: 1.75, marginBottom: '32px' }}>
          Whether you're dealing with ants, mosquitoes, termites, rodents, or any other pest,
          Dang Pest Control has the solution. We offer same-day service to {city.name} residents
          and back every treatment with our satisfaction guarantee.
        </p>
        <Link to="/quote" style={{ display: 'inline-block', background: 'hsl(28,100%,50%)', color: '#fff', fontWeight: 700, fontSize: '1.05rem', padding: '14px 36px', borderRadius: '8px', textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          Get a Free Quote in {city.name}
        </Link>
      </section>

      {/* Services */}
      <section style={{ background: '#fff', padding: '60px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: '"Bangers", cursive', fontSize: 'clamp(28px, 4vw, 48px)', color: '#1a1a1a', fontStyle: 'italic', letterSpacing: '0.04em', marginBottom: '32px', textAlign: 'center' }}>
            OUR SERVICES IN {city.name.toUpperCase()}, {city.state}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {SERVICES.map(s => (
              <Link key={s.slug} to={s.slug} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                background: '#faf7f4', borderRadius: '10px', padding: '18px 20px',
                textDecoration: 'none', border: '1px solid #f0ece8',
                transition: 'box-shadow 0.2s',
              }}>
                <span style={{ fontSize: '1.8rem' }}>{s.icon}</span>
                <span style={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.95rem' }}>{s.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA with orange band */}
      <section style={{ position: 'relative', background: 'hsl(28,100%,50%)', padding: '70px 24px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.12) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: '"Bangers", cursive', fontSize: 'clamp(30px, 5vw, 60px)', color: 'hsl(45,95%,60%)', fontStyle: 'italic', WebkitTextStroke: '2px #000', textShadow: '2px 2px 0 #000', marginBottom: '16px' }}>
            READY TO DANG THOSE PESTS?
          </h2>
          <p style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '28px', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
            Call us today or get an instant online quote — {city.name} same-day service available.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/quote" style={{ background: 'hsl(48,100%,50%)', color: '#000', fontWeight: 700, fontSize: '1.05rem', padding: '14px 36px', borderRadius: '8px', textDecoration: 'none' }}>
              Get a Free Quote
            </Link>
            <a href="tel:+19032160038" style={{ background: '#fff', color: '#000', fontWeight: 700, fontSize: '1.05rem', padding: '14px 36px', borderRadius: '8px', textDecoration: 'none' }}>
              📞 Call Now
            </a>
          </div>
        </div>
      </section>

      {/* Other cities */}
      <section style={{ padding: '50px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <h3 style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '1.1rem', marginBottom: '16px' }}>We Also Serve</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {otherCities.map(([s, c]) => (
            <Link key={s} to={`/${s}`} style={{ background: '#fff', border: '1px solid #e0dbd5', borderRadius: '20px', padding: '6px 16px', fontSize: '0.9rem', color: '#444', textDecoration: 'none' }}>
              {c.name}, {c.state}
            </Link>
          ))}
          <Link to="/service-area" style={{ background: '#fff', border: '1px solid #e0dbd5', borderRadius: '20px', padding: '6px 16px', fontSize: '0.9rem', color: '#444', textDecoration: 'none' }}>
            Tyler, TX (HQ)
          </Link>
        </div>
      </section>
    </div>
  )
}
