import { ContactForm } from '../../_components/forms/ContactForm';
import { CloudBottom } from './DangComicDevices';

// Thin comic chrome around the SHARED ContactForm (Scott's PR 4 descope: no
// bespoke field set / service-checkbox grid). Mirrors ModernProContactPage's
// wrapper pattern (hideContactSidebar). The full comic quote form (spec §6) is
// a known parity gap revisited at Phase 3 if it matters.
interface Props {
  heroTitle: string;
  heroSub: string;
  tenantId: string;
  bizName: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  facebook?: string;
  instagram?: string;
  google?: string;
  ownerSmsNumber?: string;
  shellTemplate?: string;
}

const comicH = (size: string): React.CSSProperties => ({
  fontFamily: 'var(--dang-font-display)', textTransform: 'uppercase', letterSpacing: '0.02em',
  lineHeight: 'var(--dang-line-height-tight)', fontSize: size, margin: 0,
});

export function DangComicContactPage({ heroSub, tenantId, bizName, phone, email, address, hours, facebook, instagram, google, ownerSmsNumber, shellTemplate }: Props) {
  return (
    <div style={{ fontFamily: 'var(--dang-font-body)', color: 'var(--dang-text)', background: 'var(--dang-surface)' }}>
      <section style={{ position: 'relative', background: 'var(--dang-orange)', color: 'var(--dang-white)', padding: '3.5rem 1.25rem 4rem', textAlign: 'center' }}>
        <h1 style={{ ...comicH('clamp(34px,6vw,64px)'), color: 'var(--dang-yellow)', WebkitTextStroke: '2px var(--dang-ink)' }}>Get Your Quote</h1>
        {heroSub && <p style={{ marginTop: '1rem', fontSize: 18, maxWidth: '48ch', marginInline: 'auto' }}>{heroSub}</p>}
        <CloudBottom />
      </section>

      <section style={{ padding: '3rem 1.25rem' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', background: 'var(--dang-white)', border: 'var(--dang-outline)', borderRadius: 'var(--dang-radius)', boxShadow: 'var(--dang-shadow-comic)', padding: '1.75rem' }}>
          <ContactForm
            tenantId={tenantId}
            bizName={bizName}
            phone={phone}
            email={email}
            address={address}
            hours={hours}
            facebook={facebook ?? ''}
            instagram={instagram ?? ''}
            google={google ?? ''}
            ownerSmsNumber={ownerSmsNumber ?? ''}
            shellTemplate={shellTemplate}
            hideContactSidebar
          />
        </div>
      </section>
    </div>
  );
}
