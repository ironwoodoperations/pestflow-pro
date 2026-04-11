import React from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

const FacebookIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22 12a10 10 0 1 0-11.56 9.87V15.1H8.07v-3.1h2.37V9.78c0-2.34 1.4-3.63 3.53-3.63 1.02 0 2.09.18 2.09.18v2.3h-1.18c-1.16 0-1.52.72-1.52 1.46V12h2.59l-.41 3.1h-2.18v6.77A10 10 0 0 0 22 12z"/>
  </svg>
)

const InstagramIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
)

const LinkedinIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)
import dangLogo from "./assets/dang-logo.png";

const Footer = () => {
  return (
    <footer className="bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 items-start">

          <div className="md:pl-16 pr-8" style={{ borderRight: '1px solid #e5e5e5', paddingLeft: '16rem', paddingRight: '3rem' }}>
            <h3 className="font-bold text-base mb-6" style={{ color: '#000000' }}>Services</h3>
            <ul className="space-y-3">
              <li><Link to="/pest-control" className="text-sm font-bold transition-colors hover:text-primary whitespace-nowrap" style={{ color: '#000000' }}>Pest Control</Link></li>
              <li><Link to="/mosquito-control" className="text-sm font-bold transition-colors hover:text-primary whitespace-nowrap" style={{ color: '#000000' }}>Mosquitos</Link></li>
              <li><Link to="/termite-control" className="text-sm font-bold transition-colors hover:text-primary whitespace-nowrap" style={{ color: '#000000' }}>Termites</Link></li>
              <li><Link to="/quote" className="text-sm font-bold transition-colors hover:text-primary whitespace-nowrap" style={{ color: '#000000' }}>Get Your Quote</Link></li>
              <li><Link to="/contact" className="text-sm font-bold transition-colors hover:text-primary whitespace-nowrap" style={{ color: '#000000' }}>Contact Us</Link></li>
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

          <div className="md:text-right md:pr-16 pl-8" style={{ borderLeft: '1px solid #e5e5e5', paddingLeft: '3rem', paddingRight: '16rem' }}>
            <h3 className="font-bold text-base mb-6" style={{ color: '#000000' }}>About</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-sm font-bold transition-colors hover:text-primary whitespace-nowrap" style={{ color: '#000000' }}>About Us</Link></li>
              <li><Link to="/faq" className="text-sm font-bold transition-colors hover:text-primary whitespace-nowrap" style={{ color: '#000000' }}>FAQs</Link></li>
              <li><Link to="/blog" className="text-sm font-bold transition-colors hover:text-primary whitespace-nowrap" style={{ color: '#000000' }}>Blog</Link></li>
              <li><Link to="/service-area" className="text-sm font-bold transition-colors hover:text-primary whitespace-nowrap" style={{ color: '#000000' }}>Service Area</Link></li>
              <li><Link to="/reviews" className="text-sm font-bold transition-colors hover:text-primary whitespace-nowrap" style={{ color: '#000000' }}>Customer Reviews</Link></li>
            </ul>
          </div>

        </div>

        <div className="flex justify-center gap-4 mt-10">
          <a href="https://www.facebook.com/DangPestControl" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-all hover:brightness-110" style={{ backgroundColor: 'hsl(28, 100%, 50%)' }}>
            <FacebookIcon />
          </a>
          <a href="https://instagram.com/dangpestcontrol" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-all hover:brightness-110" style={{ backgroundColor: 'hsl(28, 100%, 50%)' }}>
            <InstagramIcon />
          </a>
          <a href="https://www.linkedin.com/company/dangpestcontrol/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-all hover:brightness-110" style={{ backgroundColor: 'hsl(28, 100%, 50%)' }}>
            <LinkedinIcon />
          </a>
          <a href="https://x.com/dangpestcontrol" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-all hover:brightness-110" style={{ backgroundColor: 'hsl(28, 100%, 50%)' }}>
            <X className="w-6 h-6" />
          </a>
        </div>

        <div className="mt-8 pt-6 text-center text-xs border-t border-gray-100" style={{ color: 'hsl(20, 10%, 55%)' }}>
          © {new Date().getFullYear()} Dang Pest Control. All rights reserved.
          <span className="mx-2">·</span>
          <Link to="/privacy" className="hover:text-primary transition-colors" style={{ color: 'hsl(20, 10%, 55%)' }}>Privacy Policy</Link>
          <span className="mx-2">·</span>
          <Link to="/terms" className="hover:text-primary transition-colors" style={{ color: 'hsl(20, 10%, 55%)' }}>Terms of Service</Link>
          <span className="mx-2">·</span>
          <Link to="/sms-terms" className="hover:text-primary transition-colors" style={{ color: 'hsl(20, 10%, 55%)' }}>SMS Terms</Link>
          <a href="https://dang.pestflowpro.com/admin/login" style={{color: 'inherit', opacity: 0.5, fontSize: '11px', marginLeft: '8px'}}>©</a>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);
