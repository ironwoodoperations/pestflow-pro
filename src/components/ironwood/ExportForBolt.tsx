import { useState } from 'react'

interface Props {
  prospectId: string
  companyName: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function ExportForBolt({ prospectId, companyName: _companyName }: Props) {
  const [status, setStatus]   = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleExport() {
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/package-bolt-context`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ prospect_id: prospectId }),
        }
      )
      const data = await res.json()
      if (!data.success) {
        setStatus('error')
        setErrorMsg(data.error || 'Export failed')
        return
      }
      const blob = new Blob([data.markdown], { type: 'text/markdown' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = data.filename
      a.click()
      URL.revokeObjectURL(url)
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('Network error')
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleExport}
        disabled={status === 'loading'}
        className="w-full bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold
                   px-4 py-2 rounded-lg transition disabled:opacity-50"
      >
        {status === 'loading' ? 'Packaging…' : '📦 Export for Bolt'}
      </button>
      {status === 'success' && (
        <div className="space-y-1">
          <p className="text-emerald-400 text-xs">✓ Downloaded — open bolt.new to build</p>
          <a
            href="https://bolt.new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-purple-300 hover:text-purple-200 underline"
          >
            Open Bolt.new →
          </a>
        </div>
      )}
      {status === 'error' && (
        <p className="text-red-400 text-xs">{errorMsg}</p>
      )}
    </div>
  )
}
