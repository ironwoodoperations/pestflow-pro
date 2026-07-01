import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { formatPhone } from '../../../../../shared/lib/formatPhone';
import { generateFAQSchema } from '../../../../../shared/lib/seoSchema';
import { JsonLdScript } from '../../_components/JsonLdScripts';
import { SERVICE_DATA } from '../../_lib/serviceData';
import { CloudBottom, halftoneStyle } from './DangComicDevices';

type PageContent = { title?: string; subtitle?: string; intro?: string; hero_headline?: string } | null;
interface FaqRow { question: string; answer: string; category: string; sort_order: number }
interface Props { tenant: Tenant; pestSlug: string; content?: PageContent; faqs?: FaqRow[] }

const STEP_COLORS = ['var(--dang-orange)', 'var(--dang-yellow)', 'var(--dang-cyan)', 'var(--dang-green)'];
const comicH = (size: string): React.CSSProperties => ({
  fontFamily: 'var(--dang-font-display)', textTransform: 'uppercase', letterSpacing: '0.02em',
  lineHeight: 'var(--dang-line-height-tight)', fontSize: size, margin: 0,
});
const orangePill: React.CSSProperties = {
  display: 'inline-block', background: 'var(--dang-orange)', color: 'var(--dang-white)', border: 'var(--dang-outline)',
  fontFamily: 'var(--dang-font-display)', textTransform: 'uppercase', letterSpacing: '0.03em',
  padding: '0.7rem 1.5rem', borderRadius: 'var(--dang-radius-pill)', textDecoration: 'none', boxShadow: 'var(--dang-shadow-comic)',
};

