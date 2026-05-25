import { useState } from 'react'
import { labels } from '@/lib/hebrew'
import { useMembers, useUpdateMemberName } from '@/hooks/use-household-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { toast } from '@/hooks/use-toast'
import { getHebrewErrorMessage } from '@/utils/errors'

export function SettingsPage() {
  const { data: members, isLoading } = useMembers()
  const updateName = useUpdateMemberName()
  const [editing, setEditing] = useState<Record<string, string>>({})

  if (isLoading) return <LoadingSkeleton rows={2} />

  const handleSave = async (memberId: string): Promise<void> => {
    const name = editing[memberId]?.trim()
    if (!name) return
    try {
      await updateName.mutateAsync({ memberId, displayName: name })
      toast({ title: labels.saved })
    } catch (error) {
      toast({ title: getHebrewErrorMessage(error), variant: 'destructive' })
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{labels.settings}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{labels.memberSettings}</CardTitle>
          <CardDescription>
            שם התצוגה משמש לשדה ההכנסה בדוח החודשי
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {members?.map((member) => (
            <div key={member.id} className="flex flex-wrap items-end gap-2">
              <div className="min-w-[200px] flex-1 space-y-1.5">
                <Label htmlFor={`name-${member.id}`}>{labels.displayName}</Label>
                <Input
                  id={`name-${member.id}`}
                  defaultValue={member.displayName}
                  onChange={(e) =>
                    setEditing((prev) => ({ ...prev, [member.id]: e.target.value }))
                  }
                />
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void handleSave(member.id)}
                disabled={updateName.isPending}
              >
                {labels.save}
              </Button>
            </div>
          ))}
          {!members?.length && (
            <p className="text-sm text-[var(--color-muted-foreground)]">{labels.noData}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
