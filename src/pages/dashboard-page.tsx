import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { labels } from '@/lib/hebrew'
import { useReports } from '@/hooks/use-household-data'
import { StatCard } from '@/components/shared/stat-card'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  currentMonthKey,
  formatMonthLabel,
  getMonthStatus,
  getPreviousMonth,
} from '@/utils/dates'
import { agorotToShekels } from '@/utils/currency'
import { MONTH_NAMES_HE } from '@/lib/constants'
import type { MonthlyReport } from '@/types'

const STATUS_COLORS = {
  positive: '#ef4444',
  negative: '#10b981',
  balanced: '#a5b4fc',
}

const STATUS_LABELS = {
  positive: labels.statusPositive,
  negative: labels.statusNegative,
  balanced: labels.statusBalanced,
}

function findReport(
  reports: MonthlyReport[],
  year: number,
  month: number,
): MonthlyReport | undefined {
  return reports.find((r) => r.year === year && r.month === month)
}

function netBalance(report: MonthlyReport): number {
  return Math.max(report.remainingBalance, 0)
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

  const statusChartData = useMemo(() => {
    if (!reports) return []
    return [...reports]
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .slice(-12)
      .map((r) => {
        const status = getMonthStatus(r.remainingBalance)
        return {
          name: MONTH_NAMES_HE[r.month - 1]?.slice(0, 3) ?? String(r.month),
          status: STATUS_LABELS[status],
          statusKey: status,
          value: 1,
        }
      })
  }, [reports])

  const paidChartData = useMemo(() => {
    if (!reports) return []
    return [...reports]
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .slice(-12)
      .map((r) => ({
        name: MONTH_NAMES_HE[r.month - 1]?.slice(0, 3) ?? String(r.month),
        paid: agorotToShekels(r.fixedDonationsTotal + r.oneTimeDonationsTotal),
      }))
  }, [reports])

  if (isLoading) return <LoadingSkeleton rows={4} />

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
        <StatCard
          title={labels.currentMonthBalance}
          value={currentReport ? netBalance(currentReport) : 0}
          subtitle={
            currentReport
              ? formatMonthLabel(current.year, current.month)
              : labels.noData
          }
          variant={currentReport && currentReport.remainingBalance > 0 ? 'due' : 'neutral'}
        />
        <StatCard
          title={labels.lastMonthBalance}
          value={lastReport ? netBalance(lastReport) : 0}
          subtitle={
            lastReport
              ? formatMonthLabel(previous.year, previous.month)
              : labels.noData
          }
          variant={lastReport && lastReport.remainingBalance > 0 ? 'due' : 'neutral'}
        />
      </div>

      {reports && reports.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{labels.monthlyStatusChart}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e6f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {statusChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[entry.statusKey as keyof typeof STATUS_COLORS]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--color-muted-foreground)]">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  {labels.statusPositive}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {labels.statusNegative}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-indigo-300" />
                  {labels.statusBalanced}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{labels.monthlyMaaserPaidChart}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paidChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e6f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(v) => `₪${Number(v ?? 0).toLocaleString('he-IL')}`}
                    />
                    <Bar dataKey="paid" fill="#6366f1" radius={[6, 6, 0, 0]} />
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
