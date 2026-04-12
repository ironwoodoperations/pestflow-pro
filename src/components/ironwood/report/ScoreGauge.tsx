interface Props {
  score: number | null
  label: string
  size?: number
  loading?: boolean
}

export function scoreColor(score: number): string {
  if (score >= 90) return '#22c55e'
  if (score >= 70) return '#f59e0b'
  return '#ef4444'
}

const PULSE_STYLE = `
  @keyframes pfp-gauge-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.35; }
  }
`

export default function ScoreGauge({ score, label, size = 100, loading = false }: Props) {
  const r   = (size / 2) * 0.84
  const cx  = size / 2
  const cy  = size / 2

  // Pulsing placeholder while PageSpeed is fetching
  if (loading) {
    return (
      <div style={{ textAlign: 'center', width: size }}>
        <style>{PULSE_STYLE}</style>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
          style={{ animation: 'pfp-gauge-pulse 1.4s ease-in-out infinite' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#d1d5db" strokeWidth={size * 0.08} />
          <text x={cx} y={cy + 5} textAnchor="middle" fontSize={size * 0.16} fill="#9ca3af">···</text>
        </svg>
        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{label}</p>
      </div>
    )
  }

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

  const color        = scoreColor(score)
  const circumference = 2 * Math.PI * r
  const offset       = circumference * (1 - score / 100)

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
