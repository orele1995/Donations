import { isFullMonthActive } from '@/utils/dates'
import type { FixedDonation, MonthlyReport } from '@/types'

export function isDonationActiveInMonth(
  donation: Pick<
    FixedDonation,
    'startYear' | 'startMonth' | 'endYear' | 'endMonth'
  >,
  year: number,
  month: number,
): boolean {
  return isFullMonthActive(
    donation.startYear,
    donation.startMonth,
    donation.endYear,
    donation.endMonth,
    year,
    month,
  )
}

export function isDonationCurrentlyActive(
  donation: Pick<
    FixedDonation,
    'startYear' | 'startMonth' | 'endYear' | 'endMonth'
  >,
  now = new Date(),
): boolean {
  return isDonationActiveInMonth(
    donation,
    now.getFullYear(),
    now.getMonth() + 1,
  )
}

export function donationCoversMonth(
  donation: Pick<
    FixedDonation,
    'startYear' | 'startMonth' | 'endYear' | 'endMonth'
  >,
  reportYear: number,
  reportMonth: number,
): boolean {
  return isDonationActiveInMonth(donation, reportYear, reportMonth)
}

export function getAffectedReports(
  reports: MonthlyReport[],
  oldDonation: Pick<
    FixedDonation,
    'startYear' | 'startMonth' | 'endYear' | 'endMonth'
  > | null,
  newDonation: Pick<
    FixedDonation,
    'startYear' | 'startMonth' | 'endYear' | 'endMonth'
  > | null,
): MonthlyReport[] {
  return reports.filter((report) => {
    const inOld =
      oldDonation !== null &&
      donationCoversMonth(oldDonation, report.year, report.month)
    const inNew =
      newDonation !== null &&
      donationCoversMonth(newDonation, report.year, report.month)
    return inOld || inNew
  })
}

export function matchesDonationSearch(
  donation: FixedDonation,
  query: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return donation.name.toLowerCase().includes(q)
}
