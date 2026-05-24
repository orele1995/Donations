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
import { computeReportCalculations } from '@/utils/finance'
import { isFullMonthActive } from '@/utils/dates'
import { createAuditLog } from '@/services/audit.service'
import type {
  FixedDonation,
  FixedDonationSnapshot,
  MonthlyReport,
} from '@/types'

function mapReportDoc(
  id: string,
  data: Record<string, unknown>,
): MonthlyReport {
  return {
    id,
    householdId: data.householdId as string,
    year: data.year as number,
    month: data.month as number,
    salaryHusband: data.salaryHusband as number,
    salaryWife: data.salaryWife as number,
    additionalIncome: data.additionalIncome as MonthlyReport['additionalIncome'],
    oneTimeDonations: data.oneTimeDonations as MonthlyReport['oneTimeDonations'],
    fixedDonationSnapshots:
      data.fixedDonationSnapshots as MonthlyReport['fixedDonationSnapshots'],
    totalIncome: data.totalIncome as number,
    maaserRequired: data.maaserRequired as number,
    openingDebt: data.openingDebt as number,
    openingCredit: data.openingCredit as number,
    adjustedMaaserRequirement: data.adjustedMaaserRequirement as number,
    fixedDonationsTotal: data.fixedDonationsTotal as number,
    oneTimeDonationsTotal: data.oneTimeDonationsTotal as number,
    remainingBalance: data.remainingBalance as number,
    closingDebt: data.closingDebt as number,
    closingCredit: data.closingCredit as number,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
    createdBy: data.createdBy as string,
    updatedBy: data.updatedBy as string,
  }
}

export async function fetchReports(
  db: Firestore,
  householdId: string,
): Promise<MonthlyReport[]> {
  const q = query(
    collection(db, COLLECTIONS.monthlyReports),
    where('householdId', '==', householdId),
    orderBy('year', 'desc'),
    orderBy('month', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapReportDoc(d.id, d.data()))
}

export async function fetchReportByMonth(
  db: Firestore,
  householdId: string,
  year: number,
  month: number,
): Promise<MonthlyReport | null> {
  const q = query(
    collection(db, COLLECTIONS.monthlyReports),
    where('householdId', '==', householdId),
    where('year', '==', year),
    where('month', '==', month),
  )
  const snap = await getDocs(q)
  const first = snap.docs[0]
  if (!first) return null
  return mapReportDoc(first.id, first.data())
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

export async function getOpeningBalances(
  db: Firestore,
  householdId: string,
  year: number,
  month: number,
  creditCarryForwardEnabled: boolean,
): Promise<{ openingDebt: number; openingCredit: number; prevSalaries: { husband: number; wife: number } }> {
  const prev = getPreviousMonth(year, month)
  const prevReport = await fetchReportByMonth(
    db,
    householdId,
    prev.year,
    prev.month,
  )

  if (!prevReport) {
    return {
      openingDebt: 0,
      openingCredit: 0,
      prevSalaries: { husband: 0, wife: 0 },
    }
  }

  return {
    openingDebt: prevReport.closingDebt,
    openingCredit: creditCarryForwardEnabled ? prevReport.closingCredit : 0,
    prevSalaries: {
      husband: prevReport.salaryHusband,
      wife: prevReport.salaryWife,
    },
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
  >,
  creditCarryForwardEnabled: boolean,
): Omit<MonthlyReport, 'id'> {
  const calc = computeReportCalculations({
    salaryHusband: partial.salaryHusband,
    salaryWife: partial.salaryWife,
    additionalIncome: partial.additionalIncome,
    fixedDonationSnapshots: partial.fixedDonationSnapshots,
    oneTimeDonations: partial.oneTimeDonations,
    openingDebt: partial.openingDebt,
    openingCredit: partial.openingCredit,
    creditCarryForwardEnabled,
  })

  return {
    ...partial,
    ...calc,
  }
}

export async function saveReport(
  db: Firestore,
  report: MonthlyReport,
  creditCarryForwardEnabled: boolean,
  userId: string,
  userDisplayName: string,
  isNew: boolean,
  beforeState: Record<string, unknown> | null,
): Promise<MonthlyReport> {
  const payload = buildReportPayload(report, creditCarryForwardEnabled)
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

export async function restoreReport(
  db: Firestore,
  report: MonthlyReport,
  userId: string,
  userDisplayName: string,
): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.monthlyReports, report.id), report)
  await createAuditLog(db, {
    householdId: report.householdId,
    userId,
    userDisplayName,
    actionType: 'restore',
    entityType: 'monthlyReport',
    entityId: report.id,
    beforeState: null,
    afterState: report as unknown as Record<string, unknown>,
    year: report.year,
    month: report.month,
  })
}

export async function getReport(
  db: Firestore,
  reportId: string,
): Promise<MonthlyReport | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.monthlyReports, reportId))
  if (!snap.exists()) return null
  return mapReportDoc(snap.id, snap.data())
}
