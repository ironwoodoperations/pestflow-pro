import { Link } from 'react-router-dom'
import { ChevronDown, Phone } from 'lucide-react'
import { pestLinks, termiteLinks, aboutLinks } from './DangNavData'

interface Props {
  openDropdown: string | null
  setOpenDropdown: (v: string | null) => void
  setMobileOpen: (v: boolean) => void
}

export default function DangMobileMenu({ openDropdown, setOpenDropdown, setMobileOpen }: Props) {
  const close = () => setMobileOpen(false)
  return (
    <div className="md:hidden bg-white border-b border-yellow-200 px-4 pb-4 mx-4 rounded-b-2xl shadow-lg overflow-y-auto max-h-screen">
      <button
        className="w-full text-left py-2 text-sm font-bold flex justify-between"
        onClick={() => setOpenDropdown(openDropdown === 'pests' ? null : 'pests')}
      >
        Pests <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'pests' ? 'rotate-180' : ''}`} />
      </button>
      {openDropdown === 'pests' && (
        <div className="pl-4">
          {pestLinks.map((l) => (
            <Link key={l.href} to={l.href} className="block py-1.5 text-sm" style={{ color: 'hsl(20, 20%, 45%)' }} onClick={close}>{l.label}</Link>
          ))}
        </div>
      )}
      <Link to="/mosquito-control" className="block py-2 text-sm font-bold" onClick={close}>Mosquitos</Link>
      <Link to="/termite-inspections" className="block py-2 text-sm font-bold" onClick={close}>Termites</Link>
      <button
        className="w-full text-left py-2 text-sm font-bold flex justify-between"
        onClick={() => setOpenDropdown(openDropdown === 'about' ? null : 'about')}
      >
        About <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'about' ? 'rotate-180' : ''}`} />
      </button>
      {openDropdown === 'about' && (
        <div className="pl-4">
          {aboutLinks.map((l) => (
            <Link key={l.href} to={l.href} className="block py-1.5 text-sm" style={{ color: 'hsl(20, 20%, 45%)' }} onClick={close}>{l.label}</Link>
          ))}
        </div>
      )}
      <Link to="/quote" className="block py-2 text-sm font-bold" style={{ color: 'hsl(28,100%,50%)' }} onClick={close}>Get Your Quote</Link>
      <a href="tel:9038710550" className="flex items-center gap-1.5 py-2 text-sm font-bold" style={{ color: 'hsl(28,100%,50%)' }}>
        <Phone className="w-4 h-4" /> (903) 871-0550
      </a>
    </div>
  )
}
