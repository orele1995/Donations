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
import { formatMonthLabel } from '@/utils/dates'
import { agorotToShekels, formatShekels } from '@/utils/currency'
import type { MonthStatus } from '@/types'

export interface BalanceChartPoint {
  year: number
  month: number
  name: string
  balance: number
  balanceAgorot: number
  status: MonthStatus
  statusLabel: string
  isBalanced: boolean
}

const COLORS = {
  debt: '#ef4444',
  credit: '#10b981',
  balanced: '#94a3b8',
} as const

interface TooltipPayload {
  payload?: BalanceChartPoint
}

function BalanceTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
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
        {labels.tooltipBalance}: {formatShekels(Math.abs(point.balanceAgorot))}
      </p>
      <p>
        {labels.tooltipStatus}: {point.statusLabel}
      </p>
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
      const isBalanced = r.remainingBalance === 0
      const status: MonthStatus = isBalanced
        ? 'balanced'
        : r.remainingBalance > 0
          ? 'positive'
          : 'negative'

      const statusLabel =
        status === 'balanced'
          ? labels.statusBalanced
          : status === 'positive'
            ? labels.statusPositive
            : labels.statusNegative

      return {
        year: r.year,
        month: r.month,
        name: formatMonthLabel(r.year, r.month).split(' ')[0] ?? String(r.month),
        balance: isBalanced ? 0 : -agorotToShekels(r.remainingBalance),
        balanceAgorot: r.remainingBalance,
        status,
        statusLabel,
        isBalanced,
      }
    })
}

interface MonthlyBalanceChartProps {
  data: BalanceChartPoint[]
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

export function MonthlyBalanceChart({ data }: MonthlyBalanceChartProps) {
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.balance)), 1)

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e6f0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            domain={[-maxAbs * 1.15, maxAbs * 1.15]}
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `₪${Math.abs(v).toLocaleString('he-IL')}`}
          />
          <ReferenceLine y={0} stroke="#64748b" strokeWidth={2} />
          <Tooltip content={<BalanceTooltip />} />
          <Bar
            dataKey="balance"
            maxBarSize={48}
            radius={[4, 4, 4, 4]}
            shape={(props) => <BalanceBar {...props} payload={props.payload as BalanceChartPoint} />}
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
          {labels.statusPositive} ({labels.belowZero})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          {labels.statusNegative} ({labels.aboveZero})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-slate-400" />
          {labels.statusBalanced}
        </span>
      </div>
    </div>
  )
}
