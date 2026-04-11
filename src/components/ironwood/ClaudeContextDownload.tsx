import { useState } from 'react'

interface Props {
  prospectId: string
  slug: string | null
  websiteUrl: string | null
}

interface Extracted {
  business_name?: string
  tone?: string
  primary_color_guess?: string
  services?: { name: string }[]
  team_members?: { name: string }[]
  service_areas?: string[]
  testimonials?: { text: string }[]
}

interface FetchResult {
  brief: string
  prompt: string
  extracted: Extracted
}

type Status = 'idle' | 'loading' | 'ready' | 'error'

function dlFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function ClaudeContextDownload({ prospectId, slug, websiteUrl }: Props) {
  const [status,   setStatus]   = useState<Status>('idle')
  const [result,   setResult]   = useState<FetchResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const clientSlug = slug || 'client'

  async function generate() {
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/package-claude-context`,
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
      if (data.error) { setStatus('error'); setErrorMsg(data.error); return }
      setResult(data)
      setStatus('ready')
    } catch (e: any) {
      setStatus('error')
      setErrorMsg(e.message || 'Network error')
    }
  }

  if (!websiteUrl) {
    return (
      <p className="text-xs text-gray-500 italic">
        Run Firecrawl scrape first to generate build files.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {(status === 'idle' || status === 'error') && (
        <div className="space-y-2">
          <button onClick={generate}
            className="px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition">
            ⚡ Generate Build Files
          </button>
          {status === 'error' && (
            <p className="text-xs text-red-400">{errorMsg}</p>
          )}
        </div>
      )}

      {status === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-3 h-3 border border-gray-600 border-t-violet-400 rounded-full animate-spin" />
          Extracting with Claude…
        </div>
      )}

      {status === 'ready' && result && (
        <div className="space-y-3">
          {/* Extraction summary */}
          <div className="p-3 bg-gray-800/60 border border-violet-800/40 rounded-lg text-xs space-y-1">
            <p className="text-violet-300 font-medium mb-2">✓ Extracted successfully</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <p className="text-gray-400">Business: <span className="text-white">{result.extracted.business_name || '—'}</span></p>
              <p className="text-gray-400">Tone: <span className="text-white">{result.extracted.tone || '—'}</span></p>
              <p className="text-gray-400">Services: <span className="text-white">{result.extracted.services?.length ?? 0}</span></p>
              <p className="text-gray-400">Service areas: <span className="text-white">{result.extracted.service_areas?.length ?? 0}</span></p>
              <p className="text-gray-400">Team members: <span className="text-white">{result.extracted.team_members?.length ?? 0}</span></p>
              <p className="text-gray-400">Testimonials: <span className="text-white">{result.extracted.testimonials?.length ?? 0}</span></p>
            </div>
            {result.extracted.primary_color_guess && (
              <p className="text-gray-400 mt-1">
                Primary color guess:{' '}
                <span className="font-mono" style={{ color: result.extracted.primary_color_guess }}>
                  {result.extracted.primary_color_guess}
                </span>
                {' '}
                <span className="inline-block w-3 h-3 rounded-sm border border-gray-600 align-middle ml-1"
                  style={{ background: result.extracted.primary_color_guess }} />
              </p>
            )}
          </div>

          {/* Download buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => dlFile(result.brief, `${clientSlug}-CLIENT_BRIEF.md`)}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition">
              📄 Download Client Brief
            </button>
            <button onClick={() => dlFile(result.prompt, `${clientSlug}-BUILD_PROMPT.txt`)}
              className="px-3 py-1.5 bg-violet-700 hover:bg-violet-600 text-white text-xs font-medium rounded-lg transition">
              ⚡ Download Build Prompt
            </button>
            <button onClick={generate}
              className="text-xs text-gray-600 hover:text-gray-400 underline">
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
