import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { labels } from '@/lib/hebrew'

interface EmptyStateProps {
  icon: LucideIcon
  title?: string
  description?: string
  action?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title = labels.noData,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-16 text-center">
      <Icon className="mb-4 h-12 w-12 text-slate-300" />
      <h3 className="text-lg font-medium">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
