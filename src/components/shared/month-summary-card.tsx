import { Card, CardContent } from '@/components/ui/card'
import { formatShekels } from '@/utils/currency'
import { cn } from '@/lib/utils'
import type { MonthlyFinancialSummary } from '@/utils/monthly-summary'

interface MonthSummaryCardProps {
  title: string
  summary: MonthlyFinancialSummary
  subtitle: string
}

export function MonthSummaryCard({ title, summary, subtitle }: MonthSummaryCardProps) {
  const variant =
    summary.status === 'debt'
      ? 'text-red-600'
      : summary.status === 'credit'
        ? 'text-emerald-600'
        : 'text-[var(--color-foreground)]'

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm font-medium text-[var(--color-muted-foreground)]">{title}</p>
        <p className={cn('mt-2 text-3xl font-bold tabular-nums tracking-tight', variant)}>
          {summary.isBalanced
            ? summary.statusLabel
            : formatShekels(summary.displayAmountAgorot)}
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{subtitle}</p>
        {!summary.isBalanced && (
          <p className="mt-0.5 text-xs font-medium text-[var(--color-muted-foreground)]">
            {summary.statusLabel}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
