import { useEffect, useRef, useState } from 'react'

export type GuideSection = 'business_info' | 'build_path' | 'payment' | 'social' | null

interface GuideEntry { title: string; items: string[]; tips: string[] }

const GUIDE: Record<string, GuideEntry> = {
  business_info: {
    title: '🎯 What you need from the call:',
    items: [
      'Legal business name (ask: "What\'s the full name on your license?")',
      'Best contact name and direct number',
      'Email they check daily — this gets the intake link',
    ],
    tips: ['If they hesitate on email, say "We\'ll send your intake link here — it\'s just for us"'],
  },
  build_path: {
    title: '🛤️ Choosing the right path:',
    items: [
      'Template Launch → New business or simple setup. No existing site or they don\'t care about keeping it. Fastest — live in 24–48hrs.',
      'Firecrawl Migration → Has an existing site they want rebuilt. We scrape it, rebuild it better. Most common.',
      'Full Custom → Pro/Elite only. Complete redesign from scratch. Longest timeline.',
    ],
    tips: ['When in doubt: "Do you have a website right now you\'re happy with the content on?" → Yes = Firecrawl, No = Template'],
  },
  payment: {
    title: '💰 Pricing talk track:',
    items: [
      'Starter $149/mo — Great for new businesses, gets them online fast',
      'Growth $249/mo — Most popular. Adds SEO + social scheduling',
      'Pro $349/mo — Full dashboard, blog, locations, reporting',
      'Elite $499/mo — Everything + full custom build + priority support',
      'Setup fee covers your build cost — position it as a one-time investment',
      '"Most of our clients are on Growth — it hits the sweet spot of features and value"',
    ],
    tips: ['If they push back on setup fee: "We can look at waiving or reducing it depending on your timeline"'],
  },
  social: {
    title: '📱 Social media tips:',
    items: [
      'Facebook is the most important — it powers review widgets and social posting',
      'Ask: "Do you have a Facebook business page set up?" (not personal)',
      'Google Business Profile URL — ask them to search their business on Google Maps and copy the link',
      "Don't stress if they don't have everything — we can find most of it",
      'Instagram/YouTube are optional but add value for the social tab',
    ],
    tips: [],
  },
}

function GuideContent({ entry }: { entry: GuideEntry }) {
  return (
    <>
      <p className="font-semibold text-blue-300 mb-3">{entry.title}</p>
      <ul className="space-y-2">
        {entry.items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-blue-500 shrink-0 mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {entry.tips.length > 0 && (
        <div className="mt-3 space-y-1 border-t border-blue-800/50 pt-3">
          {entry.tips.map((tip, i) => (
            <p key={i} className="text-yellow-300 text-xs leading-snug">💡 {tip}</p>
          ))}
        </div>
      )}
    </>
  )
}

// Desktop sidebar guide — rendered in the right column
interface Props { activeSection: GuideSection }

export default function ProspectFormGuide({ activeSection }: Props) {
  const [displayed, setDisplayed] = useState<GuideSection>(activeSection)
  const [faded, setFaded] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (activeSection === displayed) return
    setFaded(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setDisplayed(activeSection)
      setFaded(false)
    }, 150)
    return () => clearTimeout(timer.current)
  }, [activeSection]) // eslint-disable-line

  const entry = displayed ? GUIDE[displayed] : null

  return (
    <div className="p-4 w-full">
      {!displayed || !entry ? (
        <div className="bg-blue-950 border border-blue-800 rounded-lg p-4 text-sm text-blue-200">
          <p>👋 Fill in the form to get step-by-step guidance for each section.</p>
        </div>
      ) : (
        <div
          className="bg-blue-950 border border-blue-800 rounded-lg p-4 text-sm text-blue-100"
          style={{
            opacity: faded ? 0 : 1,
            transform: faded ? 'translateY(4px)' : 'translateY(0)',
            transition: 'opacity 150ms ease, transform 150ms ease',
          }}
        >
          <GuideContent entry={entry} />
        </div>
      )}
    </div>
  )
}

// Mobile inline guide — collapsible panel rendered below each section header
interface InlineGuideProps { section: string; activeSection: GuideSection }

export function InlineGuide({ section, activeSection }: InlineGuideProps) {
  const isActive = activeSection === section
  const entry = GUIDE[section]
  if (!entry) return null

  return (
    <div
      className="overflow-hidden md:hidden"
      style={{
        maxHeight: isActive ? '500px' : '0',
        opacity: isActive ? 1 : 0,
        transition: 'max-height 200ms ease, opacity 200ms ease',
      }}
    >
      <div className="bg-blue-950 border border-blue-800 rounded-lg p-4 text-sm text-blue-100 mb-3">
        <GuideContent entry={entry} />
      </div>
    </div>
  )
}
