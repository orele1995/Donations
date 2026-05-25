import { useParams, useSearchParams, Navigate } from 'react-router-dom'
import { ReportEditor } from '@/features/reports/report-editor'

export function ReportEditPage() {
  const { year: yearParam, month: monthParam } = useParams()
  const [searchParams] = useSearchParams()

  const year = Number(yearParam)
  const month = Number(monthParam)
  const isNew = searchParams.get('new') === '1'

  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
    return <Navigate to="/reports" replace />
  }

  return <ReportEditor year={year} month={month} isNew={isNew} />
}
