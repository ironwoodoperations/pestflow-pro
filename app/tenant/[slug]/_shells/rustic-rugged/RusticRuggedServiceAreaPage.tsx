import Link from 'next/link';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

interface LocItem { slug: string; city: string }
interface Props {
  heroTitle: string;
  heroSub: string;
  locations: LocItem[];
  phone: string;
  businessName: string;
}

const SERIF: React.CSSProperties = { fontFamily: "'Source Serif Pro', Georgia, serif" };
const BODY: React.CSSProperties = { fontFamily: "Inter, sans-serif" };

// First letter group used as a "county-ish" friendly grouping
function groupAlpha(locations: LocItem[]) {
  const groups: Record<string, LocItem[]> = {};
  locations.forEach((l) => {
    const key = (l.city[0] || '#').toUpperCase();
    if (!groups[key]) groups[key] = [];
    groups[key].push(l);
  });
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

export function RusticRuggedServiceAreaPage({ heroTitle, heroSub, locations, phone, businessName }: Props) {
  const groups = groupAlpha(locations);

  return (
    <div style={{ backgroundColor: '#F5F0E5', color: '#2D2A24' }}>
      <section style={{ padding: '5rem 1rem 3rem', borderBottom: '1px solid #E0D7C0', textAlign: 'center' }}>
        <div className="max-w-3xl mx-auto">
          <p style={{ ...SERIF, fontStyle: 'italic', fontSize: 16, color: '#B85C38', marginBottom: '0.5rem' }}>areas we serve</p>
          <h1 style={{ ...SERIF, fontSize: 'clamp(40px,6vw,68px)', fontWeight: 600, color: '#2D4A2B', marginBottom: '1rem', lineHeight: 1.1 }}>{heroTitle}</h1>
          <p style={{ ...BODY, fontSize: 17, color: '#5A554A', lineHeight: 1.7, maxWidth: '52ch', margin: '0 auto' }}>{heroSub}</p>
        </div>
      </section>

      <section style={{ padding: '3.5rem 1rem' }}>
        <div className="max-w-5xl mx-auto">
          <p style={{ ...SERIF, fontStyle: 'italic', fontSize: 14, color: '#B85C38', textAlign: 'center', marginBottom: '0.5rem' }}>communities {businessName.toLowerCase()} calls home</p>
          <h2 style={{ ...SERIF, fontSize: 'clamp(26px,3.2vw,38px)', fontWeight: 600, color: '#2D4A2B', textAlign: 'center', marginBottom: '2.5rem' }}>Our service area</h2>
          {groups.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {groups.map(([letter, items]) => (
                <div key={letter}>
                  <p style={{ ...SERIF, fontSize: 22, fontWeight: 600, color: '#B85C38', marginBottom: '0.5rem', borderBottom: '1px solid #E0D7C0', paddingBottom: '0.4rem' }}>{letter}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '0.4rem' }}>
                    {items.map((loc) => (
                      <Link key={loc.slug} href={`/${loc.slug}`} style={{ ...BODY, fontSize: 14, color: '#2D4A2B', padding: '0.4rem 0', textDecoration: 'none' }}>
                        <span style={{ ...SERIF, fontStyle: 'italic', color: '#B85C38' }}>—</span> {loc.city}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ ...BODY, fontSize: 15, color: '#5A554A', textAlign: 'center' }}>Adding service areas — call to confirm.</p>
          )}
        </div>
      </section>

      <section style={{ padding: '3rem 1rem', textAlign: 'center', backgroundColor: '#EDE5D2', borderTop: '1px solid #E0D7C0' }}>
        <h2 style={{ ...SERIF, fontSize: 'clamp(24px,3vw,32px)', fontWeight: 600, color: '#2D4A2B', marginBottom: '0.75rem' }}>Don&apos;t see your town?</h2>
        <p style={{ ...BODY, fontSize: 15, color: '#5A554A', marginBottom: '1.25rem' }}>We may still serve your area — give us a call.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
          {phone && <a href={`tel:${phone.replace(/\D/g,'')}`} style={{ ...BODY, display: 'inline-block', backgroundColor: '#B85C38', color: '#F5F0E5', fontWeight: 600, fontSize: 15, padding: '0.85rem 2rem', borderRadius: 999, textDecoration: 'none' }}>Call {formatPhone(phone)}</a>}
          <Link href="/quote" style={{ ...BODY, display: 'inline-block', border: '2px solid #2D4A2B', color: '#2D4A2B', fontWeight: 500, fontSize: 15, padding: '0.85rem 2rem', borderRadius: 999, textDecoration: 'none' }}>Get Your Quote</Link>
        </div>
      </section>
    </div>
  );
}
