import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantBootProvider'

export interface LeadNotification {
  id: string
  name: string
  services: string | string[]
  created_at: string
}

export function useLeadNotifications() {
  const { id: tenantId } = useTenant()
  const [newLeads, setNewLeads] = useState<LeadNotification[]>([])
  const [count, setCount] = useState(0)

  const fetchNewLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('id, name, services, created_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'new')
      .order('created_at', { ascending: false })
      .limit(5)

    setNewLeads(data || [])
    setCount(data?.length || 0)
  }

  useEffect(() => {
    supabase
      .from('leads')
      .select('id, name, services, created_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'new')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { setNewLeads(data || []); setCount(data?.length || 0) })
    const interval = setInterval(fetchNewLeads, 60000)
    return () => clearInterval(interval)
  }, [tenantId]) // eslint-disable-line react-hooks/exhaustive-deps

  const markAsContacted = async (leadId: string) => {
    await supabase
      .from('leads')
      .update({ status: 'contacted' })
      .eq('id', leadId)
      .eq('tenant_id', tenantId)
    fetchNewLeads()
  }

  return { newLeads, count, markAsContacted, refresh: fetchNewLeads }
}
