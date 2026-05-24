import type {
  AuditLogEntry,
  FixedDonation,
  Household,
  HouseholdMember,
  HouseholdSettings,
  MonthlyReport,
  UserProfile,
} from '@/types'

const householdId = 'demo-household-1'
const now = new Date().toISOString()

export const DEMO_USER_ID = 'demo-user-1'

export const SEED_DATA: {
  households: Household[]
  members: HouseholdMember[]
  settings: HouseholdSettings[]
  reports: MonthlyReport[]
  fixedDonations: FixedDonation[]
  auditLogs: AuditLogEntry[]
  userProfiles: UserProfile[]
  invites: { id: string; householdId: string; code: string; expiresAt: string }[]
} = {
  households: [
    {
      id: householdId,
      name: 'משפחת כהן',
      createdAt: now,
      createdBy: DEMO_USER_ID,
    },
  ],
  members: [
    {
      id: 'demo-member-1',
      householdId,
      userId: DEMO_USER_ID,
      email: 'demo@example.com',
      displayName: 'משתמש הדגמה',
      photoURL: null,
      role: 'owner',
      joinedAt: now,
    },
  ],
  settings: [
    {
      id: householdId,
      householdId,
      creditCarryForwardEnabled: false,
      updatedAt: now,
      updatedBy: DEMO_USER_ID,
    },
  ],
  fixedDonations: [
    {
      id: 'fixed-1',
      householdId,
      name: 'ישיבה',
      amount: 50000,
      startYear: 2025,
      startMonth: 1,
      endYear: null,
      endMonth: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: DEMO_USER_ID,
    },
    {
      id: 'fixed-2',
      householdId,
      name: 'גמ״ח',
      amount: 20000,
      startYear: 2025,
      startMonth: 6,
      endYear: null,
      endMonth: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: DEMO_USER_ID,
    },
  ],
  reports: [
    {
      id: 'report-2025-04',
      householdId,
      year: 2025,
      month: 4,
      salaryHusband: 1500000,
      salaryWife: 1200000,
      additionalIncome: [
        { id: 'ai-1', description: 'בונוס', amount: 100000 },
      ],
      oneTimeDonations: [
        {
          id: 'ot-1',
          description: 'צדקה',
          amount: 50000,
          receiptUrl: null,
          donatedAt: '2025-04-15',
        },
      ],
      fixedDonationSnapshots: [
        { donationId: 'fixed-1', name: 'ישיבה', amount: 50000 },
        { donationId: 'fixed-2', name: 'גמ״ח', amount: 20000 },
      ],
      totalIncome: 2800000,
      maaserRequired: 280000,
      openingDebt: 0,
      openingCredit: 0,
      adjustedMaaserRequirement: 280000,
      fixedDonationsTotal: 70000,
      oneTimeDonationsTotal: 50000,
      remainingBalance: 160000,
      closingDebt: 160000,
      closingCredit: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: DEMO_USER_ID,
      updatedBy: DEMO_USER_ID,
    },
    {
      id: 'report-2025-05',
      householdId,
      year: 2025,
      month: 5,
      salaryHusband: 1500000,
      salaryWife: 1200000,
      additionalIncome: [],
      oneTimeDonations: [
        {
          id: 'ot-2',
          description: 'מוסד תורני',
          amount: 100000,
          receiptUrl: null,
          donatedAt: '2025-05-10',
        },
      ],
      fixedDonationSnapshots: [
        { donationId: 'fixed-1', name: 'ישיבה', amount: 50000 },
        { donationId: 'fixed-2', name: 'גמ״ח', amount: 20000 },
      ],
      totalIncome: 2700000,
      maaserRequired: 270000,
      openingDebt: 160000,
      openingCredit: 0,
      adjustedMaaserRequirement: 430000,
      fixedDonationsTotal: 70000,
      oneTimeDonationsTotal: 100000,
      remainingBalance: 260000,
      closingDebt: 260000,
      closingCredit: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: DEMO_USER_ID,
      updatedBy: DEMO_USER_ID,
    },
  ],
  auditLogs: [
    {
      id: 'audit-1',
      householdId,
      userId: DEMO_USER_ID,
      userDisplayName: 'משתמש הדגמה',
      actionType: 'create',
      entityType: 'monthlyReport',
      entityId: 'report-2025-04',
      beforeState: null,
      afterState: { year: 2025, month: 4 },
      timestamp: now,
      monthKey: '2025-04',
    },
  ],
  userProfiles: [
    {
      uid: DEMO_USER_ID,
      email: 'demo@example.com',
      displayName: 'משתמש הדגמה',
      photoURL: null,
      activeHouseholdId: householdId,
    },
  ],
  invites: [
    {
      id: 'invite-1',
      householdId,
      code: 'DEMO1234',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
}
