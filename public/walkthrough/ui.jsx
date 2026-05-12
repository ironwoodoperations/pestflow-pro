// ui.jsx — PestFlow Pro UI primitives (chrome, cards, buttons, modals, etc.)

const PFP = {
  navy: '#0B1426',
  navy2: '#142036',
  navy3: '#1E2D47',
  bg: '#F4F6FB',
  card: '#FFFFFF',
  border: '#E4E8F0',
  borderStrong: '#D2D8E3',
  text: '#0F1B2D',
  muted: '#64748B',
  faint: '#94A3B8',
  teal: '#0FB39A',
  tealDark: '#0A8C7A',
  tealSoft: '#E6F8F4',
  amber: '#F59E0B',
  amberSoft: '#FEF3C7',
  rose: '#E11D48',
  blue: '#3B82F6',
  blueSoft: '#EBF2FE',
  violet: '#8B5CF6',
};

const FONT = "Inter, system-ui, -apple-system, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

// ── Tiny icon set (stroke icons, currentColor) ──────────────────────────────
const Icon = ({ name, size = 16, stroke = 1.6, style }) => {
  const paths = {
    dash:   <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="15" width="7" height="6" rx="1.5"/></>,
    site:   <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><circle cx="6" cy="6.5" r="0.6" fill="currentColor"/><circle cx="8.5" cy="6.5" r="0.6" fill="currentColor"/></>,
    seo:    <><circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/><path d="M8 11h6M11 8v6" /></>,
    pin:    <><path d="M12 21s7-7.5 7-12a7 7 0 10-14 0c0 4.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></>,
    social: <><path d="M4 12c0-4 3-7 8-7s8 3 8 7-3 7-8 7c-1.4 0-2.7-.2-3.8-.6L4 20l1.4-3.6C4.5 15.2 4 13.7 4 12z"/></>,
    blog:   <><path d="M5 4h11l4 4v12H5z"/><path d="M16 4v4h4"/><path d="M8 12h8M8 15h8M8 18h5"/></>,
    brush:  <><path d="M14 4l6 6-8 8H6v-6z"/><path d="M3 21l3-3"/></>,
    inbox:  <><path d="M3 13l3-9h12l3 9"/><path d="M3 13v6a1 1 0 001 1h16a1 1 0 001-1v-6"/><path d="M3 13h5l2 3h4l2-3h5"/></>,
    user:   <><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></>,
    bell:   <><path d="M6 16V10a6 6 0 0112 0v6l2 2H4z"/><path d="M10 20a2 2 0 004 0"/></>,
    search: <><circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/></>,
    check:  <><path d="M5 12l4 4 10-10"/></>,
    chev:   <><path d="M9 6l6 6-6 6"/></>,
    plus:   <><path d="M12 5v14M5 12h14"/></>,
    sparkle:<><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/></>,
    save:   <><path d="M5 4h11l4 4v12H5z"/><path d="M8 4v6h8V4"/><path d="M8 14h8v6H8z"/></>,
    img:    <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M3 18l5-5 4 4 3-3 6 6"/></>,
    edit:   <><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M14 6l4 4"/></>,
    calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 20h16"/></>,
    eye:    <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
    trend:  <><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></>,
    globe:  <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></>,
    phone:  <><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/></>,
    star:   <><path d="M12 3l2.7 5.6 6.3.9-4.5 4.4 1 6.1L12 17.3 6.5 20l1-6.1L3 9.5l6.3-.9z"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/></>,
    palette:<><path d="M12 3a9 9 0 100 18c1.5 0 2-1 1.5-2a2 2 0 011.8-2.8H17a4 4 0 004-4c0-5-4-9-9-9z"/><circle cx="7.5" cy="10.5" r="1" fill="currentColor"/><circle cx="11" cy="6.5" r="1" fill="currentColor"/><circle cx="16" cy="8.5" r="1" fill="currentColor"/></>,
    link:   <><path d="M10 14a4 4 0 005.6 0l3-3a4 4 0 10-5.6-5.6l-1.5 1.5"/><path d="M14 10a4 4 0 00-5.6 0l-3 3a4 4 0 105.6 5.6L12.5 17"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{display: 'block', flexShrink: 0, ...style}}>
      {paths[name] || null}
    </svg>
  );
};

