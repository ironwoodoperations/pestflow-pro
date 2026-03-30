import { Edit3, RefreshCw, Star } from 'lucide-react'

const FEATURES = [
  { title: 'Post Composer', desc: 'Write and schedule posts with images to Facebook and Instagram from one dashboard.', icon: Edit3, color: '#3b82f6' },
  { title: 'Auto-Post from Blog', desc: 'Automatically share new blog posts to your social media accounts when published.', icon: RefreshCw, color: '#10b981' },
  { title: 'Review Sharing', desc: 'Automatically turn 5-star reviews into social media posts with branded graphics.', icon: Star, color: '#f59e0b' },
]

export default function SocialTab() {
  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-700">Connect your Facebook Page in Settings → Integrations to enable social features.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FEATURES.map(f => (
          <div key={f.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative">
            <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Coming Soon</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: f.color }}>
              <f.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">{f.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{f.desc}</p>
            <button disabled className="bg-gray-100 text-gray-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
              Configure
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
