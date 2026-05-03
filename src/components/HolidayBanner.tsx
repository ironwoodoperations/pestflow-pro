import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantBootProvider'

export default function HolidayBanner() {
  const { id: tenantId } = useTenant()
  const [visible, setVisible] = useState(false)
  const [holiday, setHoliday] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'holiday_mode').maybeSingle()
      if (data?.value?.enabled && data.value.holiday) {
        setHoliday(data.value.holiday)
        setMessage(data.value.message || 'We may have modified hours. Call to confirm.')
        setVisible(true)
      }
    })()
  }, [tenantId])

  if (!visible) return null

  return (
    <div className="w-full py-2.5 px-4 flex items-center justify-center gap-3 relative" style={{ background: '#f5c518' }}>
      <span className="text-sm font-medium text-gray-900">
        🎄 {holiday} Hours — {message}
      </span>
      <button onClick={() => setVisible(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-800 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded" aria-label="Close holiday banner">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
