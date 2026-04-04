import { useState, useRef } from 'react'
import { supabase } from '../../../../lib/supabase'

interface LogoUploadProps {
  value: string
  onChange: (url: string) => void
}

export default function LogoUpload({ value, onChange }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const sessionUuid = useRef(crypto.randomUUID())
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const path = `wizard/${sessionUuid.current}/${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('logos').getPublicUrl(path)
      onChange(data.publicUrl)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleRemove() {
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Upload your logo <span className="text-gray-400 font-normal">(PNG or SVG preferred)</span>
      </label>

      {value ? (
        <div className="flex items-center gap-4 mt-2">
          <img src={value} alt="Logo preview" className="max-h-16 max-w-48 object-contain border border-gray-200 rounded-lg p-1" />
          <button
            type="button"
            onClick={handleRemove}
            className="text-sm text-red-500 hover:text-red-700 underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="mt-1">
          <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition ${uploading ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}>
            <span className="text-sm text-gray-500">
              {uploading ? 'Uploading…' : 'Click to upload'}
            </span>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
              disabled={uploading}
            />
          </label>
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      <button
        type="button"
        onClick={() => onChange('')}
        className="text-xs text-gray-400 hover:text-gray-600 mt-1 underline"
      >
        Skip for now
      </button>
    </div>
  )
}
