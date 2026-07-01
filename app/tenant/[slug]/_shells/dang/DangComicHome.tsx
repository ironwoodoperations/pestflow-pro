import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { formatPhone } from '../../../../../shared/lib/formatPhone';
import { CloudBottom, DangShield, SunburstBand, halftoneStyle } from './DangComicDevices';

type PageContent = { title?: string; subtitle?: string; intro?: string; hero_headline?: string } | null;
interface DangTestimonial { id: string; author_name: string; review_text: string; rating: number; author_image_url?: string | null }
interface Props {
  tenant: Tenant;
  content: PageContent;
  heroImageUrl?: string | null;
  aboutIntro: string;
  serviceAreas: string[];
  testimonials: DangTestimonial[];
}

const REFERRAL_URL = 'https://referdangpestcontrol.com';

const SERVICES: { label: string; href: string }[] = [
  { label: 'General', href: '/pest-control' },
  { label: 'Termite Control & Inspections', href: '/termite-control' },
  { label: 'Ant', href: '/ant-control' },
  { label: 'Spider', href: '/spider-control' },
  { label: 'Wasp & Hornet', href: '/wasp-hornet-control' },
  { label: 'Scorpion', href: '/scorpion-control' },
  { label: 'Rodent', href: '/rodent-control' },
  { label: 'Mosquito', href: '/mosquito-control' },
  { label: 'Flea & Tick', href: '/flea-tick-control' },
  { label: 'Roach', href: '/roach-control' },
  { label: 'Bed Bug', href: '/bed-bug-control' },
];

const WHY = [
  { t: 'Professional & Licensed', d: 'Fully licensed, insured technicians with real training — not a franchise script.' },
  { t: 'Family & Pet Friendly', d: 'EPA-registered products applied with your family and pets in mind.' },
  { t: 'Free Pest Control For Life', d: 'Ask how our referral program earns you free service.' },
  { t: 'Custom Plans', d: 'Treatment built around your home, your pests, and your budget.' },
  { t: 'Super-Powered Guarantee', d: 'Pests back between visits? So are we — we re-treat free.' },
];

const comicH = (size: string): React.CSSProperties => ({
  fontFamily: 'var(--dang-font-display)', textTransform: 'uppercase', letterSpacing: '0.02em',
  lineHeight: 'var(--dang-line-height-tight)', fontSize: size, margin: 0,
});
const orangePill: React.CSSProperties = {
  display: 'inline-block', background: 'var(--dang-orange)', color: 'var(--dang-white)', border: 'var(--dang-outline)',
  fontFamily: 'var(--dang-font-display)', textTransform: 'uppercase', letterSpacing: '0.03em',
  padding: '0.7rem 1.5rem', borderRadius: 'var(--dang-radius-pill)', textDecoration: 'none', boxShadow: 'var(--dang-shadow-comic)',
};

function VideoEmbed({ title, poster }: { title: string; poster: string }) {
  return (
    <div style={{ position: 'relative', border: '4px solid var(--dang-cyan)', borderRadius: 'var(--dang-radius)', overflow: 'hidden', aspectRatio: '16 / 9', background: 'var(--dang-ink)' }}>
      <img src={poster} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--dang-orange)', border: 'var(--dang-outline)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dang-white)', fontSize: 26 }}>▶</span>
      </div>
    </div>
  );
}

