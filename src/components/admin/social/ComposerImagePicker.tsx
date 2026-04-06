import { useRef } from 'react'

interface Props {
  imageUrl: string
  onImageUrlChange: (v: string) => void
  onFileUpload?: (file: File) => void
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

export default function ComposerImagePicker({ imageUrl, onImageUrlChange, onFileUpload }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    if (onFileUpload) {
      onFileUpload(file)
    } else {
      const url = URL.createObjectURL(file)
      onImageUrlChange(url)
    }
    e.target.value = ''
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-3">Photo</h3>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
        >
          📁 Upload Photo
        </button>
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
        >
          ⬇ Download Template
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Or paste image URL</label>
        <input value={imageUrl} onChange={e => onImageUrlChange(e.target.value)}
          placeholder="https://example.com/image.jpg" className={inputClass} />
      </div>
      {imageUrl && (
        <div className="mt-3">
          <img src={imageUrl} alt="Preview" className="w-32 h-24 object-cover rounded-lg border border-gray-200" />
        </div>
      )}
    </div>
  )
}
