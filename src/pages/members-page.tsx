import { useEffect, useState } from 'react'
import { Users, Copy, Check } from 'lucide-react'
import { labels } from '@/lib/hebrew'
import { useAuth } from '@/contexts/auth-context'
import { useMembers, useInvalidateHousehold, useUpdateMemberName } from '@/hooks/use-household-data'
import { resolveMemberDisplayName, FALLBACK_DISPLAY_NAME } from '@/lib/member-display'
import { db } from '@/lib/firebase'
import * as householdService from '@/services/household.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const updateName = useUpdateMemberName()
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [draftNames, setDraftNames] = useState<Record<string, string>>({})
  const [savedId, setSavedId] = useState<string | null>(null)

  const currentMember = members?.find((m) => m.userId === user?.uid)
  const isOwner = currentMember?.role === 'owner'

  useEffect(() => {
    if (!members) return
    const initial: Record<string, string> = {}
    for (const m of members) {
      const authName = m.userId === user?.uid ? user?.displayName : null
      initial[m.id] = resolveMemberDisplayName(m.displayName, authName)
      if (initial[m.id] === FALLBACK_DISPLAY_NAME) initial[m.id] = ''
    }
    setDraftNames(initial)
  }, [members, user?.uid, user?.displayName])

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

  const handleSaveDisplayName = async (member: HouseholdMember): Promise<void> => {
    const name = draftNames[member.id]?.trim()
    if (!name) {
      toast({ title: 'יש להזין שם לתצוגה', variant: 'destructive' })
      return
    }
    try {
      await updateName.mutateAsync({ memberId: member.id, displayName: name })
      setSavedId(member.id)
      setTimeout(() => setSavedId(null), 2000)
      invalidate()
      toast({ title: labels.saved })
    } catch (error) {
      toast({ title: getHebrewErrorMessage(error), variant: 'destructive' })
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
        <div className="grid gap-4">
          {members.map((member) => {
            const authName = member.userId === user?.uid ? user?.displayName : null
            const resolved = resolveMemberDisplayName(member.displayName, authName)

            return (
              <Card key={member.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{resolved}</CardTitle>
                    <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
                      {member.role === 'owner' ? labels.owner : labels.member}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-[var(--color-muted-foreground)]" dir="ltr">
                    {member.email}
                  </p>

                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-[220px] flex-1 space-y-1.5">
                      <Label htmlFor={`display-${member.id}`}>{labels.displayNameLabel}</Label>
                      <Input
                        id={`display-${member.id}`}
                        value={draftNames[member.id] ?? ''}
                        placeholder={authName ?? FALLBACK_DISPLAY_NAME}
                        onChange={(e) =>
                          setDraftNames((prev) => ({
                            ...prev,
                            [member.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void handleSaveDisplayName(member)
                        }}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void handleSaveDisplayName(member)}
                      disabled={updateName.isPending}
                    >
                      {savedId === member.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        labels.save
                      )}
                    </Button>
                  </div>

                  {isOwner && member.role !== 'owner' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => void handleRemove(member)}
                    >
                      {labels.removeMember}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
