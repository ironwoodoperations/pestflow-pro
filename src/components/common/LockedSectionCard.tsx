import { Lock } from 'lucide-react'

interface Props {
  title: string
  bodyText: string
  mailtoSubject: string
}

export default function LockedSectionCard({ title, bodyText, mailtoSubject }: Props) {
  const href = `mailto:support@pestflowpro.ai?subject=${encodeURIComponent(mailtoSubject)}`
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-10 text-center">
      <Lock className="w-8 h-8 text-amber-500 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{bodyText}</p>
      <a
        href={href}
        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
      >
        Upgrade to unlock →
      </a>
    </div>
  )
}
