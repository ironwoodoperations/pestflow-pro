import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Phone, Menu, X, ChevronDown } from 'lucide-react'
import dangLogo from './assets/dang-logo.png'
import { pestLinks, termiteLinks, aboutLinks } from './DangNavData'
import DangMobileMenu from './DangMobileMenu'

const ORANGE = 'hsl(28, 100%, 50%)'
const TEAL = 'hsl(185, 65%, 42%)'
const DARK = 'hsl(20, 40%, 12%)'

function NavDropdown({ name, label, links, openDropdown, onEnter, onLeave }: {
  name: string; label: string; links: { label: string; href: string }[]
  openDropdown: string | null; onEnter: (n: string) => void; onLeave: () => void
}) {
  return (
    <div className="relative" onMouseEnter={() => onEnter(name)} onMouseLeave={onLeave}>
      <button className="navbar-link flex items-center gap-1">{label} <ChevronDown className="w-3.5 h-3.5" /></button>
      {openDropdown === name && (
        <div className="navbar-dropdown">
          {links.map((l) => <Link key={l.href} to={l.href} className="navbar-dropdown-item">{l.label}</Link>)}
        </div>
      )}
    </div>
  )
}

const ShellNavbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const onEnter = (name: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenDropdown(name)
  }
  const onLeave = () => {
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 150)
  }

  const phoneSection = (
    <a href="tel:9038710550" className="flex items-center gap-2 font-bold" style={{ color: DARK }}>
      <Phone className="w-6 h-6" style={{ color: DARK }} />
      <div className="leading-tight">
        <div className="text-xs font-black">Call us</div>
        <div className="text-sm font-black">(903) 871-0550</div>
      </div>
    </a>
  )

  return (
    <>
      {/* Sticky scrolled navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-[100] bg-white shadow-sm transition-all duration-300 ${scrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
        style={{ paddingTop: '8px', paddingBottom: '8px' }}
      >
        <div className="mx-auto max-w-[1100px] px-4">
          <div className="flex items-center justify-between px-6 md:px-8 py-3.5 relative">
            <div className="hidden md:flex items-center gap-2">
              <NavDropdown name="pests" label="Pests" links={pestLinks} openDropdown={openDropdown} onEnter={onEnter} onLeave={onLeave} />
              <Link to="/mosquito-control" className="navbar-link">Mosquitos</Link>
              <NavDropdown name="termites" label="Termites" links={termiteLinks} openDropdown={openDropdown} onEnter={onEnter} onLeave={onLeave} />
              <NavDropdown name="about" label="About" links={aboutLinks} openDropdown={openDropdown} onEnter={onEnter} onLeave={onLeave} />
            </div>
            <Link to="/" aria-label="Dang Pest Control home" className="hidden md:block absolute left-1/2 -translate-x-1/2">
              <img src={dangLogo} alt="Dang Pest Control" width={96} height={68} className="w-24 h-auto drop-shadow-md" />
            </Link>
            <Link to="/" aria-label="Dang Pest Control home" className="md:hidden">
              <img src={dangLogo} alt="Dang Pest Control" width={48} height={34} className="w-12 h-auto" />
            </Link>
            <div className="hidden md:flex items-center gap-5">
              {phoneSection}
              <Link to="/quote" className="inline-flex items-center justify-center font-bold transition-all duration-200"
                style={{ backgroundColor: 'white', color: DARK, border: '2px solid white', borderRadius: '999px', padding: '10px 32px', fontSize: '15px' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'hsl(48,100%,50%)'; e.currentTarget.style.borderColor = 'hsl(48,100%,50%)' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = 'white' }}
              >Get Your Quote</Link>
            </div>
            <button className="md:hidden" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} onClick={() => setMobileOpen(!mobileOpen)} style={{ color: DARK }}>
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero navbar */}
      <header className="relative z-50" style={{ backgroundColor: ORANGE, backgroundImage: "url('/hero-streaks.webp')", backgroundSize: 'cover', backgroundPosition: 'center', paddingTop: 'clamp(48px,8vw,56px)', paddingBottom: '0' }}>
        <div className="mx-auto max-w-[1400px] px-4">
          <nav className="navbar-pill flex items-center justify-between px-6 md:px-10 py-4 relative">
            <div className="hidden md:flex items-center gap-2">
              <NavDropdown name="pests" label="Pests" links={pestLinks} openDropdown={openDropdown} onEnter={onEnter} onLeave={onLeave} />
              <Link to="/mosquito-control" className="navbar-link">Mosquitos</Link>
              <NavDropdown name="termites" label="Termites" links={termiteLinks} openDropdown={openDropdown} onEnter={onEnter} onLeave={onLeave} />
              <NavDropdown name="about" label="About" links={aboutLinks} openDropdown={openDropdown} onEnter={onEnter} onLeave={onLeave} />
            </div>
            <Link to="/" aria-label="Dang Pest Control home" className="hidden md:block absolute left-1/2 -translate-x-1/2 z-10" style={{ top: '-60px' }}>
              <img src={dangLogo} alt="Dang Pest Control" width={267} height={189} style={{ width: '267px' }} className="h-auto drop-shadow-lg" />
            </Link>
            <div className="hidden md:flex items-center gap-5">
              {phoneSection}
              <Link to="/quote" className="font-bold transition-all duration-200"
                style={{ backgroundColor: TEAL, color: 'white', border: `2px solid ${TEAL}`, borderRadius: '146px', padding: '10px 28px', fontSize: '15px' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = ORANGE; e.currentTarget.style.borderColor = ORANGE }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = TEAL; e.currentTarget.style.borderColor = TEAL }}
              >Get Your Quote</Link>
            </div>
            <Link to="/" aria-label="Dang Pest Control home" className="md:hidden">
              <img src={dangLogo} alt="Dang Pest Control" width={48} height={34} className="w-12 h-auto" />
            </Link>
            <button className="md:hidden" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} onClick={() => setMobileOpen(!mobileOpen)} style={{ color: DARK }}>
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </nav>
        </div>
        {mobileOpen && <DangMobileMenu openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} setMobileOpen={setMobileOpen} />}
      </header>
    </>
  )
}

export default React.memo(ShellNavbar)
