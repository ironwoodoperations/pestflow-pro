import { useState } from 'react'
import type { Campaign, SocialPost } from './useSocialData'
import NewCampaignModal from './NewCampaignModal'

interface Props {
  campaigns: Campaign[]
  posts: SocialPost[]
  onCampaignSelect: (campaignId: string | null) => void
  selectedCampaignId: string | null
  onRefresh: () => void
}

const statusStyles: Record<string, string> = {
  active:    'bg-green-100 text-green-800',
  paused:    'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-600',
}

export default function CampaignsTab({ campaigns, posts, onCampaignSelect, selectedCampaignId, onRefresh }: Props) {
  const [showNewModal, setShowNewModal] = useState(false)

  const postCountForCampaign = (id: string) => posts.filter(p => p.campaign_id === id).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Campaigns</h3>
        <button onClick={() => setShowNewModal(true)}
          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
          + New Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
          <p className="text-3xl mb-2">📅</p>
          <p className="font-semibold text-gray-800 mb-1">No campaigns yet</p>
          <p className="text-sm text-gray-500 mb-4">Create your first campaign to organize your social media content.</p>
          <button onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
            + Create Campaign
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Goal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Platforms</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Posts</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button onClick={() => onCampaignSelect(c.id)}
                      className={`font-medium text-left ${selectedCampaignId === c.id ? 'text-emerald-600 underline' : 'text-gray-800 hover:text-emerald-600'}`}>
                      {c.title}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{c.goal || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.duration_days}d</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {(c.platforms || []).map(p => (
                        <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">{p}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusStyles[c.status] || 'bg-gray-100 text-gray-600'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{postCountForCampaign(c.id)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onCampaignSelect(c.id)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">View Posts</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedCampaignId && (
        <div className="bg-gray-50 rounded-lg px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Showing posts for: <b>{campaigns.find(c => c.id === selectedCampaignId)?.title}</b>
          </span>
          <button onClick={() => onCampaignSelect(null)} className="text-xs text-gray-500 hover:text-gray-700">&times; Clear filter</button>
        </div>
      )}

      {showNewModal && (
        <NewCampaignModal onClose={() => setShowNewModal(false)} onCreated={onRefresh} />
      )}
    </div>
  )
}
