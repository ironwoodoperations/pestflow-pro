import Link from 'next/link';
import { Shield, Eye, Award, Zap, Star, Home, Heart, Bug } from 'lucide-react';
import { JsonLdScript } from './JsonLdScripts';

interface TeamMember { id: string; name: string; title?: string; bio?: string; photo_url?: string }

interface Props {
  heroTitle: string;
  heroSub: string;
  heroImageUrl: string | null;
  aboutImage: string;
  team: TeamMember[];
  introParagraphs: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aboutSchema: any;
}

const VALUES = [
  { Icon: Shield, title: 'Science-Backed Solutions', desc: 'Every treatment plan is based on Integrated Pest Management (IPM) principles. We target the root cause, not just the symptoms.' },
  { Icon: Eye,    title: 'Transparent Pricing',      desc: 'We quote before we treat. No hidden fees, no upselling, no surprise invoices.' },
  { Icon: Award,  title: '30-Day Guarantee',         desc: "If pests return within 30 days of treatment, we come back and retreat at no additional cost." },
  { Icon: Zap,    title: 'Same-Day Response',        desc: "Call before noon and we'll be at your property the same day. Your family's safety shouldn't wait." },
];

const CERTS = ['NPMA Member', 'TPCA Certified', 'BBB Accredited', 'TDA Licensed', 'EPA Certified', 'WDI Inspector'];

const STATS = [
  { num: '15+',      label: 'Years Experience',       Icon: Star  },
  { num: '4,200+',   label: 'Homes Protected',        Icon: Home  },
  { num: '98%',      label: 'Customer Satisfaction',  Icon: Heart },
  { num: 'Same-Day', label: 'Service Available',      Icon: Bug   },
];

export function DefaultAboutPage({ heroTitle, heroSub, heroImageUrl, aboutImage, team, introParagraphs, aboutSchema }: Props) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>
      <JsonLdScript schema={aboutSchema} id="ld-about" />

      <section className="relative py-20 md:py-28" style={heroImageUrl
        ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, var(--color-bg-hero, #0a1628) 0%, var(--color-bg-hero-end, var(--color-primary)) 100%)' }}>
        {heroImageUrl && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 0, pointerEvents: 'none' }} />}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-white">{heroTitle}</h1>
          <p className="text-xl text-white/75">{heroSub}</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="rounded-xl overflow-hidden border-2 h-72" style={{ borderColor: 'var(--color-primary)' }}>
              <img src={aboutImage} alt="About us" loading="lazy" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--color-heading, #1a1a1a)' }}>Our Story</h2>
              {introParagraphs.map((p, i) => (
                <p key={i} className={`text-gray-600 leading-relaxed${i < introParagraphs.length - 1 ? ' mb-4' : ''}`}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12" style={{ backgroundColor: 'var(--color-bg-cta, #0a1628)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Our Mission</h2>
          <p className="text-lg leading-relaxed text-white/85">To protect homes and businesses with science-backed pest control solutions delivered by local professionals who treat your property like their own.</p>
        </div>
      </section>

      <section className="py-12" style={{ background: 'linear-gradient(135deg, var(--color-bg-hero, #0a1628) 0%, var(--color-bg-hero-end, var(--color-primary)) 100%)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map(({ num, label, Icon }) => (
              <div key={label}>
                <Icon className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--color-accent)' }} />
                <div className="text-3xl font-bold text-white">{num}</div>
                <div className="text-sm mt-1 text-white/60">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10" style={{ color: 'var(--color-heading, #1a1a1a)' }}>Why Choose Us?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-xl p-6 flex gap-4 bg-white shadow-sm border border-gray-100">
                <div className="flex-shrink-0 mt-1" style={{ color: 'var(--color-primary)' }}><v.Icon className="w-7 h-7" /></div>
                <div>
                  <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-heading, #1a1a1a)' }}>{v.title}</h3>
                  <p className="text-gray-600 text-sm">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {team.length > 0 && (
        <section style={{ backgroundColor: 'var(--color-bg-cta, #0a1628)', padding: '4rem 1rem' }}>
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-white">Meet Our Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {team.map((m) => (
                <div key={m.id} className="rounded-xl p-6 text-center bg-white shadow-sm">
                  <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden flex items-center justify-center bg-gray-100">
                    {m.photo_url
                      ? <img src={m.photo_url} alt={m.name} loading="lazy" className="w-full h-full object-cover" />
                      : <span className="text-xl font-bold text-gray-400">{m.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                    }
                  </div>
                  <h3 className="font-bold mb-1" style={{ color: 'var(--color-heading, #1a1a1a)' }}>{m.name}</h3>
                  {m.title && <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>{m.title}</p>}
                  {m.bio  && <p className="text-sm text-gray-600 mt-2">{m.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10" style={{ color: 'var(--color-heading, #1a1a1a)' }}>Licensed &amp; Certified</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {CERTS.map((cert) => (
              <div key={cert} className="rounded-xl px-6 py-4 text-center font-medium border border-gray-200 shadow-sm text-sm bg-white" style={{ color: 'var(--color-heading, #1a1a1a)' }}>{cert}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-cta, #0a1628)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Ready to Be Pest-Free?</h2>
          <p className="text-lg mb-8 text-white/75">Get your free quote today — same-day service available.</p>
          <Link href="/quote" className="inline-block font-bold rounded-lg px-10 py-4 text-lg transition hover:opacity-90" style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}>
            Get a Free Quote
          </Link>
        </div>
      </section>

    </div>
  );
}
