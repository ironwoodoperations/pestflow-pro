interface Props {
  onGoLive: () => void
}

export default function DemoBanner({ onGoLive }: Props) {
  return (
    <div className="bg-yellow-400 text-yellow-900 px-4 py-2 flex items-center justify-between text-sm font-medium">
      <span>🎭 Demo Mode active — this data is for demonstration only.</span>
      <button
        onClick={onGoLive}
        className="ml-4 px-3 py-1 bg-yellow-900 text-yellow-100 rounded text-xs font-semibold hover:bg-yellow-800"
      >
        Go Live →
      </button>
    </div>
  )
}
