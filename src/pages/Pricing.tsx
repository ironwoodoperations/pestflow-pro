import { Link } from 'react-router-dom'
import { Check, Minus } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HolidayBanner from '../components/HolidayBanner'
import StructuredData from '../components/StructuredData'

// Stripe Payment Link URLs — configure in .env.local or Stripe Dashboard
const STRIPE_LINKS = {
  starter: import.meta.env.VITE_STRIPE_STARTER_LINK || '',
  pro: import.meta.env.VITE_STRIPE_PRO_LINK || '',
  agency: import.meta.env.VITE_STRIPE_AGENCY_LINK || '',
}

const PLANS = [
  {
    name: 'Starter', price: '$99', period: '/month', popular: false, tier: 'starter' as const,
    features: ['1 location', 'Up to 500 leads/month', 'Public website', 'Quote form', 'Blog (5 posts)', 'Email support'],
    cta: 'Start Free Trial', ctaStyle: 'border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50',
  },
  {
    name: 'Professional', price: '$199', period: '/month', popular: true, tier: 'pro' as const,
    features: ['3 locations', 'Unlimited leads', 'Everything in Starter', 'AI keyword research', 'Google Reviews import', 'Social posting', 'Priority support'],
    cta: 'Start Free Trial', ctaStyle: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  },
  {
    name: 'Agency', price: '$399', period: '/month', popular: false, tier: 'agency' as const,
    features: ['Unlimited locations', 'White-label (your branding)', 'Everything in Pro', 'Multi-tenant dashboard', 'PDF reports', 'Dedicated onboarding', 'Phone support'],
    cta: 'Contact Sales', ctaStyle: 'bg-[#0a0f1e] hover:bg-[#1a2744] text-white',
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
  { q: 'Do you offer annual billing?', a: 'Yes — get 2 months free when you switch to annual billing. That\'s a savings of up to $798/year.' },
  { q: 'What happens after the trial?', a: 'You\'ll be prompted to add payment info. If you don\'t, your site stays live in read-only mode.' },
]

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-5 h-5 text-emerald-500 mx-auto" />
  if (value === false) return <Minus className="w-5 h-5 text-gray-300 mx-auto" />
  return <span className="text-sm text-gray-900 font-medium">{value}</span>
}

export default function Pricing() {
  return (
    <div className="min-h-screen bg-white">
      <StructuredData type="WebPage" pageSlug="pricing" />
      <HolidayBanner />
      <Navbar />

      {/* Hero */}
      <section className="py-20 md:py-28" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-oswald tracking-wide text-white text-5xl md:text-7xl mb-4">Simple, Transparent <span className="text-emerald-400">Pricing</span></h1>
          <p className="text-gray-300 text-xl">Everything you need to run your pest control business online.</p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div key={plan.name} className={`bg-white rounded-2xl shadow-lg border p-8 relative ${plan.popular ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-gray-200'}`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</span>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                {STRIPE_LINKS[plan.tier] ? (
                  <a href={STRIPE_LINKS[plan.tier]} target="_blank" rel="noopener noreferrer" className={`block text-center font-bold rounded-lg px-6 py-3 transition ${plan.ctaStyle}`}>
                    {plan.cta}
                  </a>
                ) : (
                  <Link to="/admin/onboarding" className={`block text-center font-bold rounded-lg px-6 py-3 transition ${plan.ctaStyle}`}>
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
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-10">Feature Comparison</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Feature</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Starter</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-600 uppercase tracking-wider">Pro</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Agency</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-700">{row.feature}</td>
                    <td className="px-4 py-3 text-center"><CellValue value={row.starter} /></td>
                    <td className="px-4 py-3 text-center bg-emerald-50/30"><CellValue value={row.pro} /></td>
                    <td className="px-4 py-3 text-center"><CellValue value={row.agency} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-10">Billing FAQ</h2>
          <div className="space-y-6">
            {FAQS.map((faq, i) => (
              <div key={i}>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-oswald tracking-wide text-4xl md:text-5xl text-white mb-4">Ready to Get Started?</h2>
          <p className="text-gray-300 text-lg mb-8">14-day free trial. No credit card required.</p>
          <Link to="/admin/onboarding" className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-10 py-4 text-lg transition">
            Start Your Free Trial
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
