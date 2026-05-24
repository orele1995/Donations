import { MAASER_RATE } from '@/lib/constants'
import type {
  AdditionalIncomeEntry,
  FixedDonationSnapshot,
  OneTimeDonation,
  ReportCalculations,
} from '@/types'

export function calculateTotalIncome(
  salaryHusband: number,
  salaryWife: number,
  additionalIncome: AdditionalIncomeEntry[],
): number {
  const additional = additionalIncome.reduce((sum, e) => sum + e.amount, 0)
  return salaryHusband + salaryWife + additional
}

export function calculateMaaserRequired(totalIncome: number): number {
  return Math.round(totalIncome * MAASER_RATE)
}

export function calculateAdjustedMaaserRequirement(
  maaserRequired: number,
  openingDebt: number,
  openingCredit: number,
  creditCarryForwardEnabled: boolean,
): number {
  const creditReduction = creditCarryForwardEnabled ? openingCredit : 0
  const adjusted = maaserRequired + openingDebt - creditReduction
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

export function calculateClosingBalances(
  remainingBalance: number,
  creditCarryForwardEnabled: boolean,
): { closingDebt: number; closingCredit: number } {
  if (remainingBalance > 0) {
    return { closingDebt: remainingBalance, closingCredit: 0 }
  }

  const overpayment = Math.abs(remainingBalance)
  return {
    closingDebt: 0,
    closingCredit: creditCarryForwardEnabled ? overpayment : overpayment,
  }
}

export interface ComputeReportInput {
  salaryHusband: number
  salaryWife: number
  additionalIncome: AdditionalIncomeEntry[]
  fixedDonationSnapshots: FixedDonationSnapshot[]
  oneTimeDonations: OneTimeDonation[]
  openingDebt: number
  openingCredit: number
  creditCarryForwardEnabled: boolean
}

export function computeReportCalculations(
  input: ComputeReportInput,
): ReportCalculations {
  const totalIncome = calculateTotalIncome(
    input.salaryHusband,
    input.salaryWife,
    input.additionalIncome,
  )
  const maaserRequired = calculateMaaserRequired(totalIncome)
  const adjustedMaaserRequirement = calculateAdjustedMaaserRequirement(
    maaserRequired,
    input.openingDebt,
    input.openingCredit,
    input.creditCarryForwardEnabled,
  )
  const fixedDonationsTotal = sumFixedDonations(input.fixedDonationSnapshots)
  const oneTimeDonationsTotal = sumOneTimeDonations(input.oneTimeDonations)
  const remainingBalance = calculateRemainingBalance(
    adjustedMaaserRequirement,
    fixedDonationsTotal,
    oneTimeDonationsTotal,
  )
  const { closingDebt, closingCredit } = calculateClosingBalances(
    remainingBalance,
    input.creditCarryForwardEnabled,
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
  }
}