// ── Sidebar ────────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: 'dash',    label: 'Dashboard',    icon: 'dash' },
  { id: 'site',    label: 'Website',      icon: 'site' },
  { id: 'seo',     label: 'Local SEO',    icon: 'seo' },
  { id: 'pin',     label: 'Service Areas',icon: 'pin' },
  { id: 'social',  label: 'Social',       icon: 'social' },
  { id: 'blog',    label: 'Blog',         icon: 'blog' },
  { id: 'brush',   label: 'Branding',     icon: 'brush' },
  { id: 'inbox',   label: 'Lead Inbox',   icon: 'inbox', badge: 0 },
];

function Sidebar({ active = 'dash', entryProgress = 1, leadBadge = 0 }) {
  return (
    <div style={{
      width: 232, height: '100%',
      background: PFP.navy,
      color: '#CBD5E1',
      display: 'flex', flexDirection: 'column',
      padding: '20px 14px',
      fontFamily: FONT,
      transform: `translateX(${(1 - entryProgress) * -100}%)`,
      transition: 'transform 200ms',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 22px'}}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: `linear-gradient(135deg, ${PFP.teal}, #1FE0BC)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#04231E', fontWeight: 800, fontSize: 14,
          boxShadow: '0 2px 8px rgba(15,179,154,0.35)',
        }}>P</div>
        <div style={{display: 'flex', flexDirection: 'column', lineHeight: 1.1}}>
          <span style={{color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em'}}>PestFlow</span>
          <span style={{color: PFP.teal, fontWeight: 600, fontSize: 10, letterSpacing: '0.12em'}}>PRO</span>
        </div>
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 2}}>
        {SIDEBAR_ITEMS.map(item => {
          const isActive = item.id === active;
          return (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '9px 10px', borderRadius: 8,
              background: isActive ? 'rgba(15,179,154,0.14)' : 'transparent',
              color: isActive ? '#fff' : '#94A3B8',
              fontSize: 13.5, fontWeight: isActive ? 600 : 500,
              position: 'relative',
            }}>
              {isActive && <div style={{
                position: 'absolute', left: -14, top: 6, bottom: 6, width: 3,
                background: PFP.teal, borderRadius: '0 2px 2px 0',
              }}/>}
              <Icon name={item.icon} size={17} />
              <span style={{flex: 1}}>{item.label}</span>
              {item.id === 'inbox' && leadBadge > 0 && (
                <span style={{
                  background: PFP.teal, color: '#04231E',
                  fontSize: 10, fontWeight: 700,
                  padding: '2px 6px', borderRadius: 8,
                  minWidth: 16, textAlign: 'center',
                }}>{leadBadge}</span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{flex: 1}}/>

      {/* Account */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 8px', borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: '#3F4A5F',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 12,
        }}>RT</div>
        <div style={{display: 'flex', flexDirection: 'column', lineHeight: 1.2}}>
          <span style={{color: '#fff', fontSize: 12.5, fontWeight: 600}}>Ridge Pest Co.</span>
          <span style={{color: '#94A3B8', fontSize: 10.5}}>Boise, ID</span>
        </div>
      </div>
    </div>
  );
}

// ── Top bar ────────────────────────────────────────────────────────────────
function Topbar({ title, subtitle, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 28px 16px',
      borderBottom: `1px solid ${PFP.border}`,
      background: '#fff',
    }}>
      <div>
        <div style={{fontSize: 11, color: PFP.muted, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase'}}>
          {subtitle}
        </div>
        <div style={{fontSize: 20, fontWeight: 700, color: PFP.text, letterSpacing: '-0.015em', marginTop: 2}}>{title}</div>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
        {right}
        <div style={{display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 8, background: PFP.bg, color: PFP.muted, fontSize: 12.5}}>
          <Icon name="search" size={14}/>
          <span>Search pages, posts, leads…</span>
        </div>
        <div style={{position: 'relative', padding: 8, borderRadius: 8, color: PFP.muted}}>
          <Icon name="bell" size={18}/>
        </div>
      </div>
    </div>
  );
}

// ── Buttons / pills / cards ─────────────────────────────────────────────────
function Btn({ children, kind = 'primary', icon, size = 'md', style }) {
  const palettes = {
    primary: { bg: PFP.teal, color: '#fff', border: 'transparent' },
    ghost:   { bg: '#fff',    color: PFP.text, border: PFP.borderStrong },
    dark:    { bg: PFP.navy,  color: '#fff', border: 'transparent' },
    soft:    { bg: PFP.tealSoft, color: PFP.tealDark, border: 'transparent' },
  };
  const p = palettes[kind];
  const sizes = {
    sm: { fontSize: 12, padding: '6px 10px', radius: 7 },
    md: { fontSize: 13, padding: '8px 14px', radius: 8 },
    lg: { fontSize: 14, padding: '10px 18px', radius: 9 },
  };
  const s = sizes[size];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: p.bg, color: p.color,
      border: `1px solid ${p.border}`,
      padding: s.padding, borderRadius: s.radius,
      fontSize: s.fontSize, fontWeight: 600, fontFamily: FONT,
      letterSpacing: '-0.005em',
      ...style,
    }}>
      {icon && <Icon name={icon} size={s.fontSize + 2}/>}
      {children}
    </div>
  );
}

