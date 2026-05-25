import { MAASER_RATE } from '@/lib/constants'
import type {
  AdditionalIncomeEntry,
  FixedDonationSnapshot,
  MemberIncomeEntry,
  OneTimeDonation,
  ReportCalculations,
} from '@/types'

export function calculateTotalIncome(
  memberIncomes: MemberIncomeEntry[],
  additionalIncome: AdditionalIncomeEntry[],
): number {
  const members = memberIncomes.reduce((sum, e) => sum + e.amount, 0)
  const additional = additionalIncome.reduce((sum, e) => sum + e.amount, 0)
  return members + additional
}

export function calculateMaaserRequired(totalIncome: number): number {
  return Math.round(totalIncome * MAASER_RATE)
}

export function calculateAdjustedMaaserRequirement(
  maaserRequired: number,
  openingDebt: number,
  appliedCredit: number,
): number {
  const adjusted = maaserRequired + openingDebt - appliedCredit
  return Math.max(adjusted, 0)
}

export function sumFixedDonations(snapshots: FixedDonationSnapshot[]): number {
  return snapshots.reduce((sum, s) => sum + s.amount, 0)
}

export function sumOneTimeDonations(donations: OneTimeDonation[]): number {
  return donations.reduce((sum, d) => sum + d.amount, 0)
}

export function calculateRemainingBalance(
  adjustedRequirement: number,
  fixedDonationsTotal: number,
  oneTimeDonationsTotal: number,
): number {
  return adjustedRequirement - fixedDonationsTotal - oneTimeDonationsTotal
}

export function calculateClosingBalances(remainingBalance: number): {
  closingDebt: number
  closingCredit: number
} {
  if (remainingBalance > 0) {
    return { closingDebt: remainingBalance, closingCredit: 0 }
  }
  return { closingDebt: 0, closingCredit: Math.abs(remainingBalance) }
}

export function getMaaserPaidTotal(
  fixedDonationsTotal: number,
  oneTimeDonationsTotal: number,
): number {
  return fixedDonationsTotal + oneTimeDonationsTotal
}

export interface ComputeReportInput {
  memberIncomes: MemberIncomeEntry[]
  additionalIncome: AdditionalIncomeEntry[]
  fixedDonationSnapshots: FixedDonationSnapshot[]
  oneTimeDonations: OneTimeDonation[]
  openingDebt: number
  applyCreditFromPrevious: boolean
  creditFromPreviousMonth: number
}

export function computeReportCalculations(
  input: ComputeReportInput,
): ReportCalculations {
  const appliedCredit = input.applyCreditFromPrevious
    ? input.creditFromPreviousMonth
    : 0

  const totalIncome = calculateTotalIncome(
    input.memberIncomes,
    input.additionalIncome,
  )
  const maaserRequired = calculateMaaserRequired(totalIncome)
  const adjustedMaaserRequirement = calculateAdjustedMaaserRequirement(
    maaserRequired,
    input.openingDebt,
    appliedCredit,
  )
  const fixedDonationsTotal = sumFixedDonations(input.fixedDonationSnapshots)
  const oneTimeDonationsTotal = sumOneTimeDonations(input.oneTimeDonations)
  const remainingBalance = calculateRemainingBalance(
    adjustedMaaserRequirement,
    fixedDonationsTotal,
    oneTimeDonationsTotal,
  )
  const { closingDebt, closingCredit } = calculateClosingBalances(remainingBalance)
  const maaserPaidTotal = getMaaserPaidTotal(
    fixedDonationsTotal,
    oneTimeDonationsTotal,
  )

  return {
    totalIncome,
    maaserRequired,
    adjustedMaaserRequirement,
    fixedDonationsTotal,
    oneTimeDonationsTotal,
    remainingBalance,
    closingDebt,
    closingCredit,
    maaserPaidTotal,
  }
}

export function getAppliedCredit(
  applyCreditFromPrevious: boolean,
  creditFromPreviousMonth: number,
): number {
  return applyCreditFromPrevious ? creditFromPreviousMonth : 0
}
