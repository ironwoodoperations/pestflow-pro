import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useLeadNotifications } from '../../hooks/useLeadNotifications'

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface Props { onNavigateToLeads: () => void }

export default function NotificationBell({ onNavigateToLeads }: Props) {
  const { newLeads, count, markAsContacted } = useLeadNotifications()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <Bell className="w-5 h-5 text-gray-600" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <span className="text-sm font-semibold">New Leads</span>
              {count > 0 && <span className="text-xs text-gray-500">{count} unread</span>}
            </div>
            {newLeads.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">No new leads</div>
            ) : (
              <div className="divide-y">
                {newLeads.map(lead => (
                  <div key={lead.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => { markAsContacted(lead.id); setOpen(false); onNavigateToLeads() }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{lead.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {Array.isArray(lead.services) ? lead.services.join(', ') : lead.services || 'General inquiry'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{formatTimeAgo(lead.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="px-4 py-2 border-t">
              <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                onClick={() => { onNavigateToLeads(); setOpen(false) }}>
                View all leads &rarr;
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
