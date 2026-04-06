import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import type { Prospect } from './types'

interface Props {
  prospectId: string | null
  form: Partial<Prospect>
}

const FIELDS: { key: string; label: string; placeholder: string; secret?: boolean }[] = [
  { key: 'google_place_id',          label: 'Google Place ID',          placeholder: 'ChIJ…' },
  { key: 'facebook_page_id',         label: 'Facebook Page ID',         placeholder: '1234567890' },
  { key: 'facebook_access_token',    label: 'Facebook Access Token',    placeholder: 'EAAxx…', secret: true },
  { key: 'google_maps_embed_url',    label: 'Google Maps Embed URL',    placeholder: 'https://www.google.com/maps/embed?pb=…' },
  { key: 'google_analytics_id',      label: 'Google Analytics ID',      placeholder: 'G-XXXXXXXXXX' },
  { key: 'google_search_console_url',label: 'Google Search Console URL',placeholder: 'https://search.google.com/search-console/…' },
  { key: 'google_api_key',           label: 'Google API Key',           placeholder: 'AIzaSy…', secret: true },
  { key: 'owner_sms_number',         label: 'Owner SMS Number',         placeholder: '+15551234567' },
]

const inp = 'w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500'

export default function IntegrationsSection({ prospectId, form }: Props) {
  const [values, setValues]     = useState<Record<string, string>>({})
  const [show, setShow]         = useState<Record<string, boolean>>({})
  const [saving, setSaving]     = useState(false)
  const [open, setOpen]         = useState(false)
  const tenantId = form.tenant_id

  useEffect(() => {
    if (!open) return
    // Load from tenant settings if provisioned, otherwise from intake_data
    if (tenantId) {
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()
        .then(({ data }) => { if (data?.value) setValues(data.value) })
    } else if (prospectId) {
      supabase.from('prospects').select('intake_data').eq('id', prospectId).maybeSingle()
        .then(({ data }) => {
          const v = data?.intake_data?.integrations
          if (v) setValues(v)
        })
    }
  }, [open, tenantId, prospectId])

  async function save() {
    setSaving(true)
    if (tenantId) {
      const { error } = await supabase.from('settings')
        .upsert({ tenant_id: tenantId, key: 'integrations', value: values }, { onConflict: 'tenant_id,key' })
      if (error) { toast.error('Save failed: ' + error.message); setSaving(false); return }
    } else if (prospectId) {
      // No tenant yet — store in prospect intake_data.integrations as holding field
      const { data: row } = await supabase.from('prospects').select('intake_data').eq('id', prospectId).maybeSingle()
      const existing = row?.intake_data || {}
      const { error } = await supabase.from('prospects').update({ intake_data: { ...existing, integrations: values } }).eq('id', prospectId)
      if (error) { toast.error('Save failed: ' + error.message); setSaving(false); return }
    }
    setSaving(false)
    toast.success('Integrations saved')
  }

  return (
    <div className="space-y-2">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full font-semibold text-gray-200 border-b border-gray-700 pb-1">
        <span>Integrations</span>
        <span className="text-gray-500 text-xs">{open ? '▲ collapse' : '▼ expand'}</span>
      </button>

      {open && (
        <div className="bg-gray-900 rounded-lg p-4 space-y-3">
          <p className="text-xs text-gray-500">Per-client keys collected during or after the reveal call. Platform keys (Pexels, Ayrshare, Textbelt) are Doppler-only and not shown here.</p>
          <div className="grid grid-cols-1 gap-3">
            {FIELDS.map(f => (
              <div key={f.key}>
                <label className="block text-xs text-gray-400 mb-0.5">{f.label}</label>
                <div className="flex gap-2">
                  <input
                    type={f.secret && !show[f.key] ? 'password' : 'text'}
                    className={inp}
                    value={values[f.key] || ''}
                    placeholder={f.placeholder}
                    onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                  />
                  {f.secret && (
                    <button type="button" onClick={() => setShow(s => ({ ...s, [f.key]: !s[f.key] }))}
                      className="text-xs text-gray-400 hover:text-white px-2 shrink-0">
                      {show[f.key] ? 'Hide' : 'Show'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button onClick={save} disabled={saving}
            className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Integrations'}
          </button>
          {!tenantId && <p className="text-xs text-amber-400">⚠ No tenant yet — values saved to prospect intake_data until site is provisioned.</p>}
        </div>
      )}
    </div>
  )
}
