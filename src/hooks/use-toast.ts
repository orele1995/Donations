import * as React from 'react'

type ToastActionElement = React.ReactElement<unknown>

export interface ToastItem {
  id: string
  title?: string
  description?: string
  action?: ToastActionElement
  variant?: 'default' | 'destructive'
}

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

type Action =
  | { type: 'ADD'; toast: ToastItem }
  | { type: 'UPDATE'; toast: Partial<ToastItem> & { id: string } }
  | { type: 'DISMISS'; toastId?: string }
  | { type: 'REMOVE'; toastId?: string }

interface State {
  toasts: ToastItem[]
}

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }
const timeouts = new Map<string, ReturnType<typeof setTimeout>>()

function dispatch(action: Action): void {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD':
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) }
    case 'UPDATE':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      }
    case 'DISMISS': {
      const { toastId } = action
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          toastId === undefined || t.id === toastId ? { ...t } : t,
        ),
      }
    }
    case 'REMOVE':
      if (action.toastId === undefined) {
        return { ...state, toasts: [] }
      }
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.toastId) }
    default:
      return state
  }
}

function scheduleRemove(id: string): void {
  if (timeouts.has(id)) {
    clearTimeout(timeouts.get(id))
  }
  const timeout = setTimeout(() => {
    dispatch({ type: 'REMOVE', toastId: id })
    timeouts.delete(id)
  }, TOAST_REMOVE_DELAY)
  timeouts.set(id, timeout)
}

export function toast({
  title,
  description,
  action,
  variant = 'default',
}: Omit<ToastItem, 'id'>): { id: string; dismiss: () => void; update: (t: Partial<ToastItem>) => void } {
  const id = crypto.randomUUID()
  dispatch({ type: 'ADD', toast: { id, title, description, action, variant } })
  scheduleRemove(id)

  return {
    id,
    dismiss: () => dispatch({ type: 'DISMISS', toastId: id }),
    update: (props) => dispatch({ type: 'UPDATE', toast: { ...props, id } }),
  }
}

export function useToast(): {
  toasts: ToastItem[]
  toast: typeof toast
  dismiss: (toastId?: string) => void
} {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS', toastId }),
  }
}
