import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { supabase } from '../../../lib/supabase'

interface Props { tenantId: string }

function getLast6Months(): { key: string; label: string }[] {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
    }
  })
}

export default function SocialVolumeChart({ tenantId }: Props) {
  const [chartData, setChartData] = useState<{ month: string; posts: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - 6)

    supabase
      .from('social_posts')
      .select('created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', cutoff.toISOString())
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        const rows = data || []
        const months = getLast6Months()
        const built = months.map(({ key, label }) => ({
          month: label,
          posts: rows.filter(r => r.created_at.slice(0, 7) === key).length,
        }))
        setChartData(built)
        setLoading(false)
      })
  }, [tenantId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="h-4 bg-gray-100 rounded w-64 mb-4 animate-pulse" />
        <div className="h-[240px] bg-gray-50 rounded animate-pulse" />
      </div>
    )
  }

  const total = chartData.reduce((s, r) => s + r.posts, 0)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-5">
        Social Posts Scheduled — Last 6 Months
      </h3>
      {total === 0 ? (
        <p className="text-sm text-gray-400 py-10 text-center">No posts scheduled yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
            <Tooltip />
            <Bar dataKey="posts" fill="#534AB7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
