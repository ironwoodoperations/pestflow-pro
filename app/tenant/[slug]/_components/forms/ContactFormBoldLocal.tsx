'use client';

import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

interface FormState { name: string; email: string; phone: string; message: string; smsConsent: boolean }

interface Props {
  bizName: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  facebook: string;
  instagram: string;
  google: string;
  form: FormState;
  set: (k: keyof FormState, v: string | boolean) => void;
  submitting: boolean;
  sent: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
}

const BL_INP: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--bl-surface)',
  border: '1px solid var(--bl-border-strong)',
  color: 'var(--bl-text)',
  padding: '0.75rem 1rem',
  fontFamily: 'var(--bl-font-body)',
  fontSize: 15,
  borderRadius: 0,
  outline: 'none',
};

const BL_LABEL: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--bl-font-body)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 'var(--bl-letter-spacing-wide)',
  textTransform: 'uppercase',
  color: 'var(--bl-text-muted)',
  marginBottom: 6,
};

const SOCIAL_LINK: React.CSSProperties = { fontFamily: 'var(--bl-font-body)', fontSize: 13, color: 'var(--bl-text-secondary)', textDecoration: 'none' };

export function ContactFormBoldLocal({ bizName, phone, email, address, hours, facebook, instagram, google, form, set, submitting, sent, error, onSubmit }: Props) {
  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <form onSubmit={onSubmit} style={{ gridColumn: 'span 2', backgroundColor: 'var(--bl-surface-2)', border: '1px solid var(--bl-border)', padding: '2rem' }}>
          <p style={{ fontFamily: 'var(--bl-font-body)', fontSize: 11, fontWeight: 600, letterSpacing: 'var(--bl-letter-spacing-wide)', textTransform: 'uppercase', color: 'var(--bl-accent)', marginBottom: '0.5rem' }}>Drop the call</p>
          <h2 style={{ fontFamily: 'var(--bl-font-display)', fontWeight: 700, fontSize: 'clamp(24px,3vw,36px)', textTransform: 'uppercase', letterSpacing: 'var(--bl-letter-spacing-tight)', color: 'var(--bl-text)', marginBottom: '1.5rem', lineHeight: 'var(--bl-line-height-tight)' }}>Send us a message</h2>
          {sent && <div style={{ backgroundColor: 'rgba(110,181,146,0.15)', border: '1px solid #6EB592', color: '#6EB592', padding: '0.75rem', marginBottom: '1rem', fontFamily: 'var(--bl-font-body)', fontSize: 14 }}>Message sent. We&apos;ll be in touch.</div>}
          {error && <div style={{ backgroundColor: 'rgba(226,84,28,0.15)', border: '1px solid var(--bl-accent-hot)', color: 'var(--bl-accent-hot)', padding: '0.75rem', marginBottom: '1rem', fontFamily: 'var(--bl-font-body)', fontSize: 14 }}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div><label style={BL_LABEL}>Name *</label><input type="text" value={form.name} onChange={e => set('name', e.target.value)} style={BL_INP} required /></div>
            <div><label style={BL_LABEL}>Email *</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={BL_INP} required /></div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={BL_LABEL}>Phone</label>
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} style={BL_INP} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
            <input type="checkbox" id="sms_consent" checked={form.smsConsent} onChange={e => set('smsConsent', e.target.checked)} style={{ marginTop: 4, accentColor: 'var(--bl-accent)' }} />
            <label htmlFor="sms_consent" style={{ fontFamily: 'var(--bl-font-body)', fontSize: 13, color: 'var(--bl-text-secondary)', lineHeight: 1.5 }}>
              I agree to receive text messages from {bizName}. Reply STOP to opt out.
            </label>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={BL_LABEL}>Message</label>
            <textarea value={form.message} onChange={e => set('message', e.target.value)} rows={5} style={{ ...BL_INP, resize: 'none' }} />
          </div>
          <button type="submit" disabled={submitting} style={{ width: '100%', backgroundColor: 'var(--bl-accent)', color: 'var(--bl-surface)', fontFamily: 'var(--bl-font-display)', fontWeight: 700, fontSize: 18, letterSpacing: 'var(--bl-letter-spacing-wide)', textTransform: 'uppercase', padding: '1rem', borderRadius: 0, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.5 : 1 }}>
            {submitting ? 'Sending...' : 'Strike Back'}
          </button>
        </form>

        <div style={{ backgroundColor: 'var(--bl-surface)', border: '2px solid var(--bl-accent)', padding: '1.75rem' }}>
          <p style={{ fontFamily: 'var(--bl-font-body)', fontSize: 11, fontWeight: 600, letterSpacing: 'var(--bl-letter-spacing-wide)', textTransform: 'uppercase', color: 'var(--bl-accent)', marginBottom: '0.5rem' }}>Direct line</p>
          <h3 style={{ fontFamily: 'var(--bl-font-display)', fontWeight: 700, fontSize: 22, textTransform: 'uppercase', color: 'var(--bl-text)', marginBottom: '1.5rem' }}>Reach the crew</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {phone   && <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}><Phone  className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--bl-accent)' }} /><a href={`tel:${phone}`}    style={SOCIAL_LINK}>{formatPhone(phone)}</a></li>}
            {email   && <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}><Mail   className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--bl-accent)' }} /><a href={`mailto:${email}`} style={SOCIAL_LINK}>{email}</a></li>}
            {address && <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}><MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--bl-accent)' }} /><span style={SOCIAL_LINK}>{address}</span></li>}
            {hours   && <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}><Clock  className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--bl-accent)' }} /><span style={SOCIAL_LINK}>{hours}</span></li>}
          </ul>
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--bl-border)' }}>
            <p style={{ fontFamily: 'var(--bl-font-body)', fontSize: 10, fontWeight: 600, letterSpacing: 'var(--bl-letter-spacing-wide)', textTransform: 'uppercase', color: 'var(--bl-text-muted)', marginBottom: '0.5rem' }}>Coverage</p>
            <p style={{ fontFamily: 'var(--bl-font-display)', fontWeight: 700, fontSize: 16, color: 'var(--bl-accent)' }}>SAME-DAY DISPATCH AVAILABLE</p>
          </div>
          {(facebook || instagram || google) && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--bl-border)' }}>
              <p style={{ fontFamily: 'var(--bl-font-body)', fontSize: 10, fontWeight: 600, letterSpacing: 'var(--bl-letter-spacing-wide)', textTransform: 'uppercase', color: 'var(--bl-text-muted)', marginBottom: '0.5rem' }}>Follow us</p>
              <div style={{ display: 'flex', gap: 12 }}>
                {facebook  && <a href={facebook}  target="_blank" rel="noopener noreferrer" style={SOCIAL_LINK}>Facebook</a>}
                {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer" style={SOCIAL_LINK}>Instagram</a>}
                {google    && <a href={google}    target="_blank" rel="noopener noreferrer" style={SOCIAL_LINK}>Google</a>}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
