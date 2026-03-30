interface PageHelpBannerProps {
  tab: string
  title: string
  body: string
}

export default function PageHelpBanner({ title, body }: PageHelpBannerProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
      <h3 className="text-sm font-semibold text-blue-900 mb-2">{title}</h3>
      <p className="text-sm text-blue-800">{body}</p>
    </div>
  )
}
