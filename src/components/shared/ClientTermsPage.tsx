import LegalPage from './LegalPage'
import { getTermsOfService } from './legalContent'
import { useTemplate } from '../../context/TemplateContext'

export default function ClientTermsPage() {
  const { businessName } = useTemplate()
  return (
    <LegalPage title="Terms of Service" lastUpdated="April 2026">
      {getTermsOfService(businessName || 'Our Company')}
    </LegalPage>
  )
}
