import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'

export default function HolidayBanner() {
  const [visible, setVisible] = useState(false)
  const [holiday, setHoliday] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const { data } = await supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'holiday_mode').maybeSingle()
      if (data?.value?.enabled && data.value.holiday) {
        setHoliday(data.value.holiday)
        setMessage(data.value.message || 'We may have modified hours. Call to confirm.')
        setVisible(true)
      }
    })
  }, [])

  if (!visible) return null

  return (
    <div className="w-full py-2.5 px-4 flex items-center justify-center gap-3 relative" style={{ background: '#f5c518' }}>
      <span className="text-sm font-medium text-gray-900">
        🎄 {holiday} Hours — {message}
      </span>
      <button onClick={() => setVisible(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-800 hover:text-gray-600" aria-label="Close">
        <X size={16} />
      </button>
    </div>
  )
}
