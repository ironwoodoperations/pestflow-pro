import { useTemplate } from '../../context/TemplateContext'

interface Props {
  title: string
  lastUpdated: string
  children: React.ReactNode
}

export default function LegalPage({ title, lastUpdated, children }: Props) {
  const { businessName } = useTemplate()

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '60px 24px 80px' }}>
        <p style={{
          fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary, #10b981)',
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px',
        }}>
          {businessName}
        </p>
        <h1 style={{
          fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 700, color: '#1a1a1a',
          marginBottom: '6px', fontFamily: 'var(--font-heading, sans-serif)',
          lineHeight: 1.2,
        }}>
          {title}
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#999', marginBottom: '36px' }}>
          Last Updated: {lastUpdated}
        </p>
        <hr style={{ borderColor: '#e5e5e5', marginBottom: '36px' }} />
        <div style={{ color: '#444', lineHeight: 1.8, fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
