import PageHelpBanner from '../PageHelpBanner'
import ClientSetupWizard from './ClientSetupWizard'

export default function ClientSetupPage() {
  return (
    <div>
      <PageHelpBanner
        tab="client-setup"
        title="Client Setup"
        body="Use this wizard during onboarding calls to collect client info and generate their setup file."
      />
      <ClientSetupWizard />
    </div>
  )
}
