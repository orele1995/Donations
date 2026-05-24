import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { labels } from '@/lib/hebrew'
import { useReports, useSettings } from '@/hooks/use-household-data'
import { StatCard } from '@/components/shared/stat-card'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { formatMonthLabel } from '@/utils/dates'
import { agorotToShekels } from '@/utils/currency'
import { MONTH_NAMES_HE } from '@/lib/constants'

export function DashboardPage() {
  const { data: reports, isLoading } = useReports()
  const { data: settings } = useSettings()

  const latest = reports?.[0]
  const creditEnabled = settings?.creditCarryForwardEnabled ?? false

  const chartData = useMemo(() => {
    if (!reports) return []
    const byYear = new Map<number, { income: number; maaser: number; donations: number }>()
    for (const r of reports) {
      const existing = byYear.get(r.year) ?? { income: 0, maaser: 0, donations: 0 }
      existing.income += r.totalIncome
      existing.maaser += r.maaserRequired
      existing.donations += r.fixedDonationsTotal + r.oneTimeDonationsTotal
      byYear.set(r.year, existing)
    }
    return Array.from(byYear.entries()).map(([year, data]) => ({
      year: String(year),
      הכנסות: agorotToShekels(data.income),
      מעשר: agorotToShekels(data.maaser),
      תרומות: agorotToShekels(data.donations),
    }))
  }, [reports])

  const monthlyChart = useMemo(() => {
    if (!reports) return []
    return [...reports]
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .slice(-12)
      .map((r) => ({
        name: MONTH_NAMES_HE[r.month - 1]?.slice(0, 3) ?? String(r.month),
        יתרה: agorotToShekels(Math.max(r.remainingBalance, 0)),
        חוב: agorotToShekels(r.closingDebt),
      }))
  }, [reports])

  if (isLoading) return <LoadingSkeleton rows={6} />

  if (!latest) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">{labels.dashboard}</h1>
        <p className="text-slate-500">{labels.noData}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{labels.dashboard}</h1>
        <p className="text-slate-500">
          {formatMonthLabel(latest.year, latest.month)} — עדכון אחרון
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard title={labels.totalIncome} value={latest.totalIncome} />
        <StatCard title={labels.maaserRequired} value={latest.maaserRequired} variant="warning" />
        <StatCard title={labels.maaserDebt} value={latest.closingDebt} variant="danger" />
        {creditEnabled && (
          <StatCard title={labels.maaserCredit} value={latest.closingCredit} variant="success" />
        )}
        <StatCard title={labels.fixedDonationsTotal} value={latest.fixedDonationsTotal} />
        <StatCard
          title={labels.remainingBalance}
          value={Math.max(latest.remainingBalance, 0)}
          variant={latest.remainingBalance > 0 ? 'danger' : 'success'}
        />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">{labels.annualOverview}</h2>
        <div className="h-80 rounded-lg border bg-white p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(v) => `₪${Number(v ?? 0).toLocaleString('he-IL')}`} />
              <Legend />
              <Bar dataKey="הכנסות" fill="#0f766e" />
              <Bar dataKey="מעשר" fill="#f59e0b" />
              <Bar dataKey="תרומות" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">יתרות חודשיות</h2>
        <div className="h-64 rounded-lg border bg-white p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v) => `₪${Number(v ?? 0).toLocaleString('he-IL')}`} />
              <Legend />
              <Bar dataKey="יתרה" fill="#dc2626" />
              <Bar dataKey="חוב" fill="#991b1b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
