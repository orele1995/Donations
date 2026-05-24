import { labels } from '@/lib/hebrew'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatShekels } from '@/utils/currency'
import type { ReportCalculations } from '@/types'

interface ReportCalculationsPanelProps {
  calculations: ReportCalculations
  openingDebt: number
  openingCredit: number
  creditEnabled: boolean
}

export function ReportCalculationsPanel({
  calculations,
  openingDebt,
  openingCredit,
  creditEnabled,
}: ReportCalculationsPanelProps) {
  const rows = [
    { label: labels.totalIncome, value: calculations.totalIncome },
    { label: labels.maaserRequired, value: calculations.maaserRequired },
    { label: labels.openingDebt, value: openingDebt },
    ...(creditEnabled
      ? [{ label: labels.openingCredit, value: openingCredit }]
      : []),
    { label: labels.adjustedRequirement, value: calculations.adjustedMaaserRequirement, bold: true },
    { label: labels.fixedDonationsTotal, value: calculations.fixedDonationsTotal },
    { label: labels.oneTimeDonationsTotal, value: calculations.oneTimeDonationsTotal },
    {
      label: labels.remainingBalance,
      value: Math.max(calculations.remainingBalance, 0),
      highlight: calculations.remainingBalance > 0,
    },
    { label: labels.closingDebt, value: calculations.closingDebt },
    ...(creditEnabled
      ? [{ label: labels.closingCredit, value: calculations.closingCredit }]
      : []),
  ]

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg">חישובים</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row, i) => (
          <div key={row.label}>
            {i > 0 && row.bold && <Separator className="my-2" />}
            <div className="flex justify-between text-sm">
              <span className={row.bold ? 'font-semibold' : 'text-slate-500'}>{row.label}</span>
              <span
                className={
                  row.highlight
                    ? 'font-bold text-red-600'
                    : row.bold
                      ? 'font-bold'
                      : ''
                }
              >
                {formatShekels(row.value)}
              </span>
            </div>
          </div>
        ))}
        <p className="text-xs text-slate-400">{labels.agorotNote}</p>
      </CardContent>
    </Card>
  )
}
