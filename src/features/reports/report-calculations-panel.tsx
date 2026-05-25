import { labels } from '@/lib/hebrew'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatShekels } from '@/utils/currency'
import type { ReportCalculations } from '@/types'

interface ReportCalculationsPanelProps {
  calculations: ReportCalculations
  openingDebt: number
  appliedCredit: number
  creditAvailable: number
  applyCredit: boolean
}

export function ReportCalculationsPanel({
  calculations,
  openingDebt,
  appliedCredit,
  creditAvailable,
  applyCredit,
}: ReportCalculationsPanelProps) {
  const finalDue = Math.max(calculations.remainingBalance, 0)

  const rows = [
    { label: labels.totalIncome, value: calculations.totalIncome },
    { label: labels.maaserRequired, value: calculations.maaserRequired },
    { label: labels.debtFromPreviousMonths, value: openingDebt },
    ...(creditAvailable > 0
      ? [
          {
            label: labels.creditFromPreviousMonth,
            value: creditAvailable,
            muted: !applyCredit,
          },
          ...(applyCredit
            ? [{ label: labels.applyCreditFromPrevious, value: -appliedCredit, deduct: true }]
            : []),
        ]
      : []),
    {
      label: labels.adjustedRequirement,
      value: calculations.adjustedMaaserRequirement,
      bold: true,
    },
    { label: labels.fixedDonationsTotal, value: calculations.fixedDonationsTotal },
    { label: labels.oneTimeDonationsTotal, value: calculations.oneTimeDonationsTotal },
    { label: labels.maaserPaid, value: calculations.maaserPaidTotal },
    {
      label: labels.finalBalance,
      value: finalDue,
      bold: true,
      highlight: finalDue > 0,
    },
  ]

  return (
    <Card className="h-fit lg:sticky lg:top-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{labels.calculations}</CardTitle>
      </CardHeader>
      <CardContent className="min-h-[280px] space-y-2.5">
        {rows.map((row) => (
          <div key={row.label}>
            {'bold' in row && row.bold && <Separator className="my-2" />}
            <div className="flex justify-between gap-2 text-sm">
              <span
                className={
                  row.bold
                    ? 'font-semibold'
                    : 'muted' in row && row.muted
                      ? 'text-[var(--color-muted-foreground)] line-through'
                      : 'text-[var(--color-muted-foreground)]'
                }
              >
                {row.label}
              </span>
              <span
                className={`tabular-nums shrink-0 ${
                  row.highlight
                    ? 'font-bold text-red-600'
                    : row.bold
                      ? 'font-bold text-indigo-700'
                      : 'deduct' in row && row.deduct
                        ? 'text-emerald-600'
                        : ''
                }`}
              >
                {'deduct' in row && row.deduct ? '−' : ''}
                {formatShekels(Math.abs(row.value))}
              </span>
            </div>
          </div>
        ))}
        <p className="pt-2 text-xs text-[var(--color-muted-foreground)]">{labels.agorotNote}</p>
      </CardContent>
    </Card>
  )
}
