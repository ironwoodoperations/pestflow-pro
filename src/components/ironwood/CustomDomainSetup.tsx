import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  tenantId: string
  slug: string
}

const STEPS = [
  'Client has a domain (register at Namecheap/GoDaddy if needed)',
  'Add CNAME record: @ → cname.vercel-dns.com (or A record to Vercel IP)',
  'Add CNAME record: www → cname.vercel-dns.com',
  'Add domain in Vercel: pestflow-pro project → Settings → Domains',
  'Confirm DNS propagated and site loads on custom domain',
]

export default function CustomDomainSetup({ tenantId, slug }: Props) {
  const [open, setOpen]           = useState(false)
  const [domain, setDomain]       = useState('')
  const [verified, setVerified]   = useState(false)
  const [progress, setProgress]   = useState<boolean[]>(Array(STEPS.length).fill(false))
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [domainRowId, setDomainRowId] = useState<string | null>(null)

  // Load existing domain row + progress on open
  useEffect(() => {
    if (!open) return
    async function load() {
      // Load domain row
      const { data: row } = await supabase
        .from('tenant_domains')
        .select('id, custom_domain, verified')
        .eq('tenant_id', tenantId)
        .maybeSingle()
      if (row) {
        setDomain(row.custom_domain)
        setVerified(row.verified)
        setDomainRowId(row.id)
      }
      // Load checklist progress
      const { data: setting } = await supabase
        .from('settings')
        .select('value')
        .eq('tenant_id', tenantId)
        .eq('key', 'domain_setup_progress')
        .maybeSingle()
      if (setting?.value?.steps) {
        setProgress(setting.value.steps)
      }
    }
    load()
  }, [open, tenantId])

  const saveDomain = async () => {
    if (!domain.trim()) return
    setSaving(true)
    try {
      const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
      if (domainRowId) {
        await supabase
          .from('tenant_domains')
          .update({ custom_domain: cleanDomain, verified })
          .eq('id', domainRowId)
      } else {
        const { data: row } = await supabase
          .from('tenant_domains')
          .insert({ tenant_id: tenantId, custom_domain: cleanDomain, verified })
          .select('id')
          .single()
        if (row) setDomainRowId(row.id)
      }
      setDomain(cleanDomain)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const toggleVerified = async () => {
    const next = !verified
    setVerified(next)
    if (domainRowId) {
      await supabase.from('tenant_domains').update({ verified: next }).eq('id', domainRowId)
    }
  }

  const toggleStep = async (i: number) => {
    const next = progress.map((v, j) => j === i ? !v : v)
    setProgress(next)
    await supabase.from('settings').upsert(
      { tenant_id: tenantId, key: 'domain_setup_progress', value: { steps: next } },
      { onConflict: 'tenant_id,key' }
    )
  }

  const allDone = progress.every(Boolean)

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 hover:bg-gray-800 transition text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-200">🌐 Custom Domain Setup</span>
          {domain && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${verified ? 'bg-emerald-900/50 text-emerald-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
              {verified ? '✓ verified' : 'pending'}
            </span>
          )}
          {allDone && !domain && (
            <span className="text-xs bg-emerald-900/50 text-emerald-400 px-1.5 py-0.5 rounded">✓ complete</span>
          )}
        </div>
        <span className="text-gray-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 py-4 space-y-4 bg-gray-950">
          {/* Domain input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400">Client's Custom Domain</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="e.g. dangpestcontrol.com"
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={saveDomain}
                disabled={saving || !domain.trim()}
                className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-medium rounded transition disabled:opacity-50"
              >
                {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Subdomain: <span className="text-gray-300">{slug}.pestflowpro.ai</span> will redirect here once verified.
            </p>
          </div>

          {/* Verified toggle */}
          {domainRowId && (
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={toggleVerified}
                className={`w-10 h-5 rounded-full transition-colors ${verified ? 'bg-emerald-600' : 'bg-gray-600'} relative`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${verified ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-gray-300">Mark as verified (DNS propagated)</span>
            </label>
          )}

          {/* 5-step checklist */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-400">Setup Checklist</p>
            {STEPS.map((step, i) => (
              <label key={i} className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={progress[i]}
                  onChange={() => toggleStep(i)}
                  className="mt-0.5 accent-emerald-500"
                />
                <span className={`text-xs ${progress[i] ? 'text-emerald-400 line-through' : 'text-gray-300 group-hover:text-white'} transition`}>
                  {step}
                </span>
              </label>
            ))}
          </div>

          {allDone && domain && verified && (
            <div className="bg-emerald-900/20 border border-emerald-700 rounded px-3 py-2">
              <p className="text-xs text-emerald-400 font-medium">✓ Domain setup complete</p>
              <a
                href={`https://${domain}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-300 hover:underline"
              >
                {domain} →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
