/**
 * Server-side equivalent of applyShellTheme() from src/lib/shellThemes.ts.
 * Computes the full set of CSS custom properties for a given shell template,
 * primary color, and accent color — without touching document.
 */

type ShellVars = Record<string, string>;

// Base CSS vars per shell (mirrors SHELL_THEMES in shellThemes.ts)
const SHELL_THEMES: Record<string, ShellVars> = {
  'modern-pro': {
    '--color-primary':         '#10b981',
    '--color-primary-dark':    '#059669',
    '--color-primary-light':   '#d1fae5',
    '--color-accent':          '#10b981',
    '--color-text-on-primary': '#ffffff',
    '--color-bg-hero':         '#0d1f35',
    '--color-bg-hero-end':     '#162208',
    '--color-bg-section':      '#f8fafc',
    '--color-bg-cta':          '#0d1f35',
    '--color-nav-bg':          '#0f172a',
    '--color-nav-text':        '#ffffff',
    '--color-footer-bg':       '#0f172a',
    '--color-footer-text':     '#ffffff',
    '--color-btn-bg':          '#10b981',
    '--color-btn-text':        '#ffffff',
    '--color-heading':         '#0f172a',
    '--font-heading':          'Oswald, sans-serif',
    '--font-body':             'Inter, sans-serif',
  },
  'bold-local': {
    '--color-primary':         '#f59e0b',
    '--color-primary-dark':    '#d97706',
    '--color-primary-light':   '#fef3c7',
    '--color-accent':          '#f59e0b',
    '--color-text-on-primary': '#1c1c1e',
    '--color-bg-hero':         '#2d1a00',
    '--color-bg-hero-end':     '#1a0f00',
    '--color-bg-section':      '#f5f5f5',
    '--color-bg-cta':          '#1c1c1e',
    '--color-nav-bg':          '#1c1c1e',
    '--color-nav-text':        '#ffffff',
    '--color-footer-bg':       '#1c1c1e',
    '--color-footer-text':     '#ffffff',
    '--color-btn-bg':          '#f59e0b',
    '--color-btn-text':        '#1c1c1e',
    '--color-heading':         '#1c1c1e',
    '--font-heading':          'Oswald, sans-serif',
    '--font-body':             'Inter, sans-serif',
  },
  'clean-friendly': {
    '--color-primary':         '#3b82f6',
    '--color-primary-dark':    '#2563eb',
    '--color-primary-light':   '#dbeafe',
    '--color-accent':          '#3b82f6',
    '--color-text-on-primary': '#ffffff',
    '--color-bg-hero':         '#e0f5ff',
    '--color-bg-hero-end':     '#bae8ff',
    '--color-bg-section':      '#f0f9ff',
    '--color-bg-cta':          '#eff6ff',
    '--color-nav-bg':          '#ffffff',
    '--color-nav-text':        '#1e293b',
    '--color-footer-bg':       '#1e293b',
    '--color-footer-text':     '#ffffff',
    '--color-btn-bg':          '#3b82f6',
    '--color-btn-text':        '#ffffff',
    '--color-heading':         '#1e293b',
    '--font-heading':          'Raleway, sans-serif',
    '--font-body':             'Inter, sans-serif',
  },
  'rustic-rugged': {
    '--color-primary':         '#c2410c',
    '--color-primary-dark':    '#9a3412',
    '--color-primary-light':   '#fed7aa',
    '--color-accent':          '#c2410c',
    '--color-text-on-primary': '#ffffff',
    '--color-bg-hero':         '#2d1305',
    '--color-bg-hero-end':     '#1a0a02',
    '--color-bg-section':      '#fdf8f3',
    '--color-bg-cta':          '#3b1a08',
    '--color-nav-bg':          '#3b1a08',
    '--color-nav-text':        '#ffffff',
    '--color-footer-bg':       '#3b1a08',
    '--color-footer-text':     '#ffffff',
    '--color-btn-bg':          '#c2410c',
    '--color-btn-text':        '#ffffff',
    '--color-heading':         '#3b1a08',
    '--font-heading':          'Oswald, sans-serif',
    '--font-body':             'Inter, sans-serif',
  },
  // metro-pro maps to 'metro-pro-shell' key in Vite; we keep the same here
  'metro-pro': {
    '--color-primary':         '#1565C0',
    '--color-primary-dark':    '#0d47a1',
    '--color-primary-light':   '#e3f2fd',
    '--color-accent':          '#00ACC1',
    '--color-text-on-primary': '#ffffff',
    '--color-bg-hero':         '#0a1628',
    '--color-bg-hero-end':     '#0d1f35',
    '--color-bg-section':      '#f8f9fa',
    '--color-bg-cta':          '#0a1628',
    '--color-nav-bg':          '#1565C0',
    '--color-nav-text':        '#ffffff',
    '--color-footer-bg':       '#0d1f2d',
    '--color-footer-text':     '#ffffff',
    '--color-btn-bg':          '#00ACC1',
    '--color-btn-text':        '#ffffff',
    '--color-heading':         '#1a1a1a',
    '--font-heading':          'Inter, sans-serif',
    '--font-body':             'Inter, sans-serif',
  },
};

