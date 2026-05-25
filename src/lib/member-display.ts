export const FALLBACK_DISPLAY_NAME = 'משתמש ללא שם'

export function resolveMemberDisplayName(
  displayName: string | null | undefined,
  authName?: string | null,
): string {
  const trimmed = displayName?.trim()
  if (trimmed) return trimmed
  const auth = authName?.trim()
  if (auth) return auth
  return FALLBACK_DISPLAY_NAME
}
