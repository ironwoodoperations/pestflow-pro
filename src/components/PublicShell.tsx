import type { ReactNode } from 'react'
import { lazy, Suspense } from 'react'
import { useTemplate } from '../context/TemplateContext'
import HolidayBanner from './HolidayBanner'
import ModernProNavbar from '../shells/modern-pro/ShellNavbar'
import ModernProFooter from '../shells/modern-pro/ShellFooter'
import BoldLocalNavbar from '../shells/bold-local/ShellNavbar'
import BoldLocalFooter from '../shells/bold-local/ShellFooter'
import CleanFriendlyNavbar from '../shells/clean-friendly/ShellNavbar'
import CleanFriendlyFooter from '../shells/clean-friendly/ShellFooter'
import RusticRuggedNavbar from '../shells/rustic-rugged/ShellNavbar'
import RusticRuggedFooter from '../shells/rustic-rugged/ShellFooter'
import YouPestNavbar from '../shells/youpest/ShellNavbar'
import YouPestFooter from '../shells/youpest/ShellFooter'
import ModernProSections from '../shells/modern-pro/ShellHomeSections'
import BoldLocalSections from '../shells/bold-local/ShellHomeSections'
import CleanFriendlySections from '../shells/clean-friendly/ShellHomeSections'
import RusticRuggedSections from '../shells/rustic-rugged/ShellHomeSections'
import YouPestSections from '../shells/youpest/ShellHomeSections'

// Dang shell — lazy to reduce main bundle
const DangNavbar  = lazy(() => import('../shells/dang/ShellNavbar'))
const DangFooter  = lazy(() => import('../shells/dang/ShellFooter'))
const DangSections = lazy(() => import('../shells/dang/ShellHomeSections'))

export function ShellSectionsRenderer() {
  const { template } = useTemplate()
  switch (template) {
    case 'bold-local': return <BoldLocalSections />
    case 'clean-friendly': return <CleanFriendlySections />
    case 'rustic-rugged': return <RusticRuggedSections />
    case 'youpest': return <YouPestSections />
    case 'dang': return <Suspense fallback={null}><DangSections /></Suspense>
    default: return <ModernProSections />
  }
}

interface Props {
  children: ReactNode
}

export default function PublicShell({ children }: Props) {
  const { template, loading } = useTemplate()

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-bg-hero)' }}
      >
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  let NavbarComp: React.ComponentType
  let FooterComp: React.ComponentType

  switch (template) {
    case 'modern-pro':
      NavbarComp = ModernProNavbar
      FooterComp = ModernProFooter
      break
    case 'bold-local':
      NavbarComp = BoldLocalNavbar
      FooterComp = BoldLocalFooter
      break
    case 'clean-friendly':
      NavbarComp = CleanFriendlyNavbar
      FooterComp = CleanFriendlyFooter
      break
    case 'rustic-rugged':
      NavbarComp = RusticRuggedNavbar
      FooterComp = RusticRuggedFooter
      break
    case 'youpest':
      NavbarComp = YouPestNavbar
      FooterComp = YouPestFooter
      break
    case 'dang':
      NavbarComp = DangNavbar
      FooterComp = DangFooter
      break
    default:
      NavbarComp = ModernProNavbar
      FooterComp = ModernProFooter
  }

  return (
    <>
      <HolidayBanner />
      <Suspense fallback={null}><NavbarComp /></Suspense>
      <main id="main-content">{children}</main>
      <Suspense fallback={null}><FooterComp /></Suspense>
    </>
  )
}
