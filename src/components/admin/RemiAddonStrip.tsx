import { Phone } from 'lucide-react'
import { REMI_ADDON } from '../../lib/planCardContent'

// Full-width informational add-on strip rendered BELOW the four tier cards on
// both the Dashboard plan section and the Billing tab. Styled distinctly from
// the white tier cards (indigo band) so it reads as a separate add-on, not a
// fifth plan. No button — add-on changes go through the same sales contact.
export default function RemiAddonStrip() {
  return (
    <div className="mt-4 w-full rounded-xl border border-indigo-200 bg-indigo-50/60 p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <Phone size={18} className="text-indigo-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">{REMI_ADDON.heading}</h3>
          <p className="text-xs text-gray-600 mt-1">{REMI_ADDON.description}</p>
          <p className="text-xs font-medium text-gray-800 mt-2">{REMI_ADDON.pricingLine}</p>
        </div>
      </div>
    </div>
  )
}
