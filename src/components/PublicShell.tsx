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
import YouPestNavbar from '../shells/youpest/ShellNavbar'
import YouPestFooter from '../shells/youpest/ShellFooter'
import ModernProSections from '../shells/modern-pro/ShellHomeSections'
import BoldLocalSections from '../shells/bold-local/ShellHomeSections'
import CleanFriendlySections from '../shells/clean-friendly/ShellHomeSections'
import RusticRuggedSections from '../shells/rustic-rugged/ShellHomeSections'
import YouPestSections from '../shells/youpest/ShellHomeSections'

export function useShellSections(): React.ComponentType {
  const { template } = useTemplate()
  switch (template) {
    case 'bold-local': return BoldLocalSections
    case 'clean-friendly': return CleanFriendlySections
    case 'rustic-rugged': return RusticRuggedSections
    case 'youpest': return YouPestSections
    default: return ModernProSections
  }
}

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
    case 'youpest':
      NavbarComp = YouPestNavbar
      FooterComp = YouPestFooter
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
