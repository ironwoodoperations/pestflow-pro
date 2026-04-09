const TIMELINE = [
  { icon: '📋', label: 'Licensed' },
  { icon: '🛡️', label: 'Insured' },
  { icon: '🏠', label: 'Locally Owned & Operated' },
  { icon: '⭐', label: 'Top Rated Service' },
]

const DOT_BG: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, #e0e0e0 1px, transparent 1px)',
  backgroundSize: '22px 22px',
  backgroundColor: '#ffffff',
}

interface Props { intro?: string }

export default function RusticRuggedAboutTimeline({ intro }: Props) {
  return (
    <section className="py-14 px-4" style={DOT_BG}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <div>
          <h2 className="text-3xl font-bold mb-1" style={{ color: '#1a1a1a' }}>About Us</h2>
          <div className="mb-5" style={{ width: '40px', height: '3px', backgroundColor: 'var(--color-primary)' }} />
          <p className="text-gray-600 leading-relaxed mb-6">
            {intro || "We're a locally owned pest control company committed to protecting homes and businesses in our community. Our licensed technicians bring expertise, integrity, and a personal touch to every job we do."}
          </p>
          <a href="/contact" className="font-bold text-sm transition" style={{ color: 'var(--color-primary)' }}>Contact Us →</a>
        </div>
        <div className="relative pl-8" style={{ borderLeft: '2px solid var(--color-primary)' }}>
          {TIMELINE.map((item, i) => (
            <div key={i} className="flex items-center gap-4 mb-8 relative">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg absolute -left-[calc(20px+1px)] shrink-0"
                style={{ backgroundColor: '#1a1a1a', transform: 'translateX(-50%)' }}>
                <span aria-hidden="true">{item.icon}</span>
              </div>
              <p className="font-semibold text-gray-800 pl-6">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
