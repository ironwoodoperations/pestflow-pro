import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { UploadState, MediaType, UploadNotice } from './useComposer'
import ImageLibraryPicker from './ImageLibraryPicker'

interface Props {
  imageUrl: string
  mediaType?: MediaType
  onImageUrlChange: (v: string) => void
  onFileUpload?: (file: File) => void
  uploadState?: UploadState
  // S250 hotfix: format/size feedback (the real gatekeeper lives in handleFileUpload).
  uploadNotice?: UploadNotice | null
  previewUrl?: string
}

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

function generateTemplateImage(): string {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 630
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#E87800'
  ctx.fillRect(0, 0, 1200, 630)
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.fillRect(0, 540, 1200, 90)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 72px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Your Post Here', 600, 285)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = '32px Arial, sans-serif'
  ctx.fillText('Replace with your photo or design', 600, 370)
  return canvas.toDataURL('image/png')
}

export default function ComposerImagePicker({ imageUrl, mediaType = 'image', onImageUrlChange, onFileUpload, uploadState, uploadNotice, previewUrl }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)

  function handleDownloadTemplate() {
    const dataUrl = generateTemplateImage()
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'post-template.png'
    a.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Validation (format + size) now lives in handleFileUpload — the picker no
    // longer filters by codec, so any source (Photos/Gallery/Drive/Files) works.
    if (onFileUpload) {
      onFileUpload(file)
    } else {
      // fallback: no upload handler wired — use local preview only (should not happen in production)
      const url = URL.createObjectURL(file)
      onImageUrlChange(url)
    }
    e.target.value = ''
  }

  // Show blob: preview while uploading; storage URL after success; text-input URL for paste path
  const displayPreview = uploadState === 'uploading' ? previewUrl : (imageUrl || previewUrl)
  const isVideoMedia = mediaType === 'video'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Photo or Video</h3>
      <p className="text-xs text-gray-500">Upload a photo or video from your phone, gallery, or drive — use <span className="font-medium">Upload Photo or Video</span> for video. The Library holds photos only.</p>
      <p className="text-xs text-gray-500 mb-3">You can post one video <em>or</em> photos — not both. Adding a video replaces a selected photo.</p>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setLibraryOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
        >
          🖼️ Choose Photo from Library
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadState === 'uploading'}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploadState === 'uploading' ? '⏳ Uploading...' : '📁 Upload Photo or Video'}
        </button>
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
        >
          ⬇ Download Template
        </button>
        <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
      </div>

      {uploadNotice && (
        <p className={`text-xs mb-3 ${uploadNotice.type === 'error' ? 'text-red-600' : 'text-amber-600'}`}>{uploadNotice.text}</p>
      )}
      {uploadState === 'error' && (
        <p className="text-xs text-red-600 mb-3">Upload failed — please try again or paste an image URL below.</p>
      )}
      {uploadState === 'success' && (
        <p className="text-xs text-emerald-600 mb-3">{isVideoMedia ? 'Video uploaded successfully.' : 'Image uploaded successfully.'}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Or paste image URL</label>
        <input value={imageUrl} onChange={e => onImageUrlChange(e.target.value)}
          placeholder="https://example.com/image.jpg" className={inputClass} />
      </div>
      {displayPreview && (
        <div className="mt-3 relative inline-block">
          {isVideoMedia ? (
            <video src={displayPreview} controls muted className="w-48 max-h-32 rounded-lg border border-gray-200 bg-black" />
          ) : (
            <img src={displayPreview} alt="Preview" className="w-32 h-24 object-cover rounded-lg border border-gray-200" />
          )}
          {uploadState === 'uploading' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg">
              <span className="text-xs text-gray-500 font-medium">Uploading…</span>
            </div>
          ) : imageUrl && (
            <button
              type="button"
              onClick={() => onImageUrlChange('')}
              className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-1 text-gray-500 hover:text-red-600 shadow-sm"
              aria-label="Clear image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {libraryOpen && (
        <ImageLibraryPicker
          open
          onClose={() => setLibraryOpen(false)}
          onSelect={(url) => { onImageUrlChange(url); setLibraryOpen(false) }}
        />
      )}
    </div>
  )
}