export function DangComicPestPage({ tenant, pestSlug, content = null, faqs = [] }: Props) {
  const data = SERVICE_DATA[pestSlug];
  const phone = tenant.phone ?? '';
  const tel = phone.replace(/\D/g, '');
  const heroTitle = (content?.hero_headline || data?.heroTitle || titleCase(pestSlug)).toUpperCase();
  const introHeading = data?.introHeading || `Professional ${titleCase(pestSlug)}`;
  const introP1 = content?.intro?.trim() || data?.introP1 || `Our licensed technicians deliver proven ${titleCase(pestSlug).toLowerCase()} for East Texas homes and businesses.`;
  const introP2 = data?.introP2 || '';
  const steps = data?.steps ?? [];

  return (
    <div style={{ fontFamily: 'var(--dang-font-body)', color: 'var(--dang-text)' }}>
      {/* HERO */}
      <section style={{ position: 'relative', background: 'var(--dang-orange)', color: 'var(--dang-white)', padding: '3.5rem 1.25rem 4rem', textAlign: 'center' }}>
        <h1 style={{ ...comicH('clamp(34px,6vw,64px)'), color: 'var(--dang-yellow)', WebkitTextStroke: '2px var(--dang-ink)' }}>{heroTitle}</h1>
        <CloudBottom />
      </section>

      {/* INTRO + PHOTO */}
      <section style={{ ...halftoneStyle(), background: 'var(--dang-white)', padding: '3rem 1.25rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '2rem', alignItems: 'center' }}>
          <div>
            <h2 style={{ ...comicH('clamp(26px,4vw,40px)'), color: 'var(--dang-ink)' }}>{introHeading}</h2>
            <p style={{ marginTop: '1rem', lineHeight: 'var(--dang-line-height-body)' }}>{introP1}</p>
            {introP2 && <p style={{ marginTop: '0.75rem', lineHeight: 'var(--dang-line-height-body)', color: 'var(--dang-text-muted)' }}>{introP2}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.25rem' }}>
              {phone && <a href={`tel:${tel}`} style={{ ...orangePill, background: 'var(--dang-white)', color: 'var(--dang-ink)' }}>Call {formatPhone(phone)}</a>}
              <Link href="/quote" style={orangePill}>Get Your Quote</Link>
            </div>
          </div>
          <div style={{ border: '4px solid var(--dang-orange)', borderRadius: 'var(--dang-radius)', overflow: 'hidden', minHeight: 220, background: 'var(--dang-surface-alt)' }}>
            <img src="/dang/dang-pest-homepage-img-1.webp" alt={`${titleCase(pestSlug)} service`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </section>

      {/* PROCESS */}
      {steps.length > 0 && (
        <section style={{ background: 'var(--dang-surface-alt)', padding: '3.5rem 1.25rem' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ ...comicH('clamp(24px,4vw,38px)'), color: 'var(--dang-ink)', textAlign: 'center' }}>Our {titleCase(pestSlug)} Process</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', marginTop: '2rem' }}>
              {steps.map((s, i) => {
                const c = STEP_COLORS[i % 4];
                return (
                  <div key={s.title} style={{ background: 'var(--dang-white)', border: 'var(--dang-outline)', borderTop: `8px solid ${c}`, borderBottom: `8px solid ${c}`, borderRadius: 'var(--dang-radius)', padding: '1.25rem' }}>
                    <div style={{ width: 44, height: 44, background: c, border: 'var(--dang-outline)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dang-white)', fontFamily: 'var(--dang-font-display)', fontSize: 22 }}>{i + 1}</div>
                    <p style={{ ...comicH('13px'), color: c, marginTop: '0.6rem' }}>Step {i + 1}</p>
                    <h3 style={{ ...comicH('18px'), color: 'var(--dang-ink)', marginTop: '0.25rem' }}>{s.title}</h3>
                    <p style={{ marginTop: '0.4rem', fontSize: 14, color: 'var(--dang-text-muted)' }}>{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA (orange angled + cloud) */}
      <section style={{ position: 'relative', background: 'var(--dang-orange)', color: 'var(--dang-white)', padding: '3.5rem 1.25rem 4rem', textAlign: 'center', clipPath: 'polygon(0 6%, 100% 0, 100% 100%, 0 100%)' }}>
        <h2 style={{ ...comicH('clamp(26px,4vw,42px)'), color: 'var(--dang-yellow)', WebkitTextStroke: '1.5px var(--dang-ink)' }}>{titleCase(pestSlug)}-Free Living Starts Here</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginTop: '1.25rem' }}>
          <Link href="/quote" style={{ ...orangePill, background: 'var(--dang-white)', color: 'var(--dang-ink)' }}>Get Your Quote</Link>
          {phone && <a href={`tel:${tel}`} style={{ ...orangePill, background: 'var(--dang-cyan)', color: 'var(--dang-ink)' }}>Call {formatPhone(phone)}</a>}
        </div>
        <CloudBottom />
      </section>

      {/* FAQ — debt-c: render the SAME DB array we emit; emit only when non-empty. */}
      {faqs.length > 0 && (
        <>
          <JsonLdScript schema={generateFAQSchema(faqs)} id="ld-faq" />
          <section style={{ background: 'var(--dang-white)', padding: '3.5rem 1.25rem' }}>
            <div style={{ maxWidth: 820, margin: '0 auto' }}>
              <h2 style={{ ...comicH('clamp(24px,4vw,38px)'), color: 'var(--dang-ink)', textAlign: 'center', marginBottom: '2rem' }}>Frequently Asked Questions</h2>
              {faqs.map((f, i) => (
                <div key={i} style={{ border: 'var(--dang-outline)', borderRadius: 'var(--dang-radius)', padding: '1.1rem 1.25rem', marginBottom: '0.9rem', background: 'var(--dang-white)' }}>
                  <h3 style={{ ...comicH('18px'), color: 'var(--dang-orange)' }}>{i + 1}. {f.question}</h3>
                  <p style={{ marginTop: '0.5rem', fontSize: 15, lineHeight: 'var(--dang-line-height-body)', color: 'var(--dang-text)' }}>{f.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* CLOSER (yellow angled) */}
      <section style={{ background: 'var(--dang-yellow)', color: 'var(--dang-ink)', padding: '3rem 1.25rem', textAlign: 'center', clipPath: 'polygon(0 8%, 100% 0, 100% 100%, 0 100%)' }}>
        <h2 style={{ ...comicH('clamp(24px,4vw,40px)') }}>Protect Your East Texas Home Today</h2>
        <Link href="/quote" style={{ ...orangePill, marginTop: '1.25rem' }}>Get Your Quote</Link>
      </section>
    </div>
  );
}

function titleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