function Pill({ children, color = 'gray', dot }) {
  const colors = {
    green:  { bg: PFP.tealSoft, color: PFP.tealDark, dot: PFP.teal },
    amber:  { bg: PFP.amberSoft, color: '#92400E', dot: PFP.amber },
    blue:   { bg: PFP.blueSoft, color: '#1D4ED8', dot: PFP.blue },
    gray:   { bg: '#EFF2F7', color: PFP.muted, dot: PFP.faint },
    red:    { bg: '#FEE2E2', color: PFP.rose, dot: PFP.rose },
  };
  const p = colors[color] || colors.gray;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: p.bg, color: p.color,
      fontSize: 11, fontWeight: 600,
      padding: '3px 8px', borderRadius: 999,
      letterSpacing: '0.01em',
    }}>
      {dot && <span style={{width: 6, height: 6, borderRadius: '50%', background: p.dot}}/>}
      {children}
    </span>
  );
}

function Card({ children, style, pad = 18, hover }) {
  return (
    <div style={{
      background: PFP.card,
      border: `1px solid ${PFP.border}`,
      borderRadius: 12,
      padding: pad,
      boxShadow: hover ? '0 6px 16px rgba(15,27,45,0.08)' : '0 1px 0 rgba(15,27,45,0.02)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, delta, icon, accent = PFP.teal }) {
  return (
    <Card pad={16} style={{display: 'flex', flexDirection: 'column', gap: 10}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <span style={{fontSize: 12, color: PFP.muted, fontWeight: 600}}>{label}</span>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: accent + '1A', color: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={15}/>
        </div>
      </div>
      <div style={{fontSize: 24, fontWeight: 700, color: PFP.text, letterSpacing: '-0.02em', lineHeight: 1}}>{value}</div>
      {delta && (
        <div style={{display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5}}>
          <span style={{color: delta.startsWith('+') ? PFP.tealDark : PFP.rose, fontWeight: 600}}>{delta}</span>
          <span style={{color: PFP.muted}}>vs last 30d</span>
        </div>
      )}
    </Card>
  );
}

// Section header with title + optional kicker
function SectionHeader({ kicker, title, right }) {
  return (
    <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12}}>
      <div>
        {kicker && <div style={{fontSize: 10.5, fontWeight: 700, color: PFP.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4}}>{kicker}</div>}
        <div style={{fontSize: 15, fontWeight: 700, color: PFP.text, letterSpacing: '-0.01em'}}>{title}</div>
      </div>
      {right}
    </div>
  );
}

// Animated mouse cursor
function Cursor({ x, y, click = 0 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      pointerEvents: 'none', zIndex: 999,
      transform: 'translate(-4px, -2px)',
      filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.25))',
    }}>
      <svg width="22" height="26" viewBox="0 0 22 26">
        <path d="M2 2l18 8-7.5 2.5L11 22z" fill="#fff" stroke="#0F1B2D" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
      {click > 0 && (
        <div style={{
          position: 'absolute', left: 0, top: 0,
          width: 28, height: 28,
          borderRadius: '50%',
          border: `2px solid ${PFP.teal}`,
          opacity: 1 - click,
          transform: `translate(-14px, -14px) scale(${0.6 + click * 1.4})`,
        }}/>
      )}
    </div>
  );
}

// Field row (label + value/input)
function Field({ label, children, hint, full }) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 6, flex: full ? 1 : 'initial'}}>
      <label style={{fontSize: 11.5, fontWeight: 600, color: PFP.muted, letterSpacing: '0.02em'}}>{label}</label>
      {children}
      {hint && <div style={{fontSize: 10.5, color: PFP.faint}}>{hint}</div>}
    </div>
  );
}

function Input({ value, placeholder, mono, style, suffix }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      border: `1px solid ${PFP.border}`,
      borderRadius: 7,
      padding: '8px 11px',
      background: '#fff',
      fontFamily: mono ? MONO : FONT,
      fontSize: 12.5,
      color: value ? PFP.text : PFP.faint,
      ...style,
    }}>
      <span style={{flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{value || placeholder}</span>
      {suffix}
    </div>
  );
}

