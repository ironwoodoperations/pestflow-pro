interface Props {
  score: number | null
  label: string
  size?: number
}

export function scoreColor(score: number): string {
  if (score >= 90) return '#22c55e'
  if (score >= 70) return '#f59e0b'
  return '#ef4444'
}

export default function ScoreGauge({ score, label, size = 100 }: Props) {
  const r = (size / 2) * 0.84
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r

  if (score === null) {
    return (
      <div style={{ textAlign: 'center', width: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={size * 0.08} />
          <text x={cx} y={cy + 5} textAnchor="middle" fontSize={size * 0.14} fill="#9ca3af">N/A</text>
        </svg>
        <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{label}</p>
      </div>
    )
  }

  const color  = scoreColor(score)
  const offset = circumference * (1 - score / 100)

  return (
    <div style={{ textAlign: 'center', width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={size * 0.08} />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none" stroke={color} strokeWidth={size * 0.08}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text x={cx} y={cy + (size * 0.07)} textAnchor="middle"
          fontSize={size * 0.22} fontWeight="700" fill={color}>
          {score}
        </text>
      </svg>
      <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{label}</p>
    </div>
  )
}
