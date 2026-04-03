import { useState } from 'react'

interface PostTemplate {
  id: string; icon: string; name: string; description: string; topicPrompt: string
}

const CURRENT_MONTH = new Date().toLocaleString('en-US', { month: 'long' })

const INDUSTRY_TEMPLATES: Record<string, PostTemplate[]> = {
  'pest control': [
    { id: 'pc1', icon: '🌿', name: 'Seasonal Tip', description: 'Pest prevention tips for the current season', topicPrompt: `seasonal pest prevention tips for ${CURRENT_MONTH} from {businessName}` },
    { id: 'pc2', icon: '⭐', name: 'Review Spotlight', description: 'Share a 5-star customer review', topicPrompt: 'share a 5-star customer review and thank them' },
    { id: 'pc3', icon: '🐜', name: 'Pest Fact', description: 'Interesting fact about a common pest', topicPrompt: 'interesting fact about a common local pest and how to prevent it' },
    { id: 'pc4', icon: '💰', name: 'Promotion', description: 'Limited time discount offer', topicPrompt: 'limited time discount offer on our pest control services' },
    { id: 'pc5', icon: '🏠', name: 'Home Protection', description: 'Why year-round pest protection matters', topicPrompt: 'why homeowners need year-round pest protection' },
    { id: 'pc6', icon: '👨‍💼', name: 'Meet the Team', description: 'Introduce your technicians', topicPrompt: 'introduce our pest control technicians and their expertise' },
    { id: 'pc7', icon: '📞', name: 'Free Inspection', description: 'Offer a free home inspection', topicPrompt: 'offer a free home pest inspection to new customers' },
    { id: 'pc8', icon: '🌡️', name: 'Weather Alert', description: 'Weather-related pest activity warning', topicPrompt: 'hot/wet/cold weather increases pest activity — call us' },
    { id: 'pc9', icon: '✅', name: 'Before & After', description: 'Customer success story', topicPrompt: 'customer success story — pest problem solved' },
  ],
  'hvac': [
    { id: 'hv1', icon: '🌡️', name: 'Seasonal Tune-Up', description: 'Why now is best for a tune-up', topicPrompt: `why ${CURRENT_MONTH} is the best time for an HVAC tune-up` },
    { id: 'hv2', icon: '⭐', name: 'Review Spotlight', description: 'Share a 5-star review', topicPrompt: 'share a 5-star customer review and thank them' },
    { id: 'hv3', icon: '🔧', name: 'Filter Reminder', description: 'Air filter change tips', topicPrompt: 'how often homeowners should change their air filter' },
    { id: 'hv4', icon: '💰', name: 'Promotion', description: 'Limited time HVAC discount', topicPrompt: 'limited time discount on HVAC maintenance or installation' },
    { id: 'hv5', icon: '🏠', name: 'Home Comfort', description: 'HVAC maintenance saves money', topicPrompt: 'why a well-maintained HVAC system saves money year-round' },
    { id: 'hv6', icon: '👨‍💼', name: 'Meet the Team', description: 'Introduce your HVAC techs', topicPrompt: 'introduce our HVAC technicians and their certifications' },
    { id: 'hv7', icon: '📞', name: 'Free Estimate', description: 'Offer a free HVAC estimate', topicPrompt: 'offer a free estimate on HVAC replacement or repair' },
    { id: 'hv8', icon: '❄️', name: 'Weather Alert', description: 'Extreme weather HVAC warning', topicPrompt: 'extreme heat/cold means your HVAC works harder — call us' },
    { id: 'hv9', icon: '✅', name: 'Before & After', description: 'Old unit replaced, comfort restored', topicPrompt: 'customer success story — old unit replaced, comfort restored' },
  ],
  'plumbing': [
    { id: 'pl1', icon: '🌿', name: 'Seasonal Tip', description: 'Plumbing tips for the season', topicPrompt: `plumbing tips every homeowner should know in ${CURRENT_MONTH}` },
    { id: 'pl2', icon: '⭐', name: 'Review Spotlight', description: 'Share a 5-star review', topicPrompt: 'share a 5-star customer review and thank them' },
    { id: 'pl3', icon: '🚿', name: 'Water Saving', description: 'Save water and lower bills', topicPrompt: 'easy ways homeowners can save water and lower their bills' },
    { id: 'pl4', icon: '💰', name: 'Promotion', description: 'Limited time plumbing discount', topicPrompt: 'limited time discount on plumbing repair or water heater service' },
    { id: 'pl5', icon: '🏠', name: 'Pipe Protection', description: 'Preventive plumbing matters', topicPrompt: 'why preventive plumbing maintenance matters' },
    { id: 'pl6', icon: '👨‍💼', name: 'Meet the Team', description: 'Introduce your plumbers', topicPrompt: 'introduce our licensed plumbers and their expertise' },
    { id: 'pl7', icon: '📞', name: 'Free Estimate', description: 'Offer a free plumbing estimate', topicPrompt: 'offer a free estimate on plumbing repairs' },
    { id: 'pl8', icon: '🌧️', name: 'Weather Alert', description: 'Cold weather pipe warning', topicPrompt: 'cold weather can freeze pipes — call us before it happens' },
    { id: 'pl9', icon: '✅', name: 'Before & After', description: 'Leak fixed, damage prevented', topicPrompt: 'customer success story — leak fixed, water damage prevented' },
  ],
  'roofing': [
    { id: 'rf1', icon: '🌿', name: 'Seasonal Tip', description: 'Roof tips for the season', topicPrompt: `roof maintenance tips every homeowner needs in ${CURRENT_MONTH}` },
    { id: 'rf2', icon: '⭐', name: 'Review Spotlight', description: 'Share a 5-star review', topicPrompt: 'share a 5-star customer review and thank them' },
    { id: 'rf3', icon: '🔍', name: 'Inspection Tip', description: 'Warning signs your roof needs help', topicPrompt: "warning signs your roof needs attention before it's too late" },
    { id: 'rf4', icon: '💰', name: 'Promotion', description: 'Limited time roof discount', topicPrompt: 'limited time discount on roof inspection or repair' },
    { id: 'rf5', icon: '🏠', name: 'Home Protection', description: 'Quality roof protects your home', topicPrompt: 'how a quality roof protects your biggest investment' },
    { id: 'rf6', icon: '👨‍💼', name: 'Meet the Team', description: 'Introduce your roofing crew', topicPrompt: 'introduce our roofing crew and their certifications' },
    { id: 'rf7', icon: '📞', name: 'Free Inspection', description: 'Offer a free roof inspection', topicPrompt: 'offer a free roof inspection after recent storms' },
    { id: 'rf8', icon: '🌩️', name: 'Storm Alert', description: 'Storm damage warning', topicPrompt: 'recent storms can cause hidden roof damage — get inspected' },
    { id: 'rf9', icon: '✅', name: 'Before & After', description: 'Storm damage repaired', topicPrompt: 'customer success story — storm damage repaired, home protected' },
  ],
  'generic': [
    { id: 'gn1', icon: '🌿', name: 'Seasonal Tip', description: 'Seasonal home tips', topicPrompt: `seasonal home maintenance tips every homeowner needs in ${CURRENT_MONTH}` },
    { id: 'gn2', icon: '⭐', name: 'Review Spotlight', description: 'Share a 5-star review', topicPrompt: 'share a 5-star customer review and thank them' },
    { id: 'gn3', icon: '💡', name: 'Pro Tip', description: 'Helpful home services tip', topicPrompt: 'a helpful home services tip from {businessName}' },
    { id: 'gn4', icon: '💰', name: 'Promotion', description: 'Limited time discount', topicPrompt: 'limited time discount on our services — call today' },
    { id: 'gn5', icon: '🏠', name: 'Home Care', description: 'Maintenance saves money', topicPrompt: 'why regular home maintenance saves homeowners money' },
    { id: 'gn6', icon: '👨‍💼', name: 'Meet the Team', description: 'What makes your team different', topicPrompt: 'introduce our team and what makes us different' },
    { id: 'gn7', icon: '📞', name: 'Free Estimate', description: 'Offer a free estimate', topicPrompt: 'offer a free estimate or consultation to new customers' },
    { id: 'gn8', icon: '⚠️', name: 'Seasonal Alert', description: 'Critical time for maintenance', topicPrompt: "this time of year is critical for home maintenance — here's why" },
    { id: 'gn9', icon: '✅', name: 'Before & After', description: 'Customer success story', topicPrompt: 'customer success story — problem solved, homeowner happy' },
  ],
}

interface Props {
  industry: string
  businessName: string
  onSelectTopic: (topic: string) => void
}

export default function ComposerTemplates({ industry, businessName, onSelectTopic }: Props) {
  const [open, setOpen] = useState(false)
  const key = industry.toLowerCase().trim()
  const templates = INDUSTRY_TEMPLATES[key] || INDUSTRY_TEMPLATES['generic']

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-emerald-600 transition-colors">
        📋 Use a Template <span className="text-xs text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {templates.map(t => (
            <div key={t.id} className="border border-gray-200 rounded-lg p-3 hover:border-emerald-300 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{t.icon}</span>
                <span className="text-sm font-medium text-gray-900">{t.name}</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{t.description}</p>
              <button onClick={() => { onSelectTopic(t.topicPrompt.replace(/\{businessName\}/g, businessName)); setOpen(false) }}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700">Use →</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
