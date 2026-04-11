import LegalPage from './LegalPage'
import { getPrivacyPolicy } from './legalContent'
import { useTemplate } from '../../context/TemplateContext'

export default function ClientPrivacyPage() {
  const { businessName } = useTemplate()
  return (
    <LegalPage title="Privacy Policy" lastUpdated="April 2026">
      {getPrivacyPolicy(businessName || 'Our Company')}
    </LegalPage>
  )
}