// Modal shell — scales in from 96 → 100 with backdrop fade
function Modal({ children, width = 560, progress = 1 }) {
  const e = Easing.easeOutCubic(progress);
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `rgba(11,20,38,${0.45 * e})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50,
    }}>
      <div style={{
        width,
        background: '#fff',
        borderRadius: 14,
        boxShadow: '0 24px 60px rgba(11,20,38,0.25)',
        opacity: e,
        transform: `scale(${0.96 + 0.04 * e})`,
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle }) {
  return (
    <div style={{padding: '18px 22px 14px', borderBottom: `1px solid ${PFP.border}`}}>
      <div style={{fontSize: 15, fontWeight: 700, color: PFP.text, letterSpacing: '-0.01em'}}>{title}</div>
      {subtitle && <div style={{fontSize: 12, color: PFP.muted, marginTop: 2}}>{subtitle}</div>}
    </div>
  );
}

// Overlay caption — position can be 'bottom', 'middle', or 'top'
function Caption({ text, sub, progress, position = 'bottom' }) {
  const e = Easing.easeOutCubic(Math.min(1, progress));
  const exit = progress > 0.85 ? (progress - 0.85) / 0.15 : 0;
  const op = (1 - exit) * e;

  const posStyle = position === 'middle'
    ? { top: '50%', transform: 'translateY(-50%)' }
    : position === 'top'
      ? { top: 36 }
      : { bottom: 36 };

  // For middle, translate from a Y offset combined with the centering transform
  const wrapTransform = position === 'middle'
    ? `translateY(calc(-50% + ${(1 - e) * 12}px))`
    : posStyle.transform || '';

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0,
      ...(position === 'middle' ? { top: '50%' } : posStyle),
      transform: position === 'middle' ? 'translateY(-50%)' : 'none',
      display: 'flex', justifyContent: 'center',
      pointerEvents: 'none',
      zIndex: 100,
    }}>
      <div style={{
        background: 'rgba(11,20,38,0.92)',
        color: '#fff',
        padding: '14px 26px',
        borderRadius: 14,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 10px 30px rgba(11,20,38,0.25)',
        opacity: op,
        transform: `translateY(${(1 - e) * 12}px)`,
        textAlign: 'center',
        maxWidth: 680,
      }}>
        <div style={{fontSize: 19, fontWeight: 600, letterSpacing: '-0.012em'}}>{text}</div>
        {sub && <div style={{fontSize: 12.5, color: '#94A3B8', marginTop: 4}}>{sub}</div>}
      </div>
    </div>
  );
}

// Striped image placeholder
function ImgSlot({ label, h = 140, accent = PFP.teal, style }) {
  return (
    <div style={{
      height: h, width: '100%',
      borderRadius: 8,
      background: `repeating-linear-gradient(135deg, #EEF2F8 0 10px, #E4E9F2 10px 20px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: PFP.muted, fontFamily: MONO, fontSize: 10.5,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      border: `1px dashed ${PFP.borderStrong}`,
      ...style,
    }}>
      {label}
    </div>
  );
}

// Stage entry helper — fades+slides a child in over `dur` after `delay`
function StageIn({ delay = 0, dur = 0.5, from = 'up', children, style }) {
  const { localTime } = useSprite();
  const t = Easing.easeOutCubic(clamp((localTime - delay) / dur, 0, 1));
  const dist = 14;
  const off = { up: [0, dist], down: [0, -dist], left: [dist, 0], right: [-dist, 0], none: [0, 0] }[from] || [0, dist];
  return (
    <div style={{
      opacity: t,
      transform: `translate(${off[0] * (1 - t)}px, ${off[1] * (1 - t)}px)`,
      ...style,
    }}>{children}</div>
  );
}

// Frame wrapping: sidebar + content
function AppFrame({ active, leadBadge, sidebarEntry = 1, children }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex',
      background: PFP.bg,
      fontFamily: FONT,
      color: PFP.text,
    }}>
      <Sidebar active={active} entryProgress={sidebarEntry} leadBadge={leadBadge}/>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden'}}>
        {children}
      </div>
    </div>
  );
}

Object.assign(window, {
  PFP, FONT, MONO, Icon, Sidebar, Topbar, Btn, Pill, Card, StatCard,
  SectionHeader, Cursor, Field, Input, Modal, ModalHeader, Caption,
  ImgSlot, StageIn, AppFrame,
});
