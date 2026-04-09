import React from 'react'
import { Link } from 'react-router-dom'
import dangLogo from './assets/dang-logo.png'

const ORANGE = 'hsl(28, 100%, 50%)'

const FbIcon = () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
const IgIcon = () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>
const LiIcon = () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
const XIcon = () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>

const ShellFooter = () => (
  <footer className="bg-white py-12">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 items-start">
        <div className="md:pl-16 pr-8" style={{ borderRight: '1px solid #e5e5e5', paddingLeft: '4rem', paddingRight: '3rem' }}>
          <h3 className="font-bold text-base mb-6" style={{ color: '#000' }}>Services</h3>
          <ul className="space-y-3">
            {[
              { to: '/pest-control', label: 'Pest Control' },
              { to: '/mosquito-control', label: 'Mosquitos' },
              { to: '/termite-control', label: 'Termites' },
              { to: '/quote', label: 'Get Your Quote' },
              { to: '/contact', label: 'Contact Us' },
            ].map(({ to, label }) => (
              <li key={to}><Link to={to} className="text-sm font-bold transition-colors hover:text-primary whitespace-nowrap" style={{ color: '#000' }}>{label}</Link></li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-center text-center gap-4">
          <Link to="/" aria-label="Dang Pest Control home">
            <img src={dangLogo} alt="Dang Pest Control" width={320} height={120} className="w-80 h-auto object-contain" />
          </Link>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'hsl(20, 20%, 40%)' }}>
            At Dang Pest Control, we know pest problems can seriously disrupt your life. That's why we offer a wide array of reliable pest control services tailored to meet your specific needs.
          </p>
        </div>
        <div className="md:text-right md:pr-16 pl-8" style={{ borderLeft: '1px solid #e5e5e5', paddingLeft: '3rem', paddingRight: '4rem' }}>
          <h3 className="font-bold text-base mb-6" style={{ color: '#000' }}>About</h3>
          <ul className="space-y-3">
            {[
              { to: '/about', label: 'About Us' },
              { to: '/faq', label: 'FAQs' },
              { to: '/blog', label: 'Blog' },
              { to: '/service-area', label: 'Service Area' },
              { to: '/reviews', label: 'Customer Reviews' },
            ].map(({ to, label }) => (
              <li key={to}><Link to={to} className="text-sm font-bold transition-colors hover:text-primary whitespace-nowrap" style={{ color: '#000' }}>{label}</Link></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex justify-center gap-4 mt-10">
        {[
          { href: 'https://www.facebook.com/DangPestControl', Icon: FbIcon, label: 'Facebook' },
          { href: 'https://instagram.com/dangpestcontrol', Icon: IgIcon, label: 'Instagram' },
          { href: 'https://www.linkedin.com/company/dangpestcontrol/', Icon: LiIcon, label: 'LinkedIn' },
          { href: 'https://x.com/dangpestcontrol', Icon: XIcon, label: 'X (Twitter)' },
        ].map(({ href, Icon, label }) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-all hover:brightness-110"
            style={{ backgroundColor: ORANGE }}>
            <Icon />
          </a>
        ))}
      </div>
      <div className="mt-8 pt-6 text-center text-xs border-t border-gray-100" style={{ color: 'hsl(20, 10%, 55%)' }}>
        © {new Date().getFullYear()} Dang Pest Control. All rights reserved.
        <span className="mx-2">·</span>
        <a href="https://pestflowpro.com" target="_blank" rel="noopener noreferrer"
          style={{ color: '#f97316', fontWeight: 600, marginLeft: '4px' }}>
          Powered by PestFlow Pro
        </a>
      </div>
    </div>
  </footer>
)

export default React.memo(ShellFooter)
