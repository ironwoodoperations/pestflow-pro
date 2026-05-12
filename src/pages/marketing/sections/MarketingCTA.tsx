import { useState } from 'react'

const C = { bg: '#0f1a2e', bgAlt: '#1e2d4a', green: '#22c55e', white: '#ffffff', muted: 'rgba(255,255,255,0.6)' }
const F = { h: "'Bricolage Grotesque', sans-serif", b: "'Plus Jakarta Sans', sans-serif" }
const EDGE_URL = 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/api-quote'
const MASTER_TENANT_ID = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'

const inputStyle = {
  width: '100%', padding: '11px 14px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10, color: C.white,
  fontSize: 14, fontFamily: F.b,
  outline: 'none', boxSizing: 'border-box' as const,
}

export default function MarketingCTA() {
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const messageParts = [form.company && `Company: ${form.company}`, form.message].filter(Boolean)
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: MASTER_TENANT_ID,
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: messageParts.length ? messageParts.join('\n') : undefined,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Call us at (430) 367-5601.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="contact" style={{ background: C.bgAlt, padding: '96px 32px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontFamily: F.h, fontWeight: 800, fontSize: 'clamp(32px,5vw,54px)', letterSpacing: '-0.03em', color: C.white, margin: '0 0 18px', lineHeight: 1.1 }}>
            Ready to Get More Calls?
          </h2>
          <p style={{ fontFamily: F.b, fontSize: 17, color: C.muted, maxWidth: 520, margin: '0 auto' }}>
            Talk to us about getting your pest control business online the right way.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start', maxWidth: 960, margin: '0 auto' }}>
          {/* Contact info */}
          <div>
            <h3 style={{ fontFamily: F.h, fontWeight: 700, fontSize: 20, color: C.white, margin: '0 0 28px' }}>Get in Touch</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📞</div>
              <div>
                <div style={{ fontFamily: F.b, fontSize: 12, color: C.muted, marginBottom: 2 }}>Call or Text</div>
                <a href="tel:4303675601" style={{ fontFamily: F.h, fontWeight: 700, fontSize: 20, color: C.white, textDecoration: 'none' }}>(430) 367-5601</a>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>✉️</div>
              <div>
                <div style={{ fontFamily: F.b, fontSize: 12, color: C.muted, marginBottom: 2 }}>Email</div>
                <a href="mailto:sales@homeflowpro.ai" style={{ fontFamily: F.h, fontWeight: 700, fontSize: 16, color: C.white, textDecoration: 'none' }}>sales@homeflowpro.ai</a>
              </div>
            </div>

            <div style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 12, padding: '18px 20px' }}>
              <p style={{ fontFamily: F.b, fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.6 }}>
                We typically respond within 1 business hour during business days.
              </p>
            </div>
          </div>

          {/* Form / Success / Error */}
          {submitted ? (
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 16, padding: '40px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
              <h3 style={{ fontFamily: F.h, fontWeight: 800, fontSize: 22, color: C.white, margin: '0 0 12px' }}>
                Thanks {form.name.split(' ')[0]}!
              </h3>
              <p style={{ fontFamily: F.b, fontSize: 15, color: C.muted, lineHeight: 1.65, margin: 0 }}>
                We'll be in touch within 1 business day.<br />
                Check your email for a confirmation.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Your Name" required style={inputStyle} />
                <input name="company" value={form.company} onChange={handleChange} placeholder="Company Name" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone Number" style={inputStyle} />
                <input name="email" value={form.email} onChange={handleChange} placeholder="Email Address" type="email" required style={inputStyle} />
              </div>
              <textarea name="message" value={form.message} onChange={handleChange} placeholder="Message (optional)" rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
              {error && (
                <p style={{ fontFamily: F.b, fontSize: 13, color: '#f87171', margin: 0 }}>{error}</p>
              )}
              <button type="submit" disabled={loading} style={{ padding: '14px', borderRadius: 10, background: loading ? 'rgba(34,197,94,0.5)' : C.green, color: '#ffffff', fontSize: 15, fontWeight: 700, fontFamily: F.b, border: 'none', cursor: loading ? 'default' : 'pointer', boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}>
                {loading ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
