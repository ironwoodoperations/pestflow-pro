import { useState } from 'react'
import PageHelpBanner from '../PageHelpBanner'
import BusinessInfoSection from './BusinessInfoSection'
import BrandingSection from './BrandingSection'
import SocialLinksSection from './SocialLinksSection'
import NotificationsSection from './NotificationsSection'
import HeroMediaSection from './HeroMediaSection'
import HolidayModeSection from './HolidayModeSection'
import DomainSection from './DomainSection'
import UsersSection from './UsersSection'
import { useTenant } from '../../../context/TenantBootProvider'
import { useTenantRole } from '../../../hooks/useTenantRole'
import { can } from '../../../lib/permissions'

// Base tabs every client admin sees. 'Users' (admin-only) and 'Domain' (operator-only) are
// appended conditionally below.
const BASE_TABS = ['Business Info', 'Branding', 'Social Links', 'Notifications', 'Master Hero Image', 'Holiday Mode'] as const
type SubTab = (typeof BASE_TABS)[number] | 'Users' | 'Domain'

export default function SettingsTab() {
  const tenant = useTenant()
  const { role } = useTenantRole()
  const isIronwood = tenant.slug === 'pestflow-pro'
  // S273 PR #2b — admin-only Users tab. UX gate ONLY (the tab is also unguarded at the Dashboard
  // nav level, which is tier-gated not role-gated); the real boundary is server-side
  // (invite-team-member re-reads get_my_tenant_role; list_tenant_members is admin-gated).
  const canManageUsers = can(role, 'user_mgmt', 'view')

  const SUB_TABS: SubTab[] = [
    ...BASE_TABS,
    ...(canManageUsers ? (['Users'] as const) : []),
    ...(isIronwood ? (['Domain'] as const) : []),
  ]

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
      {activeSubTab === 'Master Hero Image' && <HeroMediaSection />}
      {activeSubTab === 'Holiday Mode'   && <HolidayModeSection />}
      {activeSubTab === 'Users'          && canManageUsers && <UsersSection />}
      {activeSubTab === 'Domain'         && <DomainSection />}
    </div>
  )
}
