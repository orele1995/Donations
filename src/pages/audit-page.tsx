import { useState } from 'react'
import { History } from 'lucide-react'
import { labels } from '@/lib/hebrew'
import { useAuditLogs, useMembers } from '@/hooks/use-household-data'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toMonthKey } from '@/utils/dates'

const actionLabels: Record<string, string> = {
  create: labels.actionCreate,
  update: labels.actionUpdate,
  delete: labels.actionDelete,
  restore: labels.undo,
}

export function AuditPage() {
  const [monthKey, setMonthKey] = useState<string>('')
  const [userId, setUserId] = useState<string>('')

  const { data: logs, isLoading } = useAuditLogs({
    monthKey: monthKey || undefined,
    userId: userId || undefined,
  })
  const { data: members } = useMembers()

  if (isLoading) return <LoadingSkeleton />

  const now = new Date()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{labels.auditLog}</h1>

      <div className="flex flex-wrap gap-4">
        <div>
          <Label>{labels.filterByMonth}</Label>
          <select
            className="mt-1 block rounded-md border border-slate-200 px-3 py-2 text-sm"
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value)}
          >
            <option value="">{labels.allMonths}</option>
            {Array.from({ length: 12 }).map((_, i) => {
              const m = i + 1
              const key = toMonthKey(now.getFullYear(), m)
              return (
                <option key={key} value={key}>
                  {key}
                </option>
              )
            })}
          </select>
        </div>
        <div>
          <Label>{labels.filterByUser}</Label>
          <select
            className="mt-1 block rounded-md border border-slate-200 px-3 py-2 text-sm"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">{labels.allUsers}</option>
            {members?.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!logs?.length ? (
        <EmptyState icon={History} />
      ) : (
        <div className="relative space-y-4 border-r-2 border-teal-200 pr-6">
          {logs.map((log) => (
            <Card key={log.id} className="relative">
              <div className="absolute -right-[31px] top-4 h-4 w-4 rounded-full bg-teal-600" />
              <CardContent className="pt-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-medium">{log.userDisplayName}</p>
                    <p className="text-sm text-slate-500">
                      {actionLabels[log.actionType] ?? log.actionType} — {log.entityType}
                    </p>
                  </div>
                  <time className="text-sm text-slate-400">
                    {new Date(log.timestamp).toLocaleString('he-IL')}
                  </time>
                </div>
                {log.monthKey && (
                  <p className="mt-1 text-xs text-slate-400">חודש: {log.monthKey}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
