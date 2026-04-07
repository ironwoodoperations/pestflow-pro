export type ShellPalette = {
  id: string
  name: string
  primary: string
  accent: string
  shell: 'modern-pro' | 'bold-local' | 'clean-friendly' | 'rustic-rugged'
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
]

export function getPalettesForShell(shell: string): ShellPalette[] {
  return PALETTES.filter(p => p.shell === shell)
}

export const SHELL_THEMES: Record<string, Record<string, string>> = {
  'modern-pro': {
    '--color-primary':         '#10b981',
    '--color-primary-dark':    '#059669',
    '--color-primary-light':   '#d1fae5',
    '--color-accent':          '#10b981',
    '--color-text-on-primary': '#ffffff',
    '--color-bg-hero':         '#0f172a',
    '--color-bg-section':      '#f8fafc',
    '--color-bg-cta':          '#0f172a',
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
    '--color-bg-hero':         '#1c1c1e',
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
    '--color-bg-hero':         '#ffffff',
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
    '--color-bg-hero':         '#3b1a08',
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
}

export function applyShellTheme(
  template: string,
  primaryOverride?: string,
  accentOverride?: string
) {
  const theme = SHELL_THEMES[template] || SHELL_THEMES['modern-pro']
  const root = document.documentElement
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
  if (primaryOverride) {
    root.style.setProperty('--color-primary', primaryOverride)
    root.style.setProperty('--color-btn-bg', primaryOverride)
  }
  if (accentOverride) {
    root.style.setProperty('--color-accent', accentOverride)
  }
}
