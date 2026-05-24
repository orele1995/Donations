import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import { labels } from '@/lib/hebrew'
import type { MonthlyReport } from '@/types'
import { formatMonthLabel } from '@/utils/dates'
import { formatShekels } from '@/utils/currency'

function reportToRows(
  report: MonthlyReport,
  creditEnabled: boolean,
): (string | number)[][] {
  const monthLabel = formatMonthLabel(report.year, report.month)
  const rows: (string | number)[][] = [
    [labels.month, monthLabel],
    [],
    [labels.income, ''],
    [labels.salaryHusband, formatShekels(report.salaryHusband)],
    [labels.salaryWife, formatShekels(report.salaryWife)],
  ]

  report.additionalIncome.forEach((entry) => {
    rows.push([entry.description, formatShekels(entry.amount)])
  })

  rows.push(
    [labels.totalIncome, formatShekels(report.totalIncome)],
    [],
    [labels.maaserRequired, formatShekels(report.maaserRequired)],
    [labels.openingDebt, formatShekels(report.openingDebt)],
  )

  if (creditEnabled) {
    rows.push([labels.openingCredit, formatShekels(report.openingCredit)])
  }

  rows.push(
    [labels.adjustedRequirement, formatShekels(report.adjustedMaaserRequirement)],
    [],
    [labels.fixedDonations, ''],
  )

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
    [labels.remainingBalance, formatShekels(report.remainingBalance)],
    [labels.closingDebt, formatShekels(report.closingDebt)],
  )

  if (creditEnabled) {
    rows.push([labels.closingCredit, formatShekels(report.closingCredit)])
  }

  return rows
}

export function exportReportToExcel(
  report: MonthlyReport,
  creditEnabled: boolean,
): void {
  const rows = reportToRows(report, creditEnabled)
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

export function exportReportToCsv(
  report: MonthlyReport,
  creditEnabled: boolean,
): void {
  const rows = reportToRows(report, creditEnabled)
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell)
          return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str
        })
        .join(','),
    )
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const filename = `דוח-${report.year}-${String(report.month).padStart(2, '0')}.csv`
  saveAs(blob, filename)
}
