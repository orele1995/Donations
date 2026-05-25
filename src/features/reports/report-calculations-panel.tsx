import { labels } from '@/lib/hebrew'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatShekels } from '@/utils/currency'
import type { ReportCalculations } from '@/types'

interface ReportCalculationsPanelProps {
  calculations: ReportCalculations
  openingDebt: number
  appliedCredit: number
  applyCredit: boolean
}

export function ReportCalculationsPanel({
  calculations,
  openingDebt,
  appliedCredit,
  applyCredit,
}: ReportCalculationsPanelProps) {
  const finalDue = Math.max(calculations.remainingBalance, 0)

  type Row = {
    label: string
    value: number
    bold?: boolean
    highlight?: boolean
    deduct?: boolean
    hideZero?: boolean
  }

  const rows: Row[] = [
    { label: labels.totalIncome, value: calculations.totalIncome },
    { label: labels.maaserRequired, value: calculations.maaserRequired },
    { label: labels.debtFromPreviousMonths, value: openingDebt, hideZero: true },
    ...(applyCredit && appliedCredit > 0
      ? [
          {
            label: labels.applyCreditFromPrevious,
            value: appliedCredit,
            deduct: true,
          },
        ]
      : []),
    { label: labels.fixedDonationsTotal, value: calculations.fixedDonationsTotal },
    { label: labels.oneTimeDonationsTotal, value: calculations.oneTimeDonationsTotal },
    {
      label: labels.finalBalance,
      value: finalDue,
      bold: true,
      highlight: finalDue > 0,
    },
  ].filter((row) => !(row.hideZero && row.value === 0))

  return (
    <Card className="h-fit lg:sticky lg:top-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{labels.calculations}</CardTitle>
      </CardHeader>
      <CardContent className="min-h-[240px] space-y-2.5">
        {rows.map((row, i) => (
          <div key={row.label}>
            {row.bold && i > 0 && <Separator className="my-2" />}
            <div className="flex justify-between gap-2 text-sm">
              <span className={row.bold ? 'font-semibold' : 'text-[var(--color-muted-foreground)]'}>
                {row.label}
              </span>
              <span
                className={`shrink-0 tabular-nums ${
                  row.highlight
                    ? 'font-bold text-red-600'
                    : row.bold
                      ? 'font-bold text-indigo-700'
                      : row.deduct
                        ? 'text-emerald-600'
                        : ''
                }`}
              >
                {row.deduct ? '−' : ''}
                {formatShekels(row.value)}
              </span>
            </div>
          </div>
        ))}
        <p className="pt-2 text-xs text-[var(--color-muted-foreground)]">{labels.agorotNote}</p>
      </CardContent>
    </Card>
  )
}
