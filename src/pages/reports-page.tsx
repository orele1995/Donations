import { Link } from 'react-router-dom'
import { FileText, Plus } from 'lucide-react'
import { labels } from '@/lib/hebrew'
import { useReports } from '@/hooks/use-household-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { formatMonthLabel } from '@/utils/dates'
import { formatShekels } from '@/utils/currency'

export function ReportsPage() {
  const { data: reports, isLoading } = useReports()

  if (isLoading) return <LoadingSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{labels.reports}</h1>
        <Button asChild>
          <Link to="/reports/new">
            <Plus className="h-4 w-4" />
            {labels.newReport}
          </Link>
        </Button>
      </div>

      {!reports?.length ? (
        <EmptyState
          icon={FileText}
          action={
            <Button asChild>
              <Link to="/reports/new">{labels.newReport}</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Link key={report.id} to={`/reports/${report.year}/${report.month}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {formatMonthLabel(report.year, report.month)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{labels.totalIncome}</span>
                    <span>{formatShekels(report.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{labels.maaserRemaining}</span>
                    <span className={report.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                      {formatShekels(Math.max(report.remainingBalance, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{labels.maaserDebt}</span>
                    <span>{formatShekels(report.closingDebt)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
