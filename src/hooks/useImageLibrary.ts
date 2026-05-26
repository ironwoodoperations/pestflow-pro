import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantBootProvider'
import { resizeImage } from '../components/admin/social/lib/resizeImage'

export interface ImageLibraryItem {
  id: string
  tenant_id: string
  bucket_id: string
  storage_path: string
  original_filename: string
  mime_type: string
  size_bytes: number
  width: number | null
  height: number | null
  folder: string | null
  created_at: string
  publicUrl: string
}

type ImageLibraryRow = Omit<ImageLibraryItem, 'publicUrl'>

const BUCKET = 'social-uploads'
const MAX_EDGE = 2048

async function dimsOf(blob: Blob): Promise<{ width: number | null; height: number | null }> {
  try {
    const bmp = await createImageBitmap(blob)
    const dims = { width: bmp.width, height: bmp.height }
    bmp.close?.()
    return dims
  } catch {
    return { width: null, height: null }
  }
}

export function useImageLibrary() {
  const { id: tenantId } = useTenant()
  const [items, setItems] = useState<ImageLibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const withUrl = useCallback((row: ImageLibraryRow): ImageLibraryItem => {
    const { data } = supabase.storage.from(row.bucket_id).getPublicUrl(row.storage_path)
    return { ...row, publicUrl: data.publicUrl }
  }, [])

  const refresh = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    // RLS scopes to the current tenant; active-row filter (deleted_at IS NULL)
    // is applied here — it cannot live in the SELECT policy or soft-delete
    // UPDATEs fail RLS (PG checks the post-update row against the SELECT policy).
    const { data, error: selErr } = await supabase
      .from('image_library')
      .select('id, tenant_id, bucket_id, storage_path, original_filename, mime_type, size_bytes, width, height, folder, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (selErr) { setError(selErr.message); setLoading(false); return }
    setItems((data ?? []).map(withUrl))
    setError(null)
    setLoading(false)
  }, [tenantId, withUrl])

  useEffect(() => { refresh() }, [refresh])

  // Storage-first (validator gate Q3): upload object, then insert row. If the
  // insert fails, compensate by removing the just-uploaded object so we don't
  // leave an orphan.
  const upload = useCallback(async (file: File, folder: string | null = null) => {
    const resized = await resizeImage(file, MAX_EDGE)
    const { width, height } = await dimsOf(resized)
    const storagePath = `${tenantId}/social/${crypto.randomUUID()}.jpg`
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, resized, { contentType: 'image/jpeg', cacheControl: '3600' })
    if (upErr) throw upErr
    const { error: insErr } = await supabase.from('image_library').insert({
      tenant_id: tenantId,
      bucket_id: BUCKET,
      storage_path: storagePath,
      original_filename: file.name,
      mime_type: 'image/jpeg',
      size_bytes: resized.size,
      width,
      height,
      folder,
    })
    if (insErr) {
      await supabase.storage.from(BUCKET).remove([storagePath])
      throw insErr
    }
  }, [tenantId])

  const uploadMany = useCallback(async (files: File[], folder: string | null = null) => {
    const images = files.filter(f => f.type.startsWith('image/'))
    for (const f of images) await upload(f, folder)
    await refresh()
    return images.length
  }, [upload, refresh])

  const softDelete = useCallback(async (id: string) => {
    const { error: delErr } = await supabase
      .from('image_library')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (delErr) throw delErr
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const setFolder = useCallback(async (id: string, folder: string | null) => {
    const { error: updErr } = await supabase
      .from('image_library')
      .update({ folder })
      .eq('id', id)
    if (updErr) throw updErr
    setItems(prev => prev.map(i => (i.id === id ? { ...i, folder } : i)))
  }, [])

  const folders = Array.from(
    new Set(items.map(i => i.folder).filter((f): f is string => !!f))
  ).sort((a, b) => a.localeCompare(b))

  return { items, loading, error, refresh, upload, uploadMany, softDelete, setFolder, folders }
}
