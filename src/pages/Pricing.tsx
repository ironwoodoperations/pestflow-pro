import { Link } from 'react-router-dom'
import { Check, Minus } from 'lucide-react'
import StructuredData from '../components/StructuredData'

const STRIPE_LINKS = {
  starter: import.meta.env.VITE_STRIPE_STARTER_LINK || '',
  pro: import.meta.env.VITE_STRIPE_PRO_LINK || '',
  agency: import.meta.env.VITE_STRIPE_AGENCY_LINK || '',
}

const PLANS = [
  {
    name: 'Starter', price: '$99', period: '/month', popular: false, tier: 'starter' as const,
    features: ['1 location', 'Up to 500 leads/month', 'Public website', 'Quote form', 'Blog (5 posts)', 'Email support'],
    cta: 'Start Free Trial',
  },
  {
    name: 'Professional', price: '$199', period: '/month', popular: true, tier: 'pro' as const,
    features: ['3 locations', 'Unlimited leads', 'Everything in Starter', 'AI keyword research', 'Google Reviews import', 'Social posting', 'Priority support'],
    cta: 'Start Free Trial',
  },
  {
    name: 'Agency', price: '$399', period: '/month', popular: false, tier: 'agency' as const,
    features: ['Unlimited locations', 'White-label (your branding)', 'Everything in Pro', 'Multi-tenant dashboard', 'PDF reports', 'Dedicated onboarding', 'Phone support'],
    cta: 'Contact Sales',
  },
]

const COMPARISON = [
  { feature: 'Locations', starter: '1', pro: '3', agency: 'Unlimited' },
  { feature: 'Leads per month', starter: '500', pro: 'Unlimited', agency: 'Unlimited' },
  { feature: 'Public website', starter: true, pro: true, agency: true },
  { feature: 'Quote form', starter: true, pro: true, agency: true },
  { feature: 'Blog posts', starter: '5', pro: 'Unlimited', agency: 'Unlimited' },
  { feature: 'AI keyword research', starter: false, pro: true, agency: true },
  { feature: 'Google Reviews import', starter: false, pro: true, agency: true },
  { feature: 'Social posting', starter: false, pro: true, agency: true },
  { feature: 'White-label branding', starter: false, pro: false, agency: true },
  { feature: 'Multi-tenant dashboard', starter: false, pro: false, agency: true },
  { feature: 'PDF reports', starter: false, pro: false, agency: true },
  { feature: 'Dedicated onboarding', starter: false, pro: false, agency: true },
  { feature: 'Phone support', starter: false, pro: false, agency: true },
]

const FAQS = [
  { q: 'Is there a free trial?', a: 'Yes — 14 days free, no credit card required. Try every feature before you commit.' },
  { q: 'Can I cancel anytime?', a: 'Yes, cancel directly from your dashboard at any time. No contracts, no cancellation fees.' },
  { q: 'Do you offer annual billing?', a: "Yes — get 2 months free when you switch to annual billing. That's a savings of up to $798/year." },
  { q: 'What happens after the trial?', a: "You'll be prompted to add payment info. If you don't, your site stays live in read-only mode." },
]

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-5 h-5 mx-auto" style={{ color: 'var(--color-primary)' }} />
  if (value === false) return <Minus className="w-5 h-5 text-gray-300 mx-auto" />
  return <span className="text-sm text-gray-900 font-medium">{value}</span>
}

export default function Pricing() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>
      <StructuredData type="WebPage" pageSlug="pricing" />

      {/* Hero */}
      <section className="py-20 md:py-28" style={{ background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end) 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-oswald tracking-wide text-5xl md:text-7xl mb-4" style={{ color: 'var(--color-nav-text)' }}>
            Simple, Transparent <span style={{ color: 'var(--color-primary)' }}>Pricing</span>
          </h1>
          <p className="text-xl" style={{ color: 'var(--color-nav-text)', opacity: 0.75 }}>Everything you need to run your pest control business online.</p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div key={plan.name} className={`bg-white rounded-2xl shadow-lg border p-8 relative ${plan.popular ? 'ring-2' : 'border-gray-200'}`} style={plan.popular ? { borderColor: 'var(--color-primary)', ringColor: 'var(--color-primary)' } : undefined}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}>MOST POPULAR</span>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} /> {f}
                    </li>
                  ))}
                </ul>
                {STRIPE_LINKS[plan.tier] ? (
                  <a href={STRIPE_LINKS[plan.tier]} target="_blank" rel="noopener noreferrer" className="block text-center font-bold rounded-lg px-6 py-3 transition hover:opacity-90" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                    {plan.cta}
                  </a>
                ) : (
                  <Link to="/admin/onboarding" className="block text-center font-bold rounded-lg px-6 py-3 transition hover:opacity-90" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                    {plan.cta}
                  </Link>
                )}
                <p className="text-xs text-gray-400 text-center mt-2">{STRIPE_LINKS[plan.tier] ? '14-day free trial included' : 'No credit card required'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-center mb-10" style={{ color: 'var(--color-heading)' }}>Feature Comparison</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Feature</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Starter</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>Pro</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Agency</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-700">{row.feature}</td>
                    <td className="px-4 py-3 text-center"><CellValue value={row.starter} /></td>
                    <td className="px-4 py-3 text-center bg-blue-50/30"><CellValue value={row.pro} /></td>
                    <td className="px-4 py-3 text-center"><CellValue value={row.agency} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-center mb-10" style={{ color: 'var(--color-heading)' }}>Billing FAQ</h2>
          <div className="space-y-6">
            {FAQS.map((faq, i) => (
              <div key={i}>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-heading)' }}>{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end) 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-oswald tracking-wide text-4xl md:text-5xl mb-4" style={{ color: 'var(--color-nav-text)' }}>Ready to Get Started?</h2>
          <p className="text-lg mb-8" style={{ color: 'var(--color-nav-text)', opacity: 0.75 }}>14-day free trial. No credit card required.</p>
          <Link to="/admin/onboarding" className="inline-block font-bold rounded-lg px-10 py-4 text-lg transition hover:opacity-90" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
            Start Your Free Trial
          </Link>
        </div>
      </section>

    </div>
  )
}
