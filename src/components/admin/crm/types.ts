export interface Lead {
  id: string; name: string; email: string; phone: string; services: string[] | null
  message: string; status: string; notes?: string; created_at: string
}

export type Status = 'new' | 'contacted' | 'quoted' | 'won' | 'lost'
export const STATUSES: Status[] = ['new', 'contacted', 'quoted', 'won', 'lost']
export const PER_PAGE = 25

export const STATUS_BADGE: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  quoted: 'bg-purple-100 text-purple-700',
  won: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-gray-100 text-gray-500',
}
