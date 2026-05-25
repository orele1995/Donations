import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { labels } from '@/lib/hebrew'
import { useReports } from '@/hooks/use-household-data'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { MonthSummaryCard } from '@/components/shared/month-summary-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  buildBalanceChartData,
  MonthlyBalanceChart,
} from '@/components/charts/monthly-balance-chart'
import { currentMonthKey, formatMonthLabel, getPreviousMonth } from '@/utils/dates'
import { getMonthlyFinancialSummary } from '@/utils/monthly-summary'
import { agorotToShekels, formatShekels } from '@/utils/currency'
import { MONTH_NAMES_HE } from '@/lib/constants'
import type { MonthlyReport } from '@/types'

function findReport(
  reports: MonthlyReport[],
  year: number,
  month: number,
): MonthlyReport | undefined {
  return reports.find((r) => r.year === year && r.month === month)
}

export function DashboardPage() {
  const { data: reports, isLoading } = useReports()
  const current = currentMonthKey()
  const previous = getPreviousMonth(current.year, current.month)

  const currentReport = useMemo(
    () => (reports ? findReport(reports, current.year, current.month) : undefined),
    [reports, current.year, current.month],
  )

  const lastReport = useMemo(
    () => (reports ? findReport(reports, previous.year, previous.month) : undefined),
    [reports, previous.year, previous.month],
  )

  const currentSummary = useMemo(
    () =>
      currentReport
        ? getMonthlyFinancialSummary(currentReport.remainingBalance)
        : getMonthlyFinancialSummary(0),
    [currentReport],
  )

  const lastSummary = useMemo(
    () =>
      lastReport
        ? getMonthlyFinancialSummary(lastReport.remainingBalance)
        : getMonthlyFinancialSummary(0),
    [lastReport],
  )

  const balanceChartData = useMemo(
    () => (reports ? buildBalanceChartData(reports) : []),
    [reports],
  )

  const paidChartData = useMemo(() => {
    if (!reports) return []
    return [...reports]
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .slice(-12)
      .map((r) => ({
        name: MONTH_NAMES_HE[r.month - 1]?.slice(0, 3) ?? String(r.month),
        paid: agorotToShekels(r.fixedDonationsTotal + r.oneTimeDonationsTotal),
        fullMonth: formatMonthLabel(r.year, r.month),
      }))
  }, [reports])

  if (isLoading) return <LoadingSkeleton rows={4} />

  const currentSubtitle = currentReport
    ? `${formatMonthLabel(current.year, current.month)}${
        currentSummary.amountDueAgorot > 0
          ? ` · ${labels.amountDue}: ${formatShekels(currentSummary.amountDueAgorot)}`
          : ''
      }`
    : labels.noData

  const lastSubtitle = lastReport
    ? `${formatMonthLabel(previous.year, previous.month)}${
        lastSummary.amountDueAgorot > 0
          ? ` · ${labels.amountDue}: ${formatShekels(lastSummary.amountDueAgorot)}`
          : ''
      }`
    : labels.noData

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{labels.dashboard}</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {formatMonthLabel(current.year, current.month)}
          </p>
        </div>
        <Button asChild>
          <Link to="/reports/new">{labels.newReport}</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MonthSummaryCard
          title={`${labels.monthlyFinancialResult} — ${labels.currentMonth}`}
          summary={currentSummary}
          subtitle={currentSubtitle}
        />
        <MonthSummaryCard
          title={`${labels.monthBalanceSummary} — ${labels.previousMonth}`}
          summary={lastSummary}
          subtitle={lastSubtitle}
        />
      </div>

      {reports && reports.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{labels.monthlyFinancialChart}</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyBalanceChart data={balanceChartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{labels.monthlyMaaserPaidChart}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paidChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e6f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: number) => `₪${v.toLocaleString('he-IL')}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null
                        const p = payload[0].payload as { fullMonth: string; paid: number }
                        return (
                          <div
                            className="rounded-lg border bg-white px-3 py-2 text-sm shadow-md"
                            dir="rtl"
                          >
                            <p>
                              {labels.tooltipMonth}: {p.fullMonth}
                            </p>
                            <p>
                              {labels.maaserPaid}: ₪{p.paid.toLocaleString('he-IL')}
                            </p>
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="paid" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-[var(--color-muted-foreground)]">
            <p>{labels.noData}</p>
            <Button asChild className="mt-4">
              <Link to="/reports/new">{labels.newReport}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
