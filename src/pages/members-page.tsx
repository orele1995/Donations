import { useState } from 'react'
import { Users, Copy } from 'lucide-react'
import { labels } from '@/lib/hebrew'
import { useAuth } from '@/contexts/auth-context'
import { useMembers, useInvalidateHousehold } from '@/hooks/use-household-data'
import { db } from '@/lib/firebase'
import * as householdService from '@/services/household.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { toast } from '@/hooks/use-toast'
import { getHebrewErrorMessage } from '@/utils/errors'
import type { HouseholdMember } from '@/types'

export function MembersPage() {
  const { data: members, isLoading } = useMembers()
  const { user } = useAuth()
  const invalidate = useInvalidateHousehold()
  const [inviteCode, setInviteCode] = useState<string | null>(null)

  const currentMember = members?.find((m) => m.userId === user?.uid)
  const isOwner = currentMember?.role === 'owner'

  const handleInvite = async (): Promise<void> => {
    if (!db || !user || !currentMember) return
    try {
      const code = await householdService.createInvite(
        db,
        currentMember.householdId,
        user.uid,
      )
      setInviteCode(code)
      toast({ title: labels.generateInvite })
    } catch (error) {
      toast({ title: getHebrewErrorMessage(error), variant: 'destructive' })
    }
  }

  const copyCode = (): void => {
    if (inviteCode) {
      void navigator.clipboard.writeText(inviteCode)
      toast({ title: labels.copied })
    }
  }

  const handleRemove = async (member: HouseholdMember): Promise<void> => {
    if (!db || member.role === 'owner') return
    try {
      await householdService.removeMember(db, member.id)
      invalidate()
      toast({ title: labels.deleted })
    } catch (error) {
      toast({ title: getHebrewErrorMessage(error), variant: 'destructive' })
    }
  }

  if (isLoading) return <LoadingSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{labels.members}</h1>
        {isOwner && (
          <Button onClick={() => void handleInvite()}>{labels.generateInvite}</Button>
        )}
      </div>

      {inviteCode && (
        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardContent className="flex items-center justify-between gap-4 pt-5">
            <code className="text-lg font-mono text-indigo-800" dir="ltr">
              {inviteCode}
            </code>
            <Button variant="outline" size="sm" onClick={copyCode}>
              <Copy className="h-4 w-4" />
              {labels.copyCode}
            </Button>
          </CardContent>
        </Card>
      )}

      {!members?.length ? (
        <EmptyState icon={Users} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {members.map((member) => (
            <Card key={member.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base">{member.displayName}</CardTitle>
                <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
                  {member.role === 'owner' ? labels.owner : labels.member}
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--color-muted-foreground)]" dir="ltr">
                  {member.email}
                </p>
                {isOwner && member.role !== 'owner' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-3"
                    onClick={() => void handleRemove(member)}
                  >
                    {labels.removeMember}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
