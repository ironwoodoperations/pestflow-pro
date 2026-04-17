'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { createBrowserSupabase } from '../../../../../shared/lib/supabase/browser';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

interface Props {
  tenantId: string;
  bizName: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  facebook: string;
  instagram: string;
  google: string;
  ownerSmsNumber: string;
}

interface FormState {
  name: string; email: string; phone: string; message: string; smsConsent: boolean;
}

const INITIAL: FormState = { name: '', email: '', phone: '', message: '', smsConsent: false };

export function ContactForm({ tenantId, bizName, phone, email, address, hours, facebook, instagram, google, ownerSmsNumber }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  function set(k: keyof FormState, v: string | boolean) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError('Please fill in your name and email.'); return; }
    setSubmitting(true);
    setError('');
    const supabase = createBrowserSupabase();
    const { error: insertErr } = await supabase.from('leads').insert({
      tenant_id: tenantId, name: form.name, email: form.email, phone: form.phone, message: form.message,
    });
    setSubmitting(false);
    if (insertErr) { setError('Something went wrong. Please try again or call us directly.'); return; }

    const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-sms`;
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` };
    if (form.smsConsent && form.phone) {
      fetch(fnUrl, { method: 'POST', headers, body: JSON.stringify({ tenant_id: tenantId, to: form.phone, message: `Hi ${form.name}, thanks for contacting ${bizName}! We received your message and will be in touch shortly.`, type: 'customer' }) }).catch(() => {});
    }
    if (ownerSmsNumber) {
      fetch(fnUrl, { method: 'POST', headers, body: JSON.stringify({ tenant_id: tenantId, to: ownerSmsNumber, message: `📬 New contact from ${form.name} — ${form.phone} — "${form.message?.slice(0, 80)}". Check your PestFlow Pro admin panel.`, type: 'owner' }) }).catch(() => {});
    }
    setSent(true);
    setForm(INITIAL);
  }

  const inp = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 outline-none';

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-heading, #1a1a1a)' }}>Send Us a Message</h2>
          {sent && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 mb-4 text-sm">Message sent! We&apos;ll get back to you soon.</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inp} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inp} required /></div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={inp} />
          </div>
          <div className="flex items-start gap-3 mb-4">
            <input type="checkbox" id="sms_consent" checked={form.smsConsent} onChange={e => set('smsConsent', e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300" />
            <label htmlFor="sms_consent" className="text-sm text-gray-600">
              I agree to receive text messages from {bizName} regarding my inquiry. Message and data rates may apply. Reply STOP to opt out.
            </label>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea value={form.message} onChange={e => set('message', e.target.value)} rows={5} className={`${inp} resize-none`} />
          </div>
          <button type="submit" disabled={submitting} className="w-full font-bold rounded-lg px-6 py-4 text-lg transition disabled:opacity-50 hover:opacity-90 text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
            {submitting ? 'Sending…' : 'Send Message'}
          </button>
        </form>

        <div className="rounded-xl p-6" style={{ background: 'var(--color-bg-hero, #0a1628)', color: '#fff' }}>
          <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-accent)' }}>Get in Touch</h3>
          <ul className="space-y-4 text-white/90">
            {phone    && <li className="flex items-start gap-3"><Phone  className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} /><a href={`tel:${phone}`} className="hover:underline">{formatPhone(phone)}</a></li>}
            {email    && <li className="flex items-start gap-3"><Mail   className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} /><a href={`mailto:${email}`} className="hover:underline">{email}</a></li>}
            {address  && <li className="flex items-start gap-3"><MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} /><span>{address}</span></li>}
            {hours    && <li className="flex items-start gap-3"><Clock  className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} /><span>{hours}</span></li>}
          </ul>
          {(facebook || instagram || google) && (
            <div className="mt-6 pt-4 border-t border-white/20">
              <h4 className="text-sm font-bold text-white/50 uppercase mb-2">Follow Us</h4>
              <div className="flex gap-3 text-white/60">
                {facebook  && <a href={facebook}  target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Facebook</a>}
                {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Instagram</a>}
                {google    && <a href={google}    target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Google</a>}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
