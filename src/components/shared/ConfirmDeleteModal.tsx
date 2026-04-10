import { useEffect, useRef } from 'react'

interface Props {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  itemName: string
}

export default function ConfirmDeleteModal({ isOpen, onConfirm, onCancel, itemName }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Focus cancel button on open so Enter/Space can't accidentally confirm
  useEffect(() => {
    if (isOpen) cancelRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-sm w-full space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h4 className="font-bold text-white text-base">Delete Permanently</h4>
        <p className="text-sm text-gray-300">
          Are you sure you want to permanently delete{' '}
          <strong className="text-white">{itemName}</strong>?
        </p>
        <p className="text-xs font-semibold text-red-400">
          This is permanent and cannot be undone.
        </p>
        <div className="flex gap-3 pt-1">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition"
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  )
}
