import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'

interface Props {
  tenantId: string
  logoUrl: string
  faviconUrl: string
  onChange: (field: 'logo_url' | 'favicon_url', value: string) => void
}

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

export default function BrandingLogo({ tenantId, logoUrl, faviconUrl, onChange }: Props) {
  const [uploadingLogo, setUploadingLogo]       = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [confirmRemove, setConfirmRemove]       = useState<'logo' | 'favicon' | null>(null)

  async function upload(field: 'logo_url' | 'favicon_url', file: File, pathSuffix: string) {
    const ext  = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `${tenantId}/${pathSuffix}.${ext}`
    const setUploading = field === 'logo_url' ? setUploadingLogo : setUploadingFavicon
    setUploading(true)
    const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
    if (error) { toast.error('Upload failed: ' + error.message); setUploading(false); return }
    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    onChange(field, data.publicUrl)
    setUploading(false)
    toast.success(`${field === 'logo_url' ? 'Logo' : 'Favicon'} uploaded — save branding to apply.`)
  }

  function handleRemove(field: 'logo_url' | 'favicon_url') {
    onChange(field, '')
    setConfirmRemove(null)
    toast.success(`${field === 'logo_url' ? 'Logo' : 'Favicon'} removed — save branding to apply.`)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
      {/* Logo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo</label>
        {logoUrl && (
          <div className="flex items-center gap-3 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <img src={logoUrl} alt="Logo" className="h-10 max-w-[120px] object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <div className="flex gap-2 ml-auto">
              <label className="cursor-pointer text-xs font-medium text-emerald-700 border border-emerald-300 px-2 py-1 rounded hover:bg-emerald-50 transition">
                {uploadingLogo ? 'Uploading…' : 'Replace'}
                <input type="file" className="hidden" accept="image/*" disabled={uploadingLogo}
                  onChange={e => e.target.files?.[0] && upload('logo_url', e.target.files[0], 'logo')} />
              </label>
              {confirmRemove === 'logo' ? (
                <>
                  <button onClick={() => handleRemove('logo_url')} className="text-xs text-red-600 border border-red-300 px-2 py-1 rounded hover:bg-red-50 transition">Confirm</button>
                  <button onClick={() => setConfirmRemove(null)} className="text-xs text-gray-500 border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 transition">Cancel</button>
                </>
              ) : (
                <button onClick={() => setConfirmRemove('logo')} className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded hover:bg-red-50 transition">Remove</button>
              )}
            </div>
          </div>
        )}
        {!logoUrl && (
          <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition w-fit">
            {uploadingLogo ? 'Uploading…' : '+ Upload Logo'}
            <input type="file" className="hidden" accept="image/*" disabled={uploadingLogo}
              onChange={e => e.target.files?.[0] && upload('logo_url', e.target.files[0], 'logo')} />
          </label>
        )}
        <p className="text-xs text-gray-400 mt-1">Best: PNG transparent bg, 200×60px</p>
      </div>

      {/* Favicon */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Favicon</label>
        {faviconUrl && (
          <div className="flex items-center gap-3 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <img src={faviconUrl} alt="Favicon" className="w-8 h-8 object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <div className="flex gap-2 ml-auto">
              <label className="cursor-pointer text-xs font-medium text-emerald-700 border border-emerald-300 px-2 py-1 rounded hover:bg-emerald-50 transition">
                {uploadingFavicon ? 'Uploading…' : 'Replace'}
                <input type="file" className="hidden" accept="image/*" disabled={uploadingFavicon}
                  onChange={e => e.target.files?.[0] && upload('favicon_url', e.target.files[0], 'favicon')} />
              </label>
              {confirmRemove === 'favicon' ? (
                <>
                  <button onClick={() => handleRemove('favicon_url')} className="text-xs text-red-600 border border-red-300 px-2 py-1 rounded hover:bg-red-50 transition">Confirm</button>
                  <button onClick={() => setConfirmRemove(null)} className="text-xs text-gray-500 border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 transition">Cancel</button>
                </>
              ) : (
                <button onClick={() => setConfirmRemove('favicon')} className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded hover:bg-red-50 transition">Remove</button>
              )}
            </div>
          </div>
        )}
        {!faviconUrl && (
          <>
            <input type="text" value={faviconUrl} onChange={e => onChange('favicon_url', e.target.value)}
              placeholder="https://example.com/favicon.ico" className={inputClass} />
            <label className="flex items-center gap-2 cursor-pointer mt-1.5 px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition w-fit">
              {uploadingFavicon ? 'Uploading…' : '+ Upload Favicon'}
              <input type="file" className="hidden" accept="image/*" disabled={uploadingFavicon}
                onChange={e => e.target.files?.[0] && upload('favicon_url', e.target.files[0], 'favicon')} />
            </label>
          </>
        )}
        <p className="text-xs text-gray-400 mt-1">Best: PNG or ICO, 32×32px</p>
      </div>
    </div>
  )
}
