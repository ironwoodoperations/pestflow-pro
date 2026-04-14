export type ShellPalette = {
  id: string
  name: string
  primary: string
  accent: string
  shell: 'modern-pro' | 'bold-local' | 'clean-friendly' | 'rustic-rugged' | 'metro-pro'
}

export const PALETTES: ShellPalette[] = [
  { id: 'mp-1', name: 'Navy & Gold',    primary: '#1e3a5f', accent: '#f59e0b', shell: 'modern-pro' },
  { id: 'mp-2', name: 'Forest & Cream', primary: '#2d6a4f', accent: '#fef3c7', shell: 'modern-pro' },
  { id: 'mp-3', name: 'Slate & Orange', primary: '#334155', accent: '#E87800', shell: 'modern-pro' },
  { id: 'bl-1', name: 'Orange & Black', primary: '#E87800', accent: '#1a1a1a', shell: 'bold-local' },
  { id: 'bl-2', name: 'Red & Dark',     primary: '#b91c1c', accent: '#1a1a1a', shell: 'bold-local' },
  { id: 'bl-3', name: 'Green & Black',  primary: '#15803d', accent: '#1a1a1a', shell: 'bold-local' },
  { id: 'cf-1', name: 'Sky & White',    primary: '#0ea5e9', accent: '#ffffff', shell: 'clean-friendly' },
  { id: 'cf-2', name: 'Teal & Light',   primary: '#0d9488', accent: '#f0fdfa', shell: 'clean-friendly' },
  { id: 'cf-3', name: 'Purple & Soft',  primary: '#7c3aed', accent: '#faf5ff', shell: 'clean-friendly' },
  { id: 'rr-1', name: 'Brown & Tan',    primary: '#78350f', accent: '#fef3c7', shell: 'rustic-rugged' },
  { id: 'rr-2', name: 'Green & Earth',  primary: '#365314', accent: '#fef9c3', shell: 'rustic-rugged' },
  { id: 'rr-3', name: 'Rust & Cream',   primary: '#9a3412', accent: '#fff7ed', shell: 'rustic-rugged' },
  // metro-pro palettes — Pro/Elite only
  { id: 'mtp-1', name: 'Corporate Blue',   primary: '#1565C0', accent: '#00ACC1', shell: 'metro-pro' },
  { id: 'mtp-2', name: 'Executive Navy',   primary: '#0D2137', accent: '#C9A84C', shell: 'metro-pro' },
  { id: 'mtp-3', name: 'Slate & Electric', primary: '#2D3748', accent: '#38A169', shell: 'metro-pro' },
  { id: 'mtp-4', name: 'Forest & White',   primary: '#1B4332', accent: '#52B788', shell: 'metro-pro' },
]

export function getPalettesForShell(shell: string): ShellPalette[] {
  return PALETTES.filter(p => p.shell === shell)
}

function darkenHex(hex: string, factor: number): string {
  const h = hex.startsWith('#') ? hex.slice(1) : hex
  const r = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(0, 2), 16) * factor)))
  const g = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(2, 4), 16) * factor)))
  const b = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(4, 6), 16) * factor)))
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

function lightenHex(hex: string, white: number): string {
  const h = hex.startsWith('#') ? hex.slice(1) : hex
  const r = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(0, 2), 16) * (1 - white) + 255 * white)))
  const g = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(2, 4), 16) * (1 - white) + 255 * white)))
  const b = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(4, 6), 16) * (1 - white) + 255 * white)))
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

// Per-palette explicit hero gradient start/end, CTA background, nav, and footer. Keyed by primary hex (lowercase).
const PALETTE_HERO: Record<string, { hero: string; end: string; cta: string; nav: string; navText: string; footer: string }> = {
  '#1e3a5f': { hero: '#0d1f35', end: '#162208', cta: '#0d1f35', nav: '#1e3a5f',  navText: '#ffffff', footer: '#0d1f35' }, // Navy & Gold
  '#2d6a4f': { hero: '#1a3d2a', end: '#0d2b1a', cta: '#1a3d2a', nav: '#2d6a4f',  navText: '#ffffff', footer: '#1a3d2a' }, // Forest & Cream
  '#334155': { hero: '#1e293b', end: '#2d1a0a', cta: '#1e293b', nav: '#334155',  navText: '#ffffff', footer: '#1e293b' }, // Slate & Orange
  '#e87800': { hero: '#2d1a00', end: '#1a0f00', cta: '#2d1a00', nav: '#1a1a1a',  navText: '#ffffff', footer: '#111111' }, // Orange & Black
  '#b91c1c': { hero: '#3b0a0a', end: '#1a0505', cta: '#3b0a0a', nav: '#1a1a1a',  navText: '#ffffff', footer: '#111111' }, // Red & Dark
  '#15803d': { hero: '#0a2d1a', end: '#071a0f', cta: '#0a2d1a', nav: '#1a1a1a',  navText: '#ffffff', footer: '#111111' }, // Green & Black
  '#0ea5e9': { hero: '#e0f5ff', end: '#bae8ff', cta: '#e0f2fe', nav: '#ffffff',  navText: '#1e293b', footer: '#0c4a6e' }, // Sky & White
  '#0d9488': { hero: '#e0faf7', end: '#b2f5ec', cta: '#e0faf7', nav: '#ffffff',  navText: '#1e293b', footer: '#134e4a' }, // Teal & Light
  '#7c3aed': { hero: '#f5f0ff', end: '#e9d5ff', cta: '#f5f3ff', nav: '#ffffff',  navText: '#1e293b', footer: '#4c1d95' }, // Purple & Soft
  '#78350f': { hero: '#2d1305', end: '#1a0a02', cta: '#2d1305', nav: '#78350f',  navText: '#ffffff', footer: '#3b1a05' }, // Brown & Tan
  '#365314': { hero: '#162105', end: '#0d1503', cta: '#162105', nav: '#365314',  navText: '#ffffff', footer: '#1a2d08' }, // Green & Earth
  '#9a3412': { hero: '#3b1205', end: '#1a0802', cta: '#3b1205', nav: '#9a3412',  navText: '#ffffff', footer: '#3b1205' }, // Rust & Cream
  // metro-pro primaries — dark primary nav, dark footer
  '#1565c0': { hero: '#0a1628', end: '#0d1f35', cta: '#0a1628', nav: '#1565C0', navText: '#ffffff', footer: '#0d1f2d' }, // Corporate Blue
  '#0d2137': { hero: '#060f1a', end: '#091525', cta: '#060f1a', nav: '#0D2137', navText: '#ffffff', footer: '#060f1a' }, // Executive Navy
  '#2d3748': { hero: '#1a2030', end: '#1e2838', cta: '#1a2030', nav: '#2D3748', navText: '#ffffff', footer: '#1a2030' }, // Slate & Electric
  '#1b4332': { hero: '#0d2b1e', end: '#0a1f15', cta: '#0d2b1e', nav: '#1B4332', navText: '#ffffff', footer: '#0d2b1e' }, // Forest & White
}

