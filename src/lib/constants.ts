export const MAASER_RATE = 0.1
export const UNDO_DELETE_MS = 5000
export const AUTOSAVE_DEBOUNCE_MS = 800

export const COLLECTIONS = {
  households: 'households',
  householdMembers: 'householdMembers',
  householdSettings: 'householdSettings',
  householdInvites: 'householdInvites',
  monthlyReports: 'monthlyReports',
  fixedDonations: 'fixedDonations',
  auditLogs: 'auditLogs',
  userProfiles: 'userProfiles',
} as const

export const MONTH_NAMES_HE = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
] as const
