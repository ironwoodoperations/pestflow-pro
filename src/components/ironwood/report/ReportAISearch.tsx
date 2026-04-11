import type { RevealReportData } from '../../../types/revealReport'

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div style={{ flex: '1 1 200px', padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
      <div style={{ fontSize: '28px', marginBottom: '10px' }}>{icon}</div>
      <p style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '6px' }}>{title}</p>
      <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>{body}</p>
    </div>
  )
}

export default function ReportAISearch({ data }: { data: RevealReportData }) {
  return (
    <section style={{ padding: '48px 56px', borderBottom: '1px solid #e5e7eb', pageBreakInside: 'avoid' }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: data.primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
        Section 3
      </p>
      <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#111', marginBottom: '8px' }}>
        AI Search Ready
      </h2>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px', maxWidth: '600px' }}>
        ChatGPT, Google AI Overviews, and Perplexity are now answering pest control questions. Your site is built to be cited.
      </p>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <FeatureCard
          icon="🧠"
          title="Structured Data Markup"
          body="Machine-readable schema tells AI engines who you are, what you offer, and where you operate — without guesswork."
        />
        <FeatureCard
          icon="❓"
          title="FAQ Schema"
          body={data.hasFaqSchema
            ? "Your FAQs are marked up and indexable. AI models can pull your answers directly into search results."
            : "FAQ schema is not yet installed. Adding 5+ FAQs to your dashboard will activate this signal."}
        />
        <FeatureCard
          icon="📍"
          title="Hyper-Local Pages"
          body={data.cityPages.length > 0
            ? `${data.cityPages.length} city-specific pages give AI models geographic context for every service area you cover.`
            : "City pages haven't been published yet. Each live city page strengthens your local AI visibility."}
        />
      </div>

      <div style={{ marginTop: '28px', padding: '18px 24px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe', maxWidth: '560px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af', marginBottom: '4px' }}>
          Why this matters right now
        </p>
        <p style={{ fontSize: '13px', color: '#1d4ed8', lineHeight: 1.6 }}>
          40% of pest control searches now start with an AI assistant. Sites without structured data are invisible to these results. Yours isn't.
        </p>
      </div>
    </section>
  )
}
