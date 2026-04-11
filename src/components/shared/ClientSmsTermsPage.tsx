import LegalPage from './LegalPage'
import { getSmsTerms } from './legalContent'
import { useTemplate } from '../../context/TemplateContext'

export default function ClientSmsTermsPage() {
  const { businessName } = useTemplate()
  return (
    <LegalPage title="SMS Terms & Conditions" lastUpdated="April 2026">
      {getSmsTerms(businessName || 'Our Company')}
    </LegalPage>
  )
}
