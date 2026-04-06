export const SHELL_THEMES: Record<string, Record<string, string>> = {
  'modern-pro': {
    '--color-primary':      '#10b981',
    '--color-primary-dark': '#059669',
    '--color-accent':       '#10b981',
    '--color-bg-hero':      '#0f172a',
    '--color-bg-section':   '#f8fafc',
    '--color-bg-cta':       '#0f172a',
    '--color-nav-bg':       '#0f172a',
    '--color-nav-text':     '#ffffff',
    '--color-footer-bg':    '#0f172a',
    '--color-footer-text':  '#ffffff',
    '--color-btn-bg':       '#10b981',
    '--color-btn-text':     '#ffffff',
    '--color-heading':      '#0f172a',
    '--font-heading':       'Oswald, sans-serif',
    '--font-body':          'Inter, sans-serif',
  },
  'bold-local': {
    '--color-primary':      '#f59e0b',
    '--color-primary-dark': '#d97706',
    '--color-accent':       '#f59e0b',
    '--color-bg-hero':      '#1c1c1e',
    '--color-bg-section':   '#f5f5f5',
    '--color-bg-cta':       '#1c1c1e',
    '--color-nav-bg':       '#1c1c1e',
    '--color-nav-text':     '#ffffff',
    '--color-footer-bg':    '#1c1c1e',
    '--color-footer-text':  '#ffffff',
    '--color-btn-bg':       '#f59e0b',
    '--color-btn-text':     '#1c1c1e',
    '--color-heading':      '#1c1c1e',
    '--font-heading':       'Oswald, sans-serif',
    '--font-body':          'Inter, sans-serif',
  },
  'clean-friendly': {
    '--color-primary':      '#3b82f6',
    '--color-primary-dark': '#2563eb',
    '--color-accent':       '#3b82f6',
    '--color-bg-hero':      '#ffffff',
    '--color-bg-section':   '#f0f9ff',
    '--color-bg-cta':       '#eff6ff',
    '--color-nav-bg':       '#ffffff',
    '--color-nav-text':     '#1e293b',
    '--color-footer-bg':    '#1e293b',
    '--color-footer-text':  '#ffffff',
    '--color-btn-bg':       '#3b82f6',
    '--color-btn-text':     '#ffffff',
    '--color-heading':      '#1e293b',
    '--font-heading':       'Raleway, sans-serif',
    '--font-body':          'Inter, sans-serif',
  },
  'rustic-rugged': {
    '--color-primary':      '#c2410c',
    '--color-primary-dark': '#9a3412',
    '--color-accent':       '#c2410c',
    '--color-bg-hero':      '#3b1a08',
    '--color-bg-section':   '#fdf8f3',
    '--color-bg-cta':       '#3b1a08',
    '--color-nav-bg':       '#3b1a08',
    '--color-nav-text':     '#ffffff',
    '--color-footer-bg':    '#3b1a08',
    '--color-footer-text':  '#ffffff',
    '--color-btn-bg':       '#c2410c',
    '--color-btn-text':     '#ffffff',
    '--color-heading':      '#3b1a08',
    '--font-heading':       'Oswald, sans-serif',
    '--font-body':          'Inter, sans-serif',
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
