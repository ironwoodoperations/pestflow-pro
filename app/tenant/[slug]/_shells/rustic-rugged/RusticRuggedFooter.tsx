import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

const FbIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
const GIcon  = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;

interface Social { facebook?: string; google?: string }

interface Props {
  tenant: Tenant;
  social: Social | null;
}

export function RusticRuggedFooter({ tenant, social }: Props) {
  const businessName = tenant.business_name || tenant.name;
  const phone = tenant.phone || '';
  const email = (tenant as { email?: string }).email || '';
  const address = (tenant as { address?: string }).address || '';
  const tagline = tenant.tagline || '';
  const logoUrl = tenant.logo_url || '';
  const year = new Date().getFullYear();

  return (
    <footer style={{ backgroundColor: '#1a1a1a', borderTop: '3px solid var(--color-primary)', color: '#d1d5db' }}>
      <div className="max-w-6xl mx-auto px-4 py-10">
        {logoUrl && (
          <div className="flex justify-center mb-6">
            <img src={logoUrl} alt={businessName} style={{ height: '48px', objectFit: 'contain' }} />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center text-sm">
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl mb-1" aria-hidden="true">📱</span>
            {phone && <a href={`tel:${phone.replace(/\D/g, '')}`} className="font-bold text-white transition hover:opacity-80">{formatPhone(phone)}</a>}
            {email && <a href={`mailto:${email}`} className="transition hover:text-white">{email}</a>}
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl mb-1" aria-hidden="true">📍</span>
            {address ? <p>{address}</p> : <p className="text-gray-600">Address on file</p>}
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl mb-1" aria-hidden="true">🌐</span>
            <p className="text-white font-semibold">{businessName}</p>
            {tagline && <p className="text-xs text-gray-500 italic">{tagline}</p>}
          </div>
          <div className="flex flex-col items-center gap-3">
            <span className="text-2xl mb-1" aria-hidden="true">🔗</span>
            <div className="flex gap-3 justify-center">
              {social?.facebook && (
                <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white transition hover:opacity-80"
                  style={{ backgroundColor: '#1877f2' }}>
                  <FbIcon />
                </a>
              )}
              {social?.google && (
                <a href={social.google} target="_blank" rel="noopener noreferrer" aria-label="Google Business"
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-white transition hover:opacity-80">
                  <GIcon />
                </a>
              )}
              {!social?.facebook && !social?.google && <p className="text-gray-600 text-xs">Follow us online</p>}
            </div>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #333' }} className="py-3">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-600">
          <span>&copy; {year} {businessName}. All rights reserved.</span>
          <div className="flex items-center gap-3">
            <Link href="/privacy" className="hover:text-gray-400 transition">Privacy Policy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-gray-400 transition">Terms of Service</Link>
            <span>·</span>
            <Link href="/sms-terms" className="hover:text-gray-400 transition">SMS Terms</Link>
          </div>
          <a href="https://pestflowpro.com" target="_blank" rel="noopener noreferrer" className="transition hover:opacity-80" style={{ color: 'var(--color-primary)' }}>Powered by PestFlow Pro</a>
        </div>
      </div>
    </footer>
  );
}
