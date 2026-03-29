import { useState } from 'react'

const SUB_TABS = ['Business Info', 'Branding', 'Notifications', 'Integrations'] as const

export default function SettingsTab() {
  const [activeSubTab, setActiveSubTab] = useState<string>('Business Info')

  return (
    <div className="text-gray-300">
      <h2 className="text-xl font-semibold text-white mb-4">Settings</h2>
      <div className="flex gap-2 mb-6">
        {SUB_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeSubTab === tab
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="bg-[var(--admin-card-bg)] rounded-xl p-6 border border-[var(--admin-sidebar-border)]">
        <p className="text-gray-500">{activeSubTab} settings coming soon.</p>
      </div>
    </div>
  )
}
