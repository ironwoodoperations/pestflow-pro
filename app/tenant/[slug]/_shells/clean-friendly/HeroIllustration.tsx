export function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 420 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 16 }}
    >
      {/* Sky background */}
      <rect width="420" height="320" fill="var(--cf-bg-sky)" rx="16" />

      {/* Sun */}
      <circle cx="340" cy="68" r="34" fill="#F7DFA5" opacity="0.7" />
      <circle cx="340" cy="68" r="24" fill="var(--cf-ochre)" opacity="0.55" />

      {/* Rolling ground */}
      <ellipse cx="210" cy="310" rx="260" ry="60" fill="var(--cf-bg-mint)" />
      <rect x="0" y="270" width="420" height="60" fill="var(--cf-bg-mint)" />

      {/* Tree left */}
      <rect x="58" y="210" width="10" height="64" fill="#A8C5A0" rx="3" />
      <ellipse cx="63" cy="195" rx="26" ry="30" fill="var(--cf-mint)" opacity="0.85" />
      <ellipse cx="63" cy="182" rx="18" ry="22" fill="#7DC4A0" opacity="0.7" />

      {/* Tree right (smaller) */}
      <rect x="348" y="228" width="8" height="46" fill="#A8C5A0" rx="3" />
      <ellipse cx="352" cy="215" rx="20" ry="23" fill="var(--cf-mint)" opacity="0.75" />

      {/* House body */}
      <rect x="130" y="168" width="160" height="110" fill="var(--cf-surface)" rx="4" />
      <rect x="130" y="170" width="160" height="108" stroke="var(--cf-divider)" strokeWidth="1.5" fill="none" rx="4" />

      {/* Roof */}
      <polygon points="118,170 210,96 302,170" fill="var(--cf-ink-secondary)" opacity="0.18" />
      <polygon points="122,170 210,100 298,170" fill="var(--cf-ink)" opacity="0.12" />
      <line x1="118" y1="170" x2="302" y2="170" stroke="var(--cf-divider)" strokeWidth="1.5" />

      {/* Chimney */}
      <rect x="248" y="116" width="16" height="32" fill="var(--cf-ink-secondary)" opacity="0.2" rx="2" />

      {/* Door */}
      <rect x="192" y="228" width="36" height="50" fill="var(--cf-bg-sky)" rx="4" />
      <circle cx="224" cy="254" r="3" fill="var(--cf-ochre)" />
      <rect x="193" y="229" width="34" height="48" stroke="var(--cf-divider)" strokeWidth="1" fill="none" rx="4" />

      {/* Windows */}
      <rect x="144" y="190" width="38" height="30" fill="var(--cf-bg-sky)" rx="4" />
      <rect x="238" y="190" width="38" height="30" fill="var(--cf-bg-sky)" rx="4" />
      <line x1="163" y1="190" x2="163" y2="220" stroke="var(--cf-divider)" strokeWidth="1" />
      <line x1="144" y1="205" x2="182" y2="205" stroke="var(--cf-divider)" strokeWidth="1" />
      <line x1="257" y1="190" x2="257" y2="220" stroke="var(--cf-divider)" strokeWidth="1" />
      <line x1="238" y1="205" x2="276" y2="205" stroke="var(--cf-divider)" strokeWidth="1" />

      {/* Path to door */}
      <rect x="202" y="278" width="16" height="38" fill="var(--cf-bg-cream)" rx="2" opacity="0.8" />

      {/* Leaf / plant accent */}
      <ellipse cx="310" cy="275" rx="14" ry="10" fill="var(--cf-mint)" opacity="0.6" transform="rotate(-20 310 275)" />
      <ellipse cx="320" cy="268" rx="12" ry="8" fill="var(--cf-mint)" opacity="0.45" transform="rotate(15 320 268)" />

      {/* Small flower dots */}
      <circle cx="100" cy="276" r="4" fill="var(--cf-ochre)" opacity="0.55" />
      <circle cx="112" cy="270" r="3" fill="var(--cf-ochre)" opacity="0.4" />
      <circle cx="92" cy="268" r="3" fill="var(--cf-mint)" opacity="0.55" />
    </svg>
  );
}