export const SHELL_THEMES: Record<string, Record<string, string>> = {
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
  // metro-pro shell — dark primary navbar, enterprise/Pro/Elite only
  'metro-pro-shell': {
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
  // Dang shell — custom comic-book brand for Dang Pest Control (Tyler, TX)
  'dang': {
    '--color-primary':         '#F97316',
    '--color-primary-dark':    '#ea6c00',
    '--color-primary-light':   '#fed7aa',
    '--color-accent':          '#06B6D4',
    '--color-text-on-primary': '#ffffff',
    '--color-bg-hero':         '#F97316',
    '--color-bg-hero-end':     '#ea6c00',
    '--color-bg-section':      '#ffffff',
    '--color-bg-cta':          '#F97316',
    '--color-nav-bg':          '#F97316',
    '--color-nav-text':        '#ffffff',
    '--color-footer-bg':       '#ffffff',
    '--color-footer-text':     '#000000',
    '--color-btn-bg':          '#F97316',
    '--color-btn-text':        '#ffffff',
    '--color-heading':         'hsl(20,40%,12%)',
    '--font-heading':          "'Bangers', cursive",
    '--font-body':             "'Open Sans', sans-serif",
  },
}

export function applyShellTheme(
  template: string,
  primaryOverride?: string,
  accentOverride?: string
) {
  // 'metro-pro' template maps to 'metro-pro-shell' theme entry (avoid name conflict with existing 'modern-pro')
  const themeKey = template === 'metro-pro' ? 'metro-pro-shell' : template
  const theme = SHELL_THEMES[themeKey] || SHELL_THEMES['modern-pro']
  const root = document.documentElement
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
  let paletteHero: (typeof PALETTE_HERO)[string] | undefined
  if (primaryOverride && /^#[0-9a-fA-F]{6}$/.test(primaryOverride)) {
    root.style.setProperty('--color-primary', primaryOverride)
    const primary = primaryOverride.toLowerCase().trim()
    paletteHero = PALETTE_HERO[primary]
    if (paletteHero) {
      root.style.setProperty('--color-bg-hero',     paletteHero.hero)
      root.style.setProperty('--color-bg-hero-end', paletteHero.end)
      root.style.setProperty('--color-bg-cta',      paletteHero.cta)
      root.style.setProperty('--color-nav-bg',      paletteHero.nav)
      root.style.setProperty('--color-nav-text',    paletteHero.navText)
      root.style.setProperty('--color-footer-bg',   paletteHero.footer)
      root.style.setProperty('--color-footer-text', '#ffffff')
    } else if (template === 'clean-friendly') {
      root.style.setProperty('--color-bg-hero', lightenHex(primaryOverride, 0.85))
      root.style.setProperty('--color-bg-hero-end', lightenHex(primaryOverride, 0.93))
    } else {
      root.style.setProperty('--color-bg-hero', darkenHex(primaryOverride, 0.35))
      root.style.setProperty('--color-bg-hero-end', darkenHex(primaryOverride, 0.2))
    }
  } else if (primaryOverride) {
    root.style.setProperty('--color-primary', primaryOverride)
  }
  if (accentOverride) {
    root.style.setProperty('--color-accent', accentOverride)
  }
  if (primaryOverride) {
    root.style.setProperty('--color-btn-bg', accentOverride ?? primaryOverride)
    root.style.setProperty('--color-btn-text', paletteHero?.navText === '#ffffff' ? '#1c1c1e' : '#ffffff')
  }
}
