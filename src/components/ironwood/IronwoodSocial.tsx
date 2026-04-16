// IronwoodSocial — social media posting for PestFlow Pro's own accounts.
// Reuses the existing SocialTab component pointed at the demo tenant
// (9215b06b-3eb5-49a1-a16e-7ff214bf6783 / slug: pestflow-pro).
// SocialTab reads VITE_TENANT_ID which resolves to the demo tenant on the
// main pestflowpro.com domain, so no prop drilling is needed.

import SocialTab from '../admin/SocialTab'

export default function IronwoodSocial() {
  return (
    <div className="p-6 bg-white min-h-full">
      <div className="max-w-5xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">PestFlow Pro — Social Media</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Post to PestFlow Pro's own social accounts (demo tenant).
          </p>
        </div>
        <SocialTab />
      </div>
    </div>
  )
}
