interface Props { slug: string | null }

export default function FullCustomBuildGuide({ slug }: Props) {
  const siteUrl = `${slug || '[slug]'}.pestflowpro.ai`

  return (
    <div className="border border-violet-800/40 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-violet-950/40 border-b border-violet-800/30">
        <span className="text-xs font-semibold text-violet-300">⚡ How to run this build</span>
      </div>
      <ol className="px-4 py-3 space-y-2.5 bg-gray-900/30 text-xs text-gray-300">
        <li className="flex gap-2.5">
          <span className="flex-shrink-0 w-4 text-violet-500 font-bold">1.</span>
          Generate and download <span className="text-white font-mono">BUILD_PROMPT.txt</span> above
        </li>
        <li className="flex gap-2.5">
          <span className="flex-shrink-0 w-4 text-violet-500 font-bold">2.</span>
          Open Codespaces terminal in the <span className="text-white font-mono">pestflow-pro</span> repo
        </li>
        <li className="flex flex-col gap-1.5">
          <div className="flex gap-2.5">
            <span className="flex-shrink-0 w-4 text-violet-500 font-bold">3.</span>
            Run:
          </div>
          <pre className="ml-6 px-3 py-2 bg-gray-950 border border-gray-800 rounded text-violet-300 font-mono leading-relaxed overflow-x-auto">
            {`claude --dangerously-skip-permissions \\\n  < BUILD_PROMPT.txt`}
          </pre>
        </li>
        <li className="flex gap-2.5">
          <span className="flex-shrink-0 w-4 text-violet-500 font-bold">4.</span>
          Wait for completion (~5 min)
        </li>
        <li className="flex gap-2.5">
          <span className="flex-shrink-0 w-4 text-violet-500 font-bold">5.</span>
          Verify build at{' '}
          <a href={`https://${siteUrl}`} target="_blank" rel="noopener noreferrer"
            className="text-emerald-400 hover:underline font-mono">
            {siteUrl} ↗
          </a>
        </li>
        <li className="flex gap-2.5">
          <span className="flex-shrink-0 w-4 text-violet-500 font-bold">6.</span>
          Advance to QA in pipeline
        </li>
      </ol>
    </div>
  )
}
