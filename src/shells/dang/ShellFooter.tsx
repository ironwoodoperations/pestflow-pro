import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, X } from "lucide-react";
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
            <Facebook className="w-6 h-6" />
          </a>
          <a href="https://instagram.com/dangpestcontrol" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-all hover:brightness-110" style={{ backgroundColor: 'hsl(28, 100%, 50%)' }}>
            <Instagram className="w-6 h-6" />
          </a>
          <a href="https://www.linkedin.com/company/dangpestcontrol/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-all hover:brightness-110" style={{ backgroundColor: 'hsl(28, 100%, 50%)' }}>
            <Linkedin className="w-6 h-6" />
          </a>
          <a href="https://x.com/dangpestcontrol" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-all hover:brightness-110" style={{ backgroundColor: 'hsl(28, 100%, 50%)' }}>
            <X className="w-6 h-6" />
          </a>
        </div>

        <div className="mt-8 pt-6 text-center text-xs border-t border-gray-100" style={{ color: 'hsl(20, 10%, 55%)' }}>
          © {new Date().getFullYear()} Dang Pest Control. All rights reserved.
          <span className="mx-2">·</span>
          <Link to="/accessibility" className="hover:text-primary transition-colors" style={{ color: 'hsl(20, 10%, 55%)' }}>Accessibility</Link>
          <a href="https://dang.pestflowpro.com/admin/login" style={{color: 'inherit', opacity: 0.5, fontSize: '11px', marginLeft: '8px'}}>©</a>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);
