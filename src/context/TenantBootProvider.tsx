import { createContext, useContext, useState, useEffect, useLayoutEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { applyTheme } from '../lib/shellThemes'
import TenantBootSkeleton from './TenantBootSkeleton'
import { prefetchAllPageContent } from '../hooks/usePageContent'

export type TenantBoot = {
  id: string; slug: string; name: string; template: string
  primaryColor: string; accentColor: string; logoUrl: string | null; ctaText: string
}

interface TenantBootCtx { status: 'loading' | 'ready' | 'idle' | 'error'; tenant: TenantBoot | null; error: string | null; refetch: () => void }

const Ctx = createContext<TenantBootCtx | null>(null)
const HOST = typeof window !== 'undefined' ? window.location.hostname : ''
const CACHE_KEY = `pfp_tenant_boot_v2:${HOST}`

// Raw shape from RPC / localStorage
interface RawBoot { id: string; slug: string; name: string; template: string; primary_color: string; accent_color: string; logo_url: string; cta_text: string }

function mapRaw(r: RawBoot): TenantBoot {
  return { id: r.id, slug: r.slug, name: r.name, template: r.template, primaryColor: r.primary_color, accentColor: r.accent_color, logoUrl: r.logo_url || null, ctaText: r.cta_text }
}

function readCache(): TenantBoot | null {
  // Check window.__TENANT_BOOT__ first (injected by index.html boot script)
  const wb = typeof window !== 'undefined' ? (window as any).__TENANT_BOOT__ as RawBoot | undefined : undefined
  if (wb?.id && wb?.template) return mapRaw(wb)
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) { const r = JSON.parse(raw) as RawBoot; if (r?.id) return mapRaw(r) }
  } catch { /* silent */ }
  return null
}

function writeCache(raw: RawBoot): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(raw))
    if (typeof window !== 'undefined') (window as any).__TENANT_BOOT__ = raw
  } catch { /* silent */ }
}

function isAdminPath() { const p = window.location.pathname; return p.startsWith('/admin') || p.startsWith('/ironwood') }

export function TenantBootProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantBoot | null>(() => isAdminPath() ? null : readCache())
  const [status, setStatus] = useState<'loading' | 'ready' | 'idle' | 'error'>(() => {
    if (isAdminPath()) return 'idle'
    return readCache() ? 'ready' : 'loading'
  })
  const [error, setError] = useState<string | null>(null)
  const [fetchKey, setFetchKey] = useState(0)

  useLayoutEffect(() => {
    const cached = readCache()
    if (cached) applyTheme(cached.template, cached.primaryColor || undefined, cached.accentColor || undefined)
  }, []) // eslint-disable-line

  useEffect(() => {
    if (isAdminPath()) return
    const cached = readCache()
    if (cached) {
      // Already have data — prefetch content and stop
      prefetchAllPageContent(cached.id).catch(() => {})
      return
    }
    const slug = HOST.split('.')[0]
    Promise.resolve(supabase.rpc('get_tenant_boot', { slug_param: slug }))
      .then(({ data, error: err }) => {
        if (err || !data) { setStatus('error'); setError('Tenant not found'); return }
        const raw = data as RawBoot
        const boot = mapRaw(raw)
        applyTheme(boot.template, boot.primaryColor || undefined, boot.accentColor || undefined)
        writeCache(raw)
        setTenant(boot)
        setStatus('ready')
        prefetchAllPageContent(boot.id).catch(() => {})
      })
      .catch(() => { setStatus('error'); setError('Boot failed') })
  }, [fetchKey]) // eslint-disable-line

  if (status === 'loading') return <TenantBootSkeleton />
  return <Ctx.Provider value={{ status, tenant, error, refetch: () => setFetchKey(k => k + 1) }}>{children}</Ctx.Provider>
}

export function useTenantBoot(): TenantBootCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTenantBoot must be used inside TenantBootProvider')
  return ctx
}

export function useTenant(): TenantBoot {
  const { tenant, status } = useTenantBoot()
  if (!tenant || status !== 'ready') throw new Error('useTenant called before boot is ready')
  return tenant
}
