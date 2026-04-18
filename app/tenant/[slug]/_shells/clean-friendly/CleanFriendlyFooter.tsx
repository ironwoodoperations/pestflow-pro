import Link from 'next/link';
import { Globe } from 'lucide-react';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

const FbIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
const IgIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>;
const YtIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>;

const QUICK_LINKS = [
  { label: 'Home', href: '/' }, { label: 'Services', href: '/pest-control' },
  { label: 'About', href: '/about' }, { label: 'Blog', href: '/blog' },
  { label: 'Reviews', href: '/reviews' }, { label: 'Contact', href: '/contact' },
  { label: 'Get a Quote', href: '/quote' }, { label: 'Service Area', href: '/service-area' },
];

interface Social { facebook?: string; instagram?: string; google?: string; youtube?: string }

interface Props {
  tenant: Tenant;
  social?: Social;
}

export function CleanFriendlyFooter({ tenant, social = {} }: Props) {
  const name = tenant.business_name || tenant.name;
  const phone = tenant.phone ?? '';

  return (
    <footer style={{ backgroundColor: 'var(--color-footer-bg)', color: 'var(--color-footer-text)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            {tenant.logo_url && (
              <img src={tenant.logo_url} alt={`${name} logo`} className="h-10 w-auto object-contain mb-3 brightness-200"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
            <h3 className="font-raleway text-xl mb-3 text-white font-bold">{name}</h3>
            {tenant.tagline && <p className="mb-2 text-sm text-white/70">{tenant.tagline}</p>}
            {phone && <p className="mb-1"><a href={`tel:${phone.replace(/\D/g, '')}`} className="hover:text-white transition">{formatPhone(phone)}</a></p>}
            {tenant.license_number && <p className="text-sm text-white/60">License #{tenant.license_number}</p>}
            {(social.facebook || social.instagram || social.google || social.youtube) && (
              <div className="flex gap-3 mt-3">
                {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-white/60 hover:text-white transition"><FbIcon /></a>}
                {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white/60 hover:text-white transition"><IgIcon /></a>}
                {social.google && <a href={social.google} target="_blank" rel="noopener noreferrer" aria-label="Google Business" className="text-white/60 hover:text-white transition"><Globe className="w-5 h-5" /></a>}
                {social.youtube && <a href={social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-white/60 hover:text-white transition"><YtIcon /></a>}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-raleway text-lg mb-3 text-white font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="font-raleway hover:text-white transition">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-raleway text-lg mb-3 text-white font-semibold">Contact Us</h3>
            <ul className="space-y-2 font-raleway">
              {tenant.address && <li>{tenant.address}</li>}
              {phone && <li><a href={`tel:${phone.replace(/\D/g, '')}`} className="hover:text-white transition">{formatPhone(phone)}</a></li>}
              {tenant.email && <li><a href={`mailto:${tenant.email}`} className="hover:text-white transition">{tenant.email}</a></li>}
              {tenant.hours && <li>{tenant.hours}</li>}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-white/60">
          <span className="font-raleway">&copy; {new Date().getFullYear()} {name}. All rights reserved.</span>
          <div className="flex items-center gap-3 font-raleway text-xs text-white/50">
            <Link href="/privacy" className="hover:text-white/80 transition">Privacy Policy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-white/80 transition">Terms of Service</Link>
            <span>·</span>
            <Link href="/sms-terms" className="hover:text-white/80 transition">SMS Terms</Link>
          </div>
          <a href="https://pestflowpro.com" target="_blank" rel="noopener noreferrer" className="font-raleway text-xs text-orange-400 hover:text-orange-300 transition">Powered by PestFlow Pro</a>
        </div>
      </div>
    </footer>
  );
}
