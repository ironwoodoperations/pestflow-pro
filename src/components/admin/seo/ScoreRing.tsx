export default function ScoreRing({ score, label }: { score: number | null; label: string }) {
  const color =
    score === null ? '#9ca3af'
    : score >= 90 ? '#10b981'
    : score >= 50 ? '#f59e0b'
    : '#ef4444'
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = score !== null ? (score / 100) * circ : 0

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
        <text x="36" y="41" textAnchor="middle" fontSize="16"
          fontWeight="bold" fill={color}>
          {score ?? '\u2013'}
        </text>
      </svg>
      <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
    </div>
  )
}
