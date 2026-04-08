import { GUIDE_SECTIONS } from './repGuideContent'
import type { GuideItem } from './repGuideContent'

interface Props {
  section: string | null
  onClose: () => void
}

function renderItem(item: GuideItem, key: number, stepNum: number) {
  switch (item.type) {
    case 'heading':
      return <p key={key} className="font-bold text-gray-800 mt-4 mb-1 text-sm">{item.text}</p>
    case 'body':
      return <p key={key} className="text-gray-600 text-sm mb-2">{item.text}</p>
    case 'bullet':
      return <p key={key} className="text-gray-700 text-sm ml-4 mb-1">• {item.text}</p>
    case 'step':
      return <p key={key} className="text-gray-700 text-sm ml-4 mb-1">{stepNum}. {item.text}</p>
    case 'tip':
      return (
        <p key={key} className="text-xs bg-green-50 text-green-800 rounded px-2 py-1 mb-1">
          ✓ {item.text}
        </p>
      )
    case 'warn':
      return (
        <p key={key} className="text-xs bg-amber-50 text-amber-800 rounded px-2 py-1 mb-1">
          ⚠ {item.text}
        </p>
      )
    default:
      return null
  }
}

export default function RepGuideDrawer({ section, onClose }: Props) {
  if (!section) return null
  const guide = GUIDE_SECTIONS[section]
  if (!guide) return null

  let stepNum = 0
  const renderedItems = guide.items.map((item, i) => {
    if (item.type === 'step') stepNum++
    return renderItem(item, i, stepNum)
  })

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <h2 className="font-bold text-gray-900 text-base">{guide.title}</h2>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {renderedItems}
        </div>
      </div>
    </>
  )
}
