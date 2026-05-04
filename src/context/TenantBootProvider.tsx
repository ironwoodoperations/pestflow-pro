import { createContext, useContext, useState, useEffect, useLayoutEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { applyTheme } from '../lib/shellThemes'
import TenantBootSkeleton from './TenantBootSkeleton'
import { prefetchAllPageContent } from '../hooks/usePageContent'
import { resolveTenantId } from '../lib/subdomainRouter'

export type TenantBoot = {
  id: string; slug: string; name: string; template: string
  primaryColor: string; accentColor: string; logoUrl: string | null; ctaText: string
}

export type TenantBootStatus =
  | { status: 'loading' }
  | { status: 'error'; reason: 'not_found' | 'network' | 'unknown'; message: string }
  | { status: 'ready'; tenant: TenantBoot }
  | { status: 'marketing' }

interface TenantBootCtx { status: 'loading' | 'ready' | 'error'; tenant: TenantBoot | null; error: string | null; refetch: () => void }

const Ctx = createContext<TenantBootCtx | null>(null)
const HOST = typeof window !== 'undefined' ? window.location.hostname : ''
const CACHE_KEY = `pfp_tenant_boot_v2:${HOST}`
const MARKETING_HOSTS = new Set(['pestflowpro.com', 'www.pestflowpro.com'])
const IS_MARKETING_HOST = MARKETING_HOSTS.has(HOST)

// Raw shape from RPC / localStorage
interface RawBoot { id: string; slug: string; name: string; theme: string; primary_color: string; accent_color: string; logo_url: string; cta_text: string }

function mapRaw(r: RawBoot): TenantBoot {
  return { id: r.id, slug: r.slug, name: r.name, template: r.theme, primaryColor: r.primary_color, accentColor: r.accent_color, logoUrl: r.logo_url || null, ctaText: r.cta_text }
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

function TenantNotFound({ message }: { message: string }) {
  return (
    <div
      role="main"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', padding: '2rem',
        fontFamily: 'system-ui, sans-serif', textAlign: 'center', gap: '1rem',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Site Not Found</h1>
      <p style={{ maxWidth: '40ch', color: '#555', margin: 0 }}>{message}</p>
      <a href="https://pestflowpro.com" style={{ color: '#f97316', textDecoration: 'underline' }}>
        ← Go to PestFlow Pro
      </a>
    </div>
  )
}

export function TenantBootProvider({ children }: { children: ReactNode }) {
  const [bootState, setBootState] = useState<TenantBootStatus>(() => {
    if (IS_MARKETING_HOST) return { status: 'marketing' }
    const cached = readCache()
    return cached ? { status: 'ready', tenant: cached } : { status: 'loading' }
  })
  const [fetchKey, setFetchKey] = useState(0)

  useLayoutEffect(() => {
    if (IS_MARKETING_HOST) return
    const cached = readCache()
    if (cached) applyTheme(cached.template, cached.primaryColor || undefined, cached.accentColor || undefined)
  }, [])

  useEffect(() => {
    if (IS_MARKETING_HOST) return
    const cached = readCache()
    if (cached) {
      // Already have data — prefetch content and stop
      prefetchAllPageContent(cached.id).catch(() => {})
      return
    }
    const hostname = window.location.hostname
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) {
        setBootState({
          status: 'error',
          reason: 'not_found',
          message: `No PestFlow Pro tenant found for hostname '${hostname}'. If you typed the URL, double-check the subdomain.`,
        })
        return
      }
      try {
        // Resolve slug from tenant ID (needed for SECURITY DEFINER RPC)
        const { data: tenantRow, error: slugErr } = await supabase
          .from('tenants')
          .select('slug')
          .eq('id', tenantId)
          .maybeSingle()
        if (slugErr || !tenantRow?.slug) {
          setBootState({ status: 'error', reason: 'not_found', message: 'Tenant record not found.' })
          return
        }
        const { data, error: rpcErr } = await supabase.rpc('get_tenant_boot', { slug_param: tenantRow.slug })
        if (rpcErr || !data) {
          setBootState({ status: 'error', reason: 'not_found', message: 'Tenant configuration not found.' })
          return
        }
        const raw = data as RawBoot
        const boot = mapRaw(raw)
        applyTheme(boot.template, boot.primaryColor || undefined, boot.accentColor || undefined)
        writeCache(raw)
        setBootState({ status: 'ready', tenant: boot })
        prefetchAllPageContent(boot.id).catch(() => {})
      } catch {
        setBootState({ status: 'error', reason: 'network', message: 'Failed to load site configuration. Please try again.' })
      }
    })
  }, [fetchKey])

  if (bootState.status === 'loading') return <TenantBootSkeleton />
  if (bootState.status === 'error') return <TenantNotFound message={bootState.message} />

  if (bootState.status === 'marketing') {
    // S189: Marketing apex hosts (pestflowpro.com, www.pestflowpro.com) bypass
    // tenant resolution. App.tsx's RootRoute renders MarketingLanding for these
    // hosts. We provide a permissive null-tenant context so downstream providers
    // (PlanProvider, TemplateProvider) and analytics hooks mount cleanly.
    // This is NOT the old VITE_TENANT_ID leak — only specific apex hostnames
    // bypass, and they bypass to static content (no tenant data).
    return (
      <Ctx.Provider value={{ status: 'ready', tenant: null, error: null, refetch: () => {} }}>
        {children}
      </Ctx.Provider>
    )
  }

  const ctxValue: TenantBootCtx = {
    status: 'ready',
    tenant: bootState.tenant,
    error: null,
    refetch: () => setFetchKey(k => k + 1),
  }

  return <Ctx.Provider value={ctxValue}>{children}</Ctx.Provider>
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
