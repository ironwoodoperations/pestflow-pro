import { usePlan } from './usePlan'

const TIERS = [
  { value: 1, label: 'S', name: 'Starter' },
  { value: 2, label: 'G', name: 'Grow' },
  { value: 3, label: 'P', name: 'Pro' },
  { value: 4, label: 'E', name: 'Elite' },
]

export default function TierToggle() {
  const { tier, setTier, loading } = usePlan()

  if (loading) return null

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
