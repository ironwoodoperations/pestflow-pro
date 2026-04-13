import { usePlan } from '../../hooks/usePlan'

const TIERS = [
  { value: 1, label: 'S', name: 'Starter' },
  { value: 2, label: 'G', name: 'Grow' },
  { value: 3, label: 'P', name: 'Pro' },
  { value: 4, label: 'E', name: 'Elite' },
]

// Detect demo tenant by hostname slug
function useIsDemoTenant() {
  const parts = window.location.hostname.split('.')
  const slug = parts.length >= 3 && window.location.hostname.endsWith('.pestflowpro.com') ? parts[0] : ''
  return slug === 'pestflow-pro' || slug === ''  // also show on localhost/dev
}

export default function TierToggle() {
  const { tier, setTier, loading } = usePlan()
  const isDemo = useIsDemoTenant()

  if (loading) return null
  if (!isDemo) return null  // hide on real client sites

  return (
    <div className="px-3 pb-4">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Demo Tier</p>
      <div className="flex gap-1">
        {TIERS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTier(t.value)}
            title={t.name}
            className={`flex-1 h-7 rounded text-xs font-semibold transition-all ${
              tier === t.value
                ? 'bg-primary text-primary-foreground shadow'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
