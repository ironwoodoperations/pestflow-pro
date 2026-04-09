import { useState } from 'react';
import Navbar from '../ShellNavbar';
import Footer from '../ShellFooter';
import { supabase } from '../../../lib/supabase';

const ContactPage = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', address: '', city: '', state: '', zip: '', message: '' });
  const [smsTransactional, setSmsTransactional] = useState(false);
  const [smsMarketing, setSmsMarketing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Open Sans', sans-serif",
    color: 'hsl(20, 40%, 12%)',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const leadData = {
      name: `${form.firstName} ${form.lastName}`,
      email: form.email,
      phone: form.phone,
      message: form.message,
    };

    try {
      await supabase.from('leads').insert(leadData);
    } catch {
      // lead save failed — still show success to user
    }

    supabase.functions.invoke('notify-new-lead', {
      body: { ...leadData, form_type: 'contact' },
    }).catch(() => {});

    setSubmitted(true);
  };

  return (
    <div style={{ fontFamily: "'Open Sans', sans-serif", color: 'hsl(20, 40%, 12%)', overflowX: 'hidden' }}>
      <Navbar />
      <main>

      {/* HERO */}
      <section style={{
        position: 'relative',
        background: `url(/dang/moblie_banner.webp) center/cover no-repeat, hsl(28, 100%, 50%)`,
        paddingTop: '80px',
        paddingBottom: '200px',
        minHeight: '420px',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.18) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '0 20px 30px' }}>
          <h1 style={{
            fontFamily: '"Bangers", cursive',
            fontSize: 'clamp(56px, 9vw, 100px)',
            color: 'hsl(45, 95%, 60%)',
            fontStyle: 'italic',
            letterSpacing: '0.05em',
            WebkitTextStroke: '3px #000000',
            textShadow: '3px 3px 0 #000000',
            margin: 0,
            lineHeight: 1,
          }}>
            CONTACT US
          </h1>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 1 }}>
          <img fetchPriority="high" width={1200} height={50} src="/dang/banner-img.png" alt="" style={{ width: '100%', display: 'block' }} />
        </div>
      </section>

      {/* FORM */}
      <section className="px-4 md:px-10" style={{ paddingTop: '60px', paddingBottom: '80px', maxWidth: '700px', margin: '0 auto' }}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <h2 style={{ fontWeight: '800', fontSize: '28px', marginBottom: '16px' }}>Message Sent!</h2>
            <p style={{ fontSize: '16px', color: '#444' }}>Thank you for contacting us. We'll be in touch shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: '16px' }}>
              <input style={inputStyle} type="text" placeholder="First Name*" required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
              <input style={inputStyle} type="text" placeholder="Last Name*" required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
            </div>
            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: '16px' }}>
              <input style={inputStyle} type="tel" placeholder="Phone*" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <input style={inputStyle} type="email" placeholder="Email*" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            {/* Address */}
            <div style={{ marginBottom: '16px' }}>
              <input style={inputStyle} type="text" placeholder="Address*" required value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
            </div>
            {/* City / State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: '16px' }}>
              <input style={inputStyle} type="text" placeholder="City*" required value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
              <input style={inputStyle} type="text" placeholder="State*" required value={form.state} onChange={e => setForm({...form, state: e.target.value})} />
            </div>
            {/* Zip */}
            <div style={{ marginBottom: '16px' }}>
              <input style={{ ...inputStyle, maxWidth: '50%' }} type="text" placeholder="Zip Code*" required value={form.zip} onChange={e => setForm({...form, zip: e.target.value})} />
            </div>
            {/* Message */}
            <div style={{ marginBottom: '20px' }}>
              <textarea
                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                placeholder="What can we help you with today?*"
                required
                value={form.message}
                onChange={e => setForm({...form, message: e.target.value})}
              />
            </div>

            {/* SMS consent 1 */}
            <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px', cursor: 'pointer' }}>
              <input type="checkbox" checked={smsTransactional} onChange={e => setSmsTransactional(e.target.checked)} style={{ marginTop: '3px', flexShrink: 0, width: '18px', height: '18px' }} />
              <span style={{ fontSize: '13px', color: '#444', lineHeight: 1.6, fontStyle: 'italic' }}>
                By checking this box, I consent to receive transactional messages related to Dang Pest Control for my account, orders, or services I have requested. These messages may include appointment reminders, order confirmations, and account notifications among others. Message frequency may vary. Message & Data rates may apply. Reply HELP for help or STOP to opt-out.
              </span>
            </label>

            {/* SMS consent 2 */}
            <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '28px', cursor: 'pointer' }}>
              <input type="checkbox" checked={smsMarketing} onChange={e => setSmsMarketing(e.target.checked)} style={{ marginTop: '3px', flexShrink: 0, width: '18px', height: '18px' }} />
              <span style={{ fontSize: '13px', color: '#444', lineHeight: 1.6, fontStyle: 'italic' }}>
                By checking this box, I consent to receive marketing and promotional messages from Dang Pest Control, including special offers, discounts, new product updates among others. Message frequency may vary. Message & Data rates may apply. Reply HELP for help or STOP to opt-out.
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '18px',
                background: 'hsl(28, 100%, 50%)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontWeight: '800',
                fontSize: '17px',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                fontFamily: "'Open Sans', sans-serif",
              }}
            >
              SEND MESSAGE →
            </button>

            {/* Privacy / Terms links */}
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
              <a href="/privacy-policy" style={{ color: 'hsl(185, 65%, 42%)', textDecoration: 'underline' }}>Privacy Policy</a>
              {' | '}
              <a href="/terms-of-service" style={{ color: 'hsl(185, 65%, 42%)', textDecoration: 'underline' }}>Terms of Service</a>
            </div>
          </form>
        )}
      </section>

      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
