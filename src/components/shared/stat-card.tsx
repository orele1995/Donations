import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatShekels } from '@/utils/currency'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number
  variant?: 'default' | 'danger' | 'success' | 'warning'
  subtitle?: string
}

export function StatCard({ title, value, variant = 'default', subtitle }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn('text-2xl font-bold', {
            'text-red-600': variant === 'danger',
            'text-green-600': variant === 'success',
            'text-amber-600': variant === 'warning',
          })}
        >
          {formatShekels(value)}
        </p>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
