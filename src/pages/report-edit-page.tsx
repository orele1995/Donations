import { useParams, Navigate } from 'react-router-dom'
import { ReportEditor } from '@/features/reports/report-editor'
import { currentMonthKey } from '@/utils/dates'

export function ReportEditPage() {
  const { year: yearParam, month: monthParam } = useParams()

  if (yearParam === 'new') {
    const { year, month } = currentMonthKey()
    return <ReportEditor year={year} month={month} isNew />
  }

  const year = Number(yearParam)
  const month = Number(monthParam)

  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
    return <Navigate to="/reports" replace />
  }

  return <ReportEditor year={year} month={month} isNew={false} />
}
