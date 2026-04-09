import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Phone, Menu, X, ChevronDown } from "lucide-react";
import dangLogo from "./assets/dang-logo.png";
import DangMobileMenu from "./DangMobileMenu";

const pestLinks = [
  { label: "General Pest Control", href: "/pest-control" },
  { label: "Ant Control", href: "/ant-control" },
  { label: "Spider Control", href: "/spider-control" },
  { label: "Roach Control", href: "/roach-control" },
  { label: "Scorpion Control", href: "/scorpion-control" },
  { label: "Wasp & Hornet Control", href: "/wasp-hornet-control" },
  { label: "Rodent Control", href: "/rodent-control" },
  { label: "Flea & Tick Control", href: "/flea-tick-control" },
  { label: "Bed Bug Control", href: "/bed-bug-control" },
  { label: "View All", href: "/pest-control" },
];

const termiteLinks = [
  { label: "Termite Inspections", href: "/termite-inspections" },
  { label: "Termite Control", href: "/termite-control" },
];

const aboutLinks = [
  { label: "About Us", href: "/about" },
  { label: "Service Area", href: "/service-area" },
  { label: "Customer Reviews", href: "/reviews" },
  { label: "Blog", href: "/blog" },
  { label: "Frequently Asked Questions", href: "/faq" },
  { label: "Contact Us", href: "/contact" },
];

interface DesktopNavLinksProps {
  openDropdown: string | null;
  onEnter: (name: string) => void;
  onLeave: () => void;
}

const DesktopNavLinks = ({ openDropdown, onEnter, onLeave }: DesktopNavLinksProps) => (
  <div className="hidden md:flex items-center gap-2">
    {[
      { name: "pests", label: "Pests", links: pestLinks },
      { name: "termites", label: "Termites", links: termiteLinks },
      { name: "about", label: "About", links: aboutLinks },
    ].map(({ name, label, links }) => (
      <div key={name} className="relative" onMouseEnter={() => onEnter(name)} onMouseLeave={onLeave}>
        <button className="navbar-link flex items-center gap-1">{label} <ChevronDown className="w-3.5 h-3.5" /></button>
        {openDropdown === name && (
          <div className="navbar-dropdown">
            {links.map((l) => <Link key={l.href} to={l.href} className="navbar-dropdown-item">{l.label}</Link>)}
          </div>
        )}
      </div>
    ))}
    <Link to="/mosquito-control" className="navbar-link">Mosquitos</Link>
  </div>
);

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  // ✅ FIX: ref to hold the close timer so we can cancel it on re-enter
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => { setScrolled(window.scrollY > 80); };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ FIX: open immediately, cancel any pending close
  const handleMouseEnter = (name: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenDropdown(name);
  };

  // ✅ FIX: delay close by 150ms so cursor has time to reach the dropdown
  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => { setOpenDropdown(null); }, 150);
  };

  return (
    <>
      {/* Sticky scrolled navbar */}
      <header className={`fixed top-0 left-0 right-0 z-[100] bg-white shadow-sm transition-all duration-300 ${scrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`} style={{ paddingTop: '8px', paddingBottom: '8px' }}>
        <div className="mx-auto max-w-[1100px] px-4">
          <div className="flex items-center justify-between px-6 md:px-8 py-3.5 relative">
            <DesktopNavLinks openDropdown={openDropdown} onEnter={handleMouseEnter} onLeave={handleMouseLeave} />
            <Link to="/" aria-label="Dang Pest Control home" className="hidden md:block absolute left-1/2 -translate-x-1/2">
              <img src={dangLogo} alt="Dang Pest Control" width={96} height={68} className="w-24 h-auto drop-shadow-md" />
            </Link>
            <Link to="/" aria-label="Dang Pest Control home" className="md:hidden">
              <img src={dangLogo} alt="Dang Pest Control" width={48} height={34} className="w-12 h-auto" />
            </Link>
            <div className="hidden md:flex items-center gap-5">
              <a href="tel:9038710550" className="flex items-center gap-2 font-bold" style={{ color: '#000000' }}>
                <Phone className="w-6 h-6" style={{ color: '#000000' }} />
                <div className="leading-tight">
                  <div className="text-xs font-black">Call us</div>
                  <div className="text-sm font-black">(903) 871-0550</div>
                </div>
              </a>
              <Link to="/quote" className="inline-flex items-center justify-center font-bold transition-all duration-200"
                style={{ backgroundColor: 'white', color: '#1a1a1a', border: '2px solid white', borderRadius: '999px', padding: '10px 32px', fontSize: '15px' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'hsl(48, 100%, 50%)'; e.currentTarget.style.borderColor = 'hsl(48, 100%, 50%)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = 'white'; }}
              >Get Your Quote</Link>
            </div>
            <button className="md:hidden" aria-label={mobileOpen ? "Close menu" : "Open menu"} onClick={() => setMobileOpen(!mobileOpen)} style={{ color: 'hsl(20, 40%, 12%)' }}>
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero navbar - yellow pill with logo floating above */}
      <header className="hero-bg relative z-50" style={{ paddingTop: 'clamp(48px, 8vw, 56px)', paddingBottom: '0' }}>
        <div className="mx-auto max-w-[1400px] px-4">
          <nav className="navbar-pill flex items-center justify-between px-6 md:px-10 py-4 relative">
            {/* Left nav */}
            <DesktopNavLinks openDropdown={openDropdown} onEnter={handleMouseEnter} onLeave={handleMouseLeave} />

            {/* Logo — centered, floating above pill */}
            <Link to="/" aria-label="Dang Pest Control home" className="hidden md:block absolute left-1/2 -translate-x-1/2 z-10" style={{ top: '-60px' }}>
              <img src={dangLogo} alt="Dang Pest Control" width={267} height={189} style={{ width: '267px' }} className="h-auto drop-shadow-lg" />
            </Link>

            {/* Right: phone + CTA */}
            <div className="hidden md:flex items-center gap-5">
              <a href="tel:9038710550" className="flex items-center gap-2 font-bold" style={{ color: '#000000' }}>
                <Phone className="w-6 h-6" style={{ color: '#000000' }} />
                <div className="leading-tight">
                  <div className="text-xs font-black">Call us</div>
                  <div className="text-sm font-black">(903) 871-0550</div>
                </div>
              </a>
              <Link to="/quote" className="font-bold transition-all duration-200"
                style={{ backgroundColor: 'hsl(185, 65%, 42%)', color: 'white', border: '2px solid hsl(185, 65%, 42%)', borderRadius: '146px', padding: '10px 28px', fontSize: '15px' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'hsl(28, 100%, 50%)'; e.currentTarget.style.borderColor = 'hsl(28, 100%, 50%)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'hsl(185, 65%, 42%)'; e.currentTarget.style.borderColor = 'hsl(185, 65%, 42%)'; e.currentTarget.style.color = 'white'; }}
              >Get Your Quote</Link>
            </div>

            {/* Mobile */}
            <Link to="/" aria-label="Dang Pest Control home" className="md:hidden">
              <img src={dangLogo} alt="Dang Pest Control" width={48} height={34} className="w-12 h-auto" />
            </Link>
            <button className="md:hidden" aria-label={mobileOpen ? "Close menu" : "Open menu"} onClick={() => setMobileOpen(!mobileOpen)} style={{ color: 'hsl(20, 40%, 12%)' }}>
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </nav>
        </div>

        <DangMobileMenu
          mobileOpen={mobileOpen}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          setMobileOpen={setMobileOpen}
          pestLinks={pestLinks}
          aboutLinks={aboutLinks}
        />
      </header>
    </>
  );
};

export default React.memo(Navbar);
