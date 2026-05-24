import { useCallback, useRef } from 'react'
import { UNDO_DELETE_MS } from '@/lib/constants'
import { labels } from '@/lib/hebrew'
import { toast } from '@/hooks/use-toast'

export function useUndoDelete<T>(onRestore: (item: T) => Promise<void>): {
  scheduleDelete: (item: T, executeDelete: () => Promise<void>) => void
} {
  const pendingRef = useRef<{ item: T; timer: ReturnType<typeof setTimeout> } | null>(null)

  const scheduleDelete = useCallback(
    (item: T, executeDelete: () => Promise<void>) => {
      if (pendingRef.current) {
        clearTimeout(pendingRef.current.timer)
      }

      void executeDelete()

      const timer = setTimeout(() => {
        pendingRef.current = null
      }, UNDO_DELETE_MS)

      pendingRef.current = { item, timer }

      const { dismiss, update } = toast({
        title: labels.deleted,
        description: labels.confirmDeleteDesc,
        action: (
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm"
            onClick={() => {
              clearTimeout(timer)
              pendingRef.current = null
              void onRestore(item)
              dismiss()
              toast({ title: labels.undo, description: labels.saved })
            }}
          >
            {labels.undo}
          </button>
        ),
      })

      setTimeout(() => update({ description: undefined }), UNDO_DELETE_MS)
    },
    [onRestore],
  )

  return { scheduleDelete }
}
