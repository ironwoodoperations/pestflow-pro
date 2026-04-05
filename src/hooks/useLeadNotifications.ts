import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TENANT_ID = import.meta.env.VITE_TENANT_ID

export interface LeadNotification {
  id: string
  name: string
  services: string | string[]
  created_at: string
}

export function useLeadNotifications() {
  const [newLeads, setNewLeads] = useState<LeadNotification[]>([])
  const [count, setCount] = useState(0)

  const fetchNewLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('id, name, services, created_at')
      .eq('tenant_id', TENANT_ID)
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
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'new')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { setNewLeads(data || []); setCount(data?.length || 0) })
    const interval = setInterval(fetchNewLeads, 60000)
    return () => clearInterval(interval)
  }, [])

  const markAsContacted = async (leadId: string) => {
    await supabase
      .from('leads')
      .update({ status: 'contacted' })
      .eq('id', leadId)
      .eq('tenant_id', TENANT_ID)
    fetchNewLeads()
  }

  return { newLeads, count, markAsContacted, refresh: fetchNewLeads }
}
