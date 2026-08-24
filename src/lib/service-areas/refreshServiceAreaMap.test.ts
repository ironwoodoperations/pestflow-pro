import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { refreshServiceAreaMap, refreshMessage } from './refreshServiceAreaMap'

function client(impl: () => unknown) {
  const invoke = vi.fn(impl)
  return { supabase: { functions: { invoke } } as unknown as SupabaseClient, invoke }
}

describe('refreshServiceAreaMap calls the generator with the tenant', () => {
  it('invokes the edge function and reports success', async () => {
    const { supabase, invoke } = client(() => ({ data: { ok: true, cities: 5, failures: [] }, error: null }))
    const result = await refreshServiceAreaMap(supabase, 'tenant-1')
    expect(invoke).toHaveBeenCalledWith('service-area-map', { body: { tenant_id: 'tenant-1' } })
    expect(result).toEqual({ ok: true, failures: [], cities: 5 })
  })

  it('does not call the generator with no tenant', async () => {
    const { supabase, invoke } = client(() => ({ data: null, error: null }))
    expect(await refreshServiceAreaMap(supabase, null)).toEqual({ ok: false, error: 'no tenant' })
    expect(await refreshServiceAreaMap(supabase, '')).toEqual({ ok: false, error: 'no tenant' })
    expect(invoke).not.toHaveBeenCalled()
  })

  it('reports a transport error rather than claiming success', async () => {
    const { supabase } = client(() => ({ data: null, error: { message: 'network down' } }))
    expect(await refreshServiceAreaMap(supabase, 't')).toEqual({ ok: false, error: 'network down' })
  })

  it('reports an error the function returned in its BODY, not just a transport failure', async () => {
    // The generator answers 500 with { error }, which arrives as data, not error.
    const { supabase } = client(() => ({ data: { error: 'static maps 403' }, error: null }))
    expect(await refreshServiceAreaMap(supabase, 't')).toEqual({ ok: false, error: 'static maps 403' })
  })

  it('a thrown invoke is caught, not propagated into the save path', async () => {
    const { supabase } = client(() => { throw new Error('boom') })
    expect(await refreshServiceAreaMap(supabase, 't')).toEqual({ ok: false, error: 'boom' })
  })
})

describe('refreshMessage says only what is worth saying', () => {
  it('says nothing on a clean refresh', () => {
    expect(refreshMessage({ ok: true, failures: [], cities: 5 })).toBeNull()
    expect(refreshMessage({ ok: true })).toBeNull()
  })

  it('names the cities that could not be located', () => {
    // Nine of dang's eighteen cities have no state recorded, so an ungeocodable
    // city is not hypothetical — and it is silently absent from the map.
    const msg = refreshMessage({ ok: true, failures: ['Chapel Hill: no geocoder match', 'Arp: no geocoder match'] })
    expect(msg).toContain('Chapel Hill')
    expect(msg).toContain('Arp')
    expect(msg).not.toContain('no geocoder match')
  })

  it('surfaces a failure', () => {
    expect(refreshMessage({ ok: false, error: 'static maps 403' })).toBe('Map not updated: static maps 403')
    expect(refreshMessage({ ok: false })).toContain('unknown error')
  })
})

describe('ALL THREE mutation paths regenerate the map', () => {
  // Saving, deleting and toggling-live each change the live city set. A path
  // that skipped this would leave a stored map whose revision no longer
  // matches, and the page would then render no map at all. "Fix one, leave the
  // other" is the failure S290 and S292 were each caught by.
  const source = readFileSync(new URL('../../components/admin/LocationsTab.tsx', import.meta.url), 'utf8')

  it('LocationsTab is the file this guard thinks it is', () => {
    expect(source).toContain('export default function LocationsTab')
    expect(source.length).toBeGreaterThan(2000)
  })

  it('has exactly the three mutation handlers this guard knows about', () => {
    // If a FOURTH way to change the city set is added, this fails and forces
    // the author to decide whether it needs the call — rather than the map
    // silently going stale down a path nobody listed.
    const handlers = source.match(/async function (handleSave|handleDelete|toggleLive)\b/g) ?? []
    expect(handlers.sort()).toEqual([
      'async function handleDelete',
      'async function handleSave',
      'async function toggleLive',
    ])
  })

  // ONE slicer, used by the assertion AND by its own vacuity check below.
  // Two copies of this logic is how the first version of this file passed with
  // a slicer that handed every handler the entire file: the vacuity test was
  // exercising its own private copy, not the one under load.
  function handlerBody(name: string): string {
    const start = source.indexOf(`async function ${name}(`)
    if (start === -1) return ''
    // Up to the next top-level `async function`, which is the next handler.
    const next = source.indexOf('\n  async function ', start + 1)
    return source.slice(start, next === -1 ? source.length : next)
  }

  it('every one of the three calls regenerateMap', () => {
    for (const name of ['handleSave', 'handleDelete', 'toggleLive']) {
      const body = handlerBody(name)
      expect(body, `${name} not found`).not.toBe('')
      expect(body, `${name} does not regenerate the map`).toContain('regenerateMap()')
    }
  })

  it('the slicer really isolates one handler — the SAME slicer used above', () => {
    const body = handlerBody('handleDelete')
    expect(body).toContain('handleDelete')
    // handleSave precedes it and toggleLive follows it: a slicer that ran to
    // either end of the file would pick one of them up.
    expect(body).not.toContain('async function handleSave')
    expect(body).not.toContain('async function toggleLive')
    expect(body.length).toBeLessThan(source.length / 3)
    // …and it is not returning '' for everything, which would also "pass".
    expect(handlerBody('handleSave')).not.toBe('')
    expect(handlerBody('noSuchHandler')).toBe('')
  })

  it('regenerateMap really calls the helper, and is defined once', () => {
    expect(source.match(/async function regenerateMap\(/g)).toHaveLength(1)
    expect(source).toContain('refreshServiceAreaMap(supabase, tenantId)')
    expect(source).toContain("from '../../lib/service-areas/refreshServiceAreaMap'")
  })
})
