import { resolveMemberDisplayName } from '@/lib/member-display'
import type { HouseholdMember, MemberIncomeEntry, MonthlyReport } from '@/types'

export function buildMemberIncomesFromLegacy(
  data: Record<string, unknown>,
  members: HouseholdMember[],
): MemberIncomeEntry[] {
  const stored = data.memberIncomes as MemberIncomeEntry[] | undefined
  if (stored && stored.length > 0) {
    return members.map((m) => {
      const found = stored.find((e) => e.memberId === m.id)
      return {
        memberId: m.id,
        memberName: found?.memberName ?? resolveMemberDisplayName(m.displayName),
        amount: found?.amount ?? 0,
      }
    })
  }

  const husband = (data.salaryHusband as number) ?? 0
  const wife = (data.salaryWife as number) ?? 0

  return members.map((m, index) => ({
    memberId: m.id,
    memberName: resolveMemberDisplayName(m.displayName),
    amount: index === 0 ? husband : index === 1 ? wife : 0,
  }))
}

export function normalizeReport(
  id: string,
  data: Record<string, unknown>,
  members: HouseholdMember[],
): MonthlyReport {
  const memberIncomes = buildMemberIncomesFromLegacy(data, members)
  const applyCreditFromPrevious = (data.applyCreditFromPrevious as boolean) ?? false
  const creditFromPreviousMonth = (data.creditFromPreviousMonth as number) ?? 0

  return {
    id,
    householdId: data.householdId as string,
    year: data.year as number,
    month: data.month as number,
    memberIncomes,
    additionalIncome: (data.additionalIncome as MonthlyReport['additionalIncome']) ?? [],
    oneTimeDonations: (data.oneTimeDonations as MonthlyReport['oneTimeDonations']) ?? [],
    fixedDonationSnapshots:
      (data.fixedDonationSnapshots as MonthlyReport['fixedDonationSnapshots']) ?? [],
    applyCreditFromPrevious,
    creditFromPreviousMonth,
    totalIncome: (data.totalIncome as number) ?? 0,
    maaserRequired: (data.maaserRequired as number) ?? 0,
    openingDebt: (data.openingDebt as number) ?? 0,
    openingCredit: (data.openingCredit as number) ?? 0,
    adjustedMaaserRequirement: (data.adjustedMaaserRequirement as number) ?? 0,
    fixedDonationsTotal: (data.fixedDonationsTotal as number) ?? 0,
    oneTimeDonationsTotal: (data.oneTimeDonationsTotal as number) ?? 0,
    remainingBalance: (data.remainingBalance as number) ?? 0,
    closingDebt: (data.closingDebt as number) ?? 0,
    closingCredit: (data.closingCredit as number) ?? 0,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
    createdBy: data.createdBy as string,
    updatedBy: data.updatedBy as string,
  }
}
