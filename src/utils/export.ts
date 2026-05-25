import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import { labels } from '@/lib/hebrew'
import type { MonthlyReport } from '@/types'
import { formatMonthLabel } from '@/utils/dates'
import { formatShekels } from '@/utils/currency'

function reportToRows(report: MonthlyReport): (string | number)[][] {
  const monthLabel = formatMonthLabel(report.year, report.month)
  const rows: (string | number)[][] = [
    [labels.month, monthLabel],
    [],
    [labels.income, ''],
  ]

  report.memberIncomes.forEach((entry) => {
    rows.push([entry.memberName, formatShekels(entry.amount)])
  })

  report.additionalIncome.forEach((entry) => {
    rows.push([entry.description, formatShekels(entry.amount)])
  })

  rows.push(
    [labels.totalIncome, formatShekels(report.totalIncome)],
    [],
    [labels.maaserRequired, formatShekels(report.maaserRequired)],
    [labels.debtFromPreviousMonths, formatShekels(report.openingDebt)],
  )

  if (report.applyCreditFromPrevious && report.openingCredit > 0) {
    rows.push([labels.applyCreditFromPrevious, formatShekels(report.openingCredit)])
  }

  rows.push([], [labels.fixedDonations, ''])

  report.fixedDonationSnapshots.forEach((snap) => {
    rows.push([snap.name, formatShekels(snap.amount)])
  })

  rows.push(
    [labels.fixedDonationsTotal, formatShekels(report.fixedDonationsTotal)],
    [],
    [labels.oneTimeDonations, ''],
  )

  report.oneTimeDonations.forEach((donation) => {
    rows.push([donation.description, formatShekels(donation.amount)])
  })

  rows.push(
    [labels.oneTimeDonationsTotal, formatShekels(report.oneTimeDonationsTotal)],
    [],
    [labels.monthlyFinancialResult, formatShekels(Math.abs(report.remainingBalance))],
    [labels.amountDue, formatShekels(Math.max(report.remainingBalance, 0))],
  )

  return rows
}

export function exportReportToExcel(report: MonthlyReport): void {
  const rows = reportToRows(report)
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'דוח')
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const filename = `דוח-${report.year}-${String(report.month).padStart(2, '0')}.xlsx`
  saveAs(blob, filename)
}
