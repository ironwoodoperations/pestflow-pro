import { useEffect, useRef } from 'react'
import { restoreRecord } from '../../lib/archiveUtils'
import { supabase } from '../../lib/supabase'

interface Props {
  table: string
  id: string
  label: string          // e.g. "Lead archived"
  onDismiss: () => void  // called after auto-dismiss or after undo
}

export default function UndoToast({ table, id, label, onDismiss }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 5000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [onDismiss])

  const handleUndo = async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    await restoreRecord(table, id, supabase)
    onDismiss()
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-4 py-3 shadow-lg">
      <span>{label}</span>
      <button
        onClick={handleUndo}
        className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded transition"
      >
        Undo
      </button>
    </div>
  )
}
