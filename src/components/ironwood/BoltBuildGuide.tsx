import { useState } from 'react'

interface Props {
  slug?: string
}

const STEPS = [
  'Run the scraper on this prospect',
  'Click Export for Bolt — downloads [client]-bolt-context.md',
  'Open bolt.new in a new tab',
  'Start new project — upload the .md file into Bolt chat',
  'Prompt: "Build a pest control website matching this context file. React + TypeScript + Tailwind. Connect to Supabase."',
  'Iterate until 90% match (usually 2–3 rounds)',
  'In Bolt: connect Supabase project biezzykcgzkrwdgqpsar',
  (slug?: string) => `Export to GitHub under ironwoodoperations/${slug || '[client-slug]'}`,
  (slug?: string) => `Deploy to Vercel at ${slug || '[slug]'}.pestflowpro.com`,
  'Return here and mark prospect as Provisioned',
]

export default function BoltBuildGuide({ slug }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-purple-800/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-purple-950/40 text-left"
      >
        <span className="text-sm font-semibold text-purple-300">📦 Custom Bolt Build — Step by Step</span>
        <span className="text-purple-500 text-xs">{open ? '▲ Hide' : '▼ Show'}</span>
      </button>
      {open && (
        <ol className="px-4 py-3 space-y-2 bg-gray-900/60">
          {STEPS.map((step, i) => (
            <li key={i} className="flex gap-2.5 text-xs text-gray-300">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-800/60 text-purple-300
                               text-xs flex items-center justify-center font-bold">{i + 1}</span>
              <span>{typeof step === 'function' ? step(slug) : step}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
