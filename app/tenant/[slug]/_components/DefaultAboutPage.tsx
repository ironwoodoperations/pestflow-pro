import Link from 'next/link';
import { Shield, Eye, Award } from 'lucide-react';
import { JsonLdScript } from './JsonLdScripts';
import type { ResolvedStat } from '../_lib/aboutStats';

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
  /** PR F: resolved from settings.about. Empty = render no stat block at all. */
  stats?: ResolvedStat[];
}

const VALUES = [
  { Icon: Shield, title: 'Science-Backed Solutions', desc: 'Every treatment plan is based on Integrated Pest Management (IPM) principles. We target the root cause, not just the symptoms.' },
  { Icon: Eye,    title: 'Transparent Pricing',      desc: 'We quote before we treat. No hidden fees, no upselling, no surprise invoices.' },
  { Icon: Award,  title: '30-Day Guarantee',         desc: "If pests return within 30 days of treatment, we come back and retreat at no additional cost." },
  // PR E: the 'Same-Day Response' value ("Call before noon and we'll be at your
  // property the same day") was a dispatch-window promise made on behalf of
  // every tenant using this shell. Deleted, not softened — there is no tenant
  // fact behind it to move to the DB.
];

const CERTS = ['NPMA Member', 'TPCA Certified', 'BBB Accredited', 'TDA Licensed', 'EPA Certified', 'WDI Inspector'];

// PR F: the hardcoded stat tiles are gone. '4,200+ Homes Protected' and
// '98% Customer Satisfaction' were invented figures about a customer base that
// does not exist, and '15+ Years Experience' invented a trading history for
// every tenant on this shell. They now come from settings.about via the same
// contract modern-pro has used since PR B. No stats configured means NO block;
// there is deliberately no fallback tile.

export function DefaultAboutPage({ heroTitle, heroSub, heroImageUrl, aboutImage, team, introParagraphs, aboutSchema, stats = [] }: Props) {
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

      {stats.length > 0 && (
        <section className="py-12" style={{ background: 'linear-gradient(135deg, var(--color-bg-hero, #0a1628) 0%, var(--color-bg-hero-end, var(--color-primary)) 100%)' }}>
          <div className="max-w-6xl mx-auto px-4">
            {/* Columns derive from the tile count. #269 flattened this to a bare
                grid-cols-3, which lost the mobile breakpoint and is cramped at
                375px; with a variable number of tiles a fixed rule is wrong in
                both directions. auto-fit keeps one row on desktop and wraps on
                a phone whether there are one tile or four. */}
            <div className="grid gap-6 text-center" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-3xl font-bold text-white">{s.value}</div>
                  <div className="text-sm mt-1 text-white/60">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
          <p className="text-lg mb-8 text-white/75">Get your free quote today.</p>
          <Link href="/quote" className="inline-block font-bold rounded-lg px-10 py-4 text-lg transition hover:opacity-90" style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}>
            Get a Free Quote
          </Link>
        </div>
      </section>

    </div>
  );
}
