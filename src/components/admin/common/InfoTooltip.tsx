import { useState, useRef, useEffect, useLayoutEffect, useId } from 'react'
import { Info } from 'lucide-react'
import { METRIC_HELP } from './metricHelp'

// S250: small ⓘ icon shown next to a report metric label. Plain-English copy lives
// in metricHelp.ts. Desktop = hover; touch/keyboard = tap/focus toggle.
// Accessible (aria, Escape, focus), Tailwind-only, no extra deps, no storage.

interface Props {
  /** Key into METRIC_HELP (e.g. 'gsc.impressions'). */
  metricKey: string
  /** Extra classes on the wrapper (spacing tweaks). */
  className?: string
}

export default function InfoTooltip({ metricKey, className = '' }: Props) {
  const entry = METRIC_HELP[metricKey]
  const [open, setOpen] = useState(false)
  // Horizontal nudge (px) applied after measuring, so the bubble never clips the viewport.
  const [offsetX, setOffsetX] = useState(0)
  const wrapRef = useRef<HTMLSpanElement>(null)
  const bubbleRef = useRef<HTMLSpanElement>(null)
  const tooltipId = useId()

  // Close on outside tap (also closes any other open tooltip) and on Escape.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // After the bubble renders centered, measure and clamp it inside the viewport.
  useLayoutEffect(() => {
    if (!open || !bubbleRef.current) return
    const rect = bubbleRef.current.getBoundingClientRect()
    const gutter = 8
    let correction = 0
    if (rect.right > window.innerWidth - gutter) correction = window.innerWidth - gutter - rect.right
    else if (rect.left < gutter) correction = gutter - rect.left
    if (correction !== 0) setOffsetX(prev => prev + correction)
  }, [open])

  if (!entry) return null

  const reopen = () => { setOffsetX(0); setOpen(true) }

  return (
    <span ref={wrapRef} className={`relative inline-flex items-center align-middle ml-1 ${className}`}>
      <button
        type="button"
        aria-label={`What is ${entry.label}?`}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onClick={(e) => { e.stopPropagation(); setOffsetX(0); setOpen(o => !o) }}
        onPointerEnter={(e) => { if (e.pointerType === 'mouse') reopen() }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') setOpen(false) }}
        onFocus={reopen}
        onBlur={() => setOpen(false)}
        className="text-gray-400 hover:text-gray-600 focus:text-gray-600 focus:outline-none cursor-help"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <span
          ref={bubbleRef}
          id={tooltipId}
          role="tooltip"
          style={{ left: '50%', transform: `translateX(calc(-50% + ${offsetX}px))` }}
          className="absolute top-full mt-1 z-50 w-60 max-w-[80vw] rounded-lg bg-gray-900 text-white text-xs leading-snug px-3 py-2 shadow-lg pointer-events-none normal-case"
        >
          <span className="block font-semibold mb-0.5">{entry.label}</span>
          <span className="font-normal text-gray-200">{entry.help}</span>
        </span>
      )}
    </span>
  )
}
