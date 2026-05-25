import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  type Firestore,
} from 'firebase/firestore'
import { COLLECTIONS } from '@/lib/constants'
import { generateId } from '@/lib/utils'
import { getPreviousMonth } from '@/utils/dates'
import {
  computeReportCalculations,
  getAppliedCredit,
} from '@/utils/finance'
import { isFullMonthActive } from '@/utils/dates'
import { normalizeReport } from '@/utils/report-migration'
import { createAuditLog } from '@/services/audit.service'
import * as householdService from '@/services/household.service'
import type {
  FixedDonation,
  FixedDonationSnapshot,
  HouseholdMember,
  MemberIncomeEntry,
  MonthlyReport,
} from '@/types'

async function getMembersForHousehold(
  db: Firestore,
  householdId: string,
): Promise<HouseholdMember[]> {
  return householdService.fetchMembers(db, householdId)
}

export async function fetchReports(
  db: Firestore,
  householdId: string,
): Promise<MonthlyReport[]> {
  const members = await getMembersForHousehold(db, householdId)
  const q = query(
    collection(db, COLLECTIONS.monthlyReports),
    where('householdId', '==', householdId),
    orderBy('year', 'desc'),
    orderBy('month', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => normalizeReport(d.id, d.data(), members))
}

export async function fetchReportByMonth(
  db: Firestore,
  householdId: string,
  year: number,
  month: number,
): Promise<MonthlyReport | null> {
  const members = await getMembersForHousehold(db, householdId)
  const q = query(
    collection(db, COLLECTIONS.monthlyReports),
    where('householdId', '==', householdId),
    where('year', '==', year),
    where('month', '==', month),
  )
  const snap = await getDocs(q)
  const first = snap.docs[0]
  if (!first) return null
  return normalizeReport(first.id, first.data(), members)
}

export async function reportExists(
  db: Firestore,
  householdId: string,
  year: number,
  month: number,
): Promise<boolean> {
  const report = await fetchReportByMonth(db, householdId, year, month)
  return report !== null
}

export function buildFixedSnapshots(
  donations: FixedDonation[],
  year: number,
  month: number,
): FixedDonationSnapshot[] {
  return donations
    .filter((d) =>
      isFullMonthActive(
        d.startYear,
        d.startMonth,
        d.endYear,
        d.endMonth,
        year,
        month,
      ),
    )
    .map((d) => ({
      donationId: d.id,
      name: d.name,
      amount: d.amount,
    }))
}

export function buildDefaultMemberIncomes(
  members: HouseholdMember[],
  prevIncomes?: MemberIncomeEntry[],
): MemberIncomeEntry[] {
  return members.map((m) => {
    const prev = prevIncomes?.find((e) => e.memberId === m.id)
    return {
      memberId: m.id,
      memberName: m.displayName,
      amount: prev?.amount ?? 0,
    }
  })
}

export async function getOpeningBalances(
  db: Firestore,
  householdId: string,
  year: number,
  month: number,
): Promise<{
  openingDebt: number
  creditFromPreviousMonth: number
  prevMemberIncomes: MemberIncomeEntry[]
}> {
  const prev = getPreviousMonth(year, month)
  const members = await getMembersForHousehold(db, householdId)
  const prevReport = await fetchReportByMonth(
    db,
    householdId,
    prev.year,
    prev.month,
  )

  if (!prevReport) {
    return {
      openingDebt: 0,
      creditFromPreviousMonth: 0,
      prevMemberIncomes: buildDefaultMemberIncomes(members),
    }
  }

  return {
    openingDebt: prevReport.closingDebt,
    creditFromPreviousMonth: prevReport.closingCredit,
    prevMemberIncomes: prevReport.memberIncomes,
  }
}

export function buildReportPayload(
  partial: Omit<
    MonthlyReport,
    | 'id'
    | 'totalIncome'
    | 'maaserRequired'
    | 'adjustedMaaserRequirement'
    | 'fixedDonationsTotal'
    | 'oneTimeDonationsTotal'
    | 'remainingBalance'
    | 'closingDebt'
    | 'closingCredit'
    | 'openingCredit'
  >,
): Omit<MonthlyReport, 'id'> {
  const openingCredit = getAppliedCredit(
    partial.applyCreditFromPrevious,
    partial.creditFromPreviousMonth,
  )

  const calc = computeReportCalculations({
    memberIncomes: partial.memberIncomes,
    additionalIncome: partial.additionalIncome,
    fixedDonationSnapshots: partial.fixedDonationSnapshots,
    oneTimeDonations: partial.oneTimeDonations,
    openingDebt: partial.openingDebt,
    applyCreditFromPrevious: partial.applyCreditFromPrevious,
    creditFromPreviousMonth: partial.creditFromPreviousMonth,
  })

  return {
    ...partial,
    openingCredit,
    ...calc,
  }
}

export async function saveReport(
  db: Firestore,
  report: MonthlyReport,
  userId: string,
  userDisplayName: string,
  isNew: boolean,
  beforeState: Record<string, unknown> | null,
): Promise<MonthlyReport> {
  const payload = buildReportPayload(report)
  const now = new Date().toISOString()
  const data = {
    ...payload,
    updatedAt: now,
    updatedBy: userId,
  }

  if (isNew) {
    const id = generateId()
    await setDoc(doc(db, COLLECTIONS.monthlyReports, id), {
      ...data,
      createdAt: now,
      createdBy: userId,
    })
    const saved = { ...data, id }
    await createAuditLog(db, {
      householdId: report.householdId,
      userId,
      userDisplayName,
      actionType: 'create',
      entityType: 'monthlyReport',
      entityId: id,
      beforeState: null,
      afterState: saved as unknown as Record<string, unknown>,
      year: report.year,
      month: report.month,
    })
    return saved
  }

  await setDoc(doc(db, COLLECTIONS.monthlyReports, report.id), data, {
    merge: true,
  })

  await createAuditLog(db, {
    householdId: report.householdId,
    userId,
    userDisplayName,
    actionType: 'update',
    entityType: 'monthlyReport',
    entityId: report.id,
    beforeState,
    afterState: data as unknown as Record<string, unknown>,
    year: report.year,
    month: report.month,
  })

  return { ...data, id: report.id }
}

export async function deleteReport(
  db: Firestore,
  report: MonthlyReport,
  userId: string,
  userDisplayName: string,
): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.monthlyReports, report.id))
  await createAuditLog(db, {
    householdId: report.householdId,
    userId,
    userDisplayName,
    actionType: 'delete',
    entityType: 'monthlyReport',
    entityId: report.id,
    beforeState: report as unknown as Record<string, unknown>,
    afterState: null,
    year: report.year,
    month: report.month,
  })
}

export async function getReport(
  db: Firestore,
  reportId: string,
  householdId: string,
): Promise<MonthlyReport | null> {
  const members = await getMembersForHousehold(db, householdId)
  const snap = await getDoc(doc(db, COLLECTIONS.monthlyReports, reportId))
  if (!snap.exists()) return null
  return normalizeReport(snap.id, snap.data(), members)
}
