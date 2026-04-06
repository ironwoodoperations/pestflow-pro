import { useState } from 'react'
import PageHelpBanner from '../PageHelpBanner'
import BusinessInfoSection from './BusinessInfoSection'
import BrandingSection from './BrandingSection'
import SocialLinksSection from './SocialLinksSection'
import NotificationsSection from './NotificationsSection'
import HeroMediaSection from './HeroMediaSection'
import HolidayModeSection from './HolidayModeSection'
import DomainSection from './DomainSection'
import { useTenant } from '../../../hooks/useTenant'

const IRONWOOD_TENANT_ID = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'

const CLIENT_TABS = ['Business Info', 'Branding', 'Social Links', 'Notifications', 'Hero Media', 'Holiday Mode'] as const
const IRONWOOD_TABS = ['Business Info', 'Branding', 'Social Links', 'Notifications', 'Hero Media', 'Holiday Mode', 'Domain'] as const
type SubTab = (typeof IRONWOOD_TABS)[number]

export default function SettingsTab() {
  const { tenantId } = useTenant()
  const isIronwood = tenantId === IRONWOOD_TENANT_ID
  const SUB_TABS = isIronwood ? IRONWOOD_TABS : CLIENT_TABS
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('Business Info')

  return (
    <div>
      <PageHelpBanner tab="settings" title="⚙️ Settings"
        body="Configure your business information, branding, integrations, and more. Changes here update your live website immediately." />

      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-6 mb-6 overflow-x-auto">
        {SUB_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveSubTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeSubTab === tab
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {activeSubTab === 'Business Info'  && <BusinessInfoSection />}
      {activeSubTab === 'Branding'       && <BrandingSection />}
      {activeSubTab === 'Social Links'   && <SocialLinksSection />}
      {activeSubTab === 'Notifications'  && <NotificationsSection />}
      {activeSubTab === 'Hero Media'     && <HeroMediaSection />}
      {activeSubTab === 'Holiday Mode'   && <HolidayModeSection />}
      {activeSubTab === 'Domain'         && <DomainSection />}
    </div>
  )
}
