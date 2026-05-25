export type MemberRole = 'owner' | 'member'

export type AuditActionType = 'create' | 'update' | 'delete' | 'restore'

export type AuditEntityType =
  | 'monthlyReport'
  | 'fixedDonation'
  | 'income'
  | 'oneTimeDonation'
  | 'householdSettings'
  | 'household'
  | 'householdMember'

export interface Household {
  id: string
  name: string
  createdAt: string
  createdBy: string
}

export interface HouseholdMember {
  id: string
  householdId: string
  userId: string
  email: string
  displayName: string
  photoURL: string | null
  role: MemberRole
  joinedAt: string
}

export interface HouseholdSettings {
  id: string
  householdId: string
  updatedAt: string
  updatedBy: string
}

export interface HouseholdInvite {
  id: string
  householdId: string
  code: string
  createdBy: string
  createdAt: string
  expiresAt: string
}

export interface MemberIncomeEntry {
  memberId: string
  memberName: string
  amount: number
}

export interface AdditionalIncomeEntry {
  id: string
  description: string
  amount: number
}

export interface OneTimeDonation {
  id: string
  description: string
  amount: number
  receiptUrl: string | null
  donatedAt: string
}

export interface FixedDonationSnapshot {
  donationId: string
  name: string
  amount: number
}

export interface MonthlyReport {
  id: string
  householdId: string
  year: number
  month: number
  memberIncomes: MemberIncomeEntry[]
  additionalIncome: AdditionalIncomeEntry[]
  oneTimeDonations: OneTimeDonation[]
  fixedDonationSnapshots: FixedDonationSnapshot[]
  applyCreditFromPrevious: boolean
  creditFromPreviousMonth: number
  totalIncome: number
  maaserRequired: number
  openingDebt: number
  openingCredit: number
  adjustedMaaserRequirement: number
  fixedDonationsTotal: number
  oneTimeDonationsTotal: number
  remainingBalance: number
  closingDebt: number
  closingCredit: number
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  /** @deprecated Legacy – migrated to memberIncomes on read */
  salaryHusband?: number
  /** @deprecated Legacy – migrated to memberIncomes on read */
  salaryWife?: number
}

export interface FixedDonation {
  id: string
  householdId: string
  name: string
  amount: number
  startYear: number
  startMonth: number
  endYear: number | null
  endMonth: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface AuditLogEntry {
  id: string
  householdId: string
  userId: string
  userDisplayName: string
  actionType: AuditActionType
  entityType: AuditEntityType
  entityId: string
  beforeState: Record<string, unknown> | null
  afterState: Record<string, unknown> | null
  timestamp: string
  monthKey: string | null
}

export interface ReportCalculations {
  totalIncome: number
  maaserRequired: number
  adjustedMaaserRequirement: number
  fixedDonationsTotal: number
  oneTimeDonationsTotal: number
  remainingBalance: number
  closingDebt: number
  closingCredit: number
  maaserPaidTotal: number
}

export interface MonthKey {
  year: number
  month: number
}

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  activeHouseholdId: string | null
}

export type MonthStatus = 'positive' | 'negative' | 'balanced'