export function DangComicHome({ tenant, content, heroImageUrl, aboutIntro, serviceAreas, testimonials }: Props) {
  const phone = tenant.phone ?? '';
  const tel = phone.replace(/\D/g, '');
  const bizName = tenant.business_name || tenant.name || 'Dang Pest Control';
  const heroSub = content?.subtitle || content?.intro || 'Kirk and his super hero response team defend East Texas homes from every pest — guaranteed.';

  return (
    <div style={{ fontFamily: 'var(--dang-font-body)', color: 'var(--dang-text)' }}>
      {/* 1 — HERO */}
      <section style={{ position: 'relative', background: 'var(--dang-orange)', color: 'var(--dang-white)', padding: '3.5rem 1.25rem 4.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '2rem', alignItems: 'center' }}>
          <div>
            <h1 style={{ ...comicH('clamp(38px,6vw,72px)'), color: 'var(--dang-yellow)', WebkitTextStroke: '2px var(--dang-ink)' }}>Super Powered Pest Control</h1>
            <p style={{ marginTop: '1rem', fontSize: 18, maxWidth: '46ch' }}>{heroSub}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem' }}>
              <Link href="/quote" style={orangePill}>Get Your Quote</Link>
              <a href={REFERRAL_URL} target="_blank" rel="noopener noreferrer" style={{ ...orangePill, background: 'var(--dang-white)', color: 'var(--dang-ink)' }}>Refer &amp; Earn $75</a>
            </div>
          </div>
          <VideoEmbed title="Meet Kirk" poster={heroImageUrl || '/dang/video-poster.webp'} />
        </div>
        <CloudBottom />
      </section>

      {/* 2 — TRUST STRIP */}
      <section style={{ background: 'var(--dang-white)', padding: '2.5rem 1.25rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1.5rem', textAlign: 'center' }}>
          <TrustItem icon={<DangShield size={56} />} title="Super-Powered Guarantee" />
          <TrustItem icon={<span style={{ fontSize: 44 }}>🎧</span>} title="Super Hero Response Team!" />
          <TrustItem icon={<span style={{ fontSize: 44 }}>🎖️</span>} title="Certified Expert" />
        </div>
      </section>

      {/* 3 — TYLER INTRO */}
      <section style={{ ...halftoneStyle(), background: 'var(--dang-surface-alt)', padding: '3rem 1.25rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '2rem', alignItems: 'center' }}>
          <div style={{ border: 'var(--dang-outline)', borderRadius: 'var(--dang-radius)', overflow: 'hidden', background: 'var(--dang-orange)', minHeight: 240 }}>
            <img src="/dang/dang-homepage-img.png" alt={`${bizName} technician`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h2 style={{ ...comicH('clamp(28px,4vw,44px)'), color: 'var(--dang-ink)' }}>Expert Pest Control &amp; Management Services around Tyler, TX</h2>
            <p style={{ marginTop: '1rem', lineHeight: 'var(--dang-line-height-body)' }}>{aboutIntro || `${bizName} keeps East Texas homes and businesses pest-free with local know-how and super-powered service.`}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.25rem' }}>
              {phone && <a href={`tel:${tel}`} style={{ ...orangePill, background: 'var(--dang-white)', color: 'var(--dang-ink)' }}>Call {formatPhone(phone)}</a>}
              <Link href="/quote" style={orangePill}>Get Your Quote</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4 — SERVICE GRID (yellow angled top) */}
      <section style={{ background: 'var(--dang-yellow)', padding: '4rem 1.25rem 3rem', clipPath: 'polygon(0 4%, 100% 0, 100% 100%, 0 100%)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...comicH('16px'), color: 'var(--dang-orange)' }}>Our Services</p>
          <h2 style={{ ...comicH('clamp(28px,4vw,44px)'), color: 'var(--dang-ink)', marginTop: '0.5rem' }}>Our Pest Control Services</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '1rem', marginTop: '2rem' }}>
            {SERVICES.map((s) => (
              <Link key={s.href} href={s.href} style={{ background: 'var(--dang-orange)', color: 'var(--dang-white)', border: 'var(--dang-outline)', borderRadius: 'var(--dang-radius)', padding: '1.25rem 0.75rem', textDecoration: 'none', boxShadow: 'var(--dang-shadow-comic)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <span aria-hidden="true" style={{ fontSize: 30 }}>🐛</span>
                <span style={{ ...comicH('16px') }}>{s.label}</span>
              </Link>
            ))}
          </div>
          <Link href="/quote" style={{ ...orangePill, marginTop: '2rem' }}>Get Your Quote</Link>
        </div>
      </section>

      {/* 5 — WHY CHOOSE US */}
      <section style={{ ...halftoneStyle(), background: 'var(--dang-white)', padding: '3.5rem 1.25rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ ...comicH('16px'), color: 'var(--dang-orange)' }}>Why Choose Us</p>
          <h2 style={{ ...comicH('clamp(28px,4vw,44px)'), color: 'var(--dang-ink)', marginTop: '0.5rem' }}>Why Choose {bizName}?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', marginTop: '2rem' }}>
            {WHY.map((w) => (
              <div key={w.t} style={{ border: 'var(--dang-outline)', borderRadius: 'var(--dang-radius)', padding: '1.25rem', background: 'var(--dang-white)' }}>
                <h3 style={{ ...comicH('20px'), color: 'var(--dang-orange)' }}>{w.t}</h3>
                <p style={{ marginTop: '0.5rem', fontSize: 15, color: 'var(--dang-text-muted)' }}>{w.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 — SECOND VIDEO */}
      <section style={{ background: 'var(--dang-surface-alt)', padding: '3rem 1.25rem' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ ...comicH('clamp(26px,4vw,40px)'), color: 'var(--dang-ink)', marginBottom: '1.5rem' }}>Get Free Pest Control For Life!</h2>
          <VideoEmbed title="Get Free Pest Control For Life" poster="/dang/video-poster.webp" />
        </div>
      </section>

      {/* 7 — EXTERMINATION */}
      <section style={{ background: 'var(--dang-white)', padding: '3rem 1.25rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '2rem', alignItems: 'center' }}>
          <div>
            <h2 style={{ ...comicH('clamp(26px,4vw,40px)'), color: 'var(--dang-ink)' }}>Pest Extermination &amp; More near Tyler, TX</h2>
            <p style={{ marginTop: '1rem', lineHeight: 'var(--dang-line-height-body)', color: 'var(--dang-text-muted)' }}>From one-time knockdowns to year-round protection plans, our technicians handle every East Texas pest with proven, family-safe treatments.</p>
          </div>
          <div style={{ border: '4px solid var(--dang-orange)', borderRadius: 'var(--dang-radius)', overflow: 'hidden', minHeight: 220 }}>
            <img src="/dang/exterior-treatment.jpg" alt="Exterior pest treatment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </section>

      {/* 8 — TESTIMONIALS (teal halftone + sunburst) */}
      {testimonials.length > 0 && (
        <section style={{ position: 'relative', padding: '4rem 1.25rem', color: 'var(--dang-white)' }}>
          <SunburstBand />
          <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ ...comicH('clamp(26px,4vw,40px)'), color: 'var(--dang-white)', WebkitTextStroke: '1.5px var(--dang-ink)' }}>What Our Customers Say</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1.25rem', marginTop: '2rem' }}>
              {testimonials.slice(0, 3).map((t) => (
                <div key={t.id} style={{ background: 'var(--dang-white)', color: 'var(--dang-text)', border: 'var(--dang-outline)', borderRadius: 'var(--dang-radius)', padding: '1.25rem', textAlign: 'left' }}>
                  <div style={{ color: 'var(--dang-yellow)', fontSize: 18 }} aria-label={`${t.rating} out of 5 stars`}>{'★'.repeat(Math.max(1, Math.min(5, Math.round(t.rating || 5))))}</div>
                  <p style={{ marginTop: '0.5rem', fontSize: 15 }}>&ldquo;{t.review_text}&rdquo;</p>
                  <p style={{ marginTop: '0.75rem', ...comicH('16px'), color: 'var(--dang-orange)' }}>{t.author_name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9 — QUOTE CTA (orange angled + cloud bottom) */}
      <section style={{ position: 'relative', ...halftoneStyle('rgba(255,255,255,0.18)'), background: 'var(--dang-orange)', color: 'var(--dang-white)', padding: '4rem 1.25rem 4.5rem', clipPath: 'polygon(0 5%, 100% 0, 100% 100%, 0 100%)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ ...comicH('clamp(30px,5vw,52px)'), color: 'var(--dang-yellow)', WebkitTextStroke: '2px var(--dang-ink)' }}>Get Your Quote Today</h2>
          {serviceAreas.length > 0 && (
            <p style={{ marginTop: '1rem', fontSize: 15 }}>Proudly serving {serviceAreas.slice(0, 5).join(' · ')}</p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <Link href="/quote" style={{ ...orangePill, background: 'var(--dang-white)', color: 'var(--dang-ink)' }}>Get Your Quote</Link>
            {phone && <a href={`tel:${tel}`} style={{ ...orangePill, background: 'var(--dang-cyan)', color: 'var(--dang-ink)' }}>Call {formatPhone(phone)}</a>}
            <a href={REFERRAL_URL} target="_blank" rel="noopener noreferrer" style={{ ...orangePill, background: 'var(--dang-yellow)', color: 'var(--dang-ink)' }}>Refer &amp; Earn $75</a>
          </div>
        </div>
        <CloudBottom />
      </section>
    </div>
  );
}

function TrustItem({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      {icon}
      <p style={{ fontFamily: 'var(--dang-font-display)', textTransform: 'uppercase', letterSpacing: '0.02em', fontSize: 18, color: 'var(--dang-ink)' }}>{title}</p>
    </div>
  );
}
