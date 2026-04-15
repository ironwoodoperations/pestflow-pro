import { createContext, useContext, useState, useEffect, useLayoutEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import { applyShellTheme } from '../lib/shellThemes'
import TenantBootSkeleton from './TenantBootSkeleton'

export type TenantBoot = {
  id: string
  slug: string
  name: string
  template: string
  primaryColor: string
  accentColor: string
  logoUrl: string | null
  ctaText: string
}

type Status = 'loading' | 'ready' | 'idle' | 'error'

interface TenantBootContextValue {
  status: Status
  tenant: TenantBoot | null
  error: string | null
  refetch: () => void
}

const CACHE_KEY = 'pfp_tenant_boot_v2'
const Ctx = createContext<TenantBootContextValue | null>(null)

function isAdminPath(): boolean {
  const p = window.location.pathname
  return p.startsWith('/admin') || p.startsWith('/ironwood')
}

function getSubdomain(): string | null {
  const h = window.location.hostname
  if (h.endsWith('.pestflowpro.com')) {
    const parts = h.split('.')
    return parts.length === 3 ? parts[0] : null
  }
  return null
}

function readCache(): TenantBoot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as TenantBoot) : null
  } catch { return null }
}

function writeCache(data: TenantBoot): void {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)) } catch { /* silent */ }
}

export function TenantBootProvider({ children }: { children: ReactNode }) {
  // Compute initial state synchronously from localStorage — no async, no flash
  const [cached] = useState<TenantBoot | null>(() => {
    if (isAdminPath()) return null
    const sub = getSubdomain()
    const raw = readCache()
    return raw && (!sub || raw.slug === sub) ? raw : null
  })

  const [status, setStatus] = useState<Status>(() =>
    isAdminPath() ? 'idle' : cached ? 'ready' : 'loading'
  )
  const [tenant, setTenant] = useState<TenantBoot | null>(cached)
  const [error, setError] = useState<string | null>(null)
  const [fetchKey, setFetchKey] = useState(0)

  // Apply cached theme before first paint (eliminates flash on repeat visits)
  useLayoutEffect(() => {
    if (cached) {
      applyShellTheme(cached.template, cached.primaryColor || undefined, cached.accentColor || undefined)
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (isAdminPath()) return
    const isBackground = !!cached

    async function doFetch() {
      try {
        const tenantId = await resolveTenantId()
        if (!tenantId) {
          if (!isBackground) { setStatus('error'); setError('Tenant not found') }
          return
        }
        const [tRes, bRes] = await Promise.all([
          supabase.from('tenants').select('id,slug,name').eq('id', tenantId).maybeSingle(),
          supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
        ])
        const t = tRes.data
        if (!t) { if (!isBackground) setStatus('error'); return }
        const br = bRes.data?.value ?? {}
        const boot: TenantBoot = {
          id: t.id,
          slug: t.slug,
          name: t.name,
          template: br.template || 'modern-pro',
          primaryColor: br.primary_color || '',
          accentColor: br.accent_color || '',
          logoUrl: br.logo_url || null,
          ctaText: br.cta_text || 'Get a Free Quote',
        }
        applyShellTheme(boot.template, boot.primaryColor || undefined, boot.accentColor || undefined)
        writeCache(boot)
        setTenant(boot)
        setStatus('ready')
      } catch (e: any) {
        if (!isBackground) { setStatus('error'); setError(e?.message || 'Boot failed') }
      }
    }

    doFetch()
  }, [fetchKey]) // eslint-disable-line

  if (status === 'loading') return <TenantBootSkeleton />

  return (
    <Ctx.Provider value={{ status, tenant, error, refetch: () => setFetchKey(k => k + 1) }}>
      {children}
    </Ctx.Provider>
  )
}

export function useTenantBoot(): TenantBootContextValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTenantBoot must be used inside TenantBootProvider')
  return ctx
}

export function useTenant(): TenantBoot {
  const { tenant, status } = useTenantBoot()
  if (!tenant || status !== 'ready') throw new Error('useTenant called before boot is ready')
  return tenant
}
