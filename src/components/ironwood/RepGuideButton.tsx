interface Props {
  section: string
  label?: string
  onOpen: (section: string) => void
}

export default function RepGuideButton({ section, label, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onOpen(section); }}
      className="text-xs text-gray-500 border border-gray-300 rounded px-2 py-0.5 hover:bg-gray-100 cursor-pointer"
    >
      {label ?? '? Guide'}
    </button>
  )
}
