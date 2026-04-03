import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { seedDemoData } from '../../../lib/demoSeed'

interface Props {
  tenantId: string
  onSeeded: () => void
}

export default function DemoControls({ tenantId, onSeeded }: Props) {
  const [seeding, setSeeding] = useState(false)

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await seedDemoData(tenantId, supabase)
      onSeeded()
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="mb-6 bg-white rounded-xl shadow-sm border border-dashed border-slate-300 p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-700">Load Demo Data</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Populate leads, blog posts, social posts, and testimonials with realistic demo content.
        </p>
      </div>
      <button
        onClick={handleSeed}
        disabled={seeding}
        className="ml-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition"
      >
        {seeding && (
          <svg className="w-4 h-4 animate-spin text-slate-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {seeding ? 'Loading...' : 'Load Demo Data'}
      </button>
    </div>
  )
}
