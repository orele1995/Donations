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
import { getMonthlyFinancialSummary } from '@/utils/monthly-summary'
import { cn } from '@/lib/utils'

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
            const summary = getMonthlyFinancialSummary(report.remainingBalance)
            return (
              <Link key={report.id} to={`/reports/${report.year}/${report.month}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {formatMonthLabel(report.year, report.month)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        {labels.monthlyFinancialResult}
                      </p>
                      <p
                        className={cn(
                          'mt-1 text-2xl font-bold tabular-nums',
                          summary.status === 'debt'
                            ? 'text-red-600'
                            : summary.status === 'credit'
                              ? 'text-emerald-600'
                              : '',
                        )}
                      >
                        {summary.isBalanced
                          ? summary.statusLabel
                          : formatShekels(summary.displayAmountAgorot)}
                      </p>
                      {!summary.isBalanced && (
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          {summary.statusLabel}
                        </p>
                      )}
                    </div>
                    {summary.amountDueAgorot > 0 && (
                      <div>
                        <p className="text-sm text-[var(--color-muted-foreground)]">
                          {labels.amountDue}
                        </p>
                        <p className="mt-0.5 font-semibold tabular-nums text-red-600">
                          {formatShekels(summary.amountDueAgorot)}
                        </p>
                      </div>
                    )}
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
