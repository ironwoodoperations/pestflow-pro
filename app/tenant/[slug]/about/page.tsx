import Link from 'next/link';
import { Shield, Eye, Award, Zap, Star, Home, Heart, Bug } from 'lucide-react';
import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';

export async function generateStaticParams() {
  return [];
}
import { getPageContent, getTeamMembers, getHeroMedia } from '../_lib/queries';
import { resolveHeroImage } from '../_lib/heroImage';

const VALUES = [
  { Icon: Shield, title: 'Science-Backed Solutions', desc: 'Every treatment plan is based on Integrated Pest Management (IPM) principles. We target the root cause, not just the symptoms.' },
  { Icon: Eye,    title: 'Transparent Pricing',      desc: 'We quote before we treat. No hidden fees, no upselling, no surprise invoices.' },
  { Icon: Award,  title: '30-Day Guarantee',         desc: "If pests return within 30 days of treatment, we come back and retreat at no additional cost." },
  { Icon: Zap,    title: 'Same-Day Response',        desc: "Call before noon and we'll be at your property the same day. Your family's safety shouldn't wait." },
];

const CERTS = ['NPMA Member', 'TPCA Certified', 'BBB Accredited', 'TDA Licensed', 'EPA Certified', 'WDI Inspector'];

type Params = { params: { slug: string } };

export default async function AboutPage({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const [content, team, heroMedia] = await Promise.all([
    getPageContent(tenant.id, 'about'),
    getTeamMembers(tenant.id),
    getHeroMedia(tenant.id),
  ]);

  const c = content as { title?: string; subtitle?: string; image_1_url?: string; image_urls?: string[] } | null;
  const heroTitle  = c?.title    || 'About Us';
  const heroSub    = c?.subtitle || 'Family-owned. Science-backed.';
  const aboutImage = c?.image_1_url || c?.image_urls?.[0] || '/images/pests/team.jpg';
  const heroImageUrl = resolveHeroImage(content, heroMedia);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>

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
              <p className="text-gray-600 mb-4">Our company was founded by a local professional who saw an opportunity to do things differently — with better products, honest pricing, and genuine commitment to every customer.</p>
              <p className="text-gray-600 mb-4">What started as a small operation has grown into one of the area&apos;s most trusted pest control companies, employing licensed technicians who serve homes and businesses across the region.</p>
              <p className="text-gray-600">We are fully licensed, bonded, and insured. Every technician is EPA-certified and trained in the latest integrated pest management techniques.</p>
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
            {[
              { num: '15+',      label: 'Years Experience',       Icon: Star  },
              { num: '4,200+',   label: 'Homes Protected',        Icon: Home  },
              { num: '98%',      label: 'Customer Satisfaction',  Icon: Heart },
              { num: 'Same-Day', label: 'Service Available',      Icon: Bug   },
            ].map(({ num, label, Icon }) => (
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
        <section className="py-16" style={{ backgroundColor: 'var(--color-bg-cta, #0a1628)' }}>
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-white">Meet Our Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {team.map((m) => (
                <div key={m.id} className="rounded-xl p-6 text-center shadow-sm bg-white">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden flex items-center justify-center">
                    {m.photo_url
                      ? <img src={m.photo_url} alt={m.name} loading="lazy" className="w-full h-full object-cover" />
                      : <span className="text-2xl font-bold text-gray-400">{m.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                    }
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--color-heading, #1a1a1a)' }}>{m.name}</h3>
                  {m.title && <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>{m.title}</p>}
                  {m.bio  && <p className="text-gray-500 text-sm mt-2">{m.bio}</p>}
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
