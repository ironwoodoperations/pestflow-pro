import type { Tenant } from '../../../../../shared/lib/tenant/types';

interface Props {
  tenant: Tenant;
  serviceAreaCount?: number;
}

const LABEL_STYLE = {
  fontFamily: "var(--font-inter,'Inter',sans-serif)",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: 'var(--bl-text-muted)',
  display: 'block',
  marginBottom: 4,
} as React.CSSProperties;

const VALUE_STYLE = {
  fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)",
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--bl-accent)',
  display: 'block',
} as React.CSSProperties;

export function BoldLocalTrustBar({ tenant, serviceAreaCount = 0 }: Props) {
  const licenseVal = tenant.license_number?.trim() || 'Licensed & Insured';
  const foundedYear = tenant.founded_year;
  const ownershipVal = foundedYear ? `Since ${foundedYear}` : 'Family-Owned';
  const coverageVal = serviceAreaCount > 0 ? `${serviceAreaCount} cities served` : 'Service area';

  const cells = [
    { label: 'License #', value: licenseVal },
    { label: 'BBB Rating', value: 'A+' },
    { label: 'Ownership', value: ownershipVal },
    { label: 'Coverage', value: coverageVal },
  ];

  return (
    <div style={{
      backgroundColor: 'var(--bl-surface)',
      borderTop: '1px solid rgba(245,166,35,0.25)',
      borderBottom: '1px solid rgba(245,166,35,0.25)',
    }}>
      <div className="max-w-6xl mx-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
        {cells.map((cell, i) => (
          <div key={cell.label} style={{
            padding: '1rem 1.25rem',
            textAlign: 'center',
            borderRight: i < cells.length - 1 ? '1px solid var(--bl-border)' : 'none',
          }}>
            <span style={LABEL_STYLE}>{cell.label}</span>
            <span style={VALUE_STYLE}>{cell.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
