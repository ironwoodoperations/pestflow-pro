import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const BASE_URL = 'https://pestflowpro.com'

interface Props {
  prospectId: string | null
  adminEmail?: string
  companyName?: string
  onImportSuccess?: (data: Record<string, any>) => void
}

function mergeIfBlank(existing: string | undefined, incoming: string | undefined): string {
  return existing?.trim() ? existing : (incoming?.trim() || existing || '')
}

export default function IntakeLinkSection({ prospectId, adminEmail, companyName, onImportSuccess }: Props) {
  const [tokenRow, setTokenRow]       = useState<any>(null)
  const [loading, setLoading]         = useState(true)
  const [creating, setCreating]       = useState(false)
  const [copied, setCopied]           = useState(false)
  const [showData, setShowData]       = useState(false)
  const [confirmRegen, setConfirmRegen] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [importing, setImporting]     = useState(false)
  const [importMsg, setImportMsg]     = useState<string | null>(null)

  useEffect(() => {
    if (!prospectId) { setLoading(false); return }
    supabase.from('intake_tokens').select('*').eq('prospect_id', prospectId).maybeSingle()
      .then(({ data }) => { setTokenRow(data); setLoading(false) })
  }, [prospectId])

  async function createToken() {
    if (!prospectId) return
    setCreating(true)
    const { data, error } = await supabase.from('intake_tokens').insert({ prospect_id: prospectId }).select().single()
    if (!error && data) setTokenRow(data)
    setCreating(false)
  }

  async function regenerateToken() {
    if (!prospectId) return
    setRegenerating(true)
    await supabase.from('intake_tokens').delete().eq('prospect_id', prospectId)
    const { data, error } = await supabase.from('intake_tokens').insert({ prospect_id: prospectId }).select().single()
    if (!error && data) setTokenRow(data)
    setConfirmRegen(false)
    setRegenerating(false)
  }

  function copyLink() {
    if (!tokenRow) return
    navigator.clipboard.writeText(`${BASE_URL}/intake/${tokenRow.token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function openEmail() {
    if (!tokenRow) return
    const link = `${BASE_URL}/intake/${tokenRow.token}`
    const subject = encodeURIComponent('Your PestFlow Pro Setup Link')
    const body = encodeURIComponent(
      `Hi${companyName ? ` ${companyName}` : ''},\n\nHere is your PestFlow Pro setup link:\n\n${link}\n\nThis link will expire in 14 days. Fill out the short form so we can get your site ready!\n\nTalk soon,\nScott`
    )
    window.open(`mailto:${adminEmail || ''}?subject=${subject}&body=${body}`)
  }

  async function importFromIntake() {
    if (!prospectId) return
    setImporting(true)
    setImportMsg(null)
    try {
      const { data: prospect } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', prospectId)
        .maybeSingle()
      if (!prospect) throw new Error('Prospect not found')
      const d = prospect.intake_data || {}
      const biz = d.business || {}
      const brand = d.branding || {}
      const social = d.social || {}

      const address = [biz.address, biz.city, biz.state, biz.zip].filter(Boolean).join(', ')

      const updates: Record<string, any> = {}

      // Contact fields
      if (!prospect.email?.trim() && biz.email?.trim())   updates.email = biz.email.trim()
      if (!prospect.phone?.trim() && biz.phone?.trim())   updates.phone = biz.phone.trim()

      // business_info merge
      const existingBi = prospect.business_info || {}
      updates.business_info = {
        ...existingBi,
        name:    mergeIfBlank(existingBi.name,    biz.name),
        phone:   mergeIfBlank(existingBi.phone,   biz.phone),
        email:   mergeIfBlank(existingBi.email,   biz.email),
        address: mergeIfBlank(existingBi.address, address),
        hours:   mergeIfBlank(existingBi.hours,   biz.hours),
        tagline: mergeIfBlank(existingBi.tagline, biz.tagline),
      }

      // branding merge
      const existingBr = prospect.branding || {}
      updates.branding = {
        ...existingBr,
        template:      mergeIfBlank(existingBr.template,      brand.template),
        primary_color: mergeIfBlank(existingBr.primary_color, brand.primary_color),
        accent_color:  mergeIfBlank(existingBr.accent_color,  brand.accent_color),
        logo_url:      mergeIfBlank(existingBr.logo_url,      brand.logo_url),
      }
      if (brand.palette_id && !existingBr.palette_id) updates.branding.palette_id = brand.palette_id

      // social_links merge
      const existingSl = prospect.social_links || {}
      updates.social_links = {
        ...existingSl,
        facebook:  mergeIfBlank(existingSl.facebook,  social.facebook_url),
        instagram: mergeIfBlank(existingSl.instagram, social.instagram_url),
        google:    mergeIfBlank(existingSl.google,    social.google_business_url),
        youtube:   mergeIfBlank(existingSl.youtube,   social.youtube_url),
      }

      await supabase.from('prospects').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', prospectId)

      // Reload fresh prospect record
      const { data: refreshed } = await supabase.from('prospects').select('*').eq('id', prospectId).maybeSingle()
      if (refreshed && onImportSuccess) onImportSuccess(refreshed)
      setImportMsg('Intake data imported successfully.')
      setTimeout(() => setImportMsg(null), 4000)
    } catch (e: any) {
      setImportMsg(`Import failed: ${e.message}`)
    } finally {
      setImporting(false)
    }
  }

  if (!prospectId) return null
  if (loading) return null

  const intakeUrl = tokenRow ? `${BASE_URL}/intake/${tokenRow.token}` : null
  const submitted = tokenRow?.submitted_at
  const expires   = tokenRow ? new Date(tokenRow.expires_at) < new Date() : false

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-200 border-b border-gray-700 pb-1">Intake Link</h3>

      {!tokenRow && (
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-3">Send the client a link to fill out their setup form.</p>
          <button onClick={createToken} disabled={creating}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
            {creating ? 'Generating…' : 'Generate Intake Link'}
          </button>
        </div>
      )}

      {tokenRow && !submitted && (
        <div className="bg-gray-900 rounded-lg p-4 space-y-3">
          {expires ? (
            <p className="text-sm text-amber-400">⚠ This link expired on {new Date(tokenRow.expires_at).toLocaleDateString()}.</p>
          ) : (
            <p className="text-xs text-gray-500">Expires {new Date(tokenRow.expires_at).toLocaleDateString()}</p>
          )}
          <div className="flex items-center gap-2">
            <input readOnly value={intakeUrl!} className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300 truncate" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={copyLink} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition">
              {copied ? '✓ Copied' : 'Copy Link'}
            </button>
            <button onClick={openEmail} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition">
              Open Email
            </button>
            {!confirmRegen && (
              <button onClick={() => setConfirmRegen(true)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-amber-400 text-xs rounded-lg transition">
                Regenerate Link
              </button>
            )}
          </div>
          {confirmRegen && (
            <div className="border border-amber-700 rounded-lg p-3 space-y-2">
              <p className="text-xs text-amber-300">Regenerate link? The old link will stop working.</p>
              <div className="flex gap-2">
                <button onClick={regenerateToken} disabled={regenerating}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition disabled:opacity-50">
                  {regenerating ? 'Regenerating…' : 'Confirm'}
                </button>
                <button onClick={() => setConfirmRegen(false)}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tokenRow && submitted && (
        <div className="bg-gray-900 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            <span className="text-sm text-emerald-400 font-medium">Client submitted on {new Date(submitted).toLocaleDateString()}</span>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <button onClick={() => setShowData(d => !d)}
              className="text-xs text-gray-400 hover:text-white underline transition">
              {showData ? 'Hide submitted data' : 'View submitted data'}
            </button>
            <button onClick={importFromIntake} disabled={importing}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition disabled:opacity-50">
              {importing ? 'Importing…' : '↓ Import from Intake'}
            </button>
          </div>
          {importMsg && (
            <p className={`text-xs ${importMsg.startsWith('Import failed') ? 'text-red-400' : 'text-emerald-400'}`}>
              {importMsg}
            </p>
          )}
          {showData && <SubmittedDataViewer prospectId={prospectId} />}
        </div>
      )}
    </div>
  )
}

function SubmittedDataViewer({ prospectId }: { prospectId: string }) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    supabase.from('prospects').select('intake_data').eq('id', prospectId).maybeSingle()
      .then(({ data: row }) => setData(row?.intake_data || {}))
  }, [prospectId])

  if (!data) return <p className="text-xs text-gray-500">Loading…</p>

  const sections: [string, Record<string, any>][] = [
    ['Business', data.business || {}],
    ['Branding', data.branding || {}],
    ['Domain',   data.domain   || {}],
    ['Social',   data.social   || {}],
  ]

  return (
    <div className="space-y-3 mt-2 text-xs">
      {sections.map(([title, obj]) => (
        <div key={title}>
          <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">{title}</p>
          {Object.entries(obj).filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-gray-500 w-32 shrink-0">{k.replace(/_/g, ' ')}</span>
              <span className="text-gray-200 break-all">{String(v)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
