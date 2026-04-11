import type { RevealReportData } from '../../../types/revealReport'

interface Step {
  num: string
  title: string
  body: string
  when: string
}

function TimelineStep({ step, color }: { step: Step; color: string }) {
  return (
    <div style={{ display: 'flex', gap: '20px', marginBottom: '28px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%', background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 800, color: '#fff', flexShrink: 0,
        }}>
          {step.num}
        </div>
        <div style={{ width: '2px', flex: 1, background: '#e5e7eb', marginTop: '4px' }} />
      </div>
      <div style={{ paddingTop: '6px', paddingBottom: '8px' }}>
        <p style={{ fontSize: '13px', color: color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
          {step.when}
        </p>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#111', marginBottom: '4px' }}>{step.title}</p>
        <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>{step.body}</p>
      </div>
    </div>
  )
}

export default function ReportNextSteps({ data }: { data: RevealReportData }) {
  const steps: Step[] = [
    {
      num: '1',
      title: 'DNS Goes Live',
      body: 'Your domain points to the new site. Google begins crawling within 24–48 hours.',
      when: 'Today',
    },
    {
      num: '2',
      title: 'Google Indexes Your Pages',
      body: 'Your XML sitemap is submitted automatically. Expect new pages indexed within 1–2 weeks.',
      when: 'Week 1–2',
    },
    {
      num: '3',
      title: 'Rankings Begin Shifting',
      body: 'Organic search traffic builds as Google confirms your structured data and page authority.',
      when: 'Month 1–3',
    },
    {
      num: '4',
      title: 'Local Pack Visibility',
      body: 'With your Google Business Profile linked, you qualify for map pack placement on high-intent searches.',
      when: 'Month 2–4',
    },
    {
      num: '5',
      title: 'Ongoing Optimization',
      body: data.tier === 'elite' || data.tier === 'pro'
        ? 'Monthly content updates, blog posts, and review schema keep your rankings climbing.'
        : 'Upgrade to Pro or Elite for monthly blog content, review schema updates, and priority support.',
      when: 'Ongoing',
    },
  ]

  return (
    <section style={{ padding: '48px 56px', pageBreakInside: 'avoid' }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: data.primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
        Section 6
      </p>
      <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#111', marginBottom: '8px' }}>
        What Happens Next
      </h2>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '36px', maxWidth: '600px' }}>
        Your site is live. Here's the roadmap from today to sustainable organic growth.
      </p>

      <div style={{ maxWidth: '520px' }}>
        {steps.map(step => (
          <TimelineStep key={step.num} step={step} color={data.primaryColor} />
        ))}
      </div>

      {/* CTA footer band */}
      <div style={{ marginTop: '8px', padding: '28px 32px', background: data.primaryColor, borderRadius: '16px', maxWidth: '560px' }}>
        <p style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
          Questions? We're here.
        </p>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
          Your PestFlow Pro team monitors your site performance and is available for strategy calls, content requests, and technical changes — all included in your plan.
        </p>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '16px' }}>
          Powered by PestFlow Pro · pestflowpro.com
        </p>
      </div>
    </section>
  )
}
