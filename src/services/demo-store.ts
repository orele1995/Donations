import type {
  AuditLogEntry,
  FixedDonation,
  Household,
  HouseholdMember,
  HouseholdSettings,
  MonthlyReport,
  UserProfile,
} from '@/types'
import { generateId } from '@/lib/utils'
import { SEED_DATA } from '@/seed/data'

const STORAGE_KEY = 'household-tithing-demo'

interface DemoState {
  households: Household[]
  members: HouseholdMember[]
  settings: HouseholdSettings[]
  reports: MonthlyReport[]
  fixedDonations: FixedDonation[]
  auditLogs: AuditLogEntry[]
  userProfiles: UserProfile[]
  invites: { id: string; householdId: string; code: string; expiresAt: string }[]
}

function loadState(): DemoState {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as DemoState
    } catch {
      console.error('Failed to parse demo state')
    }
  }
  return structuredClone(SEED_DATA)
}

function saveState(state: DemoState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

let state = loadState()

export const demoStore = {
  getState: (): DemoState => state,
  reset: (): void => {
    state = structuredClone(SEED_DATA)
    saveState(state)
  },
  persist: (): void => saveState(state),
  update(fn: (s: DemoState) => void): void {
    fn(state)
    saveState(state)
  },
  generateId,
}

export function initDemoStore(): void {
  if (!localStorage.getItem(STORAGE_KEY)) {
    state = structuredClone(SEED_DATA)
    saveState(state)
  }
}
