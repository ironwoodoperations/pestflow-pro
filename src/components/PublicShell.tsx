import type { ReactNode } from 'react'
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

interface Props {
  children: ReactNode
}

export default function PublicShell({ children }: Props) {
  const { template } = useTemplate()

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
    default:
      NavbarComp = ModernProNavbar
      FooterComp = ModernProFooter
  }

  return (
    <>
      <HolidayBanner />
      <NavbarComp />
      <main id="main-content">{children}</main>
      <FooterComp />
    </>
  )
}
