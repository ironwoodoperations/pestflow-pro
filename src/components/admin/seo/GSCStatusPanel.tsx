import { CheckCircle, Ban, ExternalLink } from 'lucide-react'

interface Props {
  gscUrl: string | null
}

export default function GSCStatusPanel({ gscUrl }: Props) {
  if (gscUrl) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-800">Google Search Console Connected</p>
          <p className="text-xs text-green-700 mt-0.5 truncate">Property: {gscUrl}</p>
          <a
            href={gscUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-green-700 hover:text-green-900 transition-colors"
          >
            Open GSC <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex items-start gap-3">
      <Ban className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-gray-700">Google Search Console Not Connected</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Connect it in the SEO &rarr; Connect tab to unlock search performance data.
        </p>
      </div>
    </div>
  )
}
