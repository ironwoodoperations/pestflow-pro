import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyShellTheme } from './lib/shellThemes.ts'

// Pre-mount theme injection — runs before React, eliminates any flash on repeat visits.
// Reads from the TenantBootProvider cache key written on first visit.
;(() => {
  try {
    const p = window.location.pathname
    if (p.startsWith('/admin') || p.startsWith('/ironwood')) return
    const raw = localStorage.getItem('pfp_tenant_boot_v1')
    if (!raw) return
    const boot = JSON.parse(raw) as { slug?: string; template?: string; primaryColor?: string; accentColor?: string }
    if (!boot.template) return
    // Verify the cached slug matches the current subdomain
    const h = window.location.hostname
    if (h.endsWith('.pestflowpro.com')) {
      const parts = h.split('.')
      const sub = parts.length === 3 ? parts[0] : null
      if (sub && boot.slug !== sub) return
    }
    applyShellTheme(boot.template, boot.primaryColor || undefined, boot.accentColor || undefined)
  } catch { /* silent — never block mount */ }
})()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
