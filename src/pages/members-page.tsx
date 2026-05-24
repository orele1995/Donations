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
  const invalidate = useInvalidateHousehold()
  const { user, isDemo } = useAuth()
  const [inviteCode, setInviteCode] = useState<string | null>(null)

  const currentMember = members?.find((m) => m.userId === user?.uid)
  const isOwner = currentMember?.role === 'owner' || isDemo

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
        <h1 className="text-2xl font-bold">{labels.members}</h1>
        {isOwner && !isDemo && (
          <Button onClick={() => void handleInvite()}>{labels.generateInvite}</Button>
        )}
      </div>

      {inviteCode && (
        <Card className="border-teal-200 bg-teal-50">
          <CardContent className="flex items-center justify-between pt-4">
            <code className="text-lg font-mono" dir="ltr">
              {inviteCode}
            </code>
            <Button variant="outline" size="sm" onClick={copyCode}>
              <Copy className="h-4 w-4" />
              {labels.copyCode}
            </Button>
          </CardContent>
        </Card>
      )}

      {isDemo && (
        <p className="text-sm text-amber-700">קוד הזמנה להדגמה: DEMO1234</p>
      )}

      {!members?.length ? (
        <EmptyState icon={Users} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {members.map((member) => (
            <Card key={member.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{member.displayName}</CardTitle>
                <span className="rounded bg-slate-100 px-2 py-1 text-xs">
                  {member.role === 'owner' ? labels.owner : labels.member}
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500" dir="ltr">
                  {member.email}
                </p>
                {isOwner && member.role !== 'owner' && !isDemo && (
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
