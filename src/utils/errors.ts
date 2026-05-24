import { labels } from '@/lib/hebrew'

export function getHebrewErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as Error & { code?: string }).code
    if (code === 'permission-denied') return labels.errorPermission
    if (code === 'not-found') return labels.errorNotFound
    if (code === 'unauthenticated') return labels.errorAuth
    if (code === 'unavailable') return labels.errorNetwork
  }
  console.error('[שגיאה]', error)
  return labels.errorGeneric
}
