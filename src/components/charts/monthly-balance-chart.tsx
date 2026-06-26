import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type RectangleProps,
} from 'recharts'
import { labels } from '@/lib/hebrew'
import { formatMonthLabel, formatMonthNumeric } from '@/utils/dates'
import { formatShekels } from '@/utils/currency'
import {
  getMonthlyFinancialSummary,
  mapStatusToMonthStatus,
} from '@/utils/monthly-summary'
import type { MonthStatus } from '@/types'

export interface BalanceChartPoint {
  year: number
  month: number
  name: string
  balance: number
  summary: ReturnType<typeof getMonthlyFinancialSummary>
  status: MonthStatus
  statusLabel: string
  isBalanced: boolean
}

const COLORS = {
  debt: '#ef4444',
  credit: '#10b981',
  balanced: '#94a3b8',
} as const

function BalanceTooltip({ active, payload }: { active?: boolean; payload?: { payload: BalanceChartPoint }[] }) {
  if (!active || !payload?.[0]?.payload) return null
  const point = payload[0].payload

  return (
    <div
      className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm shadow-md"
      dir="rtl"
    >
      <p className="font-medium">
        {labels.tooltipMonth}: {formatMonthLabel(point.year, point.month)}
      </p>
      <p>
        {labels.tooltipMonthlyResult}: {formatShekels(point.summary.displayAmountAgorot)}
      </p>
      <p>
        {labels.tooltipStatus}: {point.statusLabel}
      </p>
      {point.summary.amountDueAgorot > 0 && (
        <p>
          {labels.amountDue}: {formatShekels(point.summary.amountDueAgorot)}
        </p>
      )}
    </div>
  )
}

export function buildBalanceChartData(
  reports: Array<{ year: number; month: number; remainingBalance: number }>,
): BalanceChartPoint[] {
  return [...reports]
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .slice(-12)
    .map((r) => {
      const summary = getMonthlyFinancialSummary(r.remainingBalance)
      const status = mapStatusToMonthStatus(summary.status)

      return {
        year: r.year,
        month: r.month,
        name: formatMonthNumeric(r.year, r.month),
        balance: summary.chartBalanceShekels,
        summary,
        status,
        statusLabel: summary.statusLabel,
        isBalanced: summary.isBalanced,
      }
    })
}

function BalanceBar(props: RectangleProps & { payload?: BalanceChartPoint }) {
  const { payload, x = 0, y = 0, width = 0 } = props
  if (payload?.isBalanced) {
    const lineY = typeof y === 'number' ? y : 0
    const lineX = typeof x === 'number' ? x : 0
    const lineW = typeof width === 'number' ? width : 0
    return (
      <line
        x1={lineX}
        x2={lineX + lineW}
        y1={lineY}
        y2={lineY}
        stroke={COLORS.balanced}
        strokeWidth={3}
      />
    )
  }
  return <Rectangle {...props} />
}

export function MonthlyBalanceChart({ data }: { data: BalanceChartPoint[] }) {
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.balance)), 1)

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 48, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e6f0" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-35}
            textAnchor="end"
            height={48}
          />
          <YAxis
            domain={[-maxAbs * 1.15, maxAbs * 1.15]}
            tick={{ fontSize: 11 }}
            width={44}
            tickFormatter={(v: number) => `₪ ${Math.abs(v).toLocaleString('he-IL')}`}
          />
          <ReferenceLine y={0} stroke="#64748b" strokeWidth={2} />
          <Tooltip content={<BalanceTooltip />} />
          <Bar
            dataKey="balance"
            maxBarSize={48}
            radius={[4, 4, 4, 4]}
            shape={(props) => (
              <BalanceBar {...props} payload={props.payload as BalanceChartPoint} />
            )}
          >
            {data.map((entry) => (
              <Cell
                key={`${entry.year}-${entry.month}`}
                fill={
                  entry.isBalanced
                    ? COLORS.balanced
                    : entry.balance < 0
                      ? COLORS.debt
                      : COLORS.credit
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-[var(--color-muted-foreground)]">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
          {labels.statusPositive}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          {labels.statusNegative}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-slate-400" />
          {labels.statusBalanced}
        </span>
      </div>
    </div>
  )
}
