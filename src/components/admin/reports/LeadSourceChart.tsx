import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { supabase } from '../../../lib/supabase'

interface Props { tenantId: string }

const LINE_COLORS = ['#534AB7', '#10b981', '#E87800']

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

export default function LeadSourceChart({ tenantId }: Props) {
  const [chartData, setChartData] = useState<Record<string, string | number>[]>([])
  const [serviceKeys, setServiceKeys] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - 6)

    supabase
      .from('leads')
      .select('services, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', cutoff.toISOString())
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        const rows = data || []
        const months = getLast6Months()

        // Count frequency of each service across all rows
        const freq: Record<string, number> = {}
        rows.forEach(r => {
          ;(r.services || []).forEach((s: string) => {
            freq[s] = (freq[s] || 0) + 1
          })
        })
        const top3 = Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([k]) => k)

        // Build per-month counts
        const built = months.map(({ key, label }) => {
          const entry: Record<string, string | number> = { month: label }
          top3.forEach(svc => { entry[svc] = 0 })
          rows.forEach(r => {
            const ym = r.created_at.slice(0, 7)
            if (ym === key) {
              ;(r.services || []).forEach((s: string) => {
                if (top3.includes(s)) entry[s] = (entry[s] as number) + 1
              })
            }
          })
          return entry
        })

        setServiceKeys(top3)
        setChartData(built)
        setLoading(false)
      })
  }, [tenantId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="h-4 bg-gray-100 rounded w-64 mb-4 animate-pulse" />
        <div className="h-[280px] bg-gray-50 rounded animate-pulse" />
      </div>
    )
  }

  const totalLeads = chartData.reduce((sum, row) =>
    sum + serviceKeys.reduce((s, k) => s + (row[k] as number), 0), 0)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-5">
        Lead Source Breakdown — Last 6 Months
      </h3>
      {totalLeads < 2 || serviceKeys.length === 0 ? (
        <p className="text-sm text-gray-400 py-10 text-center">Not enough data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
            <Tooltip />
            <Legend />
            {serviceKeys.map((svc, i) => (
              <Line
                key={svc}
                type="monotone"
                dataKey={svc}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
