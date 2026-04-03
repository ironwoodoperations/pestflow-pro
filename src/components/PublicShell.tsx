import type { ReactNode } from 'react'
import { useTemplate } from '../context/TemplateContext'
import HolidayBanner from './HolidayBanner'
import Navbar from './Navbar'
import Footer from './Footer'
import ModernProNavbar from '../shells/modern-pro/ShellNavbar'
import ModernProFooter from '../shells/modern-pro/ShellFooter'
import BoldLocalNavbar from '../shells/bold-local/ShellNavbar'
import BoldLocalFooter from '../shells/bold-local/ShellFooter'

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
    default:
      // clean-friendly and rustic-rugged fall back to base components for now
      NavbarComp = Navbar
      FooterComp = Footer
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
