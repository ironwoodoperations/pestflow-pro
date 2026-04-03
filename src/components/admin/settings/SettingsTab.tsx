import { useState } from 'react'
import PageHelpBanner from '../PageHelpBanner'
import BusinessInfoSection from './BusinessInfoSection'
import BrandingSection from './BrandingSection'
import SocialLinksSection from './SocialLinksSection'
import NotificationsSection from './NotificationsSection'
import HeroMediaSection from './HeroMediaSection'
import IntegrationsSection from './IntegrationsSection'
import HolidayModeSection from './HolidayModeSection'
import DomainSection from './DomainSection'

const SUB_TABS = ['Business Info', 'Branding', 'Social Links', 'Notifications', 'Hero Media', 'Integrations', 'Holiday Mode', 'Domain'] as const
type SubTab = (typeof SUB_TABS)[number]

export default function SettingsTab() {
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
      {activeSubTab === 'Integrations'   && <IntegrationsSection />}
      {activeSubTab === 'Holiday Mode'   && <HolidayModeSection />}
      {activeSubTab === 'Domain'         && <DomainSection />}
    </div>
  )
}
