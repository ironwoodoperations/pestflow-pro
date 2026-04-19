import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import IntakeSubmissionViewer from './IntakeSubmissionViewer'

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
  const [viewerOpen, setViewerOpen]   = useState(false)
  const [intakeData, setIntakeData]   = useState<any>(null)
  const [confirmRegen, setConfirmRegen] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [importing, setImporting]     = useState(false)
  const [importMsg, setImportMsg]     = useState<string | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)

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

  async function sendIntakeEmail() {
    if (!tokenRow || !adminEmail) { toast.error('Add a contact email in the Contact & Pipeline section before sending.'); return }
    setSendingEmail(true)
    try {
      let { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        const { data: r } = await supabase.auth.refreshSession()
        session = r.session
      }
      if (!session) { toast.error('Session expired — please refresh.'); return }
      const link = `${BASE_URL}/intake/${tokenRow.token}`
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-intake-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          prospectEmail: adminEmail,
          prospectName:  companyName || '',
          intakeUrl:     link,
          businessName:  companyName || 'your business',
        }),
      })
      const data = await res.json()
      if (data.success) toast.success(`Intake link sent to ${adminEmail}`)
      else toast.error(data.error || 'Failed to send email')
    } catch (e: any) {
      toast.error(e.message || 'Network error')
    } finally {
      setSendingEmail(false)
    }
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
      const domain = d.domain || {}

      const addressParts = [biz.address, biz.city, biz.state, biz.zip]
        .filter((p: any) => p && String(p).trim())
      const fullAddress = addressParts.join(', ')

      const updates: Record<string, any> = {}

      // Contact fields
      if (!prospect.email?.trim() && biz.email?.trim())   updates.email = biz.email.trim()
      if (!prospect.phone?.trim() && biz.phone?.trim())   updates.phone = biz.phone.trim()

      // business_info merge — all intake fields including new owner_name, license, founded_year, num_technicians
      const existingBi = prospect.business_info || {}
      updates.business_info = {
        ...existingBi,
        name:            mergeIfBlank(existingBi.name,            biz.business_name || biz.name),
        phone:           mergeIfBlank(existingBi.phone,           biz.phone),
        email:           mergeIfBlank(existingBi.email,           biz.email),
        address:         mergeIfBlank(existingBi.address,         fullAddress),
        hours:           mergeIfBlank(existingBi.hours,           biz.hours),
        tagline:         mergeIfBlank(existingBi.tagline,         biz.tagline),
        license:         mergeIfBlank(existingBi.license,         biz.license_number),
        founded_year:    mergeIfBlank(existingBi.founded_year,    biz.founded_year),
        num_technicians: mergeIfBlank(existingBi.num_technicians, biz.num_technicians),
        owner_name:      mergeIfBlank(existingBi.owner_name,      biz.owner_name),
      }

      // branding merge — logo_url, cta_text, palette_id
      const existingBr = prospect.branding || {}
      updates.branding = {
        ...existingBr,
        template:      mergeIfBlank(existingBr.template,      brand.template),
        primary_color: mergeIfBlank(existingBr.primary_color, brand.primary_color),
        accent_color:  mergeIfBlank(existingBr.accent_color,  brand.accent_color),
        logo_url:      mergeIfBlank(existingBr.logo_url,      brand.logo_url),
        cta_text:      mergeIfBlank(existingBr.cta_text,      brand.cta_text),
      }
      if (brand.palette_id && !existingBr.palette_id) updates.branding.palette_id = brand.palette_id

      // customization merge — owner_name, founded_year, display toggles, hero_headline
      const existingCu = prospect.customization || {}
      updates.customization = {
        ...existingCu,
        hero_headline:       existingCu.hero_headline       ?? biz.tagline ?? '',
        owner_name:          mergeIfBlank(existingCu.owner_name,    biz.owner_name),
        founded_year:        mergeIfBlank(existingCu.founded_year,  biz.founded_year),
        show_license:        existingCu.show_license        ?? true,
        show_years:          existingCu.show_years          ?? true,
        show_technicians:    existingCu.show_technicians    ?? true,
        show_certifications: existingCu.show_certifications ?? true,
      }

      // service_areas — seed with city if blank
      if (!prospect.service_areas?.trim() && biz.city?.trim()) {
        updates.service_areas = biz.city.trim()
      }

      // social_links merge
      const existingSl = prospect.social_links || {}
      updates.social_links = {
        ...existingSl,
        facebook:  mergeIfBlank(existingSl.facebook,  social.facebook_url),
        instagram: mergeIfBlank(existingSl.instagram, social.instagram_url),
        google:    mergeIfBlank(existingSl.google,    social.google_business_url),
        youtube:   mergeIfBlank(existingSl.youtube,   social.youtube_url),
      }

      // domain → website_url (only if not already set)
      const domainName = domain.domain_name?.trim()
      if (domainName && !prospect.website_url?.trim()) {
        updates.website_url = domainName.startsWith('http') ? domainName : `https://${domainName}`
      }

      // domain_registrar → append to notes if not already mentioned
      if (domain.domain_registrar && !(prospect.notes ?? '').includes(domain.domain_registrar)) {
        const domainNote = `Domain: ${domain.domain_name || '(not yet registered)'} — Registrar: ${domain.domain_registrar}`
        updates.notes = [prospect.notes ?? '', '', domainNote].join('\n').trim()
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
            <button onClick={sendIntakeEmail} disabled={sendingEmail} className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition disabled:opacity-50">
              {sendingEmail ? 'Sending…' : '📧 Send Intake Email'}
            </button>
            <button onClick={openEmail} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition">
              Open mailto
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
            <button
              onClick={async () => {
                if (!intakeData) {
                  const { data: row } = await supabase.from('prospects').select('intake_data, intake_submitted_at').eq('id', prospectId!).maybeSingle()
                  setIntakeData(row)
                }
                setViewerOpen(true)
              }}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition">
              👁 View Submitted Data
            </button>
            <button onClick={importFromIntake} disabled={importing}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition disabled:opacity-50">
              {importing ? 'Importing…' : '↓ Import from Intake'}
            </button>
            {!confirmRegen && (
              <button onClick={() => setConfirmRegen(true)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-amber-400 text-xs rounded-lg transition">
                Regenerate Link
              </button>
            )}
          </div>
          {importMsg && (
            <p className={`text-xs ${importMsg.startsWith('Import failed') ? 'text-red-400' : 'text-emerald-400'}`}>
              {importMsg}
            </p>
          )}
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

      {viewerOpen && intakeData && (
        <IntakeSubmissionViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          prospect={{
            id:                   prospectId!,
            company_name:         companyName || '',
            intake_data:          intakeData.intake_data,
            intake_submitted_at:  intakeData.intake_submitted_at || submitted,
          }}
        />
      )}
    </div>
  )
}