// Per-palette hero/nav/footer overrides keyed by lowercase primary hex
// (mirrors PALETTE_HERO in shellThemes.ts)
const PALETTE_HERO: Record<string, {
  hero: string; end: string; cta: string;
  nav: string; navText: string; footer: string;
}> = {
  '#1e3a5f': { hero: '#0d1f35', end: '#162208', cta: '#0d1f35', nav: '#1e3a5f',  navText: '#ffffff', footer: '#0d1f35' },
  '#2d6a4f': { hero: '#1a3d2a', end: '#0d2b1a', cta: '#1a3d2a', nav: '#2d6a4f',  navText: '#ffffff', footer: '#1a3d2a' },
  '#334155': { hero: '#1e293b', end: '#2d1a0a', cta: '#1e293b', nav: '#334155',  navText: '#ffffff', footer: '#1e293b' },
  '#e87800': { hero: '#2d1a00', end: '#1a0f00', cta: '#2d1a00', nav: '#1a1a1a',  navText: '#ffffff', footer: '#111111' },
  '#b91c1c': { hero: '#3b0a0a', end: '#1a0505', cta: '#3b0a0a', nav: '#1a1a1a',  navText: '#ffffff', footer: '#111111' },
  '#15803d': { hero: '#0a2d1a', end: '#071a0f', cta: '#0a2d1a', nav: '#1a1a1a',  navText: '#ffffff', footer: '#111111' },
  '#0ea5e9': { hero: '#e0f5ff', end: '#bae8ff', cta: '#e0f2fe', nav: '#ffffff',  navText: '#1e293b', footer: '#0c4a6e' },
  '#0d9488': { hero: '#e0faf7', end: '#b2f5ec', cta: '#e0faf7', nav: '#ffffff',  navText: '#1e293b', footer: '#134e4a' },
  '#7c3aed': { hero: '#f5f0ff', end: '#e9d5ff', cta: '#f5f3ff', nav: '#ffffff',  navText: '#1e293b', footer: '#4c1d95' },
  '#78350f': { hero: '#2d1305', end: '#1a0a02', cta: '#2d1305', nav: '#78350f',  navText: '#ffffff', footer: '#3b1a05' },
  '#365314': { hero: '#162105', end: '#0d1503', cta: '#162105', nav: '#365314',  navText: '#ffffff', footer: '#1a2d08' },
  '#9a3412': { hero: '#3b1205', end: '#1a0802', cta: '#3b1205', nav: '#9a3412',  navText: '#ffffff', footer: '#3b1205' },
  '#1565c0': { hero: '#0a1628', end: '#0d1f35', cta: '#0a1628', nav: '#1565C0', navText: '#ffffff', footer: '#0d1f2d' },
  '#0d2137': { hero: '#060f1a', end: '#091525', cta: '#060f1a', nav: '#0D2137', navText: '#ffffff', footer: '#060f1a' },
  '#2d3748': { hero: '#1a2030', end: '#1e2838', cta: '#1a2030', nav: '#2D3748', navText: '#ffffff', footer: '#1a2030' },
  '#1b4332': { hero: '#0d2b1e', end: '#0a1f15', cta: '#0d2b1e', nav: '#1B4332', navText: '#ffffff', footer: '#0d2b1e' },
};

function darkenHex(hex: string, factor: number): string {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(0, 2), 16) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(2, 4), 16) * factor)));
  const b = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(4, 6), 16) * factor)));
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function lightenHex(hex: string, white: number): string {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(0, 2), 16) * (1 - white) + 255 * white)));
  const g = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(2, 4), 16) * (1 - white) + 255 * white)));
  const b = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(4, 6), 16) * (1 - white) + 255 * white)));
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

/**
 * Server-side counterpart to applyShellTheme().
 * Returns a full map of CSS custom properties for the given shell config.
 */
export function computeShellCssVars(
  template: string,
  primaryColor: string,
  accentColor: string,
): ShellVars {
  const base = SHELL_THEMES[template] ?? SHELL_THEMES['modern-pro'];
  const vars: ShellVars = { ...base };

  const primary = primaryColor?.toLowerCase().trim() ?? '';
  const accent = accentColor?.trim() ?? '';

  if (primary && /^#[0-9a-f]{6}$/.test(primary)) {
    vars['--color-primary'] = primaryColor;

    const palette = PALETTE_HERO[primary];
    if (palette) {
      vars['--color-bg-hero']     = palette.hero;
      vars['--color-bg-hero-end'] = palette.end;
      vars['--color-bg-cta']      = palette.cta;
      vars['--color-nav-bg']      = palette.nav;
      vars['--color-nav-text']    = palette.navText;
      vars['--color-footer-bg']   = palette.footer;
      vars['--color-footer-text'] = '#ffffff';
    } else if (template === 'clean-friendly') {
      vars['--color-bg-hero']     = lightenHex(primaryColor, 0.85);
      vars['--color-bg-hero-end'] = lightenHex(primaryColor, 0.93);
    } else {
      vars['--color-bg-hero']     = darkenHex(primaryColor, 0.35);
      vars['--color-bg-hero-end'] = darkenHex(primaryColor, 0.2);
    }

    // btn-bg follows accent if provided, else primary
    const btnBg = accent && /^#[0-9a-f]{6}$/i.test(accent) ? accent : primaryColor;
    vars['--color-btn-bg']   = btnBg;
    vars['--color-btn-text'] = (PALETTE_HERO[primary]?.navText === '#ffffff') ? '#ffffff' : '#1c1c1e';
  }

  if (accent && /^#[0-9a-f]{6}$/i.test(accent)) {
    vars['--color-accent'] = accent;
  }

  return vars;
}

/** Serialises the vars map to an inline :root { … } CSS string. */
export function shellCssVarsString(vars: ShellVars): string {
  return `:root{${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';')}}`;
}
