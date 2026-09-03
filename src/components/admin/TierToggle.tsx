import { usePlan } from '../../hooks/usePlan'
import { showDemoAffordances } from '../../lib/demoAffordance'

const TIERS = [
  { value: 1, label: 'S', name: 'Starter' },
  { value: 2, label: 'G', name: 'Growth' },
  { value: 3, label: 'P', name: 'Pro' },
  { value: 4, label: 'E', name: 'Elite' },
]

interface Props {
  /**
   * settings.demo_mode.active for THIS tenant, read once in Dashboard.
   * `undefined` means the tenant has no demo_mode row — a real, current state
   * (vita-glow has none), and it must NOT show the control.
   */
  demoActive?: boolean | null
}

/**
 * The demo tier switcher. Previews the dashboard at each tier during a sales
 * demo; setTier writes LOCAL React state only and every gated action re-checks
 * server-side via check_tenant_access, so this is a display control, not an
 * entitlement one.
 *
 * S325 — it used to decide visibility from window.location.hostname, which
 * resolved TRUE on every custom domain and FALSE on the five demo tenants it
 * exists for. Visibility now comes from the tenant's own demo_mode row. See
 * src/lib/demoAffordance.ts for why a hostname could never answer this.
 */
export default function TierToggle({ demoActive }: Props) {
  const { tier, setTier, loading } = usePlan()

  if (loading) return null
  if (!showDemoAffordances(demoActive)) return null  // hide on real client sites

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
