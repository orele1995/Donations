import { Card, CardContent } from '@/components/ui/card'
import { formatShekels } from '@/utils/currency'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number
  subtitle?: string
  variant?: 'default' | 'due' | 'credit' | 'neutral'
}

export function StatCard({
  title,
  value,
  subtitle,
  variant = 'default',
}: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <p className="text-sm font-medium text-[var(--color-muted-foreground)]">{title}</p>
        <p
          className={cn('mt-2 text-3xl font-bold tabular-nums tracking-tight', {
            'text-red-600': variant === 'due',
            'text-emerald-600': variant === 'credit',
            'text-indigo-700': variant === 'default',
            'text-[var(--color-foreground)]': variant === 'neutral',
          })}
        >
          {formatShekels(value)}
        </p>
        {subtitle && (
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}
