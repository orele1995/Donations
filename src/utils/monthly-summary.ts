import { labels } from '@/lib/hebrew'
import { agorotToShekels } from '@/utils/currency'
import type { MonthStatus } from '@/types'

export type MonthlyFinancialStatus = 'debt' | 'credit' | 'balanced'

export interface MonthlyFinancialSummary {
  /** Raw remaining balance from report (agorot). Positive = debt owed, negative = credit. */
  remainingBalanceAgorot: number
  /** Amount still to pay (agorot), never negative. */
  amountDueAgorot: number
  status: MonthlyFinancialStatus
  statusLabel: string
  isBalanced: boolean
  /** Absolute amount for display (agorot). */
  displayAmountAgorot: number
  /** Y-axis value for balance chart (shekels). Debt below zero, credit above. */
  chartBalanceShekels: number
}

export function getMonthlyFinancialSummary(
  remainingBalanceAgorot: number,
): MonthlyFinancialSummary {
  const isBalanced = remainingBalanceAgorot === 0
  const amountDueAgorot = Math.max(remainingBalanceAgorot, 0)

  let status: MonthlyFinancialStatus = 'balanced'
  if (remainingBalanceAgorot > 0) status = 'debt'
  else if (remainingBalanceAgorot < 0) status = 'credit'

  const statusLabel =
    status === 'balanced'
      ? labels.statusBalanced
      : status === 'debt'
        ? labels.statusPositive
        : labels.statusNegative

  return {
    remainingBalanceAgorot,
    amountDueAgorot,
    status,
    statusLabel,
    isBalanced,
    displayAmountAgorot: isBalanced ? 0 : Math.abs(remainingBalanceAgorot),
    chartBalanceShekels: isBalanced ? 0 : -agorotToShekels(remainingBalanceAgorot),
  }
}

export function mapStatusToMonthStatus(status: MonthlyFinancialStatus): MonthStatus {
  if (status === 'balanced') return 'balanced'
  if (status === 'debt') return 'positive'
  return 'negative'
}
