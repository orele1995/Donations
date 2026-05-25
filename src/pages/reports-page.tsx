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
        <h1 className="text-2xl font-bold tracking-tight">{labels.reports}</h1>
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
          {reports.map((report) => {
            const due = Math.max(report.remainingBalance, 0)
            return (
              <Link key={report.id} to={`/reports/${report.year}/${report.month}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {formatMonthLabel(report.year, report.month)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {labels.netBalance}
                    </p>
                    <p
                      className={`mt-1 text-2xl font-bold tabular-nums ${
                        due > 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatShekels(due)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
