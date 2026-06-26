import { useCallback, useRef, useState, type ReactNode } from 'react'
import { UNDO_DELETE_MS } from '@/lib/constants'
import { labels } from '@/lib/hebrew'
import { toast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface PendingDelete<T> {
  item: T
  executeDelete: () => Promise<void>
  onRestore?: (item: T) => Promise<void>
}

export function useConfirmDelete<T>(): {
  requestDelete: (options: {
    item: T
    title?: string
    description?: string
    executeDelete: () => Promise<void>
    onRestore?: (item: T) => Promise<void>
  }) => void
  dialog: ReactNode
} {
  const [pending, setPending] = useState<PendingDelete<T> | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)

  const clearTimer = (): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const runDelete = useCallback(async (options: PendingDelete<T>) => {
    cancelledRef.current = false
    clearTimer()

    timerRef.current = setTimeout(() => {
      if (!cancelledRef.current) {
        void options.executeDelete()
      }
      timerRef.current = null
    }, UNDO_DELETE_MS)

    const { dismiss } = toast({
      title: labels.deleted,
      description: labels.undoDeleteHint,
      action: options.onRestore ? (
        <button
          type="button"
          className="rounded border px-2 py-1 text-sm"
          onClick={() => {
            cancelledRef.current = true
            clearTimer()
            void options.onRestore?.(options.item)
            dismiss()
            toast({ title: labels.undo, description: labels.saved })
          }}
        >
          {labels.undo}
        </button>
      ) : undefined,
    })
  }, [])

  const requestDelete = useCallback(
    (options: {
      item: T
      title?: string
      description?: string
      executeDelete: () => Promise<void>
      onRestore?: (item: T) => Promise<void>
    }) => {
      setPending({
        item: options.item,
        executeDelete: options.executeDelete,
        onRestore: options.onRestore,
      })
    },
    [],
  )

  const dialog = (
    <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>{labels.confirmDelete}</AlertDialogTitle>
          <AlertDialogDescription>{labels.confirmDeleteDesc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (pending) {
                void runDelete(pending)
                setPending(null)
              }
            }}
          >
            {labels.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return { requestDelete, dialog }
}
