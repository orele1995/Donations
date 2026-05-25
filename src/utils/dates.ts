import { MONTH_NAMES_HE } from '@/lib/constants'
import type { MonthKey, MonthStatus } from '@/types'

export function toMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function parseMonthKey(key: string): MonthKey {
  const [yearStr, monthStr] = key.split('-')
  return {
    year: Number(yearStr),
    month: Number(monthStr),
  }
}

export function formatMonthLabel(year: number, month: number): string {
  const name = MONTH_NAMES_HE[month - 1]
  return name ? `${name} ${year}` : `${month}/${year}`
}

export function getPreviousMonth(year: number, month: number): MonthKey {
  if (month === 1) return { year: year - 1, month: 12 }
  return { year, month: month - 1 }
}

export function getNextMonth(year: number, month: number): MonthKey {
  if (month === 12) return { year: year + 1, month: 1 }
  return { year, month: month + 1 }
}

export function isFullMonthActive(
  startYear: number,
  startMonth: number,
  endYear: number | null,
  endMonth: number | null,
  targetYear: number,
  targetMonth: number,
): boolean {
  const targetStart = targetYear * 12 + targetMonth
  const donationStart = startYear * 12 + startMonth

  if (targetStart < donationStart) return false

  if (endYear === null || endMonth === null) return true

  const donationEnd = endYear * 12 + endMonth
  return targetStart <= donationEnd
}

export function currentMonthKey(): MonthKey {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

/** Default for new report = previous calendar month */
export function defaultNewReportMonth(): MonthKey {
  const now = currentMonthKey()
  return getPreviousMonth(now.year, now.month)
}

export function getMonthStatus(remainingBalance: number): MonthStatus {
  if (remainingBalance > 0) return 'positive'
  if (remainingBalance < 0) return 'negative'
  return 'balanced'
}

export function compareMonthKeys(a: MonthKey, b: MonthKey): number {
  if (a.year !== b.year) return a.year - b.year
  return a.month - b.month
}
