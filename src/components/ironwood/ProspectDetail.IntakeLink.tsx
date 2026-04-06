import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const BASE_URL = 'https://pestflowpro.com'

interface Props {
  prospectId: string | null
  adminEmail?: string
  companyName?: string
}

export default function IntakeLinkSection({ prospectId, adminEmail, companyName }: Props) {
  const [tokenRow, setTokenRow]       = useState<any>(null)
  const [loading, setLoading]         = useState(true)
  const [creating, setCreating]       = useState(false)
  const [copied, setCopied]           = useState(false)
  const [showData, setShowData]       = useState(false)
  const [confirmRegen, setConfirmRegen] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

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
          <button onClick={() => setShowData(d => !d)}
            className="text-xs text-gray-400 hover:text-white underline transition">
            {showData ? 'Hide submitted data' : 'View submitted data'}
          </button>
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
