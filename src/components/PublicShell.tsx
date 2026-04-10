import type { ReactNode } from 'react'
import { lazy, Suspense } from 'react'
import { useTemplate } from '../context/TemplateContext'
import HolidayBanner from './HolidayBanner'
import ModernProNavbar from '../shells/modern-pro/ShellNavbar'
import ModernProFooter from '../shells/modern-pro/ShellFooter'
import ModernProSections from '../shells/modern-pro/ShellHomeSections'

// Non-default shells — lazy to reduce main bundle
const BoldLocalNavbar      = lazy(() => import('../shells/bold-local/ShellNavbar'))
const BoldLocalFooter      = lazy(() => import('../shells/bold-local/ShellFooter'))
const BoldLocalSections    = lazy(() => import('../shells/bold-local/ShellHomeSections'))
const CleanFriendlyNavbar  = lazy(() => import('../shells/clean-friendly/ShellNavbar'))
const CleanFriendlyFooter  = lazy(() => import('../shells/clean-friendly/ShellFooter'))
const CleanFriendlySections = lazy(() => import('../shells/clean-friendly/ShellHomeSections'))
const RusticRuggedNavbar   = lazy(() => import('../shells/rustic-rugged/ShellNavbar'))
const RusticRuggedFooter   = lazy(() => import('../shells/rustic-rugged/ShellFooter'))
const RusticRuggedSections = lazy(() => import('../shells/rustic-rugged/ShellHomeSections'))
const YouPestNavbar        = lazy(() => import('../shells/youpest/ShellNavbar'))
const YouPestFooter        = lazy(() => import('../shells/youpest/ShellFooter'))
const YouPestSections      = lazy(() => import('../shells/youpest/ShellHomeSections'))
const DangNavbar           = lazy(() => import('../shells/dang/ShellNavbar'))
const DangFooter           = lazy(() => import('../shells/dang/ShellFooter'))
const DangSections         = lazy(() => import('../shells/dang/ShellHomeSections'))

export function ShellSectionsRenderer() {
  const { template } = useTemplate()
  switch (template) {
    case 'bold-local':    return <Suspense fallback={null}><BoldLocalSections /></Suspense>
    case 'clean-friendly': return <Suspense fallback={null}><CleanFriendlySections /></Suspense>
    case 'rustic-rugged': return <Suspense fallback={null}><RusticRuggedSections /></Suspense>
    case 'youpest':       return <Suspense fallback={null}><YouPestSections /></Suspense>
    case 'dang':          return <Suspense fallback={null}><DangSections /></Suspense>
    default:              return <ModernProSections />
  }
}

interface Props {
  children: ReactNode
}

function ShellNav() {
  const { template } = useTemplate()
  switch (template) {
    case 'bold-local':    return <Suspense fallback={null}><BoldLocalNavbar /></Suspense>
    case 'clean-friendly': return <Suspense fallback={null}><CleanFriendlyNavbar /></Suspense>
    case 'rustic-rugged': return <Suspense fallback={null}><RusticRuggedNavbar /></Suspense>
    case 'youpest':       return <Suspense fallback={null}><YouPestNavbar /></Suspense>
    case 'dang':          return <Suspense fallback={null}><DangNavbar /></Suspense>
    default:              return <ModernProNavbar />
  }
}

function ShellFooterComp() {
  const { template } = useTemplate()
  switch (template) {
    case 'bold-local':    return <Suspense fallback={null}><BoldLocalFooter /></Suspense>
    case 'clean-friendly': return <Suspense fallback={null}><CleanFriendlyFooter /></Suspense>
    case 'rustic-rugged': return <Suspense fallback={null}><RusticRuggedFooter /></Suspense>
    case 'youpest':       return <Suspense fallback={null}><YouPestFooter /></Suspense>
    case 'dang':          return <Suspense fallback={null}><DangFooter /></Suspense>
    default:              return <ModernProFooter />
  }
}

export default function PublicShell({ children }: Props) {
  const { loading } = useTemplate()

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

  return (
    <>
      <HolidayBanner />
      <ShellNav />
      <main id="main-content">{children}</main>
      <ShellFooterComp />
    </>
  )
}
