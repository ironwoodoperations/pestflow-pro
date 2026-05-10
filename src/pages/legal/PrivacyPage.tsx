import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PRIVACY_CONTENT, PRIVACY_LAST_UPDATED } from '../../content/legal/privacy';
import { renderLegalMarkdown } from './_lib/legalMarkdown';

const F = { b: "'Plus Jakarta Sans', sans-serif" };
const PAGE_TITLE = 'Privacy Policy — PestFlow Pro';
const META_DESC = 'How PestFlow Pro collects, uses, and protects your data. Subscriber and end-customer privacy practices.';

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[m - 1]} ${d}, ${y}`;
}

export default function PrivacyPage() {
  useEffect(() => {
    document.title = PAGE_TITLE;
    setMeta('description', META_DESC);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#ffffff' }}>
      {/* Hero */}
      <section style={{ padding: '72px 24px 32px', background: 'linear-gradient(180deg, #0f172a 0%, #131e36 100%)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <p style={{ fontFamily: F.b, fontSize: 11, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#22c55e', marginBottom: 14 }}>
            Legal
          </p>
          <h1 style={{ fontFamily: F.b, fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 12px' }}>
            Privacy Policy
          </h1>
          <p style={{ fontFamily: F.b, fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            Last updated: {formatDate(PRIVACY_LAST_UPDATED)}
          </p>
        </div>
      </section>

      {/* Body */}
      <article style={{ padding: '32px 24px 64px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {renderLegalMarkdown(PRIVACY_CONTENT)}
        </div>
      </article>

      {/* Footer CTA */}
      <section style={{ padding: '20px 24px 64px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/" style={{ fontFamily: F.b, fontSize: 14, fontWeight: 600, color: '#22c55e', textDecoration: 'none' }}>
          ← Back to PestFlow Pro
        </Link>
      </section>
    </div>
  );
}
